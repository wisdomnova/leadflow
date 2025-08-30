// ./lib/email-processor.ts - Complete rewrite for bulk processing

import { Resend } from 'resend'
import { supabase } from '@/lib/supabase'
import { replaceTemplateVariables } from '@/lib/template-variables'
import { generateCampaignEmailHTML } from '@/lib/email-templates/campaign-template'

const resend = new Resend(process.env.RESEND_API_KEY)

interface PlanLimits {
  emailsPerMonth: number
  emailsPerDay: number
  emailsPerHour: number
  batchSize: number // Max emails per batch
}

const PLAN_LIMITS: Record<string, PlanLimits> = { 
  starter: {
    emailsPerMonth: 5000,
    emailsPerDay: 200,
    emailsPerHour: 50,
    batchSize: 50 // Resend allows up to 100 recipients per request
  },
  pro: {
    emailsPerMonth: 25000,
    emailsPerDay: 1000,  
    emailsPerHour: 200,
    batchSize: 100
  },
  enterprise: {
    emailsPerMonth: 100000,
    emailsPerDay: 5000,
    emailsPerHour: 1000,
    batchSize: 100
  }
}

export class EmailProcessor {
  static async checkRateLimits(organizationId: string): Promise<{ canSend: boolean, reason?: string, limit?: PlanLimits }> {
    try {
      if (!organizationId) {
        console.log('No organization ID provided, using starter limits')
        return { canSend: true, limit: PLAN_LIMITS.starter }
      }

      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('subscription_plan')
        .eq('id', organizationId)
        .single()

      if (orgError || !org) {
        console.warn(`Organization ${organizationId} not found, using starter limits`)
        return { canSend: true, limit: PLAN_LIMITS.starter }
      }

      const plan = org.subscription_plan || 'starter'
      const limits = PLAN_LIMITS[plan]

      if (!limits) {
        console.warn(`Invalid plan ${plan}, using starter limits`)
        return { canSend: true, limit: PLAN_LIMITS.starter }
      }

      const now = new Date()
      
      // Check hourly limit
      const hourStart = new Date(now)
      hourStart.setMinutes(0, 0, 0)
      
      const { count: hourlyCount, error: hourlyError } = await supabase
        .from('campaign_contacts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'sent')
        .gte('sent_at', hourStart.toISOString())
        .lte('sent_at', now.toISOString())

      if (hourlyError) {
        console.error('Error checking hourly limit:', hourlyError)
        return { canSend: true, limit: limits }
      }

      if ((hourlyCount || 0) >= limits.emailsPerHour) {
        return { canSend: false, reason: `Hourly limit reached (${limits.emailsPerHour}/hour)`, limit: limits }
      }

      return { canSend: true, limit: limits }
    } catch (error) {
      console.error('Rate limit check error:', error)
      return { canSend: true, limit: PLAN_LIMITS.starter }
    }
  }

  // **NEW: Bulk processing for production SaaS**
  static async processPendingJobs(batchSize: number = 50): Promise<number> {
    try {
      console.log('📧 Looking for pending campaign contacts...')
      
      const now = new Date()
      const { data: pendingContacts, error: contactsError } = await supabase
        .from('campaign_contacts')
        .select(`
          id,
          campaign_id,
          scheduled_send_time,
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
        .lte('scheduled_send_time', now.toISOString())
        .eq('contacts.status', 'active') // Only active contacts
        .order('campaign_id') // Group by campaign for better batching
        .limit(batchSize)

      if (contactsError || !pendingContacts || pendingContacts.length === 0) {
        console.log('No pending contacts found')
        return 0
      }

      console.log(`Found ${pendingContacts.length} pending contacts`)

      // Group contacts by campaign for efficient processing
      const campaignGroups = pendingContacts.reduce((groups, contact) => {
        const campaignId = contact.campaign_id
        if (!groups[campaignId]) {
          groups[campaignId] = []
        }
        groups[campaignId].push(contact)
        return groups
      }, {} as Record<string, any[]>)

      let totalProcessed = 0

      // Process each campaign group
      for (const [campaignId, contacts] of Object.entries(campaignGroups)) {
        try {
          const processed = await this.processCampaignBulk(campaignId, contacts)
          totalProcessed += processed
          
          // Add delay between campaigns to respect rate limits
          if (Object.keys(campaignGroups).length > 1) {
            await new Promise(resolve => setTimeout(resolve, 1000)) // 1 second between campaigns
          }
        } catch (error) {
          console.error(`Error processing campaign ${campaignId}:`, error)
        }
      }

      console.log(`✅ Successfully processed ${totalProcessed} emails`)
      return totalProcessed

    } catch (error) {
      console.error('Error processing pending jobs:', error)
      return 0
    }
  }

  // **NEW: Process entire campaign in bulk**
  static async processCampaignBulk(campaignId: string, contacts: any[]): Promise<number> {
    try {
      console.log(`📨 Processing ${contacts.length} contacts for campaign ${campaignId}`)

      // Get campaign steps
      const { data: steps, error: stepError } = await supabase
        .from('campaign_steps')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('order_index')

      if (stepError || !steps || steps.length === 0) {
        console.error(`No campaign steps found for campaign ${campaignId}`)
        return 0
      }

      const step = steps[0] // Use first step
      const campaign = contacts[0].campaigns

      // Check rate limits for this campaign's organization
      const rateLimitCheck = await this.checkRateLimits(campaign.organization_id)
      if (!rateLimitCheck.canSend) {
        console.log(`Rate limit reached for campaign ${campaignId}: ${rateLimitCheck.reason}`)
        return 0
      }

      const planLimits = rateLimitCheck.limit!
      const maxBatchSize = Math.min(planLimits.batchSize, contacts.length)

      // Split into smaller batches if needed
      const batches = []
      for (let i = 0; i < contacts.length; i += maxBatchSize) {
        batches.push(contacts.slice(i, i + maxBatchSize))
      }

      let totalProcessed = 0

      // Process each batch
      for (const batch of batches) {
        try {
          const processed = await this.sendBulkEmails(campaignId, step, campaign, batch)
          totalProcessed += processed

          // Add delay between batches to respect Resend's 2 requests/second limit
          if (batches.length > 1) {
            await new Promise(resolve => setTimeout(resolve, 600)) // 600ms = ~1.6 requests/second
          }
        } catch (error) {
          console.error(`Error processing batch:`, error)
        }
      }

      return totalProcessed

    } catch (error) {
      console.error(`Error processing campaign bulk ${campaignId}:`, error)
      return 0
    }
  }

  // **NEW: Send bulk emails using Resend batch API**
static async sendBulkEmails(campaignId: string, step: any, campaign: any, contacts: any[]): Promise<number> {
  try {
    console.log(`🚀 Sending TRUE bulk email to ${contacts.length} recipients`)

    // Mark all contacts as processing
    const contactIds = contacts.map(c => c.id)
    await supabase
      .from('campaign_contacts')
      .update({ 
        status: 'processing',
        updated_at: new Date().toISOString()
      })
      .in('id', contactIds)

    // **GATHER ALL EMAIL ADDRESSES FOR BULK SENDING**
    const emailAddresses = contacts.map(contact => contact.contacts.email)
    
    console.log(`📧 Bulk sending to: ${emailAddresses.join(', ')}`)

    // **PROCESS TEMPLATE VARIABLES (use first contact as base or remove personalization)**
    // Option 1: Remove personalization for true bulk
    let processedSubject = step.subject
    let processedContent = step.content
    
    // Remove template variables for bulk sending
    processedSubject = processedSubject
      .replace(/\{\{first_name\}\}/g, '')
      .replace(/\{\{last_name\}\}/g, '')
      .replace(/\{\{company\}\}/g, '')
      .replace(/\{\{.*?\}\}/g, '') // Remove any other template variables
      .trim()
    
    processedContent = processedContent
      .replace(/Hi \{\{first_name\}\},?/g, 'Hi there,')
      .replace(/Hello \{\{first_name\}\},?/g, 'Hello,')
      .replace(/\{\{first_name\}\}/g, '')
      .replace(/\{\{last_name\}\}/g, '')
      .replace(/\{\{company\}\}/g, '')
      .replace(/\{\{.*?\}\}/g, '') // Remove any other template variables
      .trim()

    // **GENERATE HTML FOR BULK EMAIL**
    const unsubscribeUrl = `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?campaign=${campaign.id}` // Generic unsubscribe

    const emailHTML = generateCampaignEmailHTML({
      subject: processedSubject,
      content: processedContent,
      recipientName: '', // No personalization for bulk
      unsubscribeUrl,
      companyName: campaign.from_name || 'LeadFlow'
    })

    // **SEND ONE EMAIL TO ALL RECIPIENTS**
    const result = await resend.emails.send({
      from: campaign.from_email || 'noreply@resend.dev',
      to: emailAddresses, // <-- THIS IS THE KEY: Array of all emails
      subject: processedSubject,
      html: emailHTML,
      replyTo: campaign.reply_to || undefined,
      tags: [
        { name: 'campaign_id', value: campaignId },
        { name: 'step_number', value: '1' },
        { name: 'bulk_batch', value: 'true' },
        { name: 'recipient_count', value: emailAddresses.length.toString() }
      ]
    })

    if (result.error) {
      throw new Error(result.error.message)
    }

    // **MARK ALL CONTACTS AS SENT**
    await supabase
      .from('campaign_contacts')
      .update({ 
        status: 'sent',
        sent_at: new Date().toISOString(),
        last_email_id: result.data?.id,
        updated_at: new Date().toISOString()
      })
      .in('id', contactIds)

    console.log(`✅ Bulk email sent successfully to ${emailAddresses.length} recipients`)
    console.log(`📊 Message ID: ${result.data?.id}`)
    
    return emailAddresses.length

  } catch (error) {
    console.error('Bulk send error:', error)
    
    // Mark all as failed if bulk operation fails
    const contactIds = contacts.map(c => c.id)
    await supabase
      .from('campaign_contacts')
      .update({ 
        status: 'failed',
        last_error: error instanceof Error ? error.message : 'Bulk send failed',
        updated_at: new Date().toISOString()
      })
      .in('id', contactIds)

    return 0
  }
}

  // Keep existing retry and cleanup methods...
  static async retryFailedJobs(maxRetries: number = 3): Promise<number> {
    try {
      console.log('🔄 Looking for failed contacts to retry...')
      
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
      
      const { data: failedContacts, error } = await supabase
        .from('campaign_contacts')
        .select('id, retry_count')
        .eq('status', 'failed')
        .gte('updated_at', oneDayAgo.toISOString())
        .lt('retry_count', maxRetries)
        .limit(maxRetries)

      if (error || !failedContacts || failedContacts.length === 0) {
        console.log('No failed contacts to retry')
        return 0
      }

      let retriedCount = 0
      for (const contact of failedContacts) {
        await supabase
          .from('campaign_contacts')
          .update({ 
            status: 'pending',
            retry_count: (contact.retry_count || 0) + 1,
            last_error: null,
            updated_at: new Date().toISOString(),
            scheduled_send_time: new Date().toISOString()
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
      console.log(`🧹 Cleaning up campaign contacts older than ${daysOld} days...`)
      
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysOld)

      const { count, error } = await supabase
        .from('campaign_contacts')
        .delete()
        .eq('status', 'failed')
        .lt('created_at', cutoffDate.toISOString())

      if (error) {
        console.error('Cleanup error:', error)
        return 0
      }

      console.log(`Cleaned up ${count || 0} old failed contacts`)
      return count || 0

    } catch (error) {
      console.error('Cleanup old contacts error:', error)
      return 0
    }
  }
}