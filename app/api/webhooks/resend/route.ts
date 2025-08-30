// ./app/api/webhooks/resend/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { EmailService } from '@/lib/email-service'
import crypto from 'crypto'

function verifyWebhookSignature(payload: string, signature: string, timestamp: string): boolean {
  if (!process.env.RESEND_WEBHOOK_SECRET) {
    console.warn('RESEND_WEBHOOK_SECRET not configured, skipping signature verification')
    return true // Allow in development
  }

  if (!signature || !timestamp) {
    console.warn('Missing signature or timestamp in webhook')
    return false
  }

  try {
    // Svix signature format: "v1,base64signature"
    const signatures = signature.split(',')
    let signatureToVerify = ''
    
    for (const sig of signatures) {
      if (sig.startsWith('v1,')) {
        signatureToVerify = sig.substring(3) // Remove "v1,"
        break
      }
    }

    if (!signatureToVerify) {
      console.error('No v1 signature found in:', signature)
      return false
    }

    // Create the signed payload as Svix does: timestamp.payload
    const signedPayload = `${timestamp}.${payload}`
    
    // Generate expected signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RESEND_WEBHOOK_SECRET)
      .update(signedPayload, 'utf8')
      .digest('base64')

    console.log('Svix signature verification:', {
      provided: signatureToVerify.substring(0, 10) + '...',
      expected: expectedSignature.substring(0, 10) + '...',
      timestamp,
      payloadLength: payload.length
    })

    // Compare signatures (both are base64)
    return crypto.timingSafeEqual(
      Buffer.from(signatureToVerify, 'base64'),
      Buffer.from(expectedSignature, 'base64')
    )
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text()
    
    // Get Svix headers
    const signature = request.headers.get('svix-signature') || ''
    const timestamp = request.headers.get('svix-timestamp') || ''
    const id = request.headers.get('svix-id') || ''

    console.log('Svix webhook received:', {
      payloadLength: payload.length,
      signature: signature ? signature.substring(0, 30) + '...' : 'none',
      timestamp,
      id,
      userAgent: request.headers.get('user-agent')
    })

    // Verify webhook signature
    if (!verifyWebhookSignature(payload, signature, timestamp)) {
      console.error('Invalid webhook signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    console.log('✅ Webhook signature verified')

    const event = JSON.parse(payload)
    console.log('Resend webhook event:', {
      type: event.type,
      messageId: event.data?.id,
      to: event.data?.to,
      subject: event.data?.subject,
      tags: event.data?.tags
    })
    
    // Extract campaign and contact info from tags
    const tags = event.data?.tags || []
    const campaignId = tags.find((tag: any) => tag.name === 'campaign_id')?.value
    const contactId = tags.find((tag: any) => tag.name === 'contact_id')?.value
    const stepNumber = parseInt(tags.find((tag: any) => tag.name === 'step_number')?.value || '1')

    if (!campaignId || !contactId) {
      console.warn('Missing campaign or contact ID in webhook event:', { 
        campaignId, 
        contactId, 
        availableTags: tags.map((t: any) => t.name) 
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
          type: 'delivery',
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

      default:
        console.log('Unhandled Resend webhook event type:', event.type)
    }

    return NextResponse.json({ 
      received: true, 
      eventType: event.type,
      messageId: event.data?.id,
      campaignId,
      contactId,
      svixId: id
    })

  } catch (error) {
    console.error('Resend webhook processing error:', error)
    return NextResponse.json({ 
      error: 'Webhook processing failed',
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}