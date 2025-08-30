// ./lib/email-scheduler.ts
import { supabase } from '@/lib/supabase'
import { EmailService } from './email-service'
import { generateCampaignEmailHTML } from './email-templates/campaign-template'
import { replaceTemplateVariables } from './template-variables'

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
      // Get campaign sequence steps (updated table name)
      const { data: steps, error: stepsError } = await supabase
        .from('sequence_steps')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('step_number')

      if (stepsError || !steps || steps.length === 0) {
        throw new Error('No sequence steps found')
      }

      const now = new Date()

      // For now, just schedule the first step - we'll handle multi-step sequences later
      const firstStep = steps[0]
      const scheduledTime = new Date(now)

      if (startImmediately) {
        // Send immediately (within 1 minute for processing)
        scheduledTime.setMinutes(scheduledTime.getMinutes() + 1)
      }

      // Update or insert campaign_contact with scheduled time
      const { error: contactError } = await supabase
        .from('campaign_contacts')
        .update({
          status: 'pending',
          scheduled_send_time: scheduledTime.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('campaign_id', campaignId)
        .eq('contact_id', contactId)

      if (contactError) {
        throw contactError
      }

      return { success: true }
    } catch (error) {
      console.error('Failed to schedule contact for campaign:', error)
      throw error
    }
  }

  static async launchCampaign(campaignId: string) {
    try {
      // Get all contacts for this campaign
      const { data: campaignContacts, error: contactsError } = await supabase
        .from('campaign_contacts')
        .select('id, contact_id, status')
        .eq('campaign_id', campaignId)
        .neq('status', 'sent') // Don't re-launch already sent contacts

      if (contactsError) {
        throw contactsError
      }

      if (!campaignContacts || campaignContacts.length === 0) {
        throw new Error('No contacts found for campaign')
      }

      // Schedule all contacts for immediate sending
      const now = new Date()
      const { error: updateError } = await supabase
        .from('campaign_contacts')
        .update({
          status: 'pending',
          scheduled_send_time: now.toISOString(),
          updated_at: now.toISOString()
        })
        .eq('campaign_id', campaignId)
        .in('status', ['ready', 'draft', 'paused'])

      if (updateError) {
        throw updateError
      }

      // Update campaign status
      const { error: campaignUpdateError } = await supabase
        .from('campaigns')
        .update({ 
          status: 'active',
          launched_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', campaignId)

      if (campaignUpdateError) {
        throw campaignUpdateError
      }

      console.log(`Campaign ${campaignId} launched with ${campaignContacts.length} contacts`)
      return { success: true, contactsScheduled: campaignContacts.length }
    } catch (error) {
      console.error('Failed to launch campaign:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  static async pauseCampaign(campaignId: string) {
    try {
      // Pause pending campaign contacts
      const { error: contactsError } = await supabase
        .from('campaign_contacts')
        .update({ 
          status: 'paused',
          updated_at: new Date().toISOString()
        })
        .eq('campaign_id', campaignId)
        .eq('status', 'pending')

      if (contactsError) {
        throw contactsError
      }

      // Update campaign status
      const { error: updateError } = await supabase
        .from('campaigns')
        .update({ 
          status: 'paused',
          paused_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', campaignId)

      if (updateError) {
        throw updateError
      }

      console.log(`Campaign ${campaignId} paused successfully`)
      return { success: true }
    } catch (error) {
      console.error('Failed to pause campaign:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  static async resumeCampaign(campaignId: string) {
    try {
      // Resume paused campaign contacts
      const { error: contactsError } = await supabase
        .from('campaign_contacts')
        .update({ 
          status: 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('campaign_id', campaignId)
        .eq('status', 'paused')

      if (contactsError) {
        throw contactsError
      }

      // Update campaign status
      const { error: updateError } = await supabase
        .from('campaigns') 
        .update({ 
          status: 'active',
          resumed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', campaignId)

      if (updateError) {
        throw updateError
      }

      console.log(`Campaign ${campaignId} resumed successfully`)
      return { success: true }
    } catch (error) {
      console.error('Failed to resume campaign:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  static async stopCampaign(campaignId: string) {
    try {
      // Verify campaign exists and can be stopped
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .select('id, status')
        .eq('id', campaignId)
        .single()

      if (campaignError || !campaign) {
        throw new Error('Campaign not found')
      }

      if (!['sending', 'active', 'paused', 'scheduled'].includes(campaign.status)) {
        throw new Error('Campaign cannot be stopped in current status')
      }

      // Cancel all pending campaign contacts
      const { error: contactsError } = await supabase
        .from('campaign_contacts')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('campaign_id', campaignId)
        .in('status', ['pending', 'paused', 'scheduled'])

      if (contactsError) {
        console.error('Error cancelling campaign contacts:', contactsError)
        // Don't throw here - continue with campaign update
      }

      // Update campaign status to stopped
      const { error: updateError } = await supabase
        .from('campaigns')
        .update({ 
          status: 'stopped',
          stopped_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', campaignId)

      if (updateError) {
        throw updateError
      }

      console.log(`Campaign ${campaignId} stopped successfully`)
      return { 
        success: true, 
        message: 'Campaign stopped successfully' 
      }
      
    } catch (error) {
      console.error('Error stopping campaign:', error)
      throw error
    }
  }

  // Process individual campaign contact (updated to work with campaign_contacts)
  static async processEmailJob(campaignContactId: string): Promise<{ success: boolean; error?: string }> {
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
        throw new Error(`No sequence step found for campaign ${campaignContact.campaign_id}`)
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

      // Send email using EmailService
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

      console.log(`✅ Email sent to ${contact.email}`)
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

  // Get pending campaign contacts ready to be sent (updated for campaign_contacts)
  static async getPendingJobs(limit: number = 10) {
    try {
      const { data: pendingContacts, error } = await supabase
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
        .eq('status', 'pending')
        .lte('scheduled_send_time', new Date().toISOString())
        .order('scheduled_send_time')
        .limit(limit)

      if (error) {
        throw error
      }

      return pendingContacts || []
    } catch (error) {
      console.error('Failed to get pending contacts:', error)
      return []
    }
  }

  // Helper method for personalizing content (kept for backward compatibility)
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