// lib/email-service.ts
import { sendSESEmail } from './ses'
import { supabase } from './supabase'
import crypto from 'crypto'

interface SendEmailOptions {
  to: string
  subject: string
  html: string
  campaignId: string
  contactId: string 
  stepNumber?: number 
  from?: string
  replyTo?: string 
  trackOpens?: boolean
  trackClicks?: boolean
}

interface TrackingData {
  campaignId: string
  contactId: string
  stepNumber: number
  type: 'sent' | 'open' | 'click' | 'bounce' | 'complaint' | 'delivery'
  url?: string
}

export class EmailService {
  private static generateTrackingId(data: TrackingData): string {
    const payload = JSON.stringify(data)
    return Buffer.from(payload).toString('base64url')
  }

  static decodeTrackingId(trackingId: string): TrackingData | null {
    try {
      const payload = Buffer.from(trackingId, 'base64url').toString()
      return JSON.parse(payload)
    } catch (error) {
      console.error('Failed to decode tracking ID:', error)
      return null
    }
  }

  private static injectTrackingPixel(html: string, trackingId: string): string {
    const trackingPixel = `<img src="${process.env.NEXT_PUBLIC_TRACKING_DOMAIN}/api/track/open/${trackingId}" width="1" height="1" style="display:none;opacity:0;" alt="" role="presentation">`
    
    // Try to inject before closing body tag, fallback to end of content
    if (html.includes('</body>')) {
      return html.replace('</body>', `${trackingPixel}</body>`)
    }
    return html + trackingPixel
  }

  private static injectClickTracking(html: string, trackingId: string): string {
    // Replace all links with tracking URLs
    const linkRegex = /<a\s+([^>]*\s+)?href=["']([^"']+)["']([^>]*)>/gi
    
    return html.replace(linkRegex, (match, beforeHref, url, afterHref) => {
      // Skip mailto, tel, and already tracked links
      if (url.startsWith('mailto:') || url.startsWith('tel:') || url.includes('/api/track/click/')) {
        return match
      }

      // Skip relative URLs that don't start with http
      if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('www.')) {
        return match
      }

      const encodedUrl = encodeURIComponent(url)
      const trackingUrl = `${process.env.NEXT_PUBLIC_TRACKING_DOMAIN}/api/track/click/${trackingId}?url=${encodedUrl}`
      
      return `<a ${beforeHref || ''}href="${trackingUrl}"${afterHref || ''}>`
    })
  }

  static async sendEmail(options: SendEmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const {
        to,
        subject,
        html,
        campaignId,
        contactId,
        stepNumber = 1,
        from = `${process.env.AWS_SES_FROM_NAME || 'LeadFlow'} <${process.env.AWS_SES_FROM_EMAIL}>`,
        replyTo,
        trackOpens = true,
        trackClicks = true
      } = options

      let processedHtml = html

      // Generate tracking ID and inject tracking
      if (trackOpens || trackClicks) {
        const trackingData: TrackingData = {
          campaignId,
          contactId,
          stepNumber,
          type: 'open'
        }
        const trackingId = this.generateTrackingId(trackingData)

        if (trackOpens) {
          processedHtml = this.injectTrackingPixel(processedHtml, trackingId)
        }

        if (trackClicks) {
          processedHtml = this.injectClickTracking(processedHtml, trackingId)
        }
      }

      // Send email via SES
      const result = await sendSESEmail({
        to: [to],
        subject,
        html: processedHtml,
        from,
        replyTo: replyTo,
        tags: {
          campaign_id: campaignId,
          contact_id: contactId,
          step_number: stepNumber.toString(),
          source: 'leadflow'
        },
        configurationSet: process.env.AWS_SES_CONFIGURATION_SET
      })

      if (!result.success) {
        console.error('SES send error:', result.error)
        return { success: false, error: result.error }
      }

      // Log email send event
      await this.logEmailEvent({
        campaignId,
        contactId,
        stepNumber,
        type: 'sent', // Changed from 'delivery' to 'sent' for initial send
        messageId: result.messageId,
        metadata: { to, subject, from }
      })

      // Update contact status
      await supabase
        .from('campaign_contacts')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          last_email_id: result.messageId
        })
        .eq('id', contactId)

      return { success: true, messageId: result.messageId }

    } catch (error) {
      console.error('Email send error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  static async logEmailEvent(event: {
    campaignId: string
    contactId: string
    stepNumber: number
    type: 'sent' | 'delivery' | 'open' | 'click' | 'bounce' | 'complaint' | 'unsubscribe'
    messageId?: string
    url?: string
    userAgent?: string
    ipAddress?: string
    metadata?: any
  }): Promise<void> {
    try {
      console.log('🔍 EmailService.logEmailEvent called with:', {
        campaignId: event.campaignId,
        contactId: event.contactId,
        stepNumber: event.stepNumber,
        type: event.type,
        messageId: event.messageId
      })

      const eventData = {
        campaign_id: event.campaignId,
        contact_id: event.contactId,
        step_number: event.stepNumber,
        event_type: event.type,
        message_id: event.messageId,
        url: event.url,
        user_agent: event.userAgent,
        ip_address: event.ipAddress,
        metadata: event.metadata,
        created_at: new Date().toISOString()
      }

      console.log('📝 Inserting email event data:', eventData)

      const { data, error } = await supabase
        .from('email_events')
        .insert(eventData)
        .select()

      if (error) {
        console.error('❌ Failed to insert email event:', error)
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
      } else {
        console.log('✅ Email event inserted successfully:', data)
      }

      // Update contact timestamps based on event type
      const updates: any = {}
      
      switch (event.type) {
        case 'sent':
          // Keep status as 'sent' for initial send
          console.log('📧 Sent event - keeping status as sent')
          break
        case 'delivery':
          // Update to delivered status
          updates.status = 'delivered'
          break
        case 'open':
          updates.opened_at = new Date().toISOString()
          if (!updates.status || updates.status === 'sent' || updates.status === 'delivered') {
            updates.status = 'opened'
          }
          break
        case 'click':
          updates.clicked_at = new Date().toISOString()
          updates.status = 'clicked'
          break
        case 'bounce':
          updates.bounced_at = new Date().toISOString()
          updates.status = 'bounced'
          break
        case 'complaint':
          updates.status = 'complained'
          break
        case 'unsubscribe':
          updates.unsubscribed_at = new Date().toISOString()
          updates.status = 'unsubscribed'
          break
      }

      if (Object.keys(updates).length > 0) {
        console.log('📝 Updating campaign_contacts with:', updates)
        
        const { error: updateError } = await supabase
          .from('campaign_contacts')
          .update(updates)
          .eq('id', event.contactId)

        if (updateError) {
          console.error('❌ Failed to update campaign_contacts:', updateError)
        } else {
          console.log('✅ Campaign contact updated successfully')
        }
      }

    } catch (error) {
      console.error('❌ Failed to log email event:', error)
    }
  }
}