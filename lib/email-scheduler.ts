// ./lib/email-scheduler.ts
import { supabase } from '@/lib/supabase'

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
          status: 'sending',
          launched_at: new Date().toISOString()
        })
        .eq('id', campaignId)

      if (updateError) {
        throw updateError
      }

      return { success: true, contactsScheduled: contacts.length }
    } catch (error) {
      console.error('Failed to launch campaign:', error)
      throw error
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
      throw error
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
        .update({ status: 'sending' })
        .eq('id', campaignId)

      if (updateError) {
        throw updateError
      }

      return { success: true }
    } catch (error) {
      console.error('Failed to resume campaign:', error)
      throw error
    }
  }
}