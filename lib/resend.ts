// lib/resend.ts
import { sendSESEmail } from './ses'

// Keep this for backward compatibility during migration
export const sendEmail = async ({
  to,
  subject,
  html,
  from = `${process.env.AWS_SES_FROM_NAME || 'LeadFlow'} <${process.env.AWS_SES_FROM_EMAIL}>`
}: {
  to: string | string[]
  subject: string
  html: string
  from?: string 
}) => { 
  try {
    console.log('📧 Legacy sendEmail called - redirecting to SES')
    
    const result = await sendSESEmail({
      to,
      subject,
      html,
      from
    })

    if (result.success) {
      console.log('Email sent successfully via SES:', result)
      return { id: result.messageId }
    } else {
      throw new Error(result.error)
    }
  } catch (error) {
    console.error('Failed to send email via SES:', error)
    throw error
  }
}

// Deprecated - use SES directly
export const resend = {
  emails: {
    send: sendEmail
  }
}