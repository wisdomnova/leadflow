// lib/email-oauth/inbox-poller.ts
import { createClient } from '@supabase/supabase-js'
import { decryptToken } from './token-manager'
import { fetchGmailMessages } from './google-oauth'
import { fetchOutlookMessages } from './microsoft-oauth'
import { classifyReplyWithAI } from '@/lib/ai/reply-classifier'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
 
export async function pollInboxes() {
  console.log('📬 Polling inboxes for replies...')

  // Get all active email accounts
  const { data: accounts, error } = await supabase
    .from('email_accounts')
    .select('*')
    .in('status', ['active', 'warming_up'])

  if (error || !accounts) {
    console.error('Error fetching accounts:', error)
    return
  }

  for (const account of accounts) {
    try {
      await pollAccountInbox(account)
    } catch (error) {
      console.error(`Error polling ${account.email}:`, error)
    }
  }

  console.log('✅ Inbox polling complete')
}

async function pollAccountInbox(account: any) {
  const accessToken = decryptToken(account.access_token)

  let messages: any[] = []

  // Fetch messages based on provider
  if (account.provider === 'google') {
    messages = await fetchGmailMessages(accessToken, 50)
  } else {
    messages = await fetchOutlookMessages(accessToken, 50)
  }

  console.log(`📧 Found ${messages.length} messages for ${account.email}`)

  for (const message of messages) {
    await processInboxMessage(message, account)
  }
}

async function processInboxMessage(message: any, account: any) {
  const messageId = message.id
  const threadId = message.threadId || message.conversationId
  
  // Check if we've already processed this message
  const { data: existing } = await supabase
    .from('email_replies')
    .select('id')
    .eq('message_id', messageId)
    .single()

  if (existing) {
    return // Already processed
  }

  // Extract email data
  let from: string = ''
  let subject: string = ''
  let body: string = ''
  let receivedAt: Date = new Date()

  if (account.provider === 'google') {
    const headers = message.payload?.headers || []
    from = headers.find((h: any) => h.name === 'From')?.value || ''
    subject = headers.find((h: any) => h.name === 'Subject')?.value || ''
    receivedAt = new Date(parseInt(message.internalDate))
    
    // Get body
    if (message.payload?.body?.data) {
      body = Buffer.from(message.payload.body.data, 'base64').toString('utf-8')
    } else if (message.payload?.parts) {
      const textPart = message.payload.parts.find((p: any) => p.mimeType === 'text/plain')
      if (textPart?.body?.data) {
        body = Buffer.from(textPart.body.data, 'base64').toString('utf-8')
      }
    }
  } else {
    from = message.from?.emailAddress?.address || ''
    subject = message.subject || ''
    body = message.body?.content || ''
    receivedAt = new Date(message.receivedDateTime)
  }

  // Find matching sent email by thread_id or recipient
  const { data: sentEmail } = await supabase
    .from('email_queue')
    .select(`
      *,
      contacts (email),
      campaigns (id, name, user_id)
    `)
    .eq('thread_id', threadId)
    .eq('status', 'sent')
    .order('sent_at', { ascending: false })
    .limit(1)
    .single()

  if (!sentEmail) {
    console.log(`No matching sent email found for thread ${threadId}`)
    return
  }

  // Classify reply using AI
  const classification = await classifyReplyWithAI(body)

  // Store reply
  const { error: insertError } = await supabase
    .from('email_replies')
    .insert({
      campaign_id: sentEmail.campaign_id,
      contact_id: sentEmail.contact_id, 
      email_queue_id: sentEmail.id,
      message_id: messageId,
      thread_id: threadId,
      from_email: from,
      subject,
      body,
      received_at: receivedAt.toISOString(),
      classification: classification.category,
      sentiment: classification.sentiment,
      needs_response: classification.needsResponse
    })

  if (insertError) {
    console.error('Error storing reply:', insertError)
    return
  }

  console.log(`✅ Processed reply from ${from}: ${classification.category}`)

  // Update campaign stats
  await supabase.rpc('increment_campaign_replies', {
    campaign_id: sentEmail.campaign_id
  })
}