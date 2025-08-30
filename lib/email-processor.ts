// // ./lib/email-processor.ts
// import { Resend } from 'resend'
// import { supabase } from '@/lib/supabase'
// import { replaceTemplateVariables } from '@/lib/template-variables'
// import { EmailService } from '@/lib/email-service'
// import { generateCampaignEmailHTML } from '@/lib/email-templates/campaign-template'

// const resend = new Resend(process.env.RESEND_API_KEY)

// interface PlanLimits {
//   emailsPerMonth: number
//   emailsPerDay: number
//   emailsPerHour: number
// }

// const PLAN_LIMITS: Record<string, PlanLimits> = { 
//   starter: {
//     emailsPerMonth: 5000,
//     emailsPerDay: 200,
//     emailsPerHour: 50
//   },
//   pro: {
//     emailsPerMonth: 25000,
//     emailsPerDay: 1000,  
//     emailsPerHour: 200
//   },
//   enterprise: {
//     emailsPerMonth: 100000,
//     emailsPerDay: 5000,
//     emailsPerHour: 1000
//   }
// }

// export class EmailProcessor {
//   static async checkRateLimits(organizationId: string): Promise<{ canSend: boolean, reason?: string }> {
//     try {
//       // Get organization plan
//       const { data: org, error: orgError } = await supabase
//         .from('organizations')
//         .select('subscription_plan')
//         .eq('id', organizationId)
//         .single()

//       if (orgError || !org) {
//         return { canSend: false, reason: 'Organization not found' }
//       }

//       const plan = org.subscription_plan || 'starter'
//       const limits = PLAN_LIMITS[plan]

//       if (!limits) {
//         return { canSend: false, reason: 'Invalid plan' }
//       }

//       const now = new Date()
      
//       // Check hourly limit
//       const hourStart = new Date(now)
//       hourStart.setMinutes(0, 0, 0)
      
//       const { count: hourlyCount, error: hourlyError } = await supabase
//         .from('email_queue')
//         .select('*', { count: 'exact', head: true })
//         .eq('status', 'sent')
//         .gte('updated_at', hourStart.toISOString())
//         .lte('updated_at', now.toISOString())

//       if (hourlyError) {
//         console.error('Error checking hourly limit:', hourlyError)
//         return { canSend: false, reason: 'Rate limit check failed' }
//       }

//       if ((hourlyCount || 0) >= limits.emailsPerHour) {
//         return { canSend: false, reason: `Hourly limit reached (${limits.emailsPerHour}/hour)` }
//       }

//       // Check daily limit
//       const dayStart = new Date(now)
//       dayStart.setHours(0, 0, 0, 0)
      
//       const { count: dailyCount, error: dailyError } = await supabase
//         .from('email_queue')
//         .select('*', { count: 'exact', head: true })
//         .eq('status', 'sent')
//         .gte('updated_at', dayStart.toISOString())
//         .lte('updated_at', now.toISOString())

//       if (dailyError) {
//         console.error('Error checking daily limit:', dailyError)
//         return { canSend: false, reason: 'Rate limit check failed' }
//       }

//       if ((dailyCount || 0) >= limits.emailsPerDay) {
//         return { canSend: false, reason: `Daily limit reached (${limits.emailsPerDay}/day)` }
//       }

//       // Check monthly limit
//       const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      
//       const { count: monthlyCount, error: monthlyError } = await supabase
//         .from('email_queue')
//         .select('*', { count: 'exact', head: true })
//         .eq('status', 'sent')
//         .gte('updated_at', monthStart.toISOString())
//         .lte('updated_at', now.toISOString())

//       if (monthlyError) {
//         console.error('Error checking monthly limit:', monthlyError)
//         return { canSend: false, reason: 'Rate limit check failed' }
//       }

//       if ((monthlyCount || 0) >= limits.emailsPerMonth) {
//         return { canSend: false, reason: `Monthly limit reached (${limits.emailsPerMonth}/month)` }
//       }

//       return { canSend: true }
//     } catch (error) {
//       console.error('Rate limit check error:', error)
//       return { canSend: false, reason: 'Rate limit check failed' }
//     }
//   }

//   static async processEmailJob(jobId: string): Promise<{ success: boolean, error?: string }> {
//     try {
//       // Get the email job with related data
//       const { data: job, error: jobError } = await supabase
//         .from('email_queue')
//         .select(`
//           *,
//           campaign_steps (
//             subject,
//             content,
//             order_index
//           ),
//           campaign_contacts (
//             id,
//             email,
//             first_name,
//             last_name,
//             company,
//             phone,
//             custom_fields
//           ),
//           campaigns (
//             id,
//             from_name,
//             from_email,
//             reply_to,
//             organization_id,
//             track_opens,
//             track_clicks
//           )
//         `)
//         .eq('id', jobId)
//         .single()

//       if (jobError || !job) {
//         throw new Error('Email job not found')
//       }

//       // Check if job is ready to process
//       const now = new Date()
//       const scheduledTime = new Date(job.scheduled_for)
      
//       if (scheduledTime > now) {
//         return { success: false, error: 'Job not ready yet' }
//       }

//       if (job.status !== 'pending') {
//         return { success: false, error: 'Job already processed' }
//       }

//       // Check rate limits
//       const rateLimitCheck = await this.checkRateLimits(job.campaigns.organization_id)
//       if (!rateLimitCheck.canSend) {
//         // Reschedule for later
//         await supabase
//           .from('email_queue')
//           .update({ 
//             scheduled_for: new Date(now.getTime() + 15 * 60 * 1000).toISOString() // Try again in 15 minutes
//           })
//           .eq('id', jobId)
        
//         return { success: false, error: rateLimitCheck.reason }
//       }

//       // Mark as processing
//       await supabase
//         .from('email_queue')
//         .update({ 
//           status: 'processing',
//           attempt_count: job.attempt_count + 1
//         })
//         .eq('id', jobId)

//       // Process template variables using your existing function
//       const contact = job.campaign_contacts
//       const step = job.campaign_steps
//       const campaign = job.campaigns

//       // Use your existing replaceTemplateVariables function
//       const processedSubject = replaceTemplateVariables(
//         step.subject, 
//         contact, 
//         contact.custom_fields || {}
//       )

//       const processedContent = replaceTemplateVariables(
//         step.content, 
//         contact, 
//         contact.custom_fields || {}
//       )

//       // Generate unsubscribe URL
//       const unsubscribeUrl = `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?campaign=${campaign.id}&contact=${contact.id}`

//       // Generate professional HTML email with tracking
//       const emailHTML = generateCampaignEmailHTML({
//         subject: processedSubject,
//         content: processedContent,
//         recipientName: contact.first_name,
//         unsubscribeUrl,
//         companyName: campaign.from_name || 'LeadFlow'
//       })

//       // Send email using EmailService (with tracking)
//       const emailResult = await EmailService.sendEmail({
//         to: contact.email,
//         subject: processedSubject,
//         html: emailHTML,
//         campaignId: campaign.id,
//         contactId: contact.id,
//         stepNumber: (step.order_index || 0) + 1,
//         from: campaign.from_email ? 
//           `${campaign.from_name || 'LeadFlow'} <${campaign.from_email}>` : 
//           undefined,
//         replyTo: campaign.reply_to || undefined,
//         trackOpens: campaign.track_opens !== false,
//         trackClicks: campaign.track_clicks !== false
//       })

//       if (!emailResult.success) {
//         throw new Error(emailResult.error || 'Email send failed')
//       }

//       // Mark as sent
//       await supabase
//         .from('email_queue')
//         .update({ 
//           status: 'sent',
//           updated_at: new Date().toISOString()
//         })
//         .eq('id', jobId)

//       // Update contact status (EmailService already does this, but ensure consistency)
//       await supabase
//         .from('campaign_contacts')
//         .update({ 
//           status: 'sent',
//           sent_at: new Date().toISOString(),
//           last_email_id: emailResult.messageId
//         })
//         .eq('id', job.contact_id)

//       return { success: true }

//     } catch (error) {
//       console.error('Email processing error:', error)
      
//       // Mark as failed
//       await supabase
//         .from('email_queue')
//         .update({ 
//           status: 'failed',
//           last_error: error instanceof Error ? error.message : 'Unknown error'
//         })
//         .eq('id', jobId)

//       return { 
//         success: false, 
//         error: error instanceof Error ? error.message : 'Unknown error' 
//       }
//     }
//   }

//   static async processPendingJobs(batchSize: number = 10): Promise<number> {
//     try {
//       // Get pending jobs that are ready to process
//       const now = new Date()
//       const { data: jobs, error: jobsError } = await supabase
//         .from('email_queue')
//         .select('id')
//         .eq('status', 'pending')
//         .lte('scheduled_for', now.toISOString())
//         .order('scheduled_for')
//         .limit(batchSize)

//       if (jobsError) {
//         console.error('Error fetching pending jobs:', jobsError)
//         return 0
//       }

//       if (!jobs || jobs.length === 0) {
//         return 0
//       }

//       // Process each job
//       const processPromises = jobs.map(job => this.processEmailJob(job.id))
//       const results = await Promise.allSettled(processPromises)

//       let successCount = 0
//       results.forEach((result, index) => {
//         if (result.status === 'fulfilled' && result.value.success) { 
//           successCount++
//         } else {
//           console.error(`Job ${jobs[index].id} failed:`, 
//             result.status === 'fulfilled' ? result.value.error : result.reason)
//         }
//       })

//       return successCount
//     } catch (error) {
//       console.error('Error processing pending jobs:', error)
//       return 0
//     }
//   }

//   static async retryFailedJobs(maxAttempts: number = 3): Promise<number> {
//     try {
//       const { data: failedJobs, error } = await supabase
//         .from('email_queue')
//         .select('id')
//         .eq('status', 'failed')
//         .lt('attempt_count', maxAttempts)

//       if (error || !failedJobs) {
//         return 0
//       }

//       let retriedCount = 0
//       for (const job of failedJobs) {
//         await supabase
//           .from('email_queue')
//           .update({ 
//             status: 'pending',
//             updated_at: new Date().toISOString()
//           })
//           .eq('id', job.id)
//         retriedCount++
//       }

//       console.log(`Reset ${retriedCount} jobs for retry`)
//       return retriedCount

//     } catch (error) {
//       console.error('Retry failed jobs error:', error)
//       return 0
//     }
//   }

//   static async cleanupOldJobs(daysOld: number = 30): Promise<number> {
//     try {
//       const cutoffDate = new Date()
//       cutoffDate.setDate(cutoffDate.getDate() - daysOld)

//       const { count, error } = await supabase
//         .from('email_queue')
//         .delete()
//         .eq('status', 'sent')
//         .lt('created_at', cutoffDate.toISOString())

//       if (error) {
//         console.error('Cleanup error:', error)
//         return 0
//       }

//       return count || 0

//     } catch (error) {
//       console.error('Cleanup old jobs error:', error)
//       return 0
//     }
//   }
// }

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
    // If no organization ID, allow sending (for testing/simple setups)
    if (!organizationId) {
      console.log('No organization ID provided, skipping rate limits')
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
      console.warn(`Organization ${organizationId} not found, proceeding without rate limits`)
      return { canSend: true }
    }

    const plan = org.subscription_plan || 'starter'
    const limits = PLAN_LIMITS[plan]

    if (!limits) {
      console.warn(`Invalid plan ${plan}, using starter limits`)
      return { canSend: true } // Use starter as fallback
    }

    // Rest of the rate limiting logic stays the same...
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
      return { canSend: true } // Allow sending if rate check fails
    }

    if ((hourlyCount || 0) >= limits.emailsPerHour) {
      return { canSend: false, reason: `Hourly limit reached (${limits.emailsPerHour}/hour)` }
    }

    // Check daily limit
    const dayStart = new Date(now)
    dayStart.setHours(0, 0, 0, 0)
    
    const { count: dailyCount, error: dailyError } = await supabase
      .from('campaign_contacts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'sent')
      .gte('sent_at', dayStart.toISOString())
      .lte('sent_at', now.toISOString())

    if (dailyError) {
      console.error('Error checking daily limit:', dailyError)
      return { canSend: true } // Allow sending if rate check fails
    }

    if ((dailyCount || 0) >= limits.emailsPerDay) {
      return { canSend: false, reason: `Daily limit reached (${limits.emailsPerDay}/day)` }
    }

    // Check monthly limit
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    
    const { count: monthlyCount, error: monthlyError } = await supabase
      .from('campaign_contacts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'sent')
      .gte('sent_at', monthStart.toISOString())
      .lte('sent_at', now.toISOString())

    if (monthlyError) {
      console.error('Error checking monthly limit:', monthlyError)
      return { canSend: true } // Allow sending if rate check fails
    }

    if ((monthlyCount || 0) >= limits.emailsPerMonth) {
      return { canSend: false, reason: `Monthly limit reached (${limits.emailsPerMonth}/month)` }
    }

    return { canSend: true }
  } catch (error) {
    console.error('Rate limit check error:', error)
    return { canSend: true } // Allow sending if rate check completely fails
  }
}

static async processEmailJob(campaignContactId: string): Promise<{ success: boolean, error?: string }> {
  try {
    console.log(`Processing campaign contact: ${campaignContactId}`)
    
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
          subject,
          content,
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
    const rateLimitCheck = await this.checkRateLimits(campaignContact.campaigns?.organization_id)
    if (!rateLimitCheck.canSend) {
      // Reschedule for later
      await supabase
        .from('campaign_contacts')
        .update({ 
          scheduled_send_time: new Date(now.getTime() + 15 * 60 * 1000).toISOString()
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

    // *** UPDATED: Use 'campaign_steps' table instead of 'sequences' ***
    const { data: steps, error: stepError } = await supabase
      .from('campaign_steps') // <-- Changed from 'sequences' to 'campaign_steps'
      .select('*')
      .eq('campaign_id', campaignContact.campaign_id)
      .order('order_index') // <-- Use order_index instead of step_number

    if (stepError) {
      throw new Error(`Error fetching campaign steps: ${stepError.message}`)
    }

    let step: any

    if (!steps || steps.length === 0) {
      // CREATE A DEFAULT CAMPAIGN STEP IF NONE EXISTS
      console.warn(`No campaign steps found for campaign ${campaignContact.campaign_id}, creating default step`)
      
      const { data: newStep, error: createError } = await supabase
        .from('campaign_steps') // <-- Use campaign_steps table
        .insert({
          campaign_id: campaignContact.campaign_id,
          type: 'email',
          subject: campaignContact.campaigns?.subject || 'Hello {{first_name}}!',
          content: campaignContact.campaigns?.content || `Hi {{first_name}},

Thank you for your interest! We'd love to connect with you.

Best regards,
${campaignContact.campaigns?.from_name || 'The Team'}`,
          delay_days: 0,
          delay_hours: 0,
          order_index: 0
        })
        .select()
        .single()

      if (createError) {
        throw new Error(`Failed to create default campaign step: ${createError.message}`)
      }

      console.log(`Created default campaign step for campaign ${campaignContact.campaign_id}`)
      step = newStep
    } else {
      // Use the first step (order_index = 0)
      step = steps[0]
    }

    // Process template variables using your existing function
    const contact = campaignContact.contacts
    const campaign = campaignContact.campaigns

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
      stepNumber: (step.order_index || 0) + 1, // <-- Use order_index + 1 for step number
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

static async processPendingJobs(batchSize: number = 10): Promise<number> {
  try {
    console.log('📧 Looking for pending campaign contacts...')
    
    // Get pending campaign contacts that are ready to process
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
      console.log('No pending contacts found')
      return 0
    }

    console.log(`Found ${pendingContacts.length} pending contacts`)

    // *** SEQUENTIAL PROCESSING WITH RATE LIMITING ***
    let successCount = 0
    
    for (let i = 0; i < pendingContacts.length; i++) {
      const contact = pendingContacts[i]
      
      try {
        console.log(`Processing contact ${i + 1}/${pendingContacts.length}: ${contact.id}`)
        
        const result = await this.processEmailJob(contact.id)
        
        if (result.success) {
          successCount++
          console.log(`✅ Email ${i + 1} sent successfully`)
        } else {
          console.error(`❌ Contact ${contact.id} failed: ${result.error}`)
        }
        
        // *** RATE LIMITING: Wait between requests ***
        if (i < pendingContacts.length - 1) { // Don't wait after the last email
          console.log('⏳ Waiting 600ms to respect rate limits...')
          await new Promise(resolve => setTimeout(resolve, 600)) // 600ms = ~1.6 requests/second
        }
        
      } catch (error) {
        console.error(`Error processing contact ${contact.id}:`, error)
      }
    }

    console.log(`✅ Successfully processed ${successCount}/${pendingContacts.length} emails`)
    return successCount
    
  } catch (error) {
    console.error('Error processing pending jobs:', error)
    return 0
  }
}

  static async retryFailedJobs(maxRetries: number = 3): Promise<number> {
    try {
      console.log('🔄 Looking for failed contacts to retry...')
      
      // Get failed contacts from last 24 hours that haven't exceeded max retries
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
            scheduled_send_time: new Date().toISOString() // Retry immediately
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

      // For campaign_contacts, we probably don't want to delete them
      // Instead, we might want to archive very old sent emails or just return 0
      // Keeping campaign history is usually important for analytics
      
      // Optional: Clean up very old failed contacts
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