// lib/transactional-email.ts
// Resend ONLY - for system emails (welcome, password reset, billing)

import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)

export async function sendTransactionalEmail({
  to,
  subject,
  html
}: {
  to: string
  subject: string
  html: string
}) {
  try {
    const { data, error } = await resend.emails.send({
      from: `${process.env.RESEND_FROM_NAME || 'LeadFlow'} <${process.env.RESEND_FROM_EMAIL}>`,
      to,
      subject,
      html
    })

    if (error) {
      console.error('❌ Transactional email failed:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ Transactional email sent:', data.id)
    return { success: true, messageId: data.id }
  } catch (error: any) {
    console.error('❌ Transactional email exception:', error)
    return { success: false, error: error.message }
  }
}

// Template functions
export function welcomeEmailTemplate(name: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .button { display: inline-block; padding: 12px 24px; background: #0f66db; color: white; text-decoration: none; border-radius: 6px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Welcome to LeadFlow, ${name}!</h1>
        <p>Your account has been created successfully.</p>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="button">Get Started →</a></p>
      </div>
    </body>
    </html>
  `
}

export function passwordResetTemplate(name: string, resetUrl: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .button { display: inline-block; padding: 12px 24px; background: #0f66db; color: white; text-decoration: none; border-radius: 6px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Reset Your Password</h1>
        <p>Hi ${name},</p>
        <p>Click the link below to reset your password:</p>
        <p><a href="${resetUrl}" class="button">Reset Password</a></p>
        <p>This link expires in 1 hour.</p>
      </div>
    </body>
    </html>
  `
}