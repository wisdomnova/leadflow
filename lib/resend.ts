import { Resend } from 'resend'

if (!process.env.RESEND_API_KEY) {
  console.warn('RESEND_API_KEY is not set in environment variables')
}

export const resend = new Resend(process.env.RESEND_API_KEY)

export const sendEmail = async ({
  to,
  subject,
  html,
  from = 'contact@tryleadflow.ai' // Update with your verified domain
}: {
  to: string | string[]
  subject: string
  html: string
  from?: string
}) => { 
  try {
    if (!process.env.RESEND_API_KEY) {
      console.log('Email would be sent (RESEND_API_KEY not configured):', { to, subject })
      return { id: 'test-email-id' }
    }

    const data = await resend.emails.send({
      from,
      to,
      subject,
      html
    })

    console.log('Email sent successfully:', data)
    return data
  } catch (error) {
    console.error('Failed to send email:', error)
    throw error
  }
}