// app/api/cron/check-delivery-status/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

    console.log('🔄 Starting intelligent delivery status check...')
    
    let deliveredCount = 0
    let bouncedCount = 0
    let timeBasedDelivered = 0

    // Step 1: Mark emails as delivered if they have opens/clicks (immediate confirmation)
    const immediateDeliveries = await markDeliveredFromEngagement()
    deliveredCount += immediateDeliveries

    // Step 2: Check for bounce notifications in recent emails
    const bounces = await checkForBounceNotifications()
    bouncedCount += bounces

    // Step 3: Apply time-based delivery assumptions (24+ hours old, no bounces)
    const timeBasedDeliveries = await markTimeBasedDeliveries()
    timeBasedDelivered += timeBasedDeliveries
    deliveredCount += timeBasedDeliveries

    console.log(`✅ Delivery status check completed:`)
    console.log(`   📧 ${immediateDeliveries} marked delivered from engagement`)  
    console.log(`   ⏰ ${timeBasedDeliveries} marked delivered by time assumption`)
    console.log(`   ❌ ${bounces} marked as bounced`)
    
    return NextResponse.json({ 
      success: true, 
      totalDelivered: deliveredCount,
      immediateDeliveries: immediateDeliveries,
      timeBasedDeliveries: timeBasedDeliveries,
      bounced: bouncedCount,
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

// Mark emails as delivered if they have opens or clicks (definitive proof of delivery)
async function markDeliveredFromEngagement(): Promise<number> {
  try {
    // Find campaign_contacts that are 'sent' but have open/click events
    const { data: engagedContacts, error } = await supabase
      .from('campaign_contacts')
      .select(`
        campaign_id,
        contact_id,
        id
      `)
      .eq('status', 'sent')
      .or('opened_at.not.is.null,clicked_at.not.is.null')

    if (error) {
      console.error('Error fetching engaged contacts:', error)
      return 0
    }

    let count = 0
    for (const contact of engagedContacts || []) {
      // Update to delivered status
      await supabase
        .from('campaign_contacts')
        .update({
          status: 'delivered'
        })
        .eq('id', contact.id)

      // Create delivery event
      await supabase
        .from('email_events')
        .insert({
          campaign_id: contact.campaign_id,
          contact_id: contact.contact_id,
          event_type: 'delivered',
          metadata: {
            delivery_method: 'engagement_confirmation',
            reason: 'Email opened or clicked',
            timestamp: new Date().toISOString()
          }
        })

      count++
    }

    return count
  } catch (error) {
    console.error('Error marking delivered from engagement:', error)
    return 0
  }
}

// Check inboxes for bounce notifications and delivery failures
async function checkForBounceNotifications(): Promise<number> {
  try {
    // Get recent bounce-related messages from inboxes
    const { data: bounceMessages, error } = await supabase
      .from('inbox_messages')
      .select('*')
      .or('subject.ilike.%bounce%,subject.ilike.%delivery failure%,subject.ilike.%undelivered%,from_email.ilike.%mailer-daemon%,from_email.ilike.%postmaster%')
      .gte('received_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
      .eq('message_type', 'new')

    if (error) {
      console.error('Error fetching bounce messages:', error)
      return 0
    }

    let bounceCount = 0
    for (const bounceMsg of bounceMessages || []) {
      // Extract original message info from bounce content
      const originalEmail = extractOriginalEmailFromBounce(bounceMsg.content)
      
      if (originalEmail) {
        // Find corresponding campaign contact
        const { data: campaignContact } = await supabase
          .from('campaign_contacts')
          .select('id, campaign_id, contact_id')
          .eq('email', originalEmail)
          .eq('status', 'sent')
          .single()

        if (campaignContact) {
          // Mark as bounced
          await supabase
            .from('campaign_contacts')
            .update({
              status: 'bounced',
              bounced_at: new Date().toISOString()
            })
            .eq('id', campaignContact.id)

          // Create bounce event
          await supabase
            .from('email_events')
            .insert({
              campaign_id: campaignContact.campaign_id,
              contact_id: campaignContact.contact_id,
              event_type: 'bounced',
              metadata: {
                bounce_type: 'hard_bounce',
                bounce_reason: 'Delivery failure notification received',
                bounce_message_id: bounceMsg.id,
                timestamp: new Date().toISOString()
              }
            })

          bounceCount++
        }
      }
    }

    return bounceCount
  } catch (error) {
    console.error('Error checking bounce notifications:', error)
    return 0
  }
}

// Mark emails as delivered after sufficient time with no bounce (24+ hours)
async function markTimeBasedDeliveries(): Promise<number> {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    
    // Find campaign_contacts that are still 'sent' after 24+ hours
    const { data: oldSentEmails, error } = await supabase
      .from('campaign_contacts')
      .select('id, campaign_id, contact_id, sent_at')
      .eq('status', 'sent')
      .lt('sent_at', twentyFourHoursAgo)

    if (error) {
      console.error('Error fetching old sent emails:', error)
      return 0
    }

    let count = 0
    for (const contact of oldSentEmails || []) {
      // Check if there's already a delivery or bounce event
      const { data: existingEvent } = await supabase
        .from('email_events')
        .select('id')
        .eq('campaign_id', contact.campaign_id)
        .eq('contact_id', contact.contact_id)
        .in('event_type', ['delivered', 'bounced'])
        .limit(1)

      if (!existingEvent || existingEvent.length === 0) {
        // Mark as delivered (time-based assumption)
        await supabase
          .from('campaign_contacts')
          .update({
            status: 'delivered'
          })
          .eq('id', contact.id)

        // Create delivery event
        await supabase
          .from('email_events')
          .insert({
            campaign_id: contact.campaign_id,
            contact_id: contact.contact_id,
            event_type: 'delivered',
            metadata: {
              delivery_method: 'time_based_assumption',
              reason: '24+ hours elapsed without bounce notification',
              sent_at: contact.sent_at,
              timestamp: new Date().toISOString()
            }
          })

        count++
      }
    }

    return count
  } catch (error) {
    console.error('Error marking time-based deliveries:', error)
    return 0
  }
}

// Extract original recipient email from bounce message content
function extractOriginalEmailFromBounce(bounceContent: string): string | null {
  try {
    // Common patterns in bounce messages
    const patterns = [
      /to:\s*([^\s<]+@[^\s>]+)/i,
      /recipient:\s*([^\s<]+@[^\s>]+)/i,
      /original-recipient:\s*([^\s<]+@[^\s>]+)/i,
      /final-recipient:\s*([^\s<]+@[^\s>]+)/i,
      /<([^@\s]+@[^@\s>]+)>/,
      /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/
    ]

    for (const pattern of patterns) {
      const match = bounceContent.match(pattern)
      if (match && match[1]) {
        return match[1].trim()
      }
    }

    return null
  } catch (error) {
    console.error('Error extracting email from bounce:', error)
    return null
  }
}

