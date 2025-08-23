// ./lib/email-processor.ts
import { Resend } from 'resend'
import { supabase } from '@/lib/supabase'
import { replaceTemplateVariables } from '@/lib/template-variables'

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
            content
          ),
          campaign_contacts (
            email,
            first_name,
            last_name,
            company,
            phone
          ),
          campaigns (
            from_name,
            from_email,
            organization_id
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

      // Process template variables
      const contact = job.campaign_contacts
      const step = job.campaign_steps
      const campaign = job.campaigns

      const processedSubject = replaceTemplateVariables(step.subject, {
        first_name: contact.first_name,
        last_name: contact.last_name,
        email: contact.email,
        company: contact.company,
        phone: contact.phone
      })

      const processedContent = replaceTemplateVariables(step.content, {
        first_name: contact.first_name,
        last_name: contact.last_name,
        email: contact.email,
        company: contact.company,
        phone: contact.phone
      })

      // Send email via Resend
      const emailResponse = await resend.emails.send({
        from: `${campaign.from_name} <${campaign.from_email}>`,
        to: [contact.email],
        subject: processedSubject,
        text: processedContent,
        headers: {
          'X-Campaign-ID': job.campaign_id,
          'X-Contact-ID': job.contact_id,
          'X-Step-ID': job.step_id
        }
      })

      if (emailResponse.error) {
        throw new Error(emailResponse.error.message)
      }

      // Mark as sent
      await supabase
        .from('email_queue')
        .update({ 
          status: 'sent',
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId)

      // Update contact status
      await supabase
        .from('campaign_contacts')
        .update({ 
          status: 'sent',
          sent_at: new Date().toISOString()
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
}