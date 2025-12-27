import { createClient } from 'jsr:@supabase/supabase-js@2'
import { SESv2Client, SendEmailCommand } from 'npm:@aws-sdk/client-sesv2@3'

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

type WarmupLog = { id: string | null; sent_count: number; limit: number; schedule_id?: string }
type SesCredentials = { aws_access_key_id: string; aws_secret_access_key: string; aws_region: string }
type ExistingSend = { contact_id: string; status: string | null; metadata: Record<string, unknown> | null }

const FALLBACK_DAILY_LIMIT = 50

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ')
}

async function getSesCredentials(supabase: ReturnType<typeof createClient>, userId: string): Promise<SesCredentials | null> {
  const { data, error } = await supabase
    .from('user_ses_accounts')
    .select('aws_access_key_id, aws_secret_access_key, aws_region')
    .eq('user_id', userId)
    .maybeSingle()

  if (error || !data) {
    console.warn(`Missing SES credentials for user ${userId}:`, error?.message)
    return null
  }
  return data as SesCredentials
}

async function ensureWarmupLog(supabase: ReturnType<typeof createClient>, userId: string): Promise<WarmupLog | null> {
  const today = new Date().toISOString().slice(0, 10)

  // Existing log for today
  const { data: existing, error: existingErr } = await supabase
    .from('warmup_daily_log')
    .select('id, sent_count, limit, schedule_id')
    .eq('user_id', userId)
    .eq('date', today)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existingErr) {
    console.error('Error fetching warmup log', existingErr.message)
    return null
  }

  if (existing) return existing as WarmupLog

  // No log yet — bootstrap from active schedule
  const { data: schedule, error: scheduleErr } = await supabase
    .from('user_warmup_schedule')
    .select('id, current_day, daily_limit')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (scheduleErr) {
    console.error('Error fetching warmup schedule', scheduleErr.message)
    return null
  }

  if (!schedule) {
    console.warn(`No active warmup schedule for user ${userId}; using fallback daily limit ${FALLBACK_DAILY_LIMIT}`)
    return { id: null, sent_count: 0, limit: FALLBACK_DAILY_LIMIT }
  }

  const insertPayload = {
    user_id: userId,
    schedule_id: schedule.id,
    day_number: schedule.current_day,
    date: today,
    sent_count: 0,
    limit: schedule.daily_limit,
  }

  const { data: created, error: createErr } = await supabase
    .from('warmup_daily_log')
    .upsert(insertPayload, { onConflict: 'schedule_id,date' })
    .select('id, sent_count, limit, schedule_id')
    .single()

  if (createErr) {
    console.error('Error creating warmup log', createErr.message)
    return null
  }

  return created as WarmupLog
}

async function sendWithSes(creds: SesCredentials, fromEmail: string, toEmail: string, subject: string, htmlBody: string, replyTo?: string) {
  const client = new SESv2Client({
    region: creds.aws_region,
    credentials: {
      accessKeyId: creds.aws_access_key_id,
      secretAccessKey: creds.aws_secret_access_key,
    },
  })

  const command = new SendEmailCommand({
    FromEmailAddress: fromEmail,
    Destination: { ToAddresses: [toEmail] },
    ReplyToAddresses: replyTo ? [replyTo] : undefined,
    Content: {
      Simple: {
        Subject: { Data: subject },
        Body: {
          Html: { Data: htmlBody },
          Text: { Data: stripHtml(htmlBody) },
        },
      },
    },
  })

  const response = await client.send(command)
  return response.MessageId ?? crypto.randomUUID()
}

Deno.serve(async () => {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Find campaigns ready to send (small batch per invoke)
    const { data: campaigns, error: campErr } = await supabase
      .from('campaigns')
      .select('id, user_id, provider, from_email, from_name, reply_to, subject, body')
      .in('status', ['queued', 'sending'])
      .limit(5)

    if (campErr) {
      return new Response(JSON.stringify({ error: campErr.message }), { status: 400 })
    }

    for (const campaign of campaigns || []) {
      const warmup = await ensureWarmupLog(supabase, campaign.user_id)
      const remaining = warmup ? Math.max(0, warmup.limit - warmup.sent_count) : 0

      if (!warmup || remaining <= 0) {
        console.log(`Skipping campaign ${campaign.id}: warmup cap reached or missing log`)
        continue
      }

      if (campaign.provider && campaign.provider !== 'aws_ses') {
        console.log(`Skipping campaign ${campaign.id}: unsupported provider ${campaign.provider}`)
        continue
      }

      const creds = await getSesCredentials(supabase, campaign.user_id)
      if (!creds) {
        console.log(`Skipping campaign ${campaign.id}: no SES credentials`)
        continue
      }

      // Pull unclaimed pending recipients within warmup window
      const { data: recipients, error: recipientsErr } = await supabase
        .from('campaign_recipients')
        .select('id, campaign_id, contact_id, merge_data, contacts(email, first_name, last_name)')
        .eq('campaign_id', campaign.id)
        .is('claimed_at', null)
        .limit(Math.min(remaining, 25))

      if (recipientsErr) {
        console.error('Error fetching recipients', recipientsErr.message)
        continue
      }

      if (!recipients || recipients.length === 0) {
        await supabase.from('campaigns').update({ status: 'completed' }).eq('id', campaign.id)
        continue
      }

      // Dedupe against already-sent or exhausted attempts
      const contactIds = recipients.map((r) => r.contact_id)
      const { data: existingSends, error: existingErr } = await supabase
        .from('campaign_sends')
        .select('contact_id, status, metadata')
        .eq('campaign_id', campaign.id)
        .in('contact_id', contactIds)

      if (existingErr) {
        console.error('Error fetching existing sends', existingErr.message)
        continue
      }

      const sendMap = new Map<string, ExistingSend>()
      for (const s of existingSends || []) {
        sendMap.set(s.contact_id, s as ExistingSend)
      }

      await supabase.from('campaigns').update({ status: 'sending' }).eq('id', campaign.id)

      const recipientIds = recipients.map((r) => r.id)
      const { error: claimErr } = await supabase
        .from('campaign_recipients')
        .update({ claimed_at: new Date().toISOString() })
        .in('id', recipientIds)

      if (claimErr) {
        console.error('Error claiming recipients', claimErr.message)
        continue
      }

      let sentThisRun = 0

      for (const recipient of recipients) {
        const toEmail = recipient.contacts?.email
        if (!toEmail) {
          console.warn(`Recipient ${recipient.id} missing email; skipping`)
          continue
        }

        if (!campaign.from_email || !campaign.subject || !campaign.body) {
          console.warn(`Campaign ${campaign.id} missing from/subject/body; skipping send`)
          continue
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(campaign.from_email)) {
          console.warn(`Campaign ${campaign.id} from_email invalid format: ${campaign.from_email}`)
          continue
        }

        if (!campaign.body.includes('unsubscribe') && !campaign.body.includes('Unsubscribe')) {
          console.warn(`Campaign ${campaign.id} body missing unsubscribe link; skipping for compliance`)
          continue
        }

        const subject = campaign.subject
        const bodyHtml = campaign.body

        const existing = sendMap.get(recipient.contact_id)
        const attempts = (existing?.metadata as { attempts?: number } | null)?.attempts ?? 0
        const alreadySent = existing?.status === 'sent' || existing?.status === 'delivered'

        if (alreadySent) {
          console.log(`Recipient ${recipient.contact_id} already sent; skipping`)
          await supabase.from('campaign_recipients').delete().eq('id', recipient.id)
          continue
        }

        if (attempts >= 3) {
          console.warn(`Recipient ${recipient.contact_id} exceeded retry limit; skipping`)
          continue
        }

        try {
          const messageId = await sendWithSes(
            creds,
            campaign.from_email,
            toEmail,
            subject,
            bodyHtml,
            campaign.reply_to ?? undefined,
          )

          // Upsert send record to track status
          await supabase.from('campaign_sends').upsert({
            campaign_id: campaign.id,
            contact_id: recipient.contact_id,
            user_id: campaign.user_id,
            status: 'sent',
            message_id: messageId,
            sent_at: new Date().toISOString(),
            metadata: { attempts: attempts + 1 },
          }, { onConflict: 'campaign_id,contact_id' })

          await supabase.from('email_events').insert({
            user_id: campaign.user_id,
            campaign_id: campaign.id,
            contact_id: recipient.contact_id,
            event_type: 'sent',
            provider: campaign.provider,
            meta: { message_id: messageId },
          })

          await supabase.from('campaign_recipients').delete().eq('id', recipient.id)
          sentThisRun += 1
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : String(err)
          console.error(`Send failed for ${recipient.contact_id}:`, errorMessage)

          await supabase.from('campaign_sends').upsert({
            campaign_id: campaign.id,
            contact_id: recipient.contact_id,
            user_id: campaign.user_id,
            status: 'failed',
            metadata: { attempts: attempts + 1, error: errorMessage, last_failed_at: new Date().toISOString() },
          }, { onConflict: 'campaign_id,contact_id' })

          await supabase.from('email_events').insert({
            user_id: campaign.user_id,
            campaign_id: campaign.id,
            contact_id: recipient.contact_id,
            event_type: 'error',
            provider: campaign.provider,
            meta: { error: errorMessage },
          })
        }
      }

      if (sentThisRun > 0 && warmup && warmup.id) {
        await supabase
          .from('warmup_daily_log')
          .update({ sent_count: warmup.sent_count + sentThisRun })
          .eq('id', warmup.id)
      }
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 })
  } catch (error) {
    console.error('Send queue error:', error)
    return new Response(JSON.stringify({ error: String(error) }), { status: 500 })
  }
})
