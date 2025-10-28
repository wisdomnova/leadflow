// lib/resend.ts
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export const sendEmail = async ({
  to,
  subject,
  html,
  from = `LeadFlow <${process.env.RESEND_SENDING_DOMAIN}>`
}: {
  to: string | string[]
  subject: string
  html: string
  from?: string 
}) => { 
  try {
    console.log('📧 Sending email via Resend')
    
    const result = await resend.emails.send({
      from,
      to,
      subject,
      html,
    })

    console.log('Email sent successfully via Resend:', result)
    return { id: result.data?.id }
  } catch (error) {
    console.error('Failed to send email via Resend:', error)
    throw error
  }
}

export { resend }