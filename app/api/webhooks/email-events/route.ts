import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const provider = request.headers.get('x-provider') || 'unknown'
    
    console.log('Email webhook received:', provider, body)

    // Handle different provider webhook formats
    let events: any[] = []
    
    if (provider === 'gmail' || provider === 'google') {
      // Google/Gmail webhook format
      events = await processGoogleWebhook(body)
    } else if (provider === 'outlook' || provider === 'microsoft') {
      // Microsoft/Outlook webhook format  
      events = await processMicrosoftWebhook(body)
    } else {
      // Generic format
      events = Array.isArray(body) ? body : [body] 
    }

    for (const event of events) {
      await processEmailEvent(event)
    }

    return NextResponse.json({ success: true, processed: events.length })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

async function processEmailEvent(event: any) {
  try {
    const { messageId, eventType, contactEmail, metadata = {} } = event

    if (!messageId || !eventType) return

    // Find the campaign contact by message ID or email
    const { data: emailQueue, error } = await supabase
      .from('email_queue')
      .select(`
        campaign_id,
        contact_id,
        email_account_id,
        campaign_contacts!inner(email, id)
      `)
      .eq('message_id', messageId)
      .single()

    if (error || !emailQueue) {
      console.warn('No email queue record found for message:', messageId)
      return
    }

    // Record the event
    await supabase
      .from('email_events')
      .insert([{
        campaign_id: emailQueue.campaign_id,
        contact_id: emailQueue.contact_id,
        email_account_id: emailQueue.email_account_id,
        event_type: eventType,
        message_id: messageId,
        metadata,
        created_at: new Date().toISOString()
      }])

    // Update campaign contact status based on event type
    const statusUpdates: any = {
      updated_at: new Date().toISOString()
    }

    switch (eventType) {
      case 'delivered':
        statusUpdates.status = 'delivered'
        break
      case 'opened':
        statusUpdates.status = 'opened'
        statusUpdates.opened_at = new Date().toISOString()
        break
      case 'clicked':
        statusUpdates.status = 'clicked'
        statusUpdates.clicked_at = new Date().toISOString()
        break
      case 'bounced':
        statusUpdates.status = 'bounced'
        statusUpdates.bounced_at = new Date().toISOString()
        break
      case 'complained':
        statusUpdates.status = 'complained'
        break
      case 'unsubscribed':
        statusUpdates.status = 'unsubscribed'
        statusUpdates.unsubscribed_at = new Date().toISOString()
        break
    }

    if (Object.keys(statusUpdates).length > 1) {
      await supabase
        .from('campaign_contacts')
        .update(statusUpdates)
        .eq('id', emailQueue.contact_id)
    }

    // Fix: Access email from the campaign_contacts array properly (it's an array due to the join)
    const recipientEmail = emailQueue.campaign_contacts?.[0]?.email || 'unknown'
    console.log(`📧 Processed ${eventType} event for ${recipientEmail}`)
  } catch (error) {
    console.error('Error processing email event:', error)
  }
}

async function processGoogleWebhook(body: any) {
  // Process Google/Gmail webhook format
  // This depends on how you set up Gmail webhooks
  return []
}

async function processMicrosoftWebhook(body: any) {
  // Process Microsoft/Outlook webhook format
  // This depends on how you set up Outlook webhooks
  return []
}
