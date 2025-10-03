// lib/integrations/crm-sync-manager.ts
import { HubSpotIntegrationService } from './hubspot'
import { ReplyClassifierService } from '@/lib/ai/reply-classifier'
import { supabase } from '@/lib/supabase'

export interface SyncContactData {
  contactId: string
  messageId: string
  email: string
  firstName?: string
  lastName?: string
  company?: string 
  phone?: string
  intent: string
  sentiment: string
  priority: string
  requiresAttention: boolean
  nextAction: string
}

export class CRMSyncManager {
  
  // Auto-sync contact based on AI classification
  static async autoSyncContact(
    organizationId: string,
    contactData: SyncContactData
  ): Promise<void> {
    try {
      console.log(`Starting auto-sync for contact: ${contactData.email}`)

      // Get all active integrations for the organization
      const integrations = await this.getActiveIntegrations(organizationId)

      if (integrations.length === 0) {
        console.log('No active integrations found for organization:', organizationId)
        return
      }

      // Process each integration
      for (const integration of integrations) {
        try {
          await this.syncContactToIntegration(integration, contactData)
        } catch (error) {
          console.error(`Failed to sync to ${integration.integration_providers.name}:`, error)
          // Continue with other integrations even if one fails
        }
      }

    } catch (error) {
      console.error('Auto-sync failed:', error)
      throw error
    }
  }

  // Get active integrations for organization
  private static async getActiveIntegrations(organizationId: string): Promise<any[]> {
    const { data: integrations, error } = await supabase
      .from('user_integrations')
      .select(`
        *,
        integration_providers(name, display_name, auth_type, config)
      `)
      .eq('organization_id', organizationId)
      .eq('status', 'connected')

    if (error) {
      throw new Error(`Failed to get integrations: ${error.message}`)
    }

    return integrations || []
  }

  // Sync contact to specific integration
  private static async syncContactToIntegration(
    integration: any,
    contactData: SyncContactData
  ): Promise<void> {
    const providerName = integration.integration_providers.name

    switch (providerName) {
      case 'hubspot':
        await this.syncToHubSpot(integration, contactData)
        break
      case 'salesforce':
        await this.syncToSalesforce(integration, contactData)
        break
      case 'pipedrive':
        await this.syncToPipedrive(integration, contactData)
        break
      default:
        console.warn(`Unknown provider: ${providerName}`)
    }
  }

  // Sync to HubSpot
  private static async syncToHubSpot(
    integration: any,
    contactData: SyncContactData
  ): Promise<void> {
    try {
      // Decrypt credentials
      const credentials = JSON.parse(
        HubSpotIntegrationService['decrypt'](integration.credentials)
      )

      // Check if token needs refresh (within 1 hour of expiry)
      const expiresAt = new Date(credentials.expires_at)
      const now = new Date()
      const oneHour = 60 * 60 * 1000

      if (expiresAt.getTime() - now.getTime() < oneHour) {
        console.log('Refreshing HubSpot token...')
        const newTokenData = await HubSpotIntegrationService.refreshAccessToken(
          credentials.refresh_token
        )
        
        // Update stored credentials
        const updatedCredentials = {
          ...credentials,
          access_token: newTokenData.access_token,
          refresh_token: newTokenData.refresh_token,
          expires_in: newTokenData.expires_in,
          expires_at: new Date(Date.now() + newTokenData.expires_in * 1000).toISOString()
        }

        await supabase
          .from('user_integrations')
          .update({
            credentials: HubSpotIntegrationService['encrypt'](JSON.stringify(updatedCredentials))
          })
          .eq('id', integration.id)

        credentials.access_token = newTokenData.access_token
      }

      // Initialize HubSpot service
      const hubspot = new HubSpotIntegrationService(
        credentials.access_token,
        integration.id,
        integration.organization_id
      )

      // Determine lead status based on AI classification
      let leadStatus = 'NEW'
      let shouldCreateDeal = false

      switch (contactData.intent) {
        case 'interested':
          leadStatus = 'QUALIFIED'
          shouldCreateDeal = true
          break
        case 'question':
          leadStatus = 'CONTACTED'
          break
        case 'objection':
          leadStatus = 'CONTACTED'
          break
        case 'not_interested':
          leadStatus = 'UNQUALIFIED'
          break
      }

      // Sync contact
      const syncResult = await hubspot.syncContact({
        email: contactData.email,
        firstName: contactData.firstName,
        lastName: contactData.lastName,
        company: contactData.company,
        phone: contactData.phone,
        leadSource: 'Email Campaign',
        leadStatus: leadStatus,
        messageId: contactData.messageId
      })

      // Create deal for interested contacts
      if (shouldCreateDeal && syncResult.contactId) {
        const dealName = `${contactData.firstName || contactData.email} - Email Lead`
        
        await hubspot.createDeal({
          contactId: syncResult.contactId,
          dealName: dealName,
          amount: 1000, // Default deal amount
          stage: 'appointmentscheduled',
          source: 'Email Campaign'
        })
      }

      // Save sync mapping
      await this.saveSyncMapping({
        organizationId: integration.organization_id,
        integrationId: integration.id,
        contactId: contactData.contactId,
        messageId: contactData.messageId,
        externalContactId: syncResult.contactId,
        externalCompanyId: syncResult.companyId,
        syncStatus: 'synced'
      })

      console.log(`Successfully synced contact to HubSpot: ${contactData.email}`)

    } catch (error) {
      console.error('HubSpot sync failed:', error)
      throw error
    }
  }

  // Sync to Salesforce
  private static async syncToSalesforce(
    integration: any,
    contactData: SyncContactData
  ): Promise<void> {
    try {
      const { SalesforceIntegrationService } = await import('./salesforce')
      
      // Decrypt credentials
      const credentials = JSON.parse(
        SalesforceIntegrationService['decrypt'](integration.credentials)
      )

      // Initialize Salesforce service
      const salesforce = new SalesforceIntegrationService(
        credentials,
        integration.id,
        integration.organization_id
      )

      // Determine lead status based on AI classification
      let leadStatus = 'Open - Not Contacted'
      let shouldCreateOpportunity = false

      switch (contactData.intent) {
        case 'interested':
          leadStatus = 'Working - Contacted'
          shouldCreateOpportunity = true
          break
        case 'question':
          leadStatus = 'Open - Not Contacted'
          break
        case 'objection':
          leadStatus = 'Working - Contacted'
          break
        case 'not_interested':
          leadStatus = 'Closed - Not Converted'
          break
      }

      // Sync contact
      const syncResult = await salesforce.syncContact({
        email: contactData.email,
        firstName: contactData.firstName,
        lastName: contactData.lastName,
        company: contactData.company,
        phone: contactData.phone,
        leadSource: 'Email Campaign',
        leadStatus: leadStatus
      })

      // Create opportunity for interested contacts
      if (shouldCreateOpportunity && (syncResult.contactId || syncResult.leadId)) {
        const opportunityName = `${contactData.firstName || contactData.email} - Email Lead`
        
        await salesforce.createOpportunity({
          contactId: syncResult.contactId,
          leadId: syncResult.leadId,
          accountId: syncResult.accountId,
          name: opportunityName,
          amount: 1000,
          stage: 'Prospecting',
          source: 'Email Campaign'
        })
      }

      // Save sync mapping
      await this.saveSyncMapping({
        organizationId: integration.organization_id,
        integrationId: integration.id,
        contactId: contactData.contactId,
        messageId: contactData.messageId,
        externalContactId: syncResult.contactId || syncResult.leadId || '',
        syncStatus: 'synced'
      })

      console.log(`Successfully synced contact to Salesforce: ${contactData.email}`)

    } catch (error) {
      console.error('Salesforce sync failed:', error)
      
      // Log the error but don't fail the entire sync process
      await this.logSyncError({
        organizationId: integration.organization_id,
        integrationId: integration.id,
        contactId: contactData.contactId,
        provider: 'salesforce',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      throw error
    }
  }

  // Sync to Pipedrive
  private static async syncToPipedrive(
    integration: any,
    contactData: SyncContactData
  ): Promise<void> {
    try {
      const { PipedriveIntegrationService } = await import('./pipedrive')
      
      // Decrypt credentials
      const credentials = JSON.parse(integration.credentials)

      // Initialize Pipedrive service
      const pipedrive = new PipedriveIntegrationService(
        credentials,
        integration.id,
        integration.organization_id
      )

      // Sync contact
      const syncResult = await pipedrive.syncContact({
        email: contactData.email,
        firstName: contactData.firstName,
        lastName: contactData.lastName,
        company: contactData.company,
        phone: contactData.phone,
        leadSource: 'Email Campaign'
      })

      // Create deal for interested contacts
      if (contactData.intent === 'interested' && syncResult.personId) {
        const dealTitle = `${contactData.firstName || contactData.email} - Email Lead`
        
        await pipedrive.createDeal({
          personId: syncResult.personId,
          orgId: syncResult.orgId,
          title: dealTitle,
          value: 1000,
          expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        })
      }

      // Save sync mapping
      await this.saveSyncMapping({
        organizationId: integration.organization_id,
        integrationId: integration.id,
        contactId: contactData.contactId,
        messageId: contactData.messageId,
        externalContactId: syncResult.personId,
        syncStatus: 'synced'
      })

      console.log(`Successfully synced contact to Pipedrive: ${contactData.email}`)

    } catch (error) {
      console.error('Pipedrive sync failed:', error)
      
      // Log the error but don't fail the entire sync process
      await this.logSyncError({
        organizationId: integration.organization_id,
        integrationId: integration.id,
        contactId: contactData.contactId,
        provider: 'pipedrive',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      throw error
    }
  }

  // Save sync mapping
  private static async saveSyncMapping(mappingData: {
    organizationId: string
    integrationId: string
    contactId: string
    messageId: string
    externalContactId: string
    externalCompanyId?: string
    externalDealId?: string
    syncStatus: string
  }): Promise<void> {
    try {
      await supabase
        .from('contact_sync_mappings')
        .upsert({
          organization_id: mappingData.organizationId,
          integration_id: mappingData.integrationId,
          contact_id: mappingData.contactId,
          message_id: mappingData.messageId,
          external_contact_id: mappingData.externalContactId,
          external_company_id: mappingData.externalCompanyId,
          external_deal_id: mappingData.externalDealId,
          sync_status: mappingData.syncStatus,
          last_synced_at: new Date().toISOString()
        }, {
          onConflict: 'integration_id,external_contact_id'
        })
    } catch (error) {
      console.error('Failed to save sync mapping:', error)
    }
  }

  // Log sync errors
  private static async logSyncError(errorData: {
    organizationId: string
    integrationId: string
    contactId: string
    provider: string
    error: string
  }): Promise<void> {
    try {
      await supabase
        .from('sync_activity_logs')
        .insert({
          organization_id: errorData.organizationId,
          integration_id: errorData.integrationId,
          activity_type: 'sync_contact',
          status: 'error',
          title: `Failed to sync contact to ${errorData.provider}`,
          description: errorData.error,
          error_details: {
            contact_id: errorData.contactId,
            provider: errorData.provider,
            error: errorData.error
          },
          created_at: new Date().toISOString()
        })
    } catch (error) {
      console.error('Failed to log sync error:', error)
    }
  }

  // Get sync status for contact
  static async getSyncStatus(
    organizationId: string,
    contactId: string
  ): Promise<{
    integrations: Array<{
      provider: string
      status: string
      externalId?: string
      lastSynced?: string
    }>
  }> {
    try {
      const { data: mappings } = await supabase
        .from('contact_sync_mappings')
        .select(`
          *,
          user_integrations!inner(
            status,
            integration_providers!inner(name, display_name)
          )
        `)
        .eq('organization_id', organizationId)
        .eq('contact_id', contactId)

      const integrations = (mappings || []).map(mapping => ({
        provider: mapping.user_integrations.integration_providers.display_name,
        status: mapping.sync_status,
        externalId: mapping.external_contact_id,
        lastSynced: mapping.last_synced_at
      }))

      return { integrations }

    } catch (error) {
      console.error('Failed to get sync status:', error)
      return { integrations: [] }
    }
  }

  // Manual sync trigger
  static async manualSync(
    organizationId: string,
    contactIds: string[]
  ): Promise<{
    success: number
    failed: number
    errors: string[]
  }> {
    let success = 0
    let failed = 0
    const errors: string[] = []

    for (const contactId of contactIds) {
      try {
        // Get contact details
        const { data: contact } = await supabase
          .from('contacts')
          .select('*')
          .eq('id', contactId)
          .eq('organization_id', organizationId)
          .single()

        if (!contact) {
          errors.push(`Contact not found: ${contactId}`)
          failed++
          continue
        }

        // Get latest message classification for context
        const { data: latestMessage } = await supabase
          .from('inbox_messages')
          .select(`
            *,
            message_classifications(*)
          `)
          .eq('contact_id', contactId)
          .order('received_at', { ascending: false })
          .limit(1)
          .single()

        const classification = latestMessage?.message_classifications

        // Build sync data
        const syncData: SyncContactData = {
          contactId: contact.id,
          messageId: latestMessage?.id || '',
          email: contact.email,
          firstName: contact.first_name,
          lastName: contact.last_name,
          company: contact.company,
          phone: contact.phone,
          intent: classification?.intent || 'neutral',
          sentiment: classification?.sentiment || 'neutral',
          priority: classification?.priority || 'medium',
          requiresAttention: classification?.requires_human_attention || false,
          nextAction: classification?.next_action || 'no_action'
        }

        await this.autoSyncContact(organizationId, syncData)
        success++

      } catch (error) {
        console.error(`Failed to sync contact ${contactId}:`, error)
        errors.push(`${contactId}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        failed++
      }
    }

    return { success, failed, errors }
  }

  // Bulk sync all qualified contacts
  static async bulkSyncQualifiedContacts(
    organizationId: string,
    timeframe: 'day' | 'week' | 'month' = 'week'
  ): Promise<{
    processed: number
    synced: number
    skipped: number
    errors: string[]
  }> {
    try {
      // Calculate date range
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

      // Get qualified contacts (those with interested/question/objection intent)
      const { data: qualifiedMessages } = await supabase
        .from('inbox_messages')
        .select(`
          contact_id,
          contacts!inner(id, email, first_name, last_name, company, phone),
          message_classifications!inner(intent, sentiment, priority, requires_human_attention, next_action)
        `)
        .eq('organization_id', organizationId)
        .gte('received_at', startDate.toISOString())
        .in('message_classifications.intent', ['interested', 'question', 'objection'])
        .not('contact_id', 'is', null)

      if (!qualifiedMessages || qualifiedMessages.length === 0) {
        return {
          processed: 0,
          synced: 0,
          skipped: 0,
          errors: []
        }
      }

      // Remove duplicates by contact ID
      const uniqueContacts = qualifiedMessages.reduce((acc, message) => {
        const contactId = message.contact_id
        if (contactId && !acc.has(contactId)) {
          acc.set(contactId, {
            contact: message.contacts,
            classification: message.message_classifications
          })
        }
        return acc
      }, new Map())

      let synced = 0
      let skipped = 0
      const errors: string[] = []

      // Process each unique contact
      for (const [contactId, data] of uniqueContacts) {
        try {
          // Check if already synced recently (within last 24 hours)
          const { data: recentSync } = await supabase
            .from('contact_sync_mappings')
            .select('last_synced_at')
            .eq('contact_id', contactId)
            .gte('last_synced_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
            .limit(1)

          if (recentSync && recentSync.length > 0) {
            skipped++
            continue
          }

          const contact = data.contact
          const classification = data.classification

          const syncData: SyncContactData = {
            contactId: contactId,
            messageId: '', // Not specific to one message for bulk sync
            email: contact.email,
            firstName: contact.first_name,
            lastName: contact.last_name,
            company: contact.company,
            phone: contact.phone,
            intent: classification.intent,
            sentiment: classification.sentiment,
            priority: classification.priority,
            requiresAttention: classification.requires_human_attention,
            nextAction: classification.next_action
          }

          await this.autoSyncContact(organizationId, syncData)
          synced++

        } catch (error) {
          console.error(`Bulk sync failed for contact ${contactId}:`, error)
          errors.push(`${contactId}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }

      return {
        processed: uniqueContacts.size,
        synced,
        skipped,
        errors
      }

    } catch (error) {
      console.error('Bulk sync failed:', error)
      throw error
    }
  }

  // Get sync analytics
  static async getSyncAnalytics(
    organizationId: string,
    timeframe: 'day' | 'week' | 'month' = 'week'
  ): Promise<{
    totalSynced: number
    successRate: number
    integrationBreakdown: Record<string, number>
    intentBreakdown: Record<string, number>
    recentActivity: Array<{
      date: string
      synced: number
      failed: number
    }>
  }> {
    try {
      // Calculate date range
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

      // Get sync mappings for the timeframe
      const { data: syncMappings } = await supabase
        .from('contact_sync_mappings')
        .select(`
          *,
          user_integrations!inner(
            integration_providers!inner(display_name)
          )
        `)
        .eq('organization_id', organizationId)
        .gte('last_synced_at', startDate.toISOString())

      // Get sync activity logs
      const { data: activityLogs } = await supabase
        .from('sync_activity_logs')
        .select('*')
        .eq('organization_id', organizationId)
        .gte('created_at', startDate.toISOString())

      const totalSynced = syncMappings?.length || 0
      const totalActivities = activityLogs?.length || 0
      const successfulActivities = activityLogs?.filter(log => log.status === 'success').length || 0
      const successRate = totalActivities > 0 ? (successfulActivities / totalActivities) * 100 : 0

      // Integration breakdown
      const integrationBreakdown: Record<string, number> = {}
      syncMappings?.forEach(mapping => {
        const providerName = mapping.user_integrations.integration_providers.display_name
        integrationBreakdown[providerName] = (integrationBreakdown[providerName] || 0) + 1
      })

      // Intent breakdown (need to join with message classifications)
      const intentBreakdown: Record<string, number> = {}
      if (syncMappings) {
        for (const mapping of syncMappings) {
          if (mapping.message_id) {
            const { data: classification } = await supabase
              .from('message_classifications')
              .select('intent')
              .eq('message_id', mapping.message_id)
              .single()

            if (classification) {
              const intent = classification.intent
              intentBreakdown[intent] = (intentBreakdown[intent] || 0) + 1
            }
          }
        }
      }

      // Recent activity by day
      const recentActivity: Array<{ date: string; synced: number; failed: number }> = []
      const days = timeframe === 'day' ? 1 : timeframe === 'week' ? 7 : 30
      
      for (let i = 0; i < days; i++) {
        const date = new Date(now)
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]

        const dayLogs = activityLogs?.filter(log => 
          log.created_at.startsWith(dateStr)
        ) || []

        recentActivity.unshift({
          date: dateStr,
          synced: dayLogs.filter(log => log.status === 'success').length,
          failed: dayLogs.filter(log => log.status === 'error').length
        })
      }

      return {
        totalSynced,
        successRate,
        integrationBreakdown,
        intentBreakdown,
        recentActivity
      }

    } catch (error) {
      console.error('Failed to get sync analytics:', error)
      throw error
    }
  }
}