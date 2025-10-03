// lib/integrations/hubspot.ts
import { Client } from '@hubspot/api-client'
import { FilterOperatorEnum } from '@hubspot/api-client/lib/codegen/crm/contacts'
import { supabase } from '@/lib/supabase'
import CryptoJS from 'crypto-js'

export interface HubSpotContact {
  id?: string
  email: string
  firstname?: string
  lastname?: string
  company?: string
  phone?: string
  website?: string
  jobtitle?: string 
  industry?: string
  lifecyclestage?: string
  lead_status?: string
  hs_lead_status?: string
}

export interface HubSpotDeal {
  id?: string
  dealname: string
  amount?: number
  dealstage: string
  pipeline: string
  closedate?: string
  hubspot_owner_id?: string
  dealtype?: string
  lead_source?: string
}

export interface HubSpotCompany {
  id?: string
  name: string
  domain?: string
  industry?: string
  phone?: string
  city?: string
  state?: string
  country?: string
  numberofemployees?: number
}

export class HubSpotIntegrationService {
  private client: Client
  private integrationId: string
  private organizationId: string

  constructor(accessToken: string, integrationId: string, organizationId: string) {
    this.client = new Client({ accessToken })
    this.integrationId = integrationId
    this.organizationId = organizationId
  }

  // Encrypt sensitive data
  private static encrypt(data: string): string {
    const key = process.env.INTEGRATION_ENCRYPTION_KEY!
    return CryptoJS.AES.encrypt(data, key).toString()
  }

  // Decrypt sensitive data
  private static decrypt(encryptedData: string): string {
    const key = process.env.INTEGRATION_ENCRYPTION_KEY!
    const bytes = CryptoJS.AES.decrypt(encryptedData, key)
    return bytes.toString(CryptoJS.enc.Utf8)
  }

  // OAuth Authorization URL
  static getAuthorizationUrl(organizationId: string): string {
    const clientId = process.env.HUBSPOT_CLIENT_ID!
    const redirectUri = process.env.HUBSPOT_REDIRECT_URI!
    const scopes = [
      'contacts',
      'content',
      'crm.objects.deals.read',
      'crm.objects.deals.write',
      'crm.objects.contacts.read',
      'crm.objects.contacts.write',
      'crm.objects.companies.read',
      'crm.objects.companies.write'
    ].join(' ')
    
    const state = Buffer.from(JSON.stringify({ organizationId })).toString('base64')
    
    return `https://app.hubspot.com/oauth/authorize?client_id=${clientId}&scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`
  }

  // Exchange authorization code for access token
  static async exchangeCodeForToken(code: string, organizationId: string): Promise<{
    access_token: string
    refresh_token: string
    expires_in: number
    hub_domain: string
    hub_id: number
  }> {
    const clientId = process.env.HUBSPOT_CLIENT_ID!
    const clientSecret = process.env.HUBSPOT_CLIENT_SECRET!
    const redirectUri = process.env.HUBSPOT_REDIRECT_URI!

    const response = await fetch('https://api.hubapi.com/oauth/v1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code: code,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`HubSpot token exchange failed: ${error}`)
    }

    return response.json()
  }

  // Refresh access token
  static async refreshAccessToken(refreshToken: string): Promise<{
    access_token: string
    refresh_token: string
    expires_in: number
  }> {
    const clientId = process.env.HUBSPOT_CLIENT_ID!
    const clientSecret = process.env.HUBSPOT_CLIENT_SECRET!

    const response = await fetch('https://api.hubapi.com/oauth/v1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`HubSpot token refresh failed: ${error}`)
    }

    return response.json()
  }

  // Create or update integration record
  static async saveIntegration(organizationId: string, tokenData: any): Promise<string> {
    try {
      // Encrypt sensitive credentials
      const encryptedCredentials = this.encrypt(JSON.stringify({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_in: tokenData.expires_in,
        expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
        hub_domain: tokenData.hub_domain,
        hub_id: tokenData.hub_id
      }))

      // Get HubSpot provider ID
      const { data: provider } = await supabase
        .from('integration_providers')
        .select('id')
        .eq('name', 'hubspot')
        .single()

      if (!provider) {
        throw new Error('HubSpot provider not found')
      }

      // Upsert integration
      const { data: integration, error } = await supabase
        .from('user_integrations')
        .upsert({
          organization_id: organizationId,
          provider_id: provider.id,
          name: `HubSpot (${tokenData.hub_domain})`,
          status: 'connected',
          credentials: encryptedCredentials,
          sync_settings: {
            auto_sync_contacts: true,
            auto_create_deals: true,
            sync_frequency: 'realtime',
            deal_pipeline: 'default',
            deal_stage: 'appointmentscheduled',
            lead_source: 'Email Campaign'
          },
          last_sync_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to save integration: ${error.message}`)
      }

      return integration.id
    } catch (error) {
      console.error('Failed to save HubSpot integration:', error)
      throw error
    }
  }

  // Get integration by organization ID
  static async getIntegration(organizationId: string): Promise<any | null> {
    try {
      const { data: provider } = await supabase
        .from('integration_providers')
        .select('id')
        .eq('name', 'hubspot')
        .single()

      if (!provider) return null

      const { data: integration } = await supabase
        .from('user_integrations')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('provider_id', provider.id)
        .eq('status', 'connected')
        .single()

      if (!integration) return null

      // Decrypt credentials
      const credentials = JSON.parse(this.decrypt(integration.credentials))
      
      return {
        ...integration,
        credentials
      }
    } catch (error) {
      console.error('Failed to get HubSpot integration:', error)
      return null
    }
  }

  // Test connection
  async testConnection(): Promise<boolean> {
    try {
      await this.client.crm.contacts.basicApi.getPage()
      return true
    } catch (error) {
      console.error('HubSpot connection test failed:', error)
      return false
    }
  }

  // Sync contact to HubSpot
  async syncContact(contactData: {
    email: string
    firstName?: string
    lastName?: string
    company?: string
    phone?: string
    leadSource?: string
    leadStatus?: string
    messageId?: string
  }): Promise<{
    contactId: string
    companyId?: string
    isNew: boolean
  }> {
    try {
      // Check if contact already exists
      let existingContact = null
      try {
        const searchResult = await this.client.crm.contacts.searchApi.doSearch({
          filterGroups: [{
            filters: [{
              propertyName: 'email',
              operator: FilterOperatorEnum.Eq,
              value: contactData.email
            }]
          }],
          properties: ['email', 'firstname', 'lastname', 'company', 'hs_object_id'],
          limit: 1
        })
        
        if (searchResult.results && searchResult.results.length > 0) {
          existingContact = searchResult.results[0]
        }
      } catch (searchError) {
        console.log('Contact search failed, will create new:', searchError)
      }

      let contactId: string
      let isNew = false

      if (existingContact) {
        // Update existing contact
        contactId = existingContact.id!
        await this.client.crm.contacts.basicApi.update(contactId, {
          properties: {
            firstname: contactData.firstName || existingContact.properties?.firstname || '',
            lastname: contactData.lastName || existingContact.properties?.lastname || '',
            company: contactData.company || existingContact.properties?.company || '',
            phone: contactData.phone || existingContact.properties?.phone || '',
            hs_lead_status: contactData.leadStatus || 'NEW',
            lead_source: contactData.leadSource || 'Email Campaign'
          }
        })
      } else {
        // Create new contact
        const createResult = await this.client.crm.contacts.basicApi.create({
          properties: {
            email: contactData.email,
            firstname: contactData.firstName || '',
            lastname: contactData.lastName || '',
            company: contactData.company || '',
            phone: contactData.phone || '',
            hs_lead_status: contactData.leadStatus || 'NEW',
            lead_source: contactData.leadSource || 'Email Campaign',
            lifecyclestage: 'lead'
          }
        })
        contactId = createResult.id!
        isNew = true
      }

      // Handle company creation/association
      let companyId: string | undefined
      if (contactData.company) {
        companyId = await this.createOrUpdateCompany(contactData.company, contactId)
      }

      // Log the sync activity
      await this.logSyncActivity({
        activity_type: 'sync_contact',
        status: 'success',
        title: `Synced contact: ${contactData.email}`,
        description: isNew ? 'Created new contact' : 'Updated existing contact',
        external_id: contactId,
        request_data: contactData
      })

      return {
        contactId,
        companyId,
        isNew
      }

    } catch (error) {
      console.error('Failed to sync contact to HubSpot:', error)
      
      // Log error
      await this.logSyncActivity({
        activity_type: 'sync_contact',
        status: 'error',
        title: `Failed to sync contact: ${contactData.email}`,
        description: error instanceof Error ? error.message : 'Unknown error',
        request_data: contactData,
        error_details: { error: error instanceof Error ? error.message : 'Unknown error' }
      })
      
      throw error
    }
  }

  // Create or update company
  private async createOrUpdateCompany(companyName: string, contactId: string): Promise<string> {
    try {
      // Search for existing company
      let existingCompany = null
      try {
        const searchResult = await this.client.crm.companies.searchApi.doSearch({
          filterGroups: [{
            filters: [{
              propertyName: 'name',
              operator: FilterOperatorEnum.Eq,
              value: companyName
            }]
          }],
          properties: ['name', 'hs_object_id'],
          limit: 1
        })
        
        if (searchResult.results && searchResult.results.length > 0) {
          existingCompany = searchResult.results[0]
        }
      } catch (searchError) {
        console.log('Company search failed, will create new:', searchError)
      }

      let companyId: string

      if (existingCompany) {
        companyId = existingCompany.id!
      } else {
        // Create new company
        const createResult = await this.client.crm.companies.basicApi.create({
          properties: {
            name: companyName,
            industry: 'Unknown',
            lead_source: 'Email Campaign'
          }
        })
        companyId = createResult.id!
      }

      // Associate contact with company
      await this.client.crm.associations.v4.basicApi.create('contacts', contactId, 'companies', companyId, [
        {
          associationCategory: 'HUBSPOT_DEFINED' as any,
          associationTypeId: 1 // Contact to Company association
        }
      ])

      return companyId
    } catch (error) {
      console.error('Failed to create/update company:', error)
      throw error
    }
  }

  // Create deal for interested contacts
  async createDeal(dealData: {
    contactId: string
    dealName: string
    amount?: number
    stage?: string
    closeDate?: string
    source?: string
  }): Promise<string> {
    try {
      const createResult = await this.client.crm.deals.basicApi.create({
        properties: {
          dealname: dealData.dealName,
          amount: dealData.amount?.toString() || '0',
          dealstage: dealData.stage || 'appointmentscheduled',
          pipeline: 'default',
          closedate: dealData.closeDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
          lead_source: dealData.source || 'Email Campaign',
          dealtype: 'newbusiness'
        }
      })

      const dealId = createResult.id!

      // Associate deal with contact
      await this.client.crm.associations.v4.basicApi.create('deals', dealId, 'contacts', dealData.contactId, [
        {
          associationCategory: 'HUBSPOT_DEFINED' as any,
          associationTypeId: 3 // Deal to Contact association
        }
      ])

      await this.logSyncActivity({
        activity_type: 'sync_deal',
        status: 'success',
        title: `Created deal: ${dealData.dealName}`,
        description: `Deal created for contact ${dealData.contactId}`,
        external_id: dealId,
        request_data: dealData
      })

      return dealId

    } catch (error) {
      console.error('Failed to create deal in HubSpot:', error)
      
      await this.logSyncActivity({
        activity_type: 'sync_deal',
        status: 'error',
        title: `Failed to create deal: ${dealData.dealName}`,
        description: error instanceof Error ? error.message : 'Unknown error',
        request_data: dealData,
        error_details: { error: error instanceof Error ? error.message : 'Unknown error' }
      })
      
      throw error
    }
  }

  // Log sync activity
  private async logSyncActivity(activity: {
    activity_type: string
    status: string
    title: string
    description?: string
    external_id?: string
    contact_id?: string
    message_id?: string
    request_data?: any
    response_data?: any
    error_details?: any
    duration_ms?: number
  }): Promise<void> {
    try {
      await supabase
        .from('sync_activity_logs')
        .insert({
          organization_id: this.organizationId,
          integration_id: this.integrationId,
          ...activity,
          created_at: new Date().toISOString()
        })
    } catch (error) {
      console.error('Failed to log sync activity:', error)
    }
  }

  // Disconnect integration
  static async disconnectIntegration(organizationId: string): Promise<void> {
    try {
      const { data: provider } = await supabase
        .from('integration_providers')
        .select('id')
        .eq('name', 'hubspot')
        .single()

      if (!provider) return

      await supabase
        .from('user_integrations')
        .update({ status: 'disconnected' })
        .eq('organization_id', organizationId)
        .eq('provider_id', provider.id)

    } catch (error) {
      console.error('Failed to disconnect HubSpot integration:', error)
      throw error
    }
  }
}