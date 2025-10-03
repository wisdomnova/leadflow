// lib/integrations/salesforce.ts
import jsforce, { Connection } from 'jsforce'
import { supabase } from '@/lib/supabase'
import CryptoJS from 'crypto-js'

export interface SalesforceContact {
  Id?: string
  Email: string
  FirstName?: string
  LastName?: string
  Company?: string
  Phone?: string
  Title?: string
  LeadSource?: string
  Status?: string
}

export interface SalesforceOpportunity {
  Id?: string
  Name: string
  Amount?: number
  StageName: string
  CloseDate: string
  LeadSource?: string
  Type?: string
  ContactId?: string
  AccountId?: string
}

export class SalesforceIntegrationService {
  private conn: Connection
  private integrationId: string
  private organizationId: string

  constructor(credentials: any, integrationId: string, organizationId: string) {
    this.conn = new jsforce.Connection({
      oauth2: {
        clientId: process.env.SALESFORCE_CLIENT_ID!,
        clientSecret: process.env.SALESFORCE_CLIENT_SECRET!,
        redirectUri: process.env.SALESFORCE_REDIRECT_URI!
      },
      instanceUrl: credentials.instance_url,
      accessToken: credentials.access_token,
      refreshToken: credentials.refresh_token
    })
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
    const clientId = process.env.SALESFORCE_CLIENT_ID!
    const redirectUri = process.env.SALESFORCE_REDIRECT_URI!
    const state = Buffer.from(JSON.stringify({ organizationId })).toString('base64')
    
    return `https://login.salesforce.com/services/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=full&state=${state}`
  }

  // Exchange authorization code for access token
  static async exchangeCodeForToken(code: string, organizationId: string): Promise<any> {
    const clientId = process.env.SALESFORCE_CLIENT_ID!
    const clientSecret = process.env.SALESFORCE_CLIENT_SECRET!
    const redirectUri = process.env.SALESFORCE_REDIRECT_URI!

    const response = await fetch('https://login.salesforce.com/services/oauth2/token', {
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
      throw new Error(`Salesforce token exchange failed: ${error}`)
    }

    return response.json()
  }

  // Test connection
  async testConnection(): Promise<boolean> {
    try {
      await this.conn.identity()
      return true
    } catch (error) {
      console.error('Salesforce connection test failed:', error)
      return false
    }
  }

  // Sync contact to Salesforce
  async syncContact(contactData: {
    email: string
    firstName?: string
    lastName?: string
    company?: string
    phone?: string
    leadSource?: string
    leadStatus?: string
  }): Promise<{
    contactId?: string
    leadId?: string
    accountId?: string
    isNew: boolean
  }> {
    try {
      // Check if contact exists
      const existingContacts = await this.conn.sobject('Contact')
        .find({ Email: contactData.email })
        .limit(1)

      let contactId: string | undefined
      let accountId: string | undefined
      let isNew = false

      if (existingContacts.length > 0) {
        // Update existing contact
        contactId = existingContacts[0].Id
        if (contactId) {
          await this.conn.sobject('Contact').update({
            Id: contactId,
            FirstName: contactData.firstName || existingContacts[0].FirstName,
            LastName: contactData.lastName || existingContacts[0].LastName,
            Phone: contactData.phone || existingContacts[0].Phone,
            LeadSource: contactData.leadSource || 'Email Campaign'
          })
        }
        accountId = existingContacts[0].AccountId
      } else {
        // Create new lead first (Salesforce best practice)
        const leadResult = await this.conn.sobject('Lead').create({
          Email: contactData.email,
          FirstName: contactData.firstName || '',
          LastName: contactData.lastName || 'Unknown',
          Company: contactData.company || 'Unknown',
          Phone: contactData.phone || '',
          LeadSource: contactData.leadSource || 'Email Campaign',
          Status: contactData.leadStatus || 'Open - Not Contacted'
        })

        isNew = true
        return {
          leadId: leadResult.id,
          isNew
        }
      }

      await this.logSyncActivity({
        activity_type: 'sync_contact',
        status: 'success',
        title: `Synced contact: ${contactData.email}`,
        description: isNew ? 'Created new lead' : 'Updated existing contact',
        external_id: contactId || '',
        request_data: contactData
      })

      return {
        contactId,
        accountId,
        isNew
      }

    } catch (error) {
      console.error('Failed to sync contact to Salesforce:', error)
      
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

  // Create opportunity for interested contacts
  async createOpportunity(opportunityData: {
    contactId?: string
    leadId?: string
    accountId?: string
    name: string
    amount?: number
    stage?: string
    closeDate?: string
    source?: string
  }): Promise<string> {
    try {
      const oppResult = await this.conn.sobject('Opportunity').create({
        Name: opportunityData.name,
        Amount: opportunityData.amount || 1000,
        StageName: opportunityData.stage || 'Prospecting',
        CloseDate: opportunityData.closeDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        LeadSource: opportunityData.source || 'Email Campaign',
        Type: 'New Customer',
        AccountId: opportunityData.accountId
      })

      await this.logSyncActivity({
        activity_type: 'sync_opportunity',
        status: 'success',
        title: `Created opportunity: ${opportunityData.name}`,
        description: `Opportunity created for ${opportunityData.contactId || opportunityData.leadId}`,
        external_id: oppResult.id,
        request_data: opportunityData
      })

      if (!oppResult.id) {
        throw new Error('Failed to create opportunity: No ID returned from Salesforce')
      }

      return oppResult.id

    } catch (error) {
      console.error('Failed to create opportunity in Salesforce:', error)
      
      await this.logSyncActivity({
        activity_type: 'sync_opportunity',
        status: 'error',
        title: `Failed to create opportunity: ${opportunityData.name}`,
        description: error instanceof Error ? error.message : 'Unknown error',
        request_data: opportunityData,
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
        instance_url: tokenData.instance_url,
        id: tokenData.id,
        token_type: tokenData.token_type,
        signature: tokenData.signature,
        issued_at: tokenData.issued_at
      }))

      const { data: provider } = await supabase
        .from('integration_providers')
        .select('id')
        .eq('name', 'salesforce')
        .single()

      if (!provider) {
        throw new Error('Salesforce provider not found')
      }

      const { data: integration, error } = await supabase
        .from('user_integrations')
        .upsert({
          organization_id: organizationId,
          provider_id: provider.id,
          name: `Salesforce (${tokenData.instance_url})`,
          status: 'connected',
          credentials: encryptedCredentials,
          sync_settings: {
            auto_sync_contacts: true,
            auto_create_opportunities: true,
            sync_frequency: 'realtime',
            default_lead_status: 'Open - Not Contacted',
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
      console.error('Failed to save Salesforce integration:', error)
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