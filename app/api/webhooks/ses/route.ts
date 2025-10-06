// app/api/webhooks/ses/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { EmailService } from '@/lib/email-service'
import { ReplyDetectionService } from '@/lib/reply-detection'
import crypto from 'crypto'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    
    // Verify SNS signature (recommended for production)
    if (process.env.AWS_SNS_WEBHOOK_SECRET) {
      const signature = request.headers.get('x-amz-sns-signature')
      const expectedSignature = crypto
        .createHmac('sha256', process.env.AWS_SNS_WEBHOOK_SECRET)
        .update(body)
        .digest('base64')
      
      if (signature !== expectedSignature) {
        console.error('Invalid SNS signature')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    const snsMessage = JSON.parse(body)
    
    // Handle SNS subscription confirmation
    if (snsMessage.Type === 'SubscriptionConfirmation') {
      console.log('SNS Subscription confirmation received')
      // In production, you might want to programmatically confirm the subscription
      return NextResponse.json({ message: 'Subscription confirmation received' })
    }

    // Handle notification messages
    if (snsMessage.Type === 'Notification') {
      const message = JSON.parse(snsMessage.Message)
      
      console.log('SES webhook event received:', {
        eventType: message.eventType,
        messageId: message.mail?.messageId,
        destination: message.mail?.destination,
        subject: message.mail?.commonHeaders?.subject
      })

      // Extract campaign and contact info from message tags
      const tags = message.mail?.tags || {}
      const campaignId = tags.campaign_id
      const contactId = tags.contact_id
      const stepNumber = parseInt(tags.step_number || '1')

      if (!campaignId || !contactId) {
        console.warn('Missing campaign or contact ID in SES event:', { 
          campaignId, 
          contactId, 
          availableTags: Object.keys(tags)
        })
        return NextResponse.json({ received: true, warning: 'Missing required tags' })
      }

      // Handle different SES event types
      switch (message.eventType) {
        case 'send':
          await EmailService.logEmailEvent({
            campaignId,
            contactId,
            stepNumber,
            type: 'sent',
            messageId: message.mail?.messageId,
            metadata: {
              destination: message.mail?.destination,
              subject: message.mail?.commonHeaders?.subject,
              source: message.mail?.source,
              timestamp: message.mail?.timestamp
            }
          })
          console.log('✅ Logged SES send event')
          break

        case 'delivery':
          await EmailService.logEmailEvent({
            campaignId,
            contactId,
            stepNumber,
            type: 'delivery',
            messageId: message.mail?.messageId,
            metadata: {
              timestamp: message.delivery?.timestamp,
              processingTimeMillis: message.delivery?.processingTimeMillis,
              recipients: message.delivery?.recipients
            }
          })
          console.log('✅ Logged SES delivery event')
          break

        case 'bounce':
          await EmailService.logEmailEvent({
            campaignId,
            contactId,
            stepNumber,
            type: 'bounce',
            messageId: message.mail?.messageId,
            metadata: {
              bounceType: message.bounce?.bounceType,
              bounceSubType: message.bounce?.bounceSubType,
              timestamp: message.bounce?.timestamp,
              feedbackId: message.bounce?.feedbackId,
              bouncedRecipients: message.bounce?.bouncedRecipients
            }
          })
          console.log('✅ Logged SES bounce event')
          break

        case 'complaint':
          await EmailService.logEmailEvent({
            campaignId,
            contactId,
            stepNumber,
            type: 'complaint',
            messageId: message.mail?.messageId,
            metadata: {
              complaintFeedbackType: message.complaint?.complaintFeedbackType,
              timestamp: message.complaint?.timestamp,
              feedbackId: message.complaint?.feedbackId,
              complainedRecipients: message.complaint?.complainedRecipients
            }
          })
          console.log('✅ Logged SES complaint event')
          break

        case 'open':
          await EmailService.logEmailEvent({
            campaignId,
            contactId,
            stepNumber,
            type: 'open',
            messageId: message.mail?.messageId,
            metadata: {
              timestamp: message.open?.timestamp,
              userAgent: message.open?.userAgent,
              ipAddress: message.open?.ipAddress
            }
          })
          console.log('✅ Logged SES open event')
          break

        case 'click':
          await EmailService.logEmailEvent({
            campaignId,
            contactId,
            stepNumber,
            type: 'click',
            messageId: message.mail?.messageId,
            metadata: {
              timestamp: message.click?.timestamp,
              url: message.click?.url,
              userAgent: message.click?.userAgent,
              ipAddress: message.click?.ipAddress
            }
          })
          console.log('✅ Logged SES click event')
          break

        // Handle incoming emails (if configured)
        case 'receipt':
          try {
            // Get organization ID from campaign
            const { data: campaign } = await supabase
              .from('campaigns')
              .select('organization_id')
              .eq('id', campaignId)
              .single()

            if (campaign && message.receipt?.action?.type === 'Lambda') {
              // Process as potential reply (you'd need to extract email content)
              console.log('📥 Received incoming email via SES')
              // This would require additional setup to extract email content
            }
          } catch (error) {
            console.error('Failed to process SES receipt:', error)
          }
          break

        default:
          console.log('Unhandled SES event type:', message.eventType)
      }

      return NextResponse.json({ 
        received: true, 
        eventType: message.eventType,
        messageId: message.mail?.messageId,
        campaignId,
        contactId
      })
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('SES webhook processing error:', error)
    return NextResponse.json({ 
      error: 'Webhook processing failed',
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}