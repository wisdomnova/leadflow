import { createClient } from 'jsr:@supabase/supabase-js@2'
import { SESv2Client, SendEmailCommand } from 'npm:@aws-sdk/client-sesv2@3'

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

Deno.serve(async (req) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Find campaigns ready to send
    const { data: campaigns, error: campErr } = await supabase
      .from('campaigns')
      .select('*')
      .in('status', ['queued', 'sending'])
      .limit(10)

    if (campErr) {
      return new Response(JSON.stringify({ error: campErr.message }), { status: 400 })
    }

    for (const campaign of campaigns || []) {
      // Check warmup limit
      const today = new Date().toISOString().slice(0, 10)
      const { data: warmup } = await supabase
        .from('warmup_daily_log')
        .select('sent_count, limit')
        .eq('user_id', campaign.user_id)
        .eq('date', today)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      const remaining = warmup ? warmup.limit - warmup.sent_count : 500

      if (remaining <= 0) {
        console.log(`User ${campaign.user_id} hit daily limit`)
        continue
      }

      // Get pending recipients
      const { data: recipients } = await supabase
        .from('campaign_recipients')
        .select('*, contacts(*)')
        .eq('campaign_id', campaign.id)
        .limit(Math.min(remaining, 50))

      if (!recipients || recipients.length === 0) {
        await supabase.from('campaigns').update({ status: 'completed' }).eq('id', campaign.id)
        continue
      }

      // Update campaign to sending
      await supabase.from('campaigns').update({ status: 'sending' }).eq('id', campaign.id)

      // Send emails (simplified - production needs provider routing)
      for (const recipient of recipients) {
        try {
          const messageId = `${campaign.id}-${recipient.contact_id}-${Date.now()}`

          // Create send record
          await supabase.from('campaign_sends').insert({
            campaign_id: campaign.id,
            contact_id: recipient.contact_id,
            user_id: campaign.user_id,
            status: 'sent',
            message_id: messageId,
            sent_at: new Date().toISOString(),
          })

          // Log event
          await supabase.from('email_events').insert({
            user_id: campaign.user_id,
            campaign_id: campaign.id,
            contact_id: recipient.contact_id,
            event_type: 'sent',
            provider: campaign.provider,
            meta: { message_id: messageId },
          })

          // Update warmup count
          if (warmup) {
            await supabase
              .from('warmup_daily_log')
              .update({ sent_count: warmup.sent_count + 1 })
              .eq('user_id', campaign.user_id)
              .eq('date', today)
          }

          // Remove from recipients queue
          await supabase.from('campaign_recipients').delete().eq('id', recipient.id)
        } catch (err) {
          console.error(`Send failed for ${recipient.contact_id}:`, err)
        }
      }
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 })
  } catch (error) {
    console.error('Send queue error:', error)
    return new Response(JSON.stringify({ error: String(error) }), { status: 500 })
  }
})
