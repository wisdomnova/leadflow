// lib/campaign-email.ts
import { createClient } from '@supabase/supabase-js'
import { decryptToken, encryptToken } from './email-oauth/token-manager'
import { sendEmailViaGmail, refreshGoogleToken } from './email-oauth/google-oauth'
import { sendEmailViaOutlook, refreshMicrosoftToken } from './email-oauth/microsoft-oauth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface SendEmailParams {
  emailAccountId: string
  to: string
  subject: string
  body: string
  campaignId?: string
  contactId?: string
  trackingId?: string 
}

export async function sendCampaignEmail({
  emailAccountId,
  to,
  subject,
  body,
  campaignId,
  contactId,
  trackingId
}: {
  emailAccountId: string
  to: string
  subject: string
  body: string
  campaignId?: string
  contactId?: string
  trackingId?: string
}) {
  // Get email account
  const { data: account, error } = await supabase
    .from('email_accounts')
    .select('*')
    .eq('id', emailAccountId)
    .single()

  if (error || !account) {
    throw new Error('Email account not found')
  }

  // Check if account is active
  if (account.status !== 'active' && account.status !== 'warming_up') {
    throw new Error(`Email account is ${account.status}. Please reconnect your account.`)
  }

  // Check daily limit
  if (account.daily_sent >= account.daily_limit) {
    throw new Error(`Daily sending limit reached (${account.daily_limit} emails/day)`)
  }

  // Check monthly usage limit (from subscription)
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan_id, monthly_emails_sent')
    .eq('user_id', account.user_id)
    .single()

  if (subscription) {
    const { PLANS } = await import('./plans')
    const plan = PLANS[subscription.plan_id as keyof typeof PLANS]
    
    if (plan && subscription.monthly_emails_sent >= plan.limits.monthlyEmails) {
      throw new Error(`Monthly email limit reached (${plan.limits.monthlyEmails} emails/month). Please upgrade your plan.`)
    }
  }

  // Decrypt tokens
  let accessToken = decryptToken(account.access_token)
  const refreshToken = decryptToken(account.refresh_token)

  // Check if token expired and refresh if needed
  const expiresAt = new Date(account.token_expires_at)
  if (expiresAt < new Date()) {
    console.log('🔄 Token expired, refreshing...')
    
    try {
      let refreshResult
      if (account.provider === 'google') {
        refreshResult = await refreshGoogleToken(refreshToken)
      } else {
        refreshResult = await refreshMicrosoftToken(refreshToken)
      }

      accessToken = refreshResult.accessToken

      // Update tokens in database
      await supabase
        .from('email_accounts')
        .update({
          access_token: encryptToken(refreshResult.accessToken),
          refresh_token: encryptToken(refreshResult.refreshToken),
          token_expires_at: refreshResult.expiresAt.toISOString()
        })
        .eq('id', emailAccountId)

      console.log('✅ Token refreshed successfully')
    } catch (error) {
      console.error('❌ Token refresh failed:', error)
      
      await supabase
        .from('email_accounts')
        .update({
          status: 'error',
          last_error: 'Token refresh failed. Please reconnect your account.'
        })
        .eq('id', emailAccountId)
      
      throw new Error('Failed to refresh access token. Please reconnect your account.')
    }
  }

  // Send email via appropriate provider
  let result
  try {
    // Generate tracking ID for this email if not provided
    const emailTrackingId = trackingId || `${campaignId}_${contactId}_${Date.now()}`
    
    // Add tracking pixels and links to email body
    const trackedBody = addEmailTracking(body, emailTrackingId)

    if (account.provider === 'google') {
      result = await sendEmailViaGmail(accessToken, to, subject, trackedBody, account.email)
    } else {
      result = await sendEmailViaOutlook(accessToken, to, subject, trackedBody, account.email)
    }

    const today = new Date().toISOString().split('T')[0]
    
    // Update counts and track usage
    await Promise.all([
      // 1. Update email account daily sent count
      supabase
        .from('email_accounts')
        .update({
          daily_sent: account.daily_sent + 1,
          last_sync_at: new Date().toISOString(),
          last_error: null,
          status: 'active'
        })
        .eq('id', emailAccountId),
      
      // 2. Track in sending limits table
      supabase
        .from('email_sending_limits')
        .upsert({
          email_account_id: emailAccountId,
          date: today,
          emails_sent: account.daily_sent + 1,
          limit_reached: account.daily_sent + 1 >= account.daily_limit
        }, {
          onConflict: 'email_account_id,date',
          ignoreDuplicates: false
        }),
      
      // 3. Increment monthly usage counter
      supabase.rpc('increment_monthly_usage', {
        p_user_id: account.user_id
      }),

      // 4. Create email event record
      supabase
        .from('email_events')
        .insert({
          campaign_id: campaignId,
          contact_id: contactId,
          email_account_id: emailAccountId,
          organization_id: account.organization_id,
          event_type: 'sent',
          message_id: result.messageId,
          thread_id: result.threadId,
          tracking_id: emailTrackingId,
          metadata: {
            subject,
            to,
            provider: account.provider
          }
        }),

      // 5. Update campaign_contacts status to 'sent'
      campaignId && contactId ? supabase
        .from('campaign_contacts')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          last_email_id: result.messageId
        })
        .eq('campaign_id', campaignId)
        .eq('contact_id', contactId) : Promise.resolve()
    ])

    console.log(`📧 Email sent successfully to ${to} via ${account.provider}`)
    console.log(`📊 Usage tracked - Daily: ${account.daily_sent + 1}/${account.daily_limit}`)
    
    return result

  } catch (error: any) {
    console.error('❌ Email send failed:', error)
    
    // Update error status 
    await supabase
      .from('email_accounts')
      .update({
        status: 'error',
        last_error: error.message || 'Email send failed'
      })
      .eq('id', emailAccountId)

    // Log failure event
    if (campaignId && contactId) {
      // Generate tracking ID for error logging if not already set
      const errorTrackingId = trackingId || `${campaignId}_${contactId}_${Date.now()}`
      
      await supabase
        .from('email_events')
        .insert({
          campaign_id: campaignId,
          contact_id: contactId,
          email_account_id: emailAccountId,
          organization_id: account.organization_id,
          event_type: 'failed',
          tracking_id: errorTrackingId,
          metadata: {
            subject,
            to,
            provider: account.provider,
            error: error.message
          }
        })
    }

    throw error
  }
}

function addEmailTracking(htmlBody: string, trackingId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  
  // Add tracking pixel at the end of the body
  const trackingPixel = `<img src="${baseUrl}/api/track/open/${trackingId}" width="1" height="1" style="display:none;" />`
  
  // Convert links to tracked links
  const trackedBody = htmlBody.replace(
    /<a\s+href="([^"]+)"([^>]*)>/g,
    `<a href="${baseUrl}/api/track/click/${trackingId}?url=$1"$2>`
  )
  
  return trackedBody + trackingPixel
}

async function recordEmailEvent({
  campaignId,
  contactId,
  emailAccountId,
  eventType,
  messageId,
  trackingId,
  metadata = {}
}: {
  campaignId: string
  contactId: string
  emailAccountId: string
  eventType: string
  messageId?: string
  trackingId?: string
  metadata?: any
}) {
  try {
    await supabase
      .from('email_events')
      .insert([{
        campaign_id: campaignId,
        contact_id: contactId,
        email_account_id: emailAccountId,
        event_type: eventType,
        message_id: messageId,
        tracking_id: trackingId,
        metadata,
        created_at: new Date().toISOString()
      }])
  } catch (error) {
    console.error('Failed to record email event:', error)
    // Don't throw - we don't want tracking failures to break email sending
  }
}

// Helper function to check if user can send emails
export async function canSendEmail(userId: string): Promise<{
  canSend: boolean
  reason?: string
  remaining?: number
}> {
  try {
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan_id, monthly_emails_sent')
      .eq('user_id', userId)
      .single()

    if (!subscription) {
      return {
        canSend: false,
        reason: 'No active subscription found'
      }
    }

    const { PLANS } = await import('./plans')
    const plan = PLANS[subscription.plan_id as keyof typeof PLANS]
    
    if (!plan) {
      return {
        canSend: false,
        reason: 'Invalid plan'
      }
    }

    const remaining = plan.limits.monthlyEmails - subscription.monthly_emails_sent
    
    if (remaining <= 0) {
      return {
        canSend: false,
        reason: `Monthly limit reached (${plan.limits.monthlyEmails} emails)`,
        remaining: 0
      }
    }

    return {
      canSend: true,
      remaining
    }
  } catch (error) {
    console.error('Error checking send permissions:', error)
    return {
      canSend: false,
      reason: 'Failed to check usage limits'
    }
  }
}