// lib/email-processor.ts
import { supabase } from '@/lib/supabase'
import { replaceTemplateVariables } from '@/lib/template-variables'
import { EmailService } from '@/lib/email-service'
import { generateCampaignEmailHTML } from '@/lib/email-templates/campaign-template'

interface PlanLimits {
  emailsPerMonth: number
  emailsPerDay: number
  emailsPerHour: number
}

const PLAN_LIMITS: Record<string, PlanLimits> = { 
  starter: {
    emailsPerMonth: 5000,
    emailsPerDay: 200, 
    emailsPerHour: 50
  },
  pro: {
    emailsPerMonth: 25000,
    emailsPerDay: 1000,  
    emailsPerHour: 200
  },
  enterprise: {
    emailsPerMonth: 100000,
    emailsPerDay: 5000,
    emailsPerHour: 1000
  }
}

export class EmailProcessor {
  static async checkRateLimits(organizationId: string): Promise<{ canSend: boolean, reason?: string }> {
    try {
      // If no organization ID, allow sending (for testing/simple setups)
      if (!organizationId) {
        return { canSend: true }
      }

      // Get organization plan
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('subscription_plan')
        .eq('id', organizationId)
        .single()

      // If organization not found, allow sending but log warning
      if (orgError || !org) {
        console.warn('Organization not found for rate limiting, allowing send:', organizationId)
        return { canSend: true }
      }

      const plan = org.subscription_plan || 'starter'
      const limits = PLAN_LIMITS[plan]

      if (!limits) {
        return { canSend: false, reason: 'Invalid plan' }
      }

      const now = new Date()
      
      // Check hourly limit - using email_events instead of email_queue
      const hourStart = new Date(now)
      hourStart.setMinutes(0, 0, 0)
      
      const { data: hourlyEvents, error: hourlyError } = await supabase
        .from('email_events')
        .select(`
          *,
          campaigns!inner(organization_id)
        `)
        .eq('campaigns.organization_id', organizationId)
        .eq('event_type', 'sent')
        .gte('created_at', hourStart.toISOString())
        .lte('created_at', now.toISOString())

      if (hourlyError) {
        console.error('Error checking hourly limit:', hourlyError)
        return { canSend: false, reason: 'Rate limit check failed' }
      }

      if ((hourlyEvents?.length || 0) >= limits.emailsPerHour) {
        return { canSend: false, reason: `Hourly limit reached (${limits.emailsPerHour}/hour)` }
      }

      // Check daily limit
      const dayStart = new Date(now)
      dayStart.setHours(0, 0, 0, 0)
      
      const { data: dailyEvents, error: dailyError } = await supabase
        .from('email_events')
        .select(`
          *,
          campaigns!inner(organization_id)
        `)
        .eq('campaigns.organization_id', organizationId)
        .eq('event_type', 'sent')
        .gte('created_at', dayStart.toISOString())
        .lte('created_at', now.toISOString())

      if (dailyError) {
        console.error('Error checking daily limit:', dailyError)
        return { canSend: false, reason: 'Rate limit check failed' }
      }

      if ((dailyEvents?.length || 0) >= limits.emailsPerDay) {
        return { canSend: false, reason: `Daily limit reached (${limits.emailsPerDay}/day)` }
      }

      // Check monthly limit
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      
      const { data: monthlyEvents, error: monthlyError } = await supabase
        .from('email_events')
        .select(`
          *,
          campaigns!inner(organization_id)
        `)
        .eq('campaigns.organization_id', organizationId)
        .eq('event_type', 'sent')
        .gte('created_at', monthStart.toISOString())
        .lte('created_at', now.toISOString())

      if (monthlyError) {
        console.error('Error checking monthly limit:', monthlyError)
        return { canSend: false, reason: 'Rate limit check failed' }
      }

      if ((monthlyEvents?.length || 0) >= limits.emailsPerMonth) {
        return { canSend: false, reason: `Monthly limit reached (${limits.emailsPerMonth}/month)` }
      }

      return { canSend: true }
    } catch (error) {
      console.error('Rate limit check error:', error)
      return { canSend: false, reason: 'Rate limit check failed' }
    }
  }

  static async processEmailJob(campaignContactId: string): Promise<{ success: boolean, error?: string }> {
    try {
      // Get the campaign contact with related data
      const { data: campaignContact, error: contactError } = await supabase
        .from('campaign_contacts')
        .select(`
          *,
          contacts (
            id,
            email,
            first_name,
            last_name,
            company,
            phone,
            status,
            custom_fields
          ),
          campaigns (
            id,
            name,
            from_name,
            from_email,
            reply_to,
            organization_id,
            track_opens,
            track_clicks
          )
        `)
        .eq('id', campaignContactId)
        .single()

      if (contactError || !campaignContact) {
        throw new Error('Campaign contact not found')
      }

      // Check if contact is ready to process
      const now = new Date()
      const scheduledTime = new Date(campaignContact.scheduled_send_time || now)
      
      if (scheduledTime > now) {
        return { success: false, error: 'Contact not ready yet' }
      }

      if (campaignContact.status !== 'pending') {
        return { success: false, error: 'Contact already processed' }
      }

      // Check if contact is active
      if (campaignContact.contacts?.status !== 'active') {
        await supabase
          .from('campaign_contacts')
          .update({
            status: 'skipped',
            updated_at: new Date().toISOString()
          })
          .eq('id', campaignContactId)
        return { success: false, error: 'Contact not active' }
      }

      // Check rate limits
      const rateLimitCheck = await this.checkRateLimits(campaignContact.campaigns.organization_id)
      if (!rateLimitCheck.canSend) {
        // Reschedule for later
        await supabase
          .from('campaign_contacts')
          .update({ 
            scheduled_send_time: new Date(now.getTime() + 15 * 60 * 1000).toISOString() // Try again in 15 minutes
          })
          .eq('id', campaignContactId)
        
        return { success: false, error: rateLimitCheck.reason }
      }

      // Mark as processing
      await supabase
        .from('campaign_contacts')
        .update({ 
          status: 'processing',
          updated_at: new Date().toISOString()
        })
        .eq('id', campaignContactId)

      // Get the first sequence step for this campaign
      const { data: step, error: stepError } = await supabase
        .from('sequence_steps')
        .select('*')
        .eq('campaign_id', campaignContact.campaign_id)
        .eq('step_number', 1)
        .single()

      if (stepError || !step) {
        throw new Error('No sequence step found for campaign')
      }

      // Process template variables
      const contact = campaignContact.contacts
      const campaign = campaignContact.campaigns

      const processedSubject = replaceTemplateVariables(
        step.subject, 
        contact, 
        contact.custom_fields || {}
      )

      const processedContent = replaceTemplateVariables(
        step.content, 
        contact, 
        contact.custom_fields || {}
      )

      // Generate unsubscribe URL
      const unsubscribeUrl = `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?campaign=${campaign.id}&contact=${contact.id}`

      // Generate professional HTML email
      const emailHTML = generateCampaignEmailHTML({
        subject: processedSubject,
        content: processedContent,
        recipientName: contact.first_name,
        unsubscribeUrl,
        companyName: campaign.from_name || 'LeadFlow'
      })

      // Send email using EmailService (which now uses SES)
      const emailResult = await EmailService.sendEmail({
        to: contact.email,
        subject: processedSubject,
        html: emailHTML,
        campaignId: campaign.id,
        contactId: contact.id,
        stepNumber: step.step_number,
        from: campaign.from_email ? 
          `${campaign.from_name || 'LeadFlow'} <${campaign.from_email}>` : 
          undefined,
        replyTo: campaign.reply_to || undefined,
        trackOpens: campaign.track_opens !== false,
        trackClicks: campaign.track_clicks !== false
      })

      if (!emailResult.success) {
        throw new Error(emailResult.error || 'Email send failed')
      }

      // Mark as sent
      await supabase
        .from('campaign_contacts')
        .update({ 
          status: 'sent',
          sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_email_id: emailResult.messageId
        })
        .eq('id', campaignContactId)

      console.log(`✅ Email sent to ${contact.email} via SES`)
      return { success: true }

    } catch (error) {
      console.error('Email processing error:', error)
      
      // Mark as failed
      await supabase
        .from('campaign_contacts')
        .update({ 
          status: 'failed',
          last_error: error instanceof Error ? error.message : 'Unknown error',
          updated_at: new Date().toISOString()
        })
        .eq('id', campaignContactId)

      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  static async processPendingJobs(batchSize: number = 10): Promise<number> {
    try {
      // Get pending campaign contacts ready to be sent
      const now = new Date()
      const { data: pendingContacts, error: contactsError } = await supabase
        .from('campaign_contacts')
        .select('id')
        .eq('status', 'pending')
        .lte('scheduled_send_time', now.toISOString())
        .order('scheduled_send_time')
        .limit(batchSize)

      if (contactsError) {
        console.error('Error fetching pending contacts:', contactsError)
        return 0
      }

      if (!pendingContacts || pendingContacts.length === 0) {
        return 0
      }

      // Process each contact
      const processPromises = pendingContacts.map(contact => this.processEmailJob(contact.id))
      const results = await Promise.allSettled(processPromises)

      let successCount = 0
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.success) { 
          successCount++
        } else {
          console.error(`Contact ${pendingContacts[index].id} failed:`, 
            result.status === 'fulfilled' ? result.value.error : result.reason)
        }
      })

      return successCount
    } catch (error) {
      console.error('Error processing pending contacts:', error)
      return 0
    }
  }

  static async retryFailedJobs(maxRetries: number = 3): Promise<number> {
    try {
      const { data: failedContacts, error } = await supabase
        .from('campaign_contacts')
        .select('id')
        .eq('status', 'failed')
        .lt('retry_count', maxRetries)

      if (error || !failedContacts) {
        return 0
      }

      let retriedCount = 0
      for (const contact of failedContacts) {
        // Get current retry count
        const { data: currentContact } = await supabase
          .from('campaign_contacts')
          .select('retry_count')
          .eq('id', contact.id)
          .single()

        const currentRetryCount = currentContact?.retry_count || 0

        await supabase
          .from('campaign_contacts')
          .update({ 
            status: 'pending',
            retry_count: currentRetryCount + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', contact.id)
        retriedCount++
      }

      console.log(`Reset ${retriedCount} contacts for retry`)
      return retriedCount

    } catch (error) {
      console.error('Retry failed contacts error:', error)
      return 0
    }
  }

  static async cleanupOldJobs(daysOld: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysOld)

      // Clean up old email events instead of email_queue
      const { count, error } = await supabase
        .from('email_events')
        .delete()
        .eq('event_type', 'sent')
        .lt('created_at', cutoffDate.toISOString())

      if (error) {
        console.error('Cleanup error:', error)
        return 0
      }

      return count || 0

    } catch (error) {
      console.error('Cleanup old events error:', error)
      return 0
    }
  }
}