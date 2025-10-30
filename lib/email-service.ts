// lib/email-service.ts
import { sendCampaignEmail } from './campaign-email'
import { supabase } from '@/lib/supabase'

export class EmailService {
  /**
   * Log email related events to the email_events table.
   * metadata is flexible (Record<string, any>) because different providers/webhooks provide different shapes.
   */
  static async logEmailEvent(args: {
    campaignId: string | number | null
    contactId: string | number | null
    stepNumber?: number | null
    type: string
    messageId?: string | null
    metadata?: Record<string, any>
    emailAccountId?: string | null
    organizationId?: string | null
    // Additional tracking properties that get moved to metadata
    url?: string
    userAgent?: string
    ipAddress?: string
  }) {
    const {
      campaignId = null,
      contactId = null,
      stepNumber = null,
      type,
      messageId = null,
      metadata = {},
      emailAccountId = null,
      organizationId = null,
      url,
      userAgent,
      ipAddress
    } = args

    try {
      // Build metadata object with additional tracking data
      const finalMetadata = {
        ...metadata,
        ...(url && { url }),
        ...(userAgent && { userAgent }),
        ...(ipAddress && { ipAddress })
      }

      const insertObj: any = {
        campaign_id: campaignId,
        contact_id: contactId,
        step_number: stepNumber,
        event_type: type,
        message_id: messageId,
        email_account_id: emailAccountId,
        organization_id: organizationId,
        metadata: finalMetadata,
        created_at: new Date().toISOString()
      }

      // Remove null keys to keep payload clean
      Object.keys(insertObj).forEach(k => {
        if (insertObj[k] === null || insertObj[k] === undefined) {
          delete insertObj[k]
        }
      })

      await supabase.from('email_events').insert(insertObj)
    } catch (error) { 
      console.error('Failed to log email event:', error)
      // Do not throw - logging failures should not break flow
    }
  }

  /**
   * Decode tracking ID to extract campaign and contact information
   */
  static decodeTrackingId(trackingId: string): {
    campaignId: string
    contactId: string
    stepNumber: number
  } | null {
    try {
      // Simple base64 decode - tracking ID format: base64(campaignId:contactId:stepNumber)
      const decoded = Buffer.from(trackingId, 'base64').toString('utf-8')
      const [campaignId, contactId, stepNumber] = decoded.split(':')
      
      if (!campaignId || !contactId) {
        console.error('Invalid tracking ID format:', trackingId)
        return null
      }

      return {
        campaignId,
        contactId,
        stepNumber: parseInt(stepNumber) || 1
      }
    } catch (error) {
      console.error('Failed to decode tracking ID:', trackingId, error)
      return null
    }
  }

  /**
   * Generate tracking ID for email campaigns
   */
  static generateTrackingId(campaignId: string, contactId: string, stepNumber: number = 1): string {
    const data = `${campaignId}:${contactId}:${stepNumber}`
    return Buffer.from(data, 'utf-8').toString('base64')
  }

  /**
   * Send campaign email using connected email accounts
   */
  static async sendCampaignEmail(params: {
    emailAccountId: string
    to: string
    subject: string
    body: string
    trackingId?: string
    campaignId?: string
    contactId?: string
  }) {
    return sendCampaignEmail(params)
  }

  /**
   * Send email with success/error response format (for backward compatibility)
   */
  static async sendEmail(params: {
    to: string
    subject: string
    html: string
    campaignId?: string
    contactId?: string
    stepNumber?: number
    from?: string
    replyTo?: string
    trackOpens?: boolean
    trackClicks?: boolean
    emailAccountId?: string
  }): Promise<{ success: boolean, error?: string, messageId?: string }> {
    try {
      if (params.emailAccountId) {
        // Use campaign email service
        const result = await sendCampaignEmail({
          emailAccountId: params.emailAccountId,
          to: params.to,
          subject: params.subject,
          body: params.html,
          campaignId: params.campaignId,
          contactId: params.contactId
        })
        
        return {
          success: true,
          messageId: result.messageId
        }
      } else {
        // Legacy mode - use Resend
        const { sendEmail } = await import('@/lib/resend')
        const result = await sendEmail({
          to: params.to,
          subject: params.subject,
          html: params.html,
          from: params.from
        })
        
        return {
          success: true,
          messageId: result.id
        }
      }
    } catch (error) {
      console.error('EmailService.sendEmail failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

/**
 * @deprecated Use EmailService.sendCampaignEmail instead
 * This function is kept for backward compatibility
 */
export async function sendEmail(params: any) {
  console.warn('⚠️ sendEmail is deprecated. Use EmailService.sendCampaignEmail instead.')
  
  // Redirect to new campaign email service
  if (params.emailAccountId) {
    return sendCampaignEmail({
      emailAccountId: params.emailAccountId,
      to: params.to,
      subject: params.subject,
      body: params.html || params.body,
      trackingId: params.trackingId,
      campaignId: params.campaignId,
      contactId: params.contactId
    }) 
  }
  
  throw new Error('Email account ID is required for campaign emails')
}

// Default export for backward compatibility
export default EmailService