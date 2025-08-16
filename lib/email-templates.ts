interface EmailVerificationProps {
  name: string
  verificationUrl: string
}

interface PasswordResetProps {
  name: string
  resetUrl: string
}

export const emailVerificationTemplate = ({ name, verificationUrl }: EmailVerificationProps) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background-color: #3b82f6; padding: 40px 20px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; }
    .content { padding: 40px 20px; }
    .content h2 { color: #1f2937; margin: 0 0 16px 0; font-size: 24px; }
    .content p { color: #6b7280; line-height: 1.6; margin: 0 0 24px 0; }
    .button { display: inline-block; background-color: #3b82f6; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; margin: 24px 0; }
    .button:hover { background-color: #2563eb; }
    .footer { padding: 20px; text-align: center; color: #9ca3af; font-size: 14px; border-top: 1px solid #e5e7eb; }
    .security-note { background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 24px 0; }
    .security-note p { margin: 0; font-size: 14px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to LeadFlow!</h1> 
    </div>
    
    <div class="content">
      <h2>Hi ${name},</h2>
      
      <p>Thank you for signing up for LeadFlow! To get started, please verify your email address by clicking the button below.</p>
      
      <div style="text-align: center;">
        <a href="${verificationUrl}" class="button">Verify Email Address</a>
      </div>
      
      <p>Once verified, you'll have full access to your LeadFlow dashboard where you can:</p>
      
      <ul style="color: #6b7280; line-height: 1.6;">
        <li>Import and manage your contacts</li>
        <li>Create email campaigns</li>
        <li>Track campaign performance</li>
        <li>Start your 14-day free trial</li>
      </ul>
      
      <div class="security-note">
        <p><strong>Security Note:</strong> This verification link will expire in 24 hours. If you didn't create an account with LeadFlow, please ignore this email.</p>
      </div>
      
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #3b82f6;">${verificationUrl}</p>
    </div>
    
    <div class="footer">
      <p>© 2024 LeadFlow. All rights reserved.</p>
      <p>If you have any questions, reply to this email or contact our support team.</p>
    </div>
  </div>
</body>
</html>
`

export const passwordResetTemplate = ({ name, resetUrl }: PasswordResetProps) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background-color: #dc2626; padding: 40px 20px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; }
    .content { padding: 40px 20px; }
    .content h2 { color: #1f2937; margin: 0 0 16px 0; font-size: 24px; }
    .content p { color: #6b7280; line-height: 1.6; margin: 0 0 24px 0; }
    .button { display: inline-block; background-color: #dc2626; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; margin: 24px 0; }
    .button:hover { background-color: #b91c1c; }
    .footer { padding: 20px; text-align: center; color: #9ca3af; font-size: 14px; border-top: 1px solid #e5e7eb; }
    .security-note { background-color: #fef2f2; padding: 16px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #dc2626; }
    .security-note p { margin: 0; font-size: 14px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Password Reset Request</h1>
    </div>
    
    <div class="content">
      <h2>Hi ${name},</h2>
      
      <p>We received a request to reset your password for your LeadFlow account. Click the button below to create a new password.</p>
      
      <div style="text-align: center;">
        <a href="${resetUrl}" class="button">Reset Password</a>
      </div>
      
      <div class="security-note">
        <p><strong>Important:</strong> This password reset link will expire in 1 hour for security reasons. If you didn't request this reset, please ignore this email and your password will remain unchanged.</p>
      </div>
      
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #dc2626;">${resetUrl}</p>
      
      <p>If you continue to have problems, please contact our support team.</p>
    </div>
    
    <div class="footer">
      <p>© 2024 LeadFlow. All rights reserved.</p>
      <p>This email was sent because a password reset was requested for your account.</p>
    </div>
  </div>
</body>
</html>
`

export const emailVerifiedSuccessTemplate = (name: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Verified Successfully</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background-color: #10b981; padding: 40px 20px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; }
    .content { padding: 40px 20px; }
    .content h2 { color: #1f2937; margin: 0 0 16px 0; font-size: 24px; }
    .content p { color: #6b7280; line-height: 1.6; margin: 0 0 24px 0; }
    .button { display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; margin: 24px 0; }
    .footer { padding: 20px; text-align: center; color: #9ca3af; font-size: 14px; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Email Verified!</h1>
    </div>
    
    <div class="content">
      <h2>Welcome ${name}!</h2>
      
      <p>Your email address has been successfully verified. You now have full access to your LeadFlow account.</p>
      
      <p>You can now:</p>
      <ul style="color: #6b7280; line-height: 1.6;">
        <li>Access your dashboard</li>
        <li>Import contacts</li>
        <li>Create campaigns</li>
        <li>Enjoy your 14-day free trial</li> 
      </ul>
      
      <div style="text-align: center;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard" class="button">Go to Dashboard</a>
      </div>
    </div>
    
    <div class="footer">
      <p>© 2024 LeadFlow. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`