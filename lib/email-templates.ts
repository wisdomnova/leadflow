interface EmailVerificationProps {
  name: string
  verificationUrl: string
}

interface PasswordResetProps {
  name: string  
  resetUrl: string
}

export interface CampaignTemplate {
  id: string
  name: string
  description: string
  category: 'sales' | 'marketing' | 'onboarding' | 'nurture' | 'follow-up'
  popular?: boolean
  steps: {
    subject: string
    content: string
    delay_days: number
    delay_hours: number
  }[]
}

export const CAMPAIGN_TEMPLATES: CampaignTemplate[] = [
  {
    id: 'welcome-series',
    name: 'Welcome Series',
    description: 'Onboard new customers with a warm welcome sequence',
    category: 'onboarding',
    popular: true,
    steps: [
      {
        subject: 'Welcome to {{company}}!',
        content: `Hi {{first_name}},

Welcome to {{company}}! We're thrilled to have you on board.

Over the next few days, I'll be sending you some helpful resources to get you started.

Best regards,
The {{company}} Team`,
        delay_days: 0,
        delay_hours: 0
      },
      {
        subject: 'Your quick start guide',
        content: `Hi {{first_name}},

Here's your quick start guide to get the most out of {{company}}.

Let me know if you have any questions!

Best,
The {{company}} Team`,
        delay_days: 2,
        delay_hours: 0
      },
      {
        subject: 'How are things going?',
        content: `Hi {{first_name}},

It's been a week since you joined us. How are things going so far?

I'd love to hear your feedback!

Best,
The {{company}} Team`,
        delay_days: 7,
        delay_hours: 0
      }
    ]
  },
  {
    id: 'sales-followup',
    name: 'Sales Follow-up',
    description: 'Professional follow-up sequence for sales prospects',
    category: 'sales',
    popular: true,
    steps: [
      {
        subject: 'Following up on our conversation',
        content: `Hi {{first_name}},

I wanted to follow up on our conversation about {{company}}'s needs.

Based on what you shared, I believe our solution could help you achieve your goals.

Would you be open to a quick call this week?

Best regards,
{{sender_name}}`,
        delay_days: 0,
        delay_hours: 0
      },
      {
        subject: 'Quick question about {{company}}',
        content: `Hi {{first_name}},

I know you're busy, so I'll keep this brief.

I was thinking about our conversation and had a quick question about your priorities for this quarter.

Worth a quick chat?

Best,
{{sender_name}}`,
        delay_days: 3,
        delay_hours: 0
      },
      {
        subject: 'Helpful resource for {{company}}',
        content: `Hi {{first_name}},

I came across this resource and thought you might find it interesting.

No agenda here, just thought it might be valuable for you and your team.

Hope it helps!

{{sender_name}}`,
        delay_days: 7,
        delay_hours: 0
      }
    ]
  },
  {
    id: 'product-launch',
    name: 'Product Launch',
    description: 'Announce and promote your new product launch',
    category: 'marketing',
    steps: [
      {
        subject: 'Something exciting is coming!',
        content: `Hi {{first_name}},

We've been working on something special and can't wait to share it with you.

Stay tuned for the big reveal!

Excited to share more soon,
The {{company}} Team`,
        delay_days: 0,
        delay_hours: 0
      },
      {
        subject: "It's here! Introducing our new product",
        content: `Hi {{first_name}},

The wait is over! Our new product is officially live.

Check it out and let us know what you think.

Cheers,
The {{company}} Team`,
        delay_days: 3,
        delay_hours: 0
      }
    ]
  },
  {
    id: 'reengagement',
    name: 'Re-engagement',
    description: 'Win back inactive customers with a gentle approach',
    category: 'nurture',
    steps: [
      {
        subject: 'We miss you, {{first_name}}',
        content: `Hi {{first_name}},

It's been a while since we've seen you, and we wanted to reach out.

Is there anything we can help you with?

We're here and listening.

Warm regards,
The {{company}} Team`,
        delay_days: 0,
        delay_hours: 0
      },
      {
        subject: 'What you\'ve been missing',
        content: `Hi {{first_name}},

Since you've been away, we've made some exciting improvements.

We'd love to show you what's new!

Hope to see you soon!

The {{company}} Team`,
        delay_days: 5,
        delay_hours: 0
      }
    ]
  }
]

export const emailVerificationTemplate = ({ name, verificationUrl }: EmailVerificationProps) => `
<!DOCTYPE html>
<html> 
<head> 
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
    .header { background-color: #1e40af; padding: 40px 20px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; }
    .content { padding: 40px 30px; }
    .content h2 { color: #1f2937; margin: 0 0 20px 0; font-size: 24px; font-weight: 600; }
    .content p { color: #374151; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px; }
    .button { display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; margin: 24px 0; font-size: 16px; }
    .button:hover { background-color: #1d4ed8; }
    .footer { padding: 30px; text-align: center; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; background-color: #f9fafb; }
    .info-box { background-color: #f1f5f9; padding: 20px; border-radius: 6px; margin: 24px 0; border-left: 4px solid #2563eb; }
    .info-box p { margin: 0; font-size: 14px; color: #475569; }
    .link-text { word-break: break-all; color: #2563eb; font-size: 14px; background-color: #f8fafc; padding: 12px; border-radius: 4px; border: 1px solid #e2e8f0; }
    ul { color: #374151; line-height: 1.6; margin: 20px 0; padding-left: 20px; }
    li { margin-bottom: 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>LeadFlow</h1> 
    </div>
    
    <div class="content">
      <h2>Verify Your Email Address</h2>
      
      <p>Hello ${name},</p>
      
      <p>Thank you for signing up for LeadFlow. To complete your account setup and start your free trial, please verify your email address by clicking the button below.</p>
      
      <div style="text-align: center;">
        <a href="${verificationUrl}" class="button">Verify Email Address</a>
      </div>
      
      <p>Once verified, you'll have full access to your LeadFlow dashboard where you can:</p>
      
      <ul>
        <li>Import and manage your contacts</li>
        <li>Create and send email campaigns</li>
        <li>Track campaign performance and analytics</li>
        <li>Access all premium features during your 14-day free trial</li>
      </ul>
      
      <div class="info-box">
        <p><strong>Important:</strong> This verification link will expire in 24 hours for security purposes. If you didn't create an account with LeadFlow, please disregard this email.</p>
      </div>
      
      <p>If the button above doesn't work, you can copy and paste the following link into your browser:</p>
      <div class="link-text">${verificationUrl}</div>
      
      <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
    </div>
    
    <div class="footer">
      <p><strong>LeadFlow</strong></p>
      <p>This email was sent to verify your account. If you didn't sign up for LeadFlow, please ignore this message.</p>
      <p>© 2025 LeadFlow. All rights reserved.</p>
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
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
    .header { background-color: #1e40af; padding: 40px 20px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; }
    .content { padding: 40px 30px; }
    .content h2 { color: #1f2937; margin: 0 0 20px 0; font-size: 24px; font-weight: 600; }
    .content p { color: #374151; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px; }
    .button { display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; margin: 24px 0; font-size: 16px; }
    .button:hover { background-color: #1d4ed8; }
    .footer { padding: 30px; text-align: center; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; background-color: #f9fafb; }
    .info-box { background-color: #f1f5f9; padding: 20px; border-radius: 6px; margin: 24px 0; border-left: 4px solid #2563eb; }
    .info-box p { margin: 0; font-size: 14px; color: #475569; }
    .link-text { word-break: break-all; color: #2563eb; font-size: 14px; background-color: #f8fafc; padding: 12px; border-radius: 4px; border: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>LeadFlow</h1>
    </div>
    
    <div class="content">
      <h2>Password Reset Request</h2>
      
      <p>Hello ${name},</p>
      
      <p>We received a request to reset the password for your LeadFlow account. To create a new password, please click the button below.</p>
      
      <div style="text-align: center;">
        <a href="${resetUrl}" class="button">Reset Password</a>
      </div>
      
      <div class="info-box">
        <p><strong>Security Notice:</strong> This password reset link will expire in 1 hour for security purposes. If you didn't request this password reset, please ignore this email and your password will remain unchanged.</p>
      </div>
      
      <p>If the button above doesn't work, you can copy and paste the following link into your browser:</p>
      <div class="link-text">${resetUrl}</div>
      
      <p>For additional security, please ensure you're accessing this link from a trusted device. If you continue to experience issues or have concerns about your account security, please contact our support team immediately.</p>
    </div>
    
    <div class="footer">
      <p><strong>LeadFlow</strong></p>
      <p>This email was sent because a password reset was requested for your account.</p>
      <p>© 2025 LeadFlow. All rights reserved.</p>
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
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
    .header { background-color: #1e40af; padding: 40px 20px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; }
    .content { padding: 40px 30px; }
    .content h2 { color: #1f2937; margin: 0 0 20px 0; font-size: 24px; font-weight: 600; }
    .content p { color: #374151; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px; }
    .button { display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; margin: 24px 0; font-size: 16px; }
    .button:hover { background-color: #1d4ed8; }
    .footer { padding: 30px; text-align: center; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; background-color: #f9fafb; }
    ul { color: #374151; line-height: 1.6; margin: 20px 0; padding-left: 20px; }
    li { margin-bottom: 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>LeadFlow</h1>
    </div>
    
    <div class="content">
      <h2>Email Verification Successful</h2>
      
      <p>Hello ${name},</p>
      
      <p>Congratulations! Your email address has been successfully verified and your LeadFlow account is now fully activated.</p>
      
      <p>You now have complete access to all LeadFlow features, including:</p>
      <ul>
        <li>Full dashboard access and analytics</li>
        <li>Contact import and management tools</li>
        <li>Email campaign creation and automation</li>
        <li>Performance tracking and detailed reporting</li>
        <li>14-day free trial with all premium features</li>
      </ul>
      
      <p>Ready to get started? Access your dashboard now and begin creating your first campaign.</p>
      
      <div style="text-align: center;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard" class="button">Access Dashboard</a>
      </div>
      
      <p>If you have any questions or need assistance getting started, our support team is here to help. We're excited to help you succeed with LeadFlow.</p>
    </div>
    
    <div class="footer">
      <p><strong>LeadFlow</strong></p>
      <p>Welcome to LeadFlow! We're glad to have you on board.</p>
      <p>© 2025 LeadFlow. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`