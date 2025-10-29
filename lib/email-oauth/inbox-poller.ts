// lib/email-oauth/inbox-poller.ts
import { google } from 'googleapis'
import { createClient } from '@supabase/supabase-js'
import { getValidAccessToken } from './token-manager'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function pollInboxes() {
  console.log('📬 Polling inboxes for replies...')
  
  try {
    // Get active email accounts
    const { data: accounts, error } = await supabase
      .from('email_accounts')
      .select('*')
      .in('status', ['active', 'warming_up'])
      .eq('provider', 'google')
    
    if (error) {
      console.error('Failed to fetch email accounts:', error)
      return
    }

    if (!accounts || accounts.length === 0) {
      console.log('No active email accounts to poll')
      return
    }

    for (const account of accounts) {
      try {
        await pollAccountInbox(account)
      } catch (error) {
        console.error(`Error polling ${account.email}:`, error)
        
        // Update account with error status
        await supabase
          .from('email_accounts')
          .update({ 
            last_error: error instanceof Error ? error.message : 'Unknown error',
            status: 'error'
          })
          .eq('id', account.id)
      }
    }
    
    console.log('✅ Inbox polling complete')
  } catch (error) {
    console.error('Inbox polling failed:', error)
    throw error
  }
}

async function pollAccountInbox(account: any) {
  console.log(`📥 Polling inbox for ${account.email}`)
  
  try {
    // Get valid access token (will refresh if needed)
    const accessToken = await getValidAccessToken(account)
    
    // Set up OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    )
    
    oauth2Client.setCredentials({
      access_token: accessToken
    })
    
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client })
    
    // Get unread messages from the last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const query = `is:unread after:${Math.floor(oneDayAgo.getTime() / 1000)}`
    
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: 50
    })
    
    const messages = response.data.messages || []
    console.log(`📧 Found ${messages.length} unread messages in ${account.email}`)
    
    if (messages.length === 0) {
      // Update last sync time
      await supabase
        .from('email_accounts')
        .update({ 
          last_sync_at: new Date().toISOString(),
          last_error: null
        })
        .eq('id', account.id)
      return
    }
    
    // Process each message
    for (const message of messages) {
      try {
        await processMessage(gmail, account, message.id!)
      } catch (error) {
        console.error(`Error processing message ${message.id}:`, error)
      }
    }
    
    // Update last sync time
    await supabase
      .from('email_accounts')
      .update({ 
        last_sync_at: new Date().toISOString(),
        last_error: null
      })
      .eq('id', account.id)
      
  } catch (error) {
    console.error(`Failed to poll inbox for ${account.email}:`, error)
    throw error
  }
}

async function processMessage(gmail: any, account: any, messageId: string) {
  try {
    // Get full message details
    const messageResponse = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'metadata',
      metadataHeaders: ['From', 'To', 'Subject', 'Date', 'In-Reply-To', 'References']
    })
    
    const message = messageResponse.data
    const headers = message.payload.headers
    
    // Extract header values
    const from = headers.find((h: any) => h.name === 'From')?.value
    const to = headers.find((h: any) => h.name === 'To')?.value  
    const subject = headers.find((h: any) => h.name === 'Subject')?.value
    const inReplyTo = headers.find((h: any) => h.name === 'In-Reply-To')?.value
    const references = headers.find((h: any) => h.name === 'References')?.value
    
    // Check if this is a reply to one of our campaign emails
    if (inReplyTo || references) {
      const messageIds = [inReplyTo, ...(references || '').split(' ')].filter(Boolean)
      
      // Look for campaign emails with matching message IDs
      const { data: campaignEmails } = await supabase
        .from('email_queue')
        .select(`
          id,
          campaign_id,
          contact_id,
          message_id,
          campaign_contacts!inner(email, first_name, last_name)
        `)
        .in('message_id', messageIds)
        .eq('status', 'sent')
      
      if (campaignEmails && campaignEmails.length > 0) {
        const campaignEmail = campaignEmails[0]
        
        console.log(`📨 Found reply from ${from} to campaign ${campaignEmail.campaign_id}`)
        
        // Store the reply in email_events
        await supabase
          .from('email_events')
          .insert({
            campaign_id: campaignEmail.campaign_id,
            contact_id: campaignEmail.contact_id,
            email_queue_id: campaignEmail.id,
            event_type: 'reply',
            event_data: {
              from,
              to,
              subject,
              message_id: messageId,
              in_reply_to: inReplyTo,
              gmail_thread_id: message.threadId
            },
            created_at: new Date().toISOString()
          })
        
        // Update campaign contact status
        await supabase
          .from('campaign_contacts')
          .update({
            status: 'replied',
            replied_at: new Date().toISOString()
          })
          .eq('id', campaignEmail.contact_id)
        
        // Mark Gmail message as read
        await gmail.users.messages.modify({
          userId: 'me',
          id: messageId,
          resource: {
            removeLabelIds: ['UNREAD']
          }
        })
      }
    }
    
  } catch (error) {
    console.error(`Error processing message ${messageId}:`, error)
  }
}