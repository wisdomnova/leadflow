// ./app/api/webhooks/resend/route.ts - Update to use Svix library

import { NextRequest, NextResponse } from 'next/server'
import { EmailService } from '@/lib/email-service'
import { Webhook } from 'svix'

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text()
    
    // Get Svix headers
    const svixId = request.headers.get('svix-id') || ''
    const svixTimestamp = request.headers.get('svix-timestamp') || ''
    const svixSignature = request.headers.get('svix-signature') || ''

    console.log('Svix webhook received:', {
      payloadLength: payload.length,
      svixId,
      svixTimestamp,
      signature: svixSignature ? svixSignature.substring(0, 30) + '...' : 'none',
      userAgent: request.headers.get('user-agent')
    })

    // Verify webhook signature using Svix library
    if (!process.env.RESEND_WEBHOOK_SECRET) {
      console.warn('RESEND_WEBHOOK_SECRET not configured, skipping signature verification')
    } else {
      try {
        const wh = new Webhook(process.env.RESEND_WEBHOOK_SECRET)
        
        // Verify the webhook - this will throw if verification fails
        wh.verify(payload, {
          'svix-id': svixId,
          'svix-timestamp': svixTimestamp,
          'svix-signature': svixSignature,
        })
        
        console.log('✅ Webhook signature verified with Svix library')
      } catch (verificationError) {
        console.error('Webhook signature verification failed:', verificationError)
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    const event = JSON.parse(payload)
    console.log('Resend webhook event:', {
      type: event.type,
      messageId: event.data?.id,
      to: event.data?.to,
      subject: event.data?.subject,
      tags: event.data?.tags
    })
    
    // *** FIXED: Extract tags correctly (tags is an object, not an array) ***
    const tags = event.data?.tags || {}
    const campaignId = tags.campaign_id
    const contactId = tags.contact_id
    const stepNumber = parseInt(tags.step_number || '1')

    console.log('Extracted from tags:', { campaignId, contactId, stepNumber, tagsType: typeof tags })

    if (!campaignId || !contactId) {
      console.warn('Missing campaign or contact ID in webhook event:', { 
        campaignId, 
        contactId, 
        availableTags: Object.keys(tags)
      })
      return NextResponse.json({ received: true, warning: 'Missing required tags' })
    }

    console.log('Processing webhook for:', { campaignId, contactId, stepNumber, eventType: event.type })

    // Handle different event types
    switch (event.type) {
      case 'email.sent':
        await EmailService.logEmailEvent({
          campaignId,
          contactId,
          stepNumber,
          type: 'delivery', // or 'sent' - depends on your EmailService implementation
          messageId: event.data?.id,
          metadata: {
            to: event.data?.to,
            subject: event.data?.subject,
            sentAt: event.created_at
          }
        })
        console.log('✅ Logged email sent event')
        break

      case 'email.delivered':
        await EmailService.logEmailEvent({
          campaignId,
          contactId,
          stepNumber,
          type: 'delivery',
          messageId: event.data?.id,
          metadata: {
            deliveredAt: event.created_at,
            to: event.data?.to
          }
        })
        console.log('✅ Logged email delivery event')
        break

      case 'email.bounced':
        await EmailService.logEmailEvent({
          campaignId,
          contactId,
          stepNumber,
          type: 'bounce',
          messageId: event.data?.id,
          metadata: {
            reason: event.data?.bounce?.reason,
            bounceType: event.data?.bounce?.type,
            diagnostic: event.data?.bounce?.diagnostic
          }
        })
        console.log('✅ Logged email bounce event')
        break

      case 'email.complained':
        await EmailService.logEmailEvent({
          campaignId,
          contactId,
          stepNumber,
          type: 'complaint',
          messageId: event.data?.id,
          metadata: {
            complaintType: event.data?.complaint?.type,
            userAgent: event.data?.complaint?.userAgent
          }
        })
        console.log('✅ Logged email complaint event')
        break

      case 'email.opened':
        await EmailService.logEmailEvent({
          campaignId,
          contactId,
          stepNumber,
          type: 'open',
          messageId: event.data?.id,
          metadata: {
            openedAt: event.created_at,
            userAgent: event.data?.userAgent,
            ip: event.data?.ip
          }
        })
        console.log('✅ Logged email open event')
        break

      case 'email.clicked':
        await EmailService.logEmailEvent({
          campaignId,
          contactId,
          stepNumber,
          type: 'click',
          messageId: event.data?.id,
          metadata: {
            clickedAt: event.created_at,
            url: event.data?.url,
            userAgent: event.data?.userAgent,
            ip: event.data?.ip
          }
        })
        console.log('✅ Logged email click event')
        break

      default:
        console.log('Unhandled Resend webhook event type:', event.type)
    }

    return NextResponse.json({ 
      received: true, 
      eventType: event.type,
      messageId: event.data?.id,
      campaignId,
      contactId,
      svixId
    })

  } catch (error) {
    console.error('Resend webhook processing error:', error)
    return NextResponse.json({ 
      error: 'Webhook processing failed',
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}