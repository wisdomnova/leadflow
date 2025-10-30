// lib/email-oauth/inbox-poller.ts
import { supabase } from '@/lib/supabase'
import { decryptToken, encryptToken } from './token-manager'
import { fetchGmailMessages, refreshGoogleToken } from './google-oauth'
import { fetchOutlookMessages, refreshMicrosoftToken } from './microsoft-oauth'
import { ReplyDetectionService } from '@/lib/reply-detection'

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
    let accessToken = decryptToken(account.access_token)
    
    // Check if token is expired and refresh if needed
    const now = new Date()
    const expiresAt = new Date(account.expires_at)
    
    if (expiresAt <= now) {
      console.log(`🔄 Token expired for ${account.email}, refreshing...`)
      try {
        const refreshToken = decryptToken(account.refresh_token)
        let refreshResult
        
        if (account.provider === 'google') {
          refreshResult = await refreshGoogleToken(refreshToken)
        } else if (account.provider === 'microsoft') {
          refreshResult = await refreshMicrosoftToken(refreshToken)
        } else {
          throw new Error(`Unsupported provider: ${account.provider}`)
        }
        
        // Update the account with new tokens
        const { error: updateError } = await supabase
          .from('email_accounts')
          .update({
            access_token: encryptToken(refreshResult.accessToken),
            refresh_token: refreshResult.refreshToken ? encryptToken(refreshResult.refreshToken) : account.refresh_token,
            expires_at: refreshResult.expiresAt.toISOString(),
            updated_at: now.toISOString()
          })
          .eq('id', account.id)
        
        if (updateError) {
          console.error(`Failed to update tokens for ${account.email}:`, updateError)
          return
        }
        
        accessToken = refreshResult.accessToken
        console.log(`✅ Token refreshed for ${account.email}`)
      } catch (refreshError) {
        console.error(`Failed to refresh token for ${account.email}:`, refreshError)
        return
      }
    }
    
    // Get recent emails from the last hour
    const sinceDate = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    
    let emails: any[] = []
    
    if (account.provider === 'google') {
      emails = await getGmailEmails(accessToken, sinceDate, account)
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
    // Get the organization ID from the email account
    const organizationId = account.organization_id

    if (!organizationId) {
      console.error('No organization_id found for email account:', account.email)
      return
    }

    // Use ReplyDetectionService to process the email completely
    // This will handle AI classification, inbox_messages insertion, and reply detection
    const inboxMessage = await ReplyDetectionService.processIncomingEmail({
      message_id: email.messageId,
      subject: email.subject || '',
      content: email.content || email.body || '',
      html_content: email.html_content || email.htmlBody,
      from_email: email.from,
      from_name: email.fromName,
      to_email: account.email,
      to_name: account.display_name,
      headers: email.headers,
      received_at: email.receivedAt
    }, organizationId)

    console.log(`💬 Email processed and saved to inbox: ${email.from} -> ${account.email}`)
    
    // If it's a reply to a campaign, also log to email_events for analytics
    if (inboxMessage.campaign_id && inboxMessage.contact_id) {
      await supabase
        .from('email_events')
        .insert([{
          campaign_id: inboxMessage.campaign_id,
          contact_id: inboxMessage.contact_id,
          email_account_id: account.id,
          event_type: 'reply',
          metadata: {
            subject: email.subject,
            from: email.from,
            messageId: email.messageId,
            receivedAt: email.receivedAt,
            inboxMessageId: inboxMessage.id
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
        .eq('id', inboxMessage.contact_id)

      console.log(`� Campaign reply recorded: ${email.from} to campaign ${inboxMessage.campaign_id}`)
    }

  } catch (error) {
    console.error('Error processing incoming email:', error)
  }
}

async function getGmailEmails(accessToken: string, sinceDate: string, account?: any) {
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
      if (response.status === 401 && account) {
        console.log(`🔄 Gmail API returned 401, attempting token refresh for ${account.email}`)
        try {
          const refreshToken = decryptToken(account.refresh_token)
          const refreshResult = await refreshGoogleToken(refreshToken)
          
          // Update the account with new tokens
          const { error: updateError } = await supabase
            .from('email_accounts')
            .update({
              access_token: encryptToken(refreshResult.accessToken),
              refresh_token: refreshResult.refreshToken ? encryptToken(refreshResult.refreshToken) : account.refresh_token,
              expires_at: refreshResult.expiresAt.toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', account.id)
          
          if (updateError) {
            console.error(`Failed to update tokens after 401 for ${account.email}:`, updateError)
            throw new Error(`Gmail API error: ${response.status}`)
          }
          
          // Retry with new token
          console.log(`✅ Token refreshed after 401, retrying Gmail API for ${account.email}`)
          return await getGmailEmails(refreshResult.accessToken, sinceDate)
        } catch (refreshError) {
          console.error(`Failed to refresh token after 401 for ${account.email}:`, refreshError)
          throw new Error(`Gmail API error: ${response.status}`)
        }
      }
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
        
        // Extract email content from payload
        let content = ''
        let htmlContent = ''
        
        // Function to extract content from message parts
        const extractContent = (part: any): void => {
          if (part.body?.data) {
            const decodedContent = Buffer.from(part.body.data, 'base64').toString('utf-8')
            if (part.mimeType === 'text/plain') {
              content = decodedContent
            } else if (part.mimeType === 'text/html') {
              htmlContent = decodedContent
            }
          }
          
          // Recursively process multipart messages
          if (part.parts) {
            part.parts.forEach(extractContent)
          }
        }
        
        // Extract content from the payload
        if (emailData.payload) {
          extractContent(emailData.payload)
        }
        
        // If no plain text content, try to extract from HTML
        if (!content && htmlContent) {
          content = htmlContent.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
        }
        
        emails.push({
          messageId: emailData.id,
          from: headers.find((h: any) => h.name === 'From')?.value,
          fromName: headers.find((h: any) => h.name === 'From')?.value?.match(/^(.+?)\s*<.*>$/)?.[1]?.trim(),
          subject: headers.find((h: any) => h.name === 'Subject')?.value,
          content: content,
          htmlContent: htmlContent,
          body: content, // Alias for backwards compatibility
          htmlBody: htmlContent, // Alias for backwards compatibility
          inReplyTo: headers.find((h: any) => h.name === 'In-Reply-To')?.value,
          references: headers.find((h: any) => h.name === 'References')?.value?.split(' ') || [],
          headers: Object.fromEntries(headers.map((h: any) => [h.name.toLowerCase(), h.value])),
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
      fromName: email.from?.emailAddress?.name,
      subject: email.subject,
      content: email.body?.content || email.bodyPreview || '',
      htmlContent: email.body?.contentType === 'html' ? email.body?.content : '',
      body: email.body?.content || email.bodyPreview || '',
      htmlBody: email.body?.contentType === 'html' ? email.body?.content : '',
      inReplyTo: email.conversationId, // Outlook uses conversation threading
      references: [],
      headers: {
        'message-id': email.internetMessageId,
        'conversation-id': email.conversationId
      },
      receivedAt: email.receivedDateTime
    }))
  } catch (error) {
    console.error('Outlook polling error:', error)
    return []
  }
}