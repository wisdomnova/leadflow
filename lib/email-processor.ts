// ./lib/email-processor.ts
import { Resend } from 'resend'
import { supabase } from '@/lib/supabase'
import { replaceTemplateVariables } from '@/lib/template-variables'
import { EmailService } from '@/lib/email-service'
import { generateCampaignEmailHTML } from '@/lib/email-templates/campaign-template'

const resend = new Resend(process.env.RESEND_API_KEY)

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
      // Get organization plan
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('subscription_plan')
        .eq('id', organizationId)
        .single()

      if (orgError || !org) {
        return { canSend: false, reason: 'Organization not found' }
      }

      const plan = org.subscription_plan || 'starter'
      const limits = PLAN_LIMITS[plan]

      if (!limits) {
        return { canSend: false, reason: 'Invalid plan' }
      }

      const now = new Date()
      
      // Check hourly limit
      const hourStart = new Date(now)
      hourStart.setMinutes(0, 0, 0)
      
      const { count: hourlyCount, error: hourlyError } = await supabase
        .from('email_queue')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'sent')
        .gte('updated_at', hourStart.toISOString())
        .lte('updated_at', now.toISOString())

      if (hourlyError) {
        console.error('Error checking hourly limit:', hourlyError)
        return { canSend: false, reason: 'Rate limit check failed' }
      }

      if ((hourlyCount || 0) >= limits.emailsPerHour) {
        return { canSend: false, reason: `Hourly limit reached (${limits.emailsPerHour}/hour)` }
      }

      // Check daily limit
      const dayStart = new Date(now)
      dayStart.setHours(0, 0, 0, 0)
      
      const { count: dailyCount, error: dailyError } = await supabase
        .from('email_queue')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'sent')
        .gte('updated_at', dayStart.toISOString())
        .lte('updated_at', now.toISOString())

      if (dailyError) {
        console.error('Error checking daily limit:', dailyError)
        return { canSend: false, reason: 'Rate limit check failed' }
      }

      if ((dailyCount || 0) >= limits.emailsPerDay) {
        return { canSend: false, reason: `Daily limit reached (${limits.emailsPerDay}/day)` }
      }

      // Check monthly limit
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      
      const { count: monthlyCount, error: monthlyError } = await supabase
        .from('email_queue')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'sent')
        .gte('updated_at', monthStart.toISOString())
        .lte('updated_at', now.toISOString())

      if (monthlyError) {
        console.error('Error checking monthly limit:', monthlyError)
        return { canSend: false, reason: 'Rate limit check failed' }
      }

      if ((monthlyCount || 0) >= limits.emailsPerMonth) {
        return { canSend: false, reason: `Monthly limit reached (${limits.emailsPerMonth}/month)` }
      }

      return { canSend: true }
    } catch (error) {
      console.error('Rate limit check error:', error)
      return { canSend: false, reason: 'Rate limit check failed' }
    }
  }

  static async processEmailJob(jobId: string): Promise<{ success: boolean, error?: string }> {
    try {
      // Get the email job with related data
      const { data: job, error: jobError } = await supabase
        .from('email_queue')
        .select(`
          *,
          campaign_steps (
            subject,
            content,
            order_index
          ),
          campaign_contacts (
            id,
            email,
            first_name,
            last_name,
            company,
            phone,
            custom_fields
          ),
          campaigns (
            id,
            from_name,
            from_email,
            reply_to,
            organization_id,
            track_opens,
            track_clicks
          )
        `)
        .eq('id', jobId)
        .single()

      if (jobError || !job) {
        throw new Error('Email job not found')
      }

      // Check if job is ready to process
      const now = new Date()
      const scheduledTime = new Date(job.scheduled_for)
      
      if (scheduledTime > now) {
        return { success: false, error: 'Job not ready yet' }
      }

      if (job.status !== 'pending') {
        return { success: false, error: 'Job already processed' }
      }

      // Check rate limits
      const rateLimitCheck = await this.checkRateLimits(job.campaigns.organization_id)
      if (!rateLimitCheck.canSend) {
        // Reschedule for later
        await supabase
          .from('email_queue')
          .update({ 
            scheduled_for: new Date(now.getTime() + 15 * 60 * 1000).toISOString() // Try again in 15 minutes
          })
          .eq('id', jobId)
        
        return { success: false, error: rateLimitCheck.reason }
      }

      // Mark as processing
      await supabase
        .from('email_queue')
        .update({ 
          status: 'processing',
          attempt_count: job.attempt_count + 1
        })
        .eq('id', jobId)

      // Process template variables using your existing function
      const contact = job.campaign_contacts
      const step = job.campaign_steps
      const campaign = job.campaigns

      // Use your existing replaceTemplateVariables function
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

      // Generate professional HTML email with tracking
      const emailHTML = generateCampaignEmailHTML({
        subject: processedSubject,
        content: processedContent,
        recipientName: contact.first_name,
        unsubscribeUrl,
        companyName: campaign.from_name || 'LeadFlow'
      })

      // Send email using EmailService (with tracking)
      const emailResult = await EmailService.sendEmail({
        to: contact.email,
        subject: processedSubject,
        html: emailHTML,
        campaignId: campaign.id,
        contactId: contact.id,
        stepNumber: (step.order_index || 0) + 1,
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
        .from('email_queue')
        .update({ 
          status: 'sent',
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId)

      // Update contact status (EmailService already does this, but ensure consistency)
      await supabase
        .from('campaign_contacts')
        .update({ 
          status: 'sent',
          sent_at: new Date().toISOString(),
          last_email_id: emailResult.messageId
        })
        .eq('id', job.contact_id)

      return { success: true }

    } catch (error) {
      console.error('Email processing error:', error)
      
      // Mark as failed
      await supabase
        .from('email_queue')
        .update({ 
          status: 'failed',
          last_error: error instanceof Error ? error.message : 'Unknown error'
        })
        .eq('id', jobId)

      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  static async processPendingJobs(batchSize: number = 10): Promise<number> {
    try {
      // Get pending jobs that are ready to process
      const now = new Date()
      const { data: jobs, error: jobsError } = await supabase
        .from('email_queue')
        .select('id')
        .eq('status', 'pending')
        .lte('scheduled_for', now.toISOString())
        .order('scheduled_for')
        .limit(batchSize)

      if (jobsError) {
        console.error('Error fetching pending jobs:', jobsError)
        return 0
      }

      if (!jobs || jobs.length === 0) {
        return 0
      }

      // Process each job
      const processPromises = jobs.map(job => this.processEmailJob(job.id))
      const results = await Promise.allSettled(processPromises)

      let successCount = 0
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.success) {
          successCount++
        } else {
          console.error(`Job ${jobs[index].id} failed:`, 
            result.status === 'fulfilled' ? result.value.error : result.reason)
        }
      })

      return successCount
    } catch (error) {
      console.error('Error processing pending jobs:', error)
      return 0
    }
  }

  static async retryFailedJobs(maxAttempts: number = 3): Promise<number> {
    try {
      const { data: failedJobs, error } = await supabase
        .from('email_queue')
        .select('id')
        .eq('status', 'failed')
        .lt('attempt_count', maxAttempts)

      if (error || !failedJobs) {
        return 0
      }

      let retriedCount = 0
      for (const job of failedJobs) {
        await supabase
          .from('email_queue')
          .update({ 
            status: 'pending',
            updated_at: new Date().toISOString()
          })
          .eq('id', job.id)
        retriedCount++
      }

      console.log(`Reset ${retriedCount} jobs for retry`)
      return retriedCount

    } catch (error) {
      console.error('Retry failed jobs error:', error)
      return 0
    }
  }

  static async cleanupOldJobs(daysOld: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysOld)

      const { count, error } = await supabase
        .from('email_queue')
        .delete()
        .eq('status', 'sent')
        .lt('created_at', cutoffDate.toISOString())

      if (error) {
        console.error('Cleanup error:', error)
        return 0
      }

      return count || 0

    } catch (error) {
      console.error('Cleanup old jobs error:', error)
      return 0
    }
  }
}