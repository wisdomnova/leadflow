// lib/email-oauth/inbox-poller.ts
import { supabase } from '@/lib/supabase'
import { decryptToken } from './token-manager'
import { fetchGmailMessages } from './google-oauth'
import { fetchOutlookMessages } from './microsoft-oauth'
import { classifyReplyWithAI } from '@/lib/ai/reply-classifier'

export async function pollInboxes() {
  try {
    console.log('🔄 Starting inbox polling...')

    // Get all active email accounts 
    const { data: accounts, error } = await supabase
      .from('email_accounts')
      .select('*')
      .in('status', ['active', 'warming_up'])

    if (error || !accounts) {
      console.error('Failed to fetch email accounts:', error)
      return
    }

    for (const account of accounts) {
      try {
        await pollAccountInbox(account)
      } catch (error) {
        console.error(`Failed to poll inbox for ${account.email}:`, error)
      }
    }

    console.log('✅ Inbox polling completed')
  } catch (error) {
    console.error('Inbox polling error:', error)
  }
}

async function pollAccountInbox(account: any) {
  try {
    const accessToken = decryptToken(account.access_token)
    
    // Get recent emails from the last hour
    const sinceDate = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    
    let emails: any[] = []
    
    if (account.provider === 'google') {
      emails = await getGmailEmails(accessToken, sinceDate)
    } else if (account.provider === 'microsoft') {
      emails = await getOutlookEmails(accessToken, sinceDate)
    }

    // Process each email to check for replies
    for (const email of emails) {
      await processIncomingEmail(email, account)
    }

    console.log(`📨 Processed ${emails.length} emails for ${account.email}`)
  } catch (error) {
    console.error(`Error polling ${account.email}:`, error) 
  }
}

async function processIncomingEmail(email: any, account: any) {
  try {
    const fromEmail = email.from?.toLowerCase()
    const subject = email.subject || ''
    const inReplyTo = email.inReplyTo
    const references = email.references || []

    // Check if this is a reply to a campaign email
    const { data: campaignContacts, error } = await supabase
      .from('campaign_contacts')
      .select(`
        id,
        campaign_id,
        email,
        campaigns!inner(id, organization_id)
      `)
      .eq('email', fromEmail)
      .in('status', ['sent', 'delivered', 'opened', 'clicked'])

    if (error || !campaignContacts || campaignContacts.length === 0) {
      return // Not a reply to our campaign
    }

    // Find matching campaign contact
    for (const contact of campaignContacts) {
      // Check if this email is a reply (by subject or thread references)
      const isReply = 
        subject.toLowerCase().includes('re:') ||
        inReplyTo ||
        references.length > 0

      if (isReply) {
        // Record the reply event
        await supabase
          .from('email_events')
          .insert([{
            campaign_id: contact.campaign_id,
            contact_id: contact.id,
            email_account_id: account.id,
            event_type: 'reply',
            metadata: {
              subject: email.subject,
              from: email.from,
              messageId: email.messageId,
              receivedAt: email.receivedAt
            },
            created_at: new Date().toISOString()
          }])

        // Update campaign contact status
        await supabase
          .from('campaign_contacts')
          .update({
            status: 'replied',
            replied_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', contact.id)

        console.log(`💬 Reply detected from ${fromEmail} to campaign ${contact.campaign_id}`)
        break
      }
    }
  } catch (error) {
    console.error('Error processing incoming email:', error)
  }
}

async function getGmailEmails(accessToken: string, sinceDate: string) {
  try {
    const response = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=after:${Math.floor(new Date(sinceDate).getTime() / 1000)}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Gmail API error: ${response.status}`)
    }

    const data = await response.json()
    const messages = data.messages || []

    // Get full message details
    const emails = []
    for (const message of messages.slice(0, 50)) { // Limit to recent 50
      const detailResponse = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      )

      if (detailResponse.ok) {
        const emailData = await detailResponse.json()
        const headers = emailData.payload?.headers || []
        
        emails.push({
          messageId: emailData.id,
          from: headers.find((h: any) => h.name === 'From')?.value,
          subject: headers.find((h: any) => h.name === 'Subject')?.value,
          inReplyTo: headers.find((h: any) => h.name === 'In-Reply-To')?.value,
          references: headers.find((h: any) => h.name === 'References')?.value?.split(' ') || [],
          receivedAt: new Date(parseInt(emailData.internalDate)).toISOString()
        })
      }
    }

    return emails
  } catch (error) {
    console.error('Gmail polling error:', error)
    return []
  }
}

async function getOutlookEmails(accessToken: string, sinceDate: string) {
  try {
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/me/messages?$filter=receivedDateTime ge ${sinceDate}&$top=50`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Outlook API error: ${response.status}`)
    }

    const data = await response.json()
    const messages = data.value || []

    return messages.map((email: any) => ({
      messageId: email.id,
      from: email.from?.emailAddress?.address,
      subject: email.subject,
      inReplyTo: email.conversationId, // Outlook uses conversation threading
      references: [],
      receivedAt: email.receivedDateTime
    }))
  } catch (error) {
    console.error('Outlook polling error:', error)
    return []
  }
}