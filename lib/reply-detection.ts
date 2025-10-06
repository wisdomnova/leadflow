// lib/reply-detection.ts
import { supabase } from '@/lib/supabase'
import { ReplyClassifierService } from '@/lib/ai/reply-classifier'
import { CRMSyncManager } from '@/lib/integrations/crm-sync-manager'

export interface InboxMessage {
  id: string
  organization_id: string
  campaign_id?: string
  contact_id?: string
  message_id?: string
  thread_id?: string
  subject: string
  content: string
  html_content?: string
  from_email: string 
  from_name?: string
  to_email: string
  to_name?: string
  direction: 'inbound' | 'outbound'
  message_type: 'reply' | 'forward' | 'new'
  classification?: string
  sentiment_score?: number
  confidence_score?: number
  tags?: string[]
  is_read: boolean
  is_archived: boolean
  is_starred: boolean
  received_at: string
  created_at: string
  updated_at: string
}

export interface EmailThread {
  id: string
  organization_id: string
  campaign_id?: string
  contact_id?: string
  thread_id: string
  subject: string
  message_count: number
  last_message_at: string
  last_message_from?: string
  is_active: boolean
  is_archived: boolean
  created_at: string
  updated_at: string
}

export class ReplyDetectionService {
  
  // Detect if an email is a reply based on various patterns
  static async detectReply(emailData: {
    subject: string
    content: string
    headers?: Record<string, string>
    from_email: string
    to_email: string
    references?: string[]
    in_reply_to?: string
  }): Promise<{
    isReply: boolean
    confidence: number
    threadId?: string
    originalCampaignId?: string
    originalContactId?: string
    replyType: 'reply' | 'forward' | 'new'
  }> {
    
    let confidence = 0
    let isReply = false
    let threadId: string | undefined
    let originalCampaignId: string | undefined
    let originalContactId: string | undefined
    let replyType: 'reply' | 'forward' | 'new' = 'new'

    // 1. Check subject line patterns
    const subjectPatterns = [
      /^re:\s*/i,
      /^reply:\s*/i,
      /^fwd:\s*/i,
      /^forward:\s*/i
    ]

    for (const pattern of subjectPatterns) {
      if (pattern.test(emailData.subject)) {
        confidence += 0.4
        isReply = true
        if (pattern.source.includes('fwd') || pattern.source.includes('forward')) {
          replyType = 'forward'
        } else {
          replyType = 'reply'
        }
        break
      }
    }

    // 2. Check for email headers (References, In-Reply-To)
    if (emailData.headers?.['References'] || emailData.in_reply_to) {
      confidence += 0.5
      isReply = true
      replyType = 'reply'
    }

    // 3. Check content patterns
    const contentPatterns = [
      /^on\s+.+wrote:$/im,
      /^from:\s*.+$/im,
      /^sent:\s*.+$/im,
      />.*$/m, // Quoted text
      /-----original message-----/i
    ]

    for (const pattern of contentPatterns) {
      if (pattern.test(emailData.content)) {
        confidence += 0.2
        isReply = true
        if (replyType === 'new') replyType = 'reply'
        break
      }
    }

    // 4. Look for matching campaigns/contacts in our database
    try {
      // Try to find original campaign by matching sender/recipient
      const { data: campaigns } = await supabase
        .from('campaigns')
        .select(`
          id,
          campaign_contacts!inner (
            contact_id,
            contacts!inner (
              email
            )
          )
        `)
        .eq('campaign_contacts.contacts.email', emailData.from_email)
        .limit(1)

      if (campaigns && campaigns.length > 0) {
        confidence += 0.3
        isReply = true
        originalCampaignId = campaigns[0].id
        originalContactId = campaigns[0].campaign_contacts[0].contact_id
        if (replyType === 'new') replyType = 'reply'
      }

      // Try to find existing thread
      const cleanSubject = emailData.subject.replace(/^(re:|reply:|fwd:|forward:)\s*/i, '').trim()
      const { data: existingThread } = await supabase
        .from('email_threads')
        .select('*')
        .ilike('subject', `%${cleanSubject}%`)
        .eq('is_active', true)
        .limit(1)
        .single()

      if (existingThread) {
        confidence += 0.4
        isReply = true
        threadId = existingThread.thread_id
        originalCampaignId = originalCampaignId || existingThread.campaign_id
        originalContactId = originalContactId || existingThread.contact_id
        if (replyType === 'new') replyType = 'reply'
      }

    } catch (error) {
      console.error('Error looking up campaign/thread data:', error)
    }

    return {
      isReply: confidence > 0.3, // Threshold for considering it a reply
      confidence,
      threadId,
      originalCampaignId,
      originalContactId,
      replyType
    }
  }

  // Updated: Process incoming email with AI classification and CRM sync
  static async processIncomingEmail(emailData: {
    message_id?: string
    subject: string
    content: string
    html_content?: string
    from_email: string
    from_name?: string
    to_email: string
    to_name?: string
    headers?: Record<string, string>
    received_at?: string
  }, organizationId: string): Promise<InboxMessage> {

    const startTime = Date.now()
    
    // Detect if this is a reply
    const replyDetection = await this.detectReply(emailData)
    
    // Generate thread ID if not exists
    let threadId = replyDetection.threadId
    if (!threadId) {
      threadId = `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    // Get campaign context for AI classification
    let campaignContext = undefined
    if (replyDetection.originalCampaignId) {
      try {
        const { data: campaign } = await supabase
          .from('campaigns')
          .select('name, type, content')
          .eq('id', replyDetection.originalCampaignId)
          .single()

        if (campaign) {
          campaignContext = {
            campaignName: campaign.name,
            campaignType: campaign.type || 'email',
            originalMessage: campaign.content || ''
          }
        }
      } catch (error) {
        console.error('Failed to get campaign context:', error)
      }
    }

    // *** AI Classification ***
    let aiClassification = null
    try {
      console.log('Starting AI classification for message:', emailData.subject)
      aiClassification = await ReplyClassifierService.classifyReply(
        emailData.content,
        emailData.subject,
        emailData.from_email,
        campaignContext
      )
      console.log('AI classification completed:', aiClassification)
    } catch (error) {
      console.error('AI classification failed:', error)
    }

    // Create or update email thread
    const cleanSubject = emailData.subject.replace(/^(re:|reply:|fwd:|forward:)\s*/i, '').trim()
    
    const { data: thread, error: threadError } = await supabase
      .from('email_threads')
      .upsert({
        organization_id: organizationId,
        campaign_id: replyDetection.originalCampaignId,
        contact_id: replyDetection.originalContactId,
        thread_id: threadId,
        subject: cleanSubject,
        last_message_at: emailData.received_at || new Date().toISOString(),
        last_message_from: emailData.from_email,
        is_active: true
      }, {
        onConflict: 'organization_id,thread_id'
      })
      .select()
      .single()

    if (threadError) {
      console.error('Error creating/updating thread:', threadError)
    }

    // Create inbox message with AI classification
    const { data: message, error: messageError } = await supabase
      .from('inbox_messages')
      .insert({
        organization_id: organizationId,
        campaign_id: replyDetection.originalCampaignId,
        contact_id: replyDetection.originalContactId,
        message_id: emailData.message_id,
        thread_id: threadId,
        subject: emailData.subject,
        content: emailData.content,
        html_content: emailData.html_content,
        from_email: emailData.from_email,
        from_name: emailData.from_name,
        to_email: emailData.to_email,
        to_name: emailData.to_name,
        direction: 'inbound',
        message_type: replyDetection.replyType,
        // Store AI classification results in simple fields
        classification: aiClassification?.intent,
        sentiment_score: aiClassification?.sentiment === 'positive' ? 0.8 : 
                        aiClassification?.sentiment === 'negative' ? 0.2 : 0.5,
        confidence_score: replyDetection.confidence,
        tags: aiClassification?.tags || [],
        received_at: emailData.received_at || new Date().toISOString(),
        is_read: false
      })
      .select()
      .single()

    if (messageError) {
      throw new Error(`Failed to create inbox message: ${messageError.message}`)
    }

    // *** Store detailed AI classification ***
    if (aiClassification) {
      const processingTime = Date.now() - startTime
      
      try {
        console.log('Storing detailed AI classification...')
        await supabase
          .from('message_classifications')
          .insert({
            message_id: message.id,
            intent: aiClassification.intent,
            sentiment: aiClassification.sentiment,
            confidence: aiClassification.confidence,
            reasoning: aiClassification.reasoning,
            suggested_response: aiClassification.suggested_response,
            priority: aiClassification.priority,
            tags: aiClassification.tags,
            requires_human_attention: aiClassification.requires_human_attention,
            next_action: aiClassification.next_action,
            ai_model: 'gpt-4o-mini',
            processing_time_ms: processingTime
          })

        console.log('AI classification stored successfully')

        // Apply classification rules
        await ReplyClassifierService.applyClassificationRules(
          message.id,
          aiClassification,
          organizationId
        )

        console.log('Classification rules applied successfully')

      } catch (classificationError) {
        console.error('Failed to store AI classification:', classificationError)
      }
    }

    // *** NEW: CRM Sync Integration ***
    if (aiClassification && message) {
      try {
        // Only sync if the AI classification indicates interest or needs attention
        const shouldSync = [
          'interested',
          'question',
          'objection'
        ].includes(aiClassification.intent) || aiClassification.requires_human_attention

        if (shouldSync) {
          console.log('Triggering CRM sync for classified message:', message.id)
          
          // Get or create contact
          let contactId = replyDetection.originalContactId
          
          if (!contactId && emailData.from_email) {
            // Create contact from email data
            const { data: newContact, error: contactError } = await supabase
              .from('contacts')
              .upsert({
                organization_id: organizationId,
                email: emailData.from_email,
                first_name: emailData.from_name?.split(' ')[0] || '',
                last_name: emailData.from_name?.split(' ').slice(1).join(' ') || '',
                source: 'email_reply',
                status: 'active'
              }, {
                onConflict: 'organization_id,email'
              })
              .select()
              .single()

            if (!contactError && newContact) {
              contactId = newContact.id
              
              // Update message with contact ID
              await supabase
                .from('inbox_messages')
                .update({ contact_id: contactId })
                .eq('id', message.id)
            }
          }

          if (contactId) {
            // Extract company from email signature or domain
            let company = ''
            try {
              // Simple company extraction from email domain
              const domain = emailData.from_email.split('@')[1]
              if (domain && !['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'].includes(domain)) {
                company = domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1)
              }
              
              // Try to extract company from signature
              const companyPatterns = [
                /company:\s*([^\n\r]+)/i,
                /organization:\s*([^\n\r]+)/i,
                /([A-Z][a-z]+\s+(?:Inc|LLC|Corp|Ltd|Co)\.?)/g
              ]
              
              for (const pattern of companyPatterns) {
                const match = emailData.content.match(pattern)
                if (match && match[1]) {
                  company = match[1].trim()
                  break
                }
              }
            } catch (error) {
              console.error('Failed to extract company:', error)
            }

            // Prepare sync data
            const syncData = {
              contactId: contactId,
              messageId: message.id,
              email: emailData.from_email,
              firstName: emailData.from_name?.split(' ')[0],
              lastName: emailData.from_name?.split(' ').slice(1).join(' '),
              company: company,
              phone: '', // Extract from signature if available
              intent: aiClassification.intent,
              sentiment: aiClassification.sentiment,
              priority: aiClassification.priority,
              requiresAttention: aiClassification.requires_human_attention,
              nextAction: aiClassification.next_action
            }

            // Trigger async CRM sync (don't await to avoid blocking email processing)
            CRMSyncManager.autoSyncContact(organizationId, syncData)
              .then(() => {
                console.log('CRM sync completed successfully for contact:', contactId)
              })
              .catch(error => {
                console.error('CRM sync failed:', error)
                // Don't throw - continue with email processing
              })
          }
        } else {
          console.log('Message does not meet CRM sync criteria:', {
            intent: aiClassification.intent,
            requiresAttention: aiClassification.requires_human_attention
          })
        }
      } catch (syncError) {
        console.error('CRM sync trigger failed:', syncError)
        // Don't throw - continue with email processing
      }
    }

    // Update thread message count
    if (thread) {
      await supabase.rpc('increment_thread_message_count', {
        thread_id: thread.id
      })
    }

    console.log('Email processing completed for message:', message.id)
    return message
  }

  // Mark messages as read
  static async markAsRead(messageIds: string[], organizationId: string): Promise<void> {
    const { error } = await supabase
      .from('inbox_messages')
      .update({ is_read: true })
      .in('id', messageIds)
      .eq('organization_id', organizationId)

    if (error) {
      throw new Error(`Failed to mark messages as read: ${error.message}`)
    }
  }

  // Archive messages
  static async archiveMessages(messageIds: string[], organizationId: string): Promise<void> {
    const { error } = await supabase
      .from('inbox_messages')
      .update({ is_archived: true })
      .in('id', messageIds)
      .eq('organization_id', organizationId)

    if (error) {
      throw new Error(`Failed to archive messages: ${error.message}`)
    }
  }

  // Updated: Get inbox messages with AI classification data
  static async getInboxMessages(
    organizationId: string,
    options: {
      page?: number
      limit?: number
      filter?: 'all' | 'unread' | 'starred' | 'archived' | 'high_priority' | 'requires_attention'
      campaignId?: string
      contactId?: string
      intentFilter?: string
      sentimentFilter?: string
    } = {}
  ): Promise<{
    messages: (InboxMessage & { message_classifications?: any })[]
    total: number
    hasMore: boolean
  }> {
    
    const { 
      page = 1, 
      limit = 50, 
      filter = 'all', 
      campaignId, 
      contactId,
      intentFilter,
      sentimentFilter
    } = options
    const offset = (page - 1) * limit

    let query = supabase
      .from('inbox_messages')
      .select(`
        *,
        campaigns:campaign_id(id, name),
        contacts:contact_id(id, email, first_name, last_name, company),
        message_classifications(
          intent,
          sentiment,
          confidence,
          reasoning,
          suggested_response,
          priority,
          tags,
          requires_human_attention,
          next_action,
          ai_model,
          processing_time_ms
        )
      `, { count: 'exact' })
      .eq('organization_id', organizationId)
      .order('received_at', { ascending: false })

    // Apply standard filters
    if (filter === 'unread') {
      query = query.eq('is_read', false)
    } else if (filter === 'starred') {
      query = query.eq('is_starred', true)
    } else if (filter === 'archived') {
      query = query.eq('is_archived', true)
    } else if (filter !== 'high_priority' && filter !== 'requires_attention') {
      query = query.eq('is_archived', false) // Exclude archived by default
    }

    if (campaignId) {
      query = query.eq('campaign_id', campaignId)
    }

    if (contactId) {
      query = query.eq('contact_id', contactId)
    }

    const { data, error, count } = await query
      .range(offset, offset + limit - 1)

    if (error) {
      throw new Error(`Failed to fetch inbox messages: ${error.message}`)
    }

    let filteredData = data || []

    // Client-side filtering for AI classification filters
    if (filter === 'high_priority') {
      filteredData = filteredData.filter(msg => 
        msg.message_classifications?.priority === 'high'
      )
    } else if (filter === 'requires_attention') {
      filteredData = filteredData.filter(msg => 
        msg.message_classifications?.requires_human_attention === true
      )
    }

    // Apply AI intent filter
    if (intentFilter && intentFilter !== 'all') {
      filteredData = filteredData.filter(msg => 
        msg.message_classifications?.intent === intentFilter
      )
    }

    // Apply AI sentiment filter
    if (sentimentFilter && sentimentFilter !== 'all') {
      filteredData = filteredData.filter(msg => 
        msg.message_classifications?.sentiment === sentimentFilter
      )
    }

    return {
      messages: filteredData,
      total: count || 0,
      hasMore: (count || 0) > offset + limit
    }
  }

  // Get email threads
  static async getEmailThreads(
    organizationId: string,
    options: {
      page?: number
      limit?: number
      campaignId?: string
      contactId?: string
    } = {}
  ): Promise<{
    threads: (EmailThread & {
      messages?: InboxMessage[]
      latest_message?: InboxMessage
    })[]
    total: number
    hasMore: boolean
  }> {
    
    const { page = 1, limit = 20, campaignId, contactId } = options
    const offset = (page - 1) * limit

    let query = supabase
      .from('email_threads')
      .select(`
        *,
        campaigns:campaign_id(id, name),
        contacts:contact_id(id, email, first_name, last_name, company)
      `, { count: 'exact' })
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('last_message_at', { ascending: false })

    if (campaignId) {
      query = query.eq('campaign_id', campaignId)
    }

    if (contactId) {
      query = query.eq('contact_id', contactId)
    }

    const { data, error, count } = await query
      .range(offset, offset + limit - 1)

    if (error) {
      throw new Error(`Failed to fetch email threads: ${error.message}`)
    }

    // Get latest message for each thread with AI classification
    const threadsWithMessages = await Promise.all(
      (data || []).map(async (thread) => {
        const { data: latestMessage } = await supabase
          .from('inbox_messages')
          .select(`
            *,
            message_classifications(
              intent,
              sentiment,
              confidence,
              priority,
              requires_human_attention
            )
          `)
          .eq('thread_id', thread.thread_id)
          .order('received_at', { ascending: false })
          .limit(1)
          .single()

        return {
          ...thread,
          latest_message: latestMessage
        }
      })
    )

    return {
      threads: threadsWithMessages,
      total: count || 0,
      hasMore: (count || 0) > offset + limit
    }
  }

  // *** Get AI classification analytics ***
  static async getClassificationAnalytics(
    organizationId: string,
    timeframe: 'day' | 'week' | 'month' = 'week'
  ): Promise<{
    totalMessages: number
    intentBreakdown: Record<string, number>
    sentimentBreakdown: Record<string, number>
    priorityBreakdown: Record<string, number>
    averageConfidence: number
    requiresAttentionCount: number
    processingTimeAvg: number
  }> {
    
    const now = new Date()
    let startDate = new Date()
    
    switch (timeframe) {
      case 'day':
        startDate.setDate(now.getDate() - 1)
        break
      case 'week':
        startDate.setDate(now.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(now.getMonth() - 1)
        break
    }

    try {
      const { data: messages } = await supabase
        .from('inbox_messages')
        .select(`
          id,
          message_classifications(
            intent,
            sentiment,
            confidence,
            priority,
            requires_human_attention,
            processing_time_ms
          )
        `)
        .eq('organization_id', organizationId)
        .gte('received_at', startDate.toISOString())
        .not('message_classifications', 'is', null)

      if (!messages) {
        return {
          totalMessages: 0,
          intentBreakdown: {},
          sentimentBreakdown: {},
          priorityBreakdown: {},
          averageConfidence: 0,
          requiresAttentionCount: 0,
          processingTimeAvg: 0
        }
      }

      const classifications = messages
        .map(m => m.message_classifications)
        .filter(Boolean)
        .flat()

      const intentBreakdown: Record<string, number> = {}
      const sentimentBreakdown: Record<string, number> = {}
      const priorityBreakdown: Record<string, number> = {}
      let totalConfidence = 0
      let requiresAttentionCount = 0
      let totalProcessingTime = 0

      classifications.forEach(classification => {
        // Intent breakdown
        intentBreakdown[classification.intent] = (intentBreakdown[classification.intent] || 0) + 1
        
        // Sentiment breakdown
        sentimentBreakdown[classification.sentiment] = (sentimentBreakdown[classification.sentiment] || 0) + 1
        
        // Priority breakdown
        priorityBreakdown[classification.priority] = (priorityBreakdown[classification.priority] || 0) + 1
        
        // Confidence and attention metrics
        totalConfidence += classification.confidence || 0 
        if (classification.requires_human_attention) {
          requiresAttentionCount++
        }
        
        // Processing time
        totalProcessingTime += classification.processing_time_ms || 0
      })

      return {
        totalMessages: classifications.length,
        intentBreakdown,
        sentimentBreakdown,
        priorityBreakdown,
        averageConfidence: classifications.length > 0 ? totalConfidence / classifications.length : 0,
        requiresAttentionCount,
        processingTimeAvg: classifications.length > 0 ? totalProcessingTime / classifications.length : 0
      }
      
    } catch (error) {
      console.error('Failed to get classification analytics:', error)
      throw new Error('Failed to get classification analytics')
    }
  }

  // *** Reclassify existing messages ***
  static async reclassifyMessage(
    messageId: string,
    organizationId: string
  ): Promise<void> {
    try {
      // Get the message
      const { data: message } = await supabase
        .from('inbox_messages')
        .select('*')
        .eq('id', messageId)
        .eq('organization_id', organizationId)
        .single()

      if (!message) {
        throw new Error('Message not found')
      }

      // Get campaign context if available
      let campaignContext = undefined
      if (message.campaign_id) {
        const { data: campaign } = await supabase
          .from('campaigns')
          .select('name, type, content')
          .eq('id', message.campaign_id)
          .single()

        if (campaign) {
          campaignContext = {
            campaignName: campaign.name,
            campaignType: campaign.type || 'email',
            originalMessage: campaign.content || ''
          }
        }
      }

      // Reclassify with AI
      const aiClassification = await ReplyClassifierService.classifyReply(
        message.content,
        message.subject,
        message.from_email,
        campaignContext
      )

      // Update message with new classification
      await supabase
        .from('inbox_messages')
        .update({
          classification: aiClassification.intent,
          sentiment_score: aiClassification.sentiment === 'positive' ? 0.8 : 
                          aiClassification.sentiment === 'negative' ? 0.2 : 0.5,
          tags: aiClassification.tags
        })
        .eq('id', messageId)

      // Update detailed classification
      await supabase
        .from('message_classifications')
        .upsert({
          message_id: messageId,
          intent: aiClassification.intent,
          sentiment: aiClassification.sentiment,
          confidence: aiClassification.confidence,
          reasoning: aiClassification.reasoning,
          suggested_response: aiClassification.suggested_response,
          priority: aiClassification.priority,
          tags: aiClassification.tags,
          requires_human_attention: aiClassification.requires_human_attention,
          next_action: aiClassification.next_action,
          ai_model: 'gpt-4o-mini'
        })

      // Apply classification rules
      await ReplyClassifierService.applyClassificationRules(
        messageId,
        aiClassification,
        organizationId
      )

      // *** NEW: Trigger CRM sync for reclassified messages if needed ***
      if (message.contact_id) {
        const shouldSync = [
          'interested',
          'question',
          'objection'
        ].includes(aiClassification.intent) || aiClassification.requires_human_attention

        if (shouldSync) {
          // Get contact details for sync
          const { data: contact } = await supabase
            .from('contacts')
            .select('*')
            .eq('id', message.contact_id)
            .single()

          if (contact) { 
            const syncData = {
              contactId: contact.id,
              messageId: messageId,
              email: contact.email,
              firstName: contact.first_name,
              lastName: contact.last_name,
              company: contact.company,
              phone: contact.phone,
              intent: aiClassification.intent,
              sentiment: aiClassification.sentiment,
              priority: aiClassification.priority,
              requiresAttention: aiClassification.requires_human_attention,
              nextAction: aiClassification.next_action
            }

            // Trigger async CRM sync
            CRMSyncManager.autoSyncContact(organizationId, syncData)
              .catch(error => {
                console.error('CRM sync after reclassification failed:', error)
              })
          }
        }
      }

    } catch (error) {
      console.error('Failed to reclassify message:', error)
      throw error
    }
  }
}