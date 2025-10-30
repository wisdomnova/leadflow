// app/api/cron/check-delivery-status/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { decryptToken } from '@/lib/email-oauth/token-manager'
import { google } from 'googleapis'
import axios from 'axios'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔄 Checking delivery status for recent emails...')
    
    // Get email events from the last 24 hours that are 'sent' but not yet 'delivered'
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    
    const { data: recentEmails, error } = await supabase
      .from('email_events')
      .select(`
        *,
        email_accounts!inner(*)
      `)
      .eq('event_type', 'sent')
      .gte('created_at', twentyFourHoursAgo)
      .not('message_id', 'is', null)
      .limit(50)

    if (error) {
      console.error('Error fetching recent emails:', error)
      return NextResponse.json({ error: 'Failed to fetch emails' }, { status: 500 })
    }

    let deliveredCount = 0
    let bouncedCount = 0

    for (const email of recentEmails || []) {
      try {
        // Check if we already have a delivery status for this message
        const { data: existingDelivery } = await supabase
          .from('email_events')
          .select('id')
          .eq('message_id', email.message_id)
          .in('event_type', ['delivered', 'bounced'])
          .limit(1)

        if (existingDelivery && existingDelivery.length > 0) {
          continue // Already processed
        }

        const account = email.email_accounts
        let deliveryStatus = null

        if (account.provider === 'google') {
          deliveryStatus = await checkGmailDeliveryStatus(account, email.message_id)
        } else if (account.provider === 'microsoft') {
          deliveryStatus = await checkOutlookDeliveryStatus(account, email.message_id)
        }

        if (deliveryStatus) {
          // Create delivery event
          await supabase
            .from('email_events')
            .insert({
              campaign_id: email.campaign_id,
              contact_id: email.contact_id,
              email_account_id: email.email_account_id,
              organization_id: email.organization_id,
              event_type: deliveryStatus.status,
              message_id: email.message_id,
              tracking_id: email.tracking_id,
              metadata: deliveryStatus.metadata || {}
            })

          // Update campaign_contacts status
          if (deliveryStatus.status === 'delivered') {
            await supabase
              .from('campaign_contacts')
              .update({
                status: 'delivered',
                // Don't overwrite sent_at, but could add delivered_at if column exists
              })
              .eq('campaign_id', email.campaign_id)
              .eq('contact_id', email.contact_id)
              .in('status', ['sent']) // Only update if currently 'sent'
              
            deliveredCount++
          } else if (deliveryStatus.status === 'bounced') {
            await supabase
              .from('campaign_contacts')
              .update({
                status: 'bounced',
                bounced_at: new Date().toISOString()
              })
              .eq('campaign_id', email.campaign_id)
              .eq('contact_id', email.contact_id)
              .in('status', ['sent']) // Only update if currently 'sent'
              
            bouncedCount++
          }
        }
      } catch (error) {
        console.error(`Error checking delivery status for message ${email.message_id}:`, error)
      }
    }

    console.log(`✅ Delivery status check completed: ${deliveredCount} delivered, ${bouncedCount} bounced`)
    
    return NextResponse.json({ 
      success: true, 
      delivered: deliveredCount,
      bounced: bouncedCount,
      processed: recentEmails?.length || 0,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Delivery status check error:', error)
    return NextResponse.json({ 
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

async function checkGmailDeliveryStatus(account: any, messageId: string) {
  try {
    const accessToken = decryptToken(account.access_token)
    
    const oauth2Client = new google.auth.OAuth2()
    oauth2Client.setCredentials({ access_token: accessToken })
    
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client })
    
    // Get message details to check if it was delivered or bounced
    const message = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'metadata',
      metadataHeaders: ['Message-ID', 'Subject', 'To']
    })

    // Gmail doesn't provide explicit delivery receipts, but we can assume
    // if the message exists and wasn't returned as bounced, it was delivered
    // In a real implementation, you might check for bounce messages in the inbox
    
    return {
      status: 'delivered',
      metadata: {
        provider: 'gmail',
        messageId: messageId,
        checkTime: new Date().toISOString()
      }
    }
  } catch (error: any) {
    // If message not found or error, it might have bounced
    if (error.code === 404 || error.message?.includes('not found')) {
      return {
        status: 'bounced',
        metadata: {
          provider: 'gmail',
          messageId: messageId,
          error: error.message,
          checkTime: new Date().toISOString()
        }
      }
    }
    throw error
  }
}

async function checkOutlookDeliveryStatus(account: any, messageId: string) {
  try {
    const accessToken = decryptToken(account.access_token)
    
    // Use Microsoft Graph API to check message status
    const response = await axios.get(
      `https://graph.microsoft.com/v1.0/me/messages/${messageId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (response.data) {
      return {
        status: 'delivered',
        metadata: {
          provider: 'microsoft',
          messageId: messageId,
          checkTime: new Date().toISOString()
        }
      }
    }
  } catch (error: any) {
    // If message not found, it might have bounced
    if (error.response?.status === 404) {
      return {
        status: 'bounced',
        metadata: {
          provider: 'microsoft',
          messageId: messageId,
          error: error.message,
          checkTime: new Date().toISOString()
        }
      }
    }
    throw error
  }
}