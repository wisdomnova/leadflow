// lib/ses.ts
import { SESClient, SendEmailCommand, SendRawEmailCommand } from '@aws-sdk/client-ses'
import { SESv2Client } from '@aws-sdk/client-sesv2'

if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
  console.warn('AWS credentials not configured. Email sending will be simulated.')
}

const sesClient = new SESClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  } : undefined,
})

const sesv2Client = new SESv2Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  } : undefined,
})

export interface SendSESEmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
  from?: string
  replyTo?: string
  tags?: Record<string, string>
  configurationSet?: string
}

export const sendSESEmail = async (options: SendSESEmailOptions) => {
  try {
    const {
      to,
      subject,
      html,
      text,
      from = `${process.env.AWS_SES_FROM_NAME || 'LeadFlow'} <${process.env.AWS_SES_FROM_EMAIL}>`,
      replyTo,
      tags = {},
      configurationSet = process.env.AWS_SES_CONFIGURATION_SET
    } = options

    if (!process.env.AWS_ACCESS_KEY_ID) {
      console.log('SES email would be sent (AWS not configured):', { 
        to, 
        subject, 
        from,
        tags 
      })
      return { 
        success: true, 
        messageId: `sim-${Date.now()}`, 
        message: 'Email simulated (AWS not configured)' 
      }
    }

    // Ensure 'to' is an array
    const recipients = Array.isArray(to) ? to : [to]

    // Create email parameters
    const emailParams = {
      Source: from,
      Destination: {
        ToAddresses: recipients,
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: html,
            Charset: 'UTF-8',
          },
          ...(text && {
            Text: {
              Data: text,
              Charset: 'UTF-8',
            },
          }),
        },
      },
      ...(replyTo && {
        ReplyToAddresses: [replyTo],
      }),
      ...(configurationSet && {
        ConfigurationSetName: configurationSet,
      }),
      // Add tags as message tags (for tracking)
      ...(Object.keys(tags).length > 0 && {
        Tags: Object.entries(tags).map(([key, value]) => ({
          Name: key,
          Value: value,
        })),
      }),
    }

    console.log('📧 Sending SES email:', {
      to: recipients,
      subject,
      from,
      configurationSet,
      tagsCount: Object.keys(tags).length
    })

    const command = new SendEmailCommand(emailParams)
    const result = await sesClient.send(command)

    console.log('✅ SES email sent successfully:', {
      messageId: result.MessageId,
      to: recipients
    })

    return {
      success: true,
      messageId: result.MessageId,
      message: 'Email sent successfully via SES'
    }

  } catch (error) {
    console.error('❌ SES email send failed:', error)
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown SES error',
      message: 'Failed to send email via SES'
    }
  }
}

// Helper function to send raw email (for advanced use cases)
export const sendRawSESEmail = async (rawEmail: string, from: string, to: string[]) => {
  try {
    if (!process.env.AWS_ACCESS_KEY_ID) {
      console.log('Raw SES email would be sent (AWS not configured)')
      return { success: true, messageId: `sim-raw-${Date.now()}` }
    }

    const command = new SendRawEmailCommand({
      Source: from,
      Destinations: to,
      RawMessage: {
        Data: Buffer.from(rawEmail),
      },
    })

    const result = await sesClient.send(command)
    return {
      success: true,
      messageId: result.MessageId
    }

  } catch (error) {
    console.error('Raw SES email send failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Configure SES event publishing (call this during setup)
export const configureSESEventPublishing = async () => {
  try {
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SES_CONFIGURATION_SET) {
      console.log('Skipping SES event configuration (not configured)')
      return
    }

    // This would typically be configured once via AWS Console or CLI
    // Including here for reference
    console.log('SES event publishing should be configured via AWS Console')
    console.log('Configuration Set:', process.env.AWS_SES_CONFIGURATION_SET)

  } catch (error) {
    console.error('Failed to configure SES events:', error)
  }
}