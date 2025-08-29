// ./lib/email-scheduler.ts
import { supabase } from '@/lib/supabase'
import { EmailService } from './email-service'
import { generateCampaignEmailHTML } from './email-templates/campaign-template'

export interface EmailJob {
  id?: string
  campaign_id: string
  contact_id: string
  step_id: string
  scheduled_for: string
  status: 'pending' | 'processing' | 'sent' | 'failed' | 'cancelled'
  attempt_count: number
  last_error?: string 
  created_at?: string
  updated_at?: string
}

export class EmailScheduler {
  static async scheduleContactForCampaign(
    campaignId: string, 
    contactId: string, 
    startImmediately: boolean = true
  ) {
    try {
      // Get campaign steps
      const { data: steps, error: stepsError } = await supabase
        .from('campaign_steps')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('order_index')

      if (stepsError || !steps || steps.length === 0) {
        throw new Error('No campaign steps found')
      }

      const now = new Date()
      const jobs: Omit<EmailJob, 'id'>[] = []

      // Schedule each step
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i]
        const scheduledTime = new Date(now)

        if (i === 0 && startImmediately) {
          // First step sends immediately (or within a few minutes for processing)
          scheduledTime.setMinutes(scheduledTime.getMinutes() + 1)
        } else {
          // Calculate cumulative delay
          let totalDelayMinutes = 0
          for (let j = 0; j <= i; j++) {
            const prevStep = steps[j]
            totalDelayMinutes += (prevStep.delay_days || 0) * 24 * 60
            totalDelayMinutes += (prevStep.delay_hours || 0) * 60
          }
          scheduledTime.setMinutes(scheduledTime.getMinutes() + totalDelayMinutes)
        }

        jobs.push({
          campaign_id: campaignId,
          contact_id: contactId,
          step_id: step.id,
          scheduled_for: scheduledTime.toISOString(),
          status: 'pending',
          attempt_count: 0
        })
      }

      // Insert jobs into queue
      const { data: createdJobs, error: jobError } = await supabase
        .from('email_queue')
        .insert(jobs)
        .select()

      if (jobError) {
        throw jobError
      }

      return createdJobs
    } catch (error) {
      console.error('Failed to schedule contact for campaign:', error)
      throw error
    }
  }

  static async launchCampaign(campaignId: string) {
    try {
      // Get all contacts for this campaign
      const { data: contacts, error: contactsError } = await supabase
        .from('campaign_contacts')
        .select('id, status')
        .eq('campaign_id', campaignId)
        .eq('status', 'pending')

      if (contactsError) {
        throw contactsError
      }

      if (!contacts || contacts.length === 0) {
        throw new Error('No pending contacts found for campaign')
      }

      // Schedule all contacts
      const schedulePromises = contacts.map(contact =>
        this.scheduleContactForCampaign(campaignId, contact.id)
      )

      await Promise.all(schedulePromises)

      // Update campaign status
      const { error: updateError } = await supabase
        .from('campaigns')
        .update({ 
          status: 'active',
          launched_at: new Date().toISOString()
        })
        .eq('id', campaignId)

      if (updateError) {
        throw updateError
      }

      return { success: true, contactsScheduled: contacts.length }
    } catch (error) {
      console.error('Failed to launch campaign:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  static async pauseCampaign(campaignId: string) {
    try {
      // Cancel pending jobs
      const { error: queueError } = await supabase
        .from('email_queue')
        .update({ status: 'cancelled' })
        .eq('campaign_id', campaignId)
        .eq('status', 'pending')

      if (queueError) {
        throw queueError
      }

      // Update campaign status
      const { error: updateError } = await supabase
        .from('campaigns')
        .update({ status: 'paused' })
        .eq('id', campaignId)

      if (updateError) {
        throw updateError
      }

      return { success: true }
    } catch (error) {
      console.error('Failed to pause campaign:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  static async resumeCampaign(campaignId: string) {
    try {
      // Reactivate cancelled jobs
      const { error: queueError } = await supabase
        .from('email_queue')
        .update({ status: 'pending' })
        .eq('campaign_id', campaignId)
        .eq('status', 'cancelled')

      if (queueError) {
        throw queueError
      }

      // Update campaign status
      const { error: updateError } = await supabase
        .from('campaigns') 
        .update({ status: 'active' })
        .eq('id', campaignId)

      if (updateError) {
        throw updateError
      }

      return { success: true }
    } catch (error) {
      console.error('Failed to resume campaign:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  // NEW: Process individual email job using EmailService
  static async processEmailJob(jobId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get the job details
      const { data: job, error: jobError } = await supabase
        .from('email_queue')
        .select(`
          *,
          campaigns(*),
          campaign_contacts(*),
          campaign_steps(*)
        `)
        .eq('id', jobId)
        .single()

      if (jobError || !job) {
        throw new Error('Job not found')
      }

      // Mark job as processing
      await supabase
        .from('email_queue')
        .update({ 
          status: 'processing',
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId)

      // Get step content
      const step = job.campaign_steps
      const campaign = job.campaigns
      const contact = job.campaign_contacts

      // Personalize content
      const personalizedContent = this.personalizeContent(step.content, contact)
      const personalizedSubject = this.personalizeContent(step.subject, contact)

      // Generate unsubscribe URL
      const unsubscribeUrl = `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?campaign=${campaign.id}&contact=${contact.id}`

      // Generate professional HTML email
      const emailHTML = generateCampaignEmailHTML({
        subject: personalizedSubject,
        content: personalizedContent,
        recipientName: contact.first_name,
        unsubscribeUrl,
        companyName: campaign.from_name || 'LeadFlow'
      })

      // Send email using EmailService
      const result = await EmailService.sendEmail({
        to: contact.email,
        subject: personalizedSubject,
        html: emailHTML,
        campaignId: campaign.id,
        contactId: contact.id,
        stepNumber: step.order_index + 1,
        from: campaign.from_email ? 
          `${campaign.from_name || 'LeadFlow'} <${campaign.from_email}>` : 
          undefined,
        replyTo: campaign.reply_to || undefined,
        trackOpens: campaign.track_opens !== false,
        trackClicks: campaign.track_clicks !== false
      })

      // Update job status based on result
      if (result.success) {
        await supabase
          .from('email_queue')
          .update({ 
            status: 'sent',
            updated_at: new Date().toISOString()
          })
          .eq('id', jobId)
      } else {
        await supabase
          .from('email_queue')
          .update({ 
            status: 'failed',
            attempt_count: job.attempt_count + 1,
            last_error: result.error,
            updated_at: new Date().toISOString()
          })
          .eq('id', jobId)
      }

      return result

    } catch (error) {
      console.error('Failed to process email job:', error)
      
      // Mark job as failed
      await supabase
        .from('email_queue')
        .update({ 
          status: 'failed',
          last_error: error instanceof Error ? error.message : 'Unknown error',
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId)

      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  // NEW: Get pending jobs ready to be sent
  static async getPendingJobs(limit: number = 10) {
    try {
      const { data: jobs, error } = await supabase
        .from('email_queue')
        .select(`
          *,
          campaigns(*),
          campaign_contacts(*),
          campaign_steps(*)
        `)
        .eq('status', 'pending')
        .lte('scheduled_for', new Date().toISOString())
        .limit(limit)
        .order('scheduled_for')

      if (error) {
        throw error
      }

      return jobs || []
    } catch (error) {
      console.error('Failed to get pending jobs:', error)
      return []
    }
  }

  // Helper method for personalizing content
  private static personalizeContent(content: string, contact: any): string {
    return content
      .replace(/\{\{first_name\}\}/g, contact.first_name || '')
      .replace(/\{\{last_name\}\}/g, contact.last_name || '')
      .replace(/\{\{full_name\}\}/g, `${contact.first_name || ''} ${contact.last_name || ''}`.trim())
      .replace(/\{\{company\}\}/g, contact.company || '')
      .replace(/\{\{email\}\}/g, contact.email || '')
      .replace(/\{\{phone\}\}/g, contact.phone || '')
  }
}