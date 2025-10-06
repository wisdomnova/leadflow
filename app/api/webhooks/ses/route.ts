// app/api/webhooks/ses/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { EmailService } from '@/lib/email-service'
import { ReplyDetectionService } from '@/lib/reply-detection'
import crypto from 'crypto'
import { supabase } from '@/lib/supabase'

// Production SNS signature verification
async function verifySNSSignature(
  message: string,
  signature: string | null,
  signingCertURL: string | null,
  topicArn: string,
  messageType: string
): Promise<boolean> {
  try {
    // For SubscriptionConfirmation, signature verification is different
    if (messageType === 'SubscriptionConfirmation' || messageType === 'UnsubscribeConfirmation') {
      console.log('📋 Skipping signature verification for subscription confirmation')
      
      // Basic validation for subscription confirmations
      const snsMessage = JSON.parse(message)
      const requiredFields = ['Type', 'MessageId', 'TopicArn', 'SubscribeURL', 'Token']
      
      for (const field of requiredFields) {
        if (!snsMessage[field]) {
          console.error(`Missing required field for subscription: ${field}`)
          return false
        }
      }
      
      // Validate TopicArn matches expected pattern
      if (!snsMessage.TopicArn.includes('leadflow-ses-events')) {
        console.error('Invalid topic ARN for subscription')
        return false
      }
      
      console.log('✅ Subscription confirmation validated')
      return true
    }

    // For regular notifications, do full signature verification
    if (!signature || !signingCertURL) {
      console.error('Missing SNS signature or certificate URL')
      return false
    }

    // Verify the certificate URL is from AWS
    const certURL = new URL(signingCertURL)
    if (!certURL.hostname.endsWith('.amazonaws.com')) {
      console.error('Invalid certificate URL domain')
      return false
    }

    // Download the certificate
    const certResponse = await fetch(signingCertURL)
    if (!certResponse.ok) {
      console.error('Failed to fetch signing certificate')
      return false
    }

    const certPem = await certResponse.text()
    
    // Parse the SNS message to get the string to sign
    const snsMessage = JSON.parse(message)
    let stringToSign = ''

    // Build the string to sign based on message type
    if (snsMessage.Type === 'Notification') {
      stringToSign = [
        'Message', snsMessage.Message,
        'MessageId', snsMessage.MessageId,
        'Subject', snsMessage.Subject || '',
        'Timestamp', snsMessage.Timestamp,
        'TopicArn', snsMessage.TopicArn,
        'Type', snsMessage.Type
      ].join('\n') + '\n'
    } else if (snsMessage.Type === 'SubscriptionConfirmation' || snsMessage.Type === 'UnsubscribeConfirmation') {
      stringToSign = [
        'Message', snsMessage.Message,
        'MessageId', snsMessage.MessageId,
        'SubscribeURL', snsMessage.SubscribeURL,
        'Timestamp', snsMessage.Timestamp,
        'Token', snsMessage.Token,
        'TopicArn', snsMessage.TopicArn,
        'Type', snsMessage.Type
      ].join('\n') + '\n'
    }

    // Verify signature using crypto
    const verifier = crypto.createVerify('SHA1')
    verifier.update(stringToSign, 'utf8')
    
    const isValid = verifier.verify(certPem, signature, 'base64')
    
    if (!isValid) {
      console.error('SNS signature verification failed')
      return false
    }

    console.log('✅ SNS signature verified successfully')
    return true

  } catch (error) {
    console.error('SNS signature verification error:', error)
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    
    console.log('📨 SES webhook received:', {
      contentLength: body.length,
      userAgent: request.headers.get('user-agent'),
      timestamp: new Date().toISOString()
    })

    // Parse the SNS message
    let snsMessage
    try {
      snsMessage = JSON.parse(body)
    } catch (parseError) {
      console.error('Failed to parse SNS message:', parseError)
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
    }

    console.log('📨 SNS Message received:', {
      type: snsMessage.Type,
      messageId: snsMessage.MessageId,
      topicArn: snsMessage.TopicArn
    })

    // Get signature headers (may not exist for subscription confirmations)
    const signature = request.headers.get('x-amz-sns-signature')
    const signingCertURL = request.headers.get('x-amz-sns-signing-cert-url')
    const topicArn = snsMessage.TopicArn

    // Handle SNS subscription confirmation FIRST (before signature verification)
    if (snsMessage.Type === 'SubscriptionConfirmation') {
      console.log('🔗 SNS Subscription confirmation received:', {
        topicArn: snsMessage.TopicArn,
        subscribeURL: snsMessage.SubscribeURL
      })

      // Basic validation for subscription confirmations
      if (!snsMessage.SubscribeURL || !snsMessage.TopicArn.includes('leadflow-ses-events')) {
        console.error('❌ Invalid subscription confirmation')
        return NextResponse.json({ error: 'Invalid subscription confirmation' }, { status: 400 })
      }

      // Auto-confirm subscription in production
      if (snsMessage.SubscribeURL) {
        try {
          console.log('🔄 Confirming SNS subscription...')
          const confirmResponse = await fetch(snsMessage.SubscribeURL, {
            method: 'GET',
            headers: {
              'User-Agent': 'LeadFlow-Webhook/1.0'
            }
          })
          
          if (confirmResponse.ok) {
            console.log('✅ SNS subscription confirmed automatically')
          } else {
            console.error('❌ Failed to confirm SNS subscription:', {
              status: confirmResponse.status,
              statusText: confirmResponse.statusText
            })
          }
        } catch (confirmError) {
          console.error('❌ Error confirming SNS subscription:', confirmError)
        }
      }

      return NextResponse.json({ 
        message: 'Subscription confirmation processed',
        status: 'confirmed',
        topicArn: snsMessage.TopicArn
      })
    }

    // Handle unsubscribe confirmation
    if (snsMessage.Type === 'UnsubscribeConfirmation') {
      console.log('🔗 SNS Unsubscribe confirmation received')
      return NextResponse.json({ 
        message: 'Unsubscribe confirmation received',
        topicArn: snsMessage.TopicArn
      })
    }

    // For regular notifications, verify signature
    const isValidSignature = await verifySNSSignature(body, signature, signingCertURL, topicArn, snsMessage.Type)
    
    if (!isValidSignature) {
      console.error('❌ SNS signature verification failed')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // Handle notification messages (SES events)
    if (snsMessage.Type === 'Notification') {
      let sesMessage
      try {
        sesMessage = JSON.parse(snsMessage.Message)
      } catch (sesParseError) {
        console.error('Failed to parse SES message from SNS:', sesParseError)
        return NextResponse.json({ error: 'Invalid SES message format' }, { status: 400 })
      }
      
      console.log('📧 SES event received:', {
        eventType: sesMessage.eventType,
        messageId: sesMessage.mail?.messageId,
        destination: sesMessage.mail?.destination,
        timestamp: sesMessage.mail?.timestamp
      })

      // Extract campaign and contact info from message tags
      const tags = sesMessage.mail?.tags || {}
      const campaignId = tags.campaign_id
      const contactId = tags.contact_id
      const stepNumber = parseInt(tags.step_number || '1')

      // Handle auth emails (signup, password reset) that don't have campaign tags
      if (!campaignId || !contactId) {
        console.log('📧 SES event for auth/system email:', {
          eventType: sesMessage.eventType,
          messageId: sesMessage.mail?.messageId,
          destination: sesMessage.mail?.destination,
          subject: sesMessage.mail?.commonHeaders?.subject,
          availableTags: Object.keys(tags)
        })
        
        // Return success for auth emails but don't process as campaign events
        return NextResponse.json({ 
          received: true, 
          eventType: sesMessage.eventType,
          messageId: sesMessage.mail?.messageId,
          type: 'auth_email',
          processed: false
        })
      }

      // Validate campaign and contact exist before processing
      try {
        const { data: campaignContact, error: validationError } = await supabase
          .from('campaign_contacts')
          .select('id, campaign_id, contact_id')
          .eq('campaign_id', campaignId)
          .eq('contact_id', contactId)
          .single()

        if (validationError || !campaignContact) {
          console.warn('Campaign or contact not found for SES event:', {
            campaignId,
            contactId,
            eventType: sesMessage.eventType
          })
          return NextResponse.json({ 
            received: true, 
            warning: 'Campaign or contact not found',
            campaignId,
            contactId
          })
        }
      } catch (validationError) {
        console.error('Error validating campaign/contact:', validationError)
        return NextResponse.json({ 
          received: true, 
          warning: 'Validation error',
          error: validationError instanceof Error ? validationError.message : 'Unknown error'
        })
      }

      // Process SES events
      try {
        switch (sesMessage.eventType) {
          case 'send':
            await EmailService.logEmailEvent({
              campaignId,
              contactId,
              stepNumber,
              type: 'sent',
              messageId: sesMessage.mail?.messageId,
              metadata: {
                destination: sesMessage.mail?.destination,
                subject: sesMessage.mail?.commonHeaders?.subject,
                source: sesMessage.mail?.source,
                timestamp: sesMessage.mail?.timestamp,
                source_service: 'aws_ses'
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
              messageId: sesMessage.mail?.messageId,
              metadata: {
                timestamp: sesMessage.delivery?.timestamp,
                processingTimeMillis: sesMessage.delivery?.processingTimeMillis,
                recipients: sesMessage.delivery?.recipients,
                source_service: 'aws_ses'
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
              messageId: sesMessage.mail?.messageId,
              metadata: {
                bounceType: sesMessage.bounce?.bounceType,
                bounceSubType: sesMessage.bounce?.bounceSubType,
                timestamp: sesMessage.bounce?.timestamp,
                feedbackId: sesMessage.bounce?.feedbackId,
                bouncedRecipients: sesMessage.bounce?.bouncedRecipients,
                source_service: 'aws_ses'
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
              messageId: sesMessage.mail?.messageId,
              metadata: {
                complaintFeedbackType: sesMessage.complaint?.complaintFeedbackType,
                timestamp: sesMessage.complaint?.timestamp,
                feedbackId: sesMessage.complaint?.feedbackId,
                complainedRecipients: sesMessage.complaint?.complainedRecipients,
                source_service: 'aws_ses'
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
              messageId: sesMessage.mail?.messageId,
              metadata: {
                timestamp: sesMessage.open?.timestamp,
                userAgent: sesMessage.open?.userAgent,
                ipAddress: sesMessage.open?.ipAddress,
                source_service: 'aws_ses'
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
              messageId: sesMessage.mail?.messageId,
              url: sesMessage.click?.url,
              metadata: {
                timestamp: sesMessage.click?.timestamp,
                url: sesMessage.click?.url,
                userAgent: sesMessage.click?.userAgent,
                ipAddress: sesMessage.click?.ipAddress,
                source_service: 'aws_ses'
              }
            })
            console.log('✅ Logged SES click event')
            break

          case 'reject':
            await EmailService.logEmailEvent({
              campaignId,
              contactId,
              stepNumber,
              type: 'bounce', // Treat reject as bounce
              messageId: sesMessage.mail?.messageId,
              metadata: {
                reason: sesMessage.reject?.reason,
                timestamp: sesMessage.mail?.timestamp,
                source_service: 'aws_ses'
              }
            })
            console.log('✅ Logged SES reject event as bounce')
            break

          case 'renderingFailure':
            console.error('SES rendering failure:', {
              messageId: sesMessage.mail?.messageId,
              errorMessage: sesMessage.failure?.errorMessage,
              templateName: sesMessage.failure?.templateName
            })
            break

          default:
            console.log('Unhandled SES event type:', sesMessage.eventType)
        }
      } catch (eventProcessingError) {
        console.error('Error processing SES event:', eventProcessingError)
        return NextResponse.json({ 
          received: true,
          error: 'Event processing failed',
          details: eventProcessingError instanceof Error ? eventProcessingError.message : 'Unknown error'
        }, { status: 500 })
      }

      return NextResponse.json({ 
        received: true, 
        processed: true,
        eventType: sesMessage.eventType,
        messageId: sesMessage.mail?.messageId,
        campaignId,
        contactId,
        timestamp: new Date().toISOString()
      })
    }

    // Unknown SNS message type
    console.warn('Unknown SNS message type received:', snsMessage.Type)
    return NextResponse.json({ 
      received: true, 
      warning: 'Unknown message type',
      messageType: snsMessage.Type
    })

  } catch (error) {
    console.error('❌ SES webhook processing error:', error)
    
    // Return detailed error for debugging but don't expose internal details
    return NextResponse.json({ 
      error: 'Webhook processing failed',
      timestamp: new Date().toISOString(),
      details: process.env.NODE_ENV === 'development' ? 
        (error instanceof Error ? error.message : 'Unknown error') : 
        'Internal server error'
    }, { status: 500 })
  }
}