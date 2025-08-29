// ./app/api/webhooks/resend/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { EmailService } from '@/lib/email-service'
import crypto from 'crypto'

function verifyWebhookSignature(payload: string, signature: string): boolean {
  if (!process.env.RESEND_WEBHOOK_SECRET) {
    console.warn('RESEND_WEBHOOK_SECRET not configured, skipping signature verification')
    return true // Allow in development
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RESEND_WEBHOOK_SECRET)
      .update(payload)
      .digest('hex')

    return crypto.timingSafeEqual(
      Buffer.from(signature.replace('sha256=', '')),
      Buffer.from(expectedSignature)
    )
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text()
    const signature = request.headers.get('resend-signature') || 
                     request.headers.get('x-resend-signature') || ''

    // Verify webhook signature
    if (!verifyWebhookSignature(payload, signature)) {
      console.error('Invalid webhook signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const event = JSON.parse(payload)
    console.log('Resend webhook event:', event.type, event.data?.id)
    
    // Extract campaign and contact info from tags
    const tags = event.data?.tags || []
    const campaignId = tags.find((tag: any) => tag.name === 'campaign_id')?.value
    const contactId = tags.find((tag: any) => tag.name === 'contact_id')?.value
    const stepNumber = parseInt(tags.find((tag: any) => tag.name === 'step_number')?.value || '1')

    if (!campaignId || !contactId) {
      console.warn('Missing campaign or contact ID in webhook event:', { campaignId, contactId })
      return NextResponse.json({ received: true, warning: 'Missing required tags' })
    }

    // Handle different event types
    switch (event.type) {
      case 'email.sent':
        await EmailService.logEmailEvent({
          campaignId,
          contactId,
          stepNumber,
          type: 'delivery',
          messageId: event.data?.id,
          metadata: {
            to: event.data?.to,
            subject: event.data?.subject
          }
        })
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
        break

      case 'email.delivered':
        // Update delivery confirmation
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
        break

      default:
        console.log('Unhandled Resend webhook event type:', event.type)
    }

    return NextResponse.json({ 
      received: true, 
      eventType: event.type,
      messageId: event.data?.id 
    })

  } catch (error) {
    console.error('Resend webhook processing error:', error)
    return NextResponse.json({ 
      error: 'Webhook processing failed',
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}