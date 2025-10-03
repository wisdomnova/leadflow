// lib/integrations/pipedrive.ts
import { supabase } from '@/lib/supabase'
import CryptoJS from 'crypto-js'

export interface PipedriveContact {
  id?: number
  name: string
  email: Array<{ value: string; primary: boolean }>
  phone: Array<{ value: string; primary: boolean }>
  org_id?: number
  owner_id?: number
  label?: number
}

export interface PipedriveDeal {
  id?: number
  title: string
  value?: number
  currency?: string
  stage_id: number
  person_id: number
  org_id?: number
  status?: string
  expected_close_date?: string
  add_time?: string
}

export class PipedriveIntegrationService {
  private apiToken: string
  private companyDomain: string
  private integrationId: string
  private organizationId: string

  constructor(credentials: any, integrationId: string, organizationId: string) {
    this.apiToken = credentials.access_token
    this.companyDomain = credentials.company_domain
    this.integrationId = integrationId
    this.organizationId = organizationId
  }

  // Encrypt sensitive data
  private static encrypt(data: string): string {
    const key = process.env.INTEGRATION_ENCRYPTION_KEY!
    return CryptoJS.AES.encrypt(data, key).toString()
  }

  // OAuth Authorization URL
  static getAuthorizationUrl(organizationId: string): string {
    const clientId = process.env.PIPEDRIVE_CLIENT_ID!
    const redirectUri = process.env.PIPEDRIVE_REDIRECT_URI!
    const state = Buffer.from(JSON.stringify({ organizationId })).toString('base64')
    
    return `https://oauth.pipedrive.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&state=${state}`
  }

  // Exchange authorization code for access token
  static async exchangeCodeForToken(code: string, organizationId: string): Promise<any> {
    const clientId = process.env.PIPEDRIVE_CLIENT_ID!
    const clientSecret = process.env.PIPEDRIVE_CLIENT_SECRET!
    const redirectUri = process.env.PIPEDRIVE_REDIRECT_URI!

    const response = await fetch('https://oauth.pipedrive.com/oauth/token', {
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
      throw new Error(`Pipedrive token exchange failed: ${error}`)
    }

    return response.json()
  }

  // Test connection
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`https://${this.companyDomain}.pipedrive.com/api/v1/users/me?api_token=${this.apiToken}`)
      return response.ok
    } catch (error) {
      console.error('Pipedrive connection test failed:', error)
      return false
    }
  }

  // Sync contact to Pipedrive
  async syncContact(contactData: {
    email: string
    firstName?: string
    lastName?: string
    company?: string
    phone?: string
    leadSource?: string
  }): Promise<{
    personId: string
    orgId?: string
    isNew: boolean
  }> {
    try {
      const fullName = `${contactData.firstName || ''} ${contactData.lastName || ''}`.trim() || contactData.email

      // Check if person exists
      const searchResponse = await fetch(
        `https://${this.companyDomain}.pipedrive.com/api/v1/persons/search?term=${encodeURIComponent(contactData.email)}&api_token=${this.apiToken}`
      )

      let personId: string
      let orgId: string | undefined
      let isNew = false

      const searchData = await searchResponse.json()
      
      if (searchData.success && searchData.data?.items && searchData.data.items.length > 0) {
        // Update existing person
        personId = searchData.data.items[0].item.id.toString()
        
        await fetch(`https://${this.companyDomain}.pipedrive.com/api/v1/persons/${personId}?api_token=${this.apiToken}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: fullName,
            email: [{ value: contactData.email, primary: true }],
            phone: contactData.phone ? [{ value: contactData.phone, primary: true }] : undefined
          })
        })
      } else {
        // Create organization if company provided
        if (contactData.company) {
          const orgResponse = await fetch(`https://${this.companyDomain}.pipedrive.com/api/v1/organizations?api_token=${this.apiToken}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: contactData.company
            })
          })
          
          const orgData = await orgResponse.json()
          if (orgData.success) {
            orgId = orgData.data.id.toString()
          }
        }

        // Create new person
        const createResponse = await fetch(`https://${this.companyDomain}.pipedrive.com/api/v1/persons?api_token=${this.apiToken}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: fullName,
            email: [{ value: contactData.email, primary: true }],
            phone: contactData.phone ? [{ value: contactData.phone, primary: true }] : undefined,
            org_id: orgId ? parseInt(orgId) : undefined
          })
        })

        const createData = await createResponse.json()
        if (createData.success) {
          personId = createData.data.id.toString()
          isNew = true
        } else {
          throw new Error('Failed to create person in Pipedrive')
        }
      }

      await this.logSyncActivity({
        activity_type: 'sync_contact',
        status: 'success',
        title: `Synced contact: ${contactData.email}`,
        description: isNew ? 'Created new person' : 'Updated existing person',
        external_id: personId,
        request_data: contactData
      })

      return {
        personId,
        orgId,
        isNew
      }

    } catch (error) {
      console.error('Failed to sync contact to Pipedrive:', error)
      
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

  // Create deal for interested contacts
  async createDeal(dealData: {
    personId: string
    orgId?: string
    title: string
    value?: number
    stageId?: number
    expectedCloseDate?: string
  }): Promise<string> {
    try {
      // Get default pipeline and stage if not provided
      let stageId = dealData.stageId
      if (!stageId) {
        const pipelinesResponse = await fetch(`https://${this.companyDomain}.pipedrive.com/api/v1/pipelines?api_token=${this.apiToken}`)
        const pipelinesData = await pipelinesResponse.json()
        
        if (pipelinesData.success && pipelinesData.data.length > 0) {
          // Use first stage of first pipeline
          const firstPipeline = pipelinesData.data[0]
          const stagesResponse = await fetch(`https://${this.companyDomain}.pipedrive.com/api/v1/stages?pipeline_id=${firstPipeline.id}&api_token=${this.apiToken}`)
          const stagesData = await stagesResponse.json()
          
          if (stagesData.success && stagesData.data.length > 0) {
            stageId = stagesData.data[0].id
          }
        }
      }

      const createResponse = await fetch(`https://${this.companyDomain}.pipedrive.com/api/v1/deals?api_token=${this.apiToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: dealData.title,
          value: dealData.value || 1000,
          currency: 'USD',
          person_id: parseInt(dealData.personId),
          org_id: dealData.orgId ? parseInt(dealData.orgId) : undefined,
          stage_id: stageId,
          expected_close_date: dealData.expectedCloseDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        })
      })

      const createData = await createResponse.json()
      
      if (createData.success) {
        const dealId = createData.data.id.toString()

        await this.logSyncActivity({
          activity_type: 'sync_deal',
          status: 'success',
          title: `Created deal: ${dealData.title}`,
          description: `Deal created for person ${dealData.personId}`,
          external_id: dealId,
          request_data: dealData
        })

        return dealId
      } else {
        throw new Error('Failed to create deal in Pipedrive')
      }

    } catch (error) {
      console.error('Failed to create deal in Pipedrive:', error)
      
      await this.logSyncActivity({
        activity_type: 'sync_deal',
        status: 'error',
        title: `Failed to create deal: ${dealData.title}`,
        description: error instanceof Error ? error.message : 'Unknown error',
        request_data: dealData,
        error_details: { error: error instanceof Error ? error.message : 'Unknown error' }
      })
      
      throw error
    }
  }

  // Save integration
  static async saveIntegration(organizationId: string, tokenData: any): Promise<string> {
    try {
      const encryptedCredentials = this.encrypt(JSON.stringify({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        api_domain: tokenData.api_domain,
        company_id: tokenData.company_id,
        company_name: tokenData.company_name,
        company_domain: tokenData.company_domain
      }))

      const { data: provider } = await supabase
        .from('integration_providers')
        .select('id')
        .eq('name', 'pipedrive')
        .single()

      if (!provider) {
        throw new Error('Pipedrive provider not found')
      }

      const { data: integration, error } = await supabase
        .from('user_integrations')
        .upsert({
          organization_id: organizationId,
          provider_id: provider.id,
          name: `Pipedrive (${tokenData.company_name})`,
          status: 'connected',
          credentials: encryptedCredentials,
          sync_settings: {
            auto_sync_contacts: true,
            auto_create_deals: true,
            sync_frequency: 'realtime',
            default_pipeline: 'default',
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
      console.error('Failed to save Pipedrive integration:', error)
      throw error
    }
  }

  // Log sync activity
  private async logSyncActivity(activity: any): Promise<void> {
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
}