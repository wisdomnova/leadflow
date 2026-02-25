import { SupabaseClient } from "@supabase/supabase-js";

export interface CRMIntegration {
  id: string;
  org_id: string;
  provider: 'hubspot' | 'pipedrive' | 'salesforce';
  config: {
    accessToken: string;
    refreshToken?: string;
    expiresAt?: number;
    accountName?: string;
    portalId?: string;
    instanceUrl?: string;
  };
  status: 'active' | 'error' | 'disconnected';
  last_sync?: string;
  created_at: string;
}

export class CRMService {
  constructor(private supabase: SupabaseClient) {}

  async getIntegrations(orgId: string): Promise<CRMIntegration[]> {
    const { data, error } = await this.supabase
      .from("crm_integrations")
      .select("*")
      .eq("org_id", orgId);

    if (error) {
      console.error("Error fetching CRM integrations:", error);
      return [];
    }

    return data || [];
  }

  async pushLead(orgId: string, lead: any, provider: string) {
    let integration = await this.getIntegration(orgId, provider);
    if (!integration || integration.status !== 'active') {
      throw new Error(`CRM ${provider} not connected or active`);
    }

    integration = await this.ensureValidToken(integration);
    const { accessToken } = integration.config;

    if (provider === 'hubspot') {
      return this.pushToHubSpot(accessToken, lead);
    } else if (provider === 'pipedrive') {
      return this.pushToPipedrive(accessToken, lead);
    } else if (provider === 'salesforce') {
      return this.pushToSalesforce(accessToken, lead, integration.config.instanceUrl!);
    }

    throw new Error(`Unsupported CRM provider: ${provider}`);
  }

  private async ensureValidToken(integration: CRMIntegration): Promise<CRMIntegration> {
    const { expiresAt, refreshToken } = integration.config;
    
    // If token is still valid for at least 5 minutes, return as is
    if (expiresAt && expiresAt > Date.now() + 5 * 60 * 1000) {
      return integration;
    }

    if (!refreshToken) {
      throw new Error(`No refresh token available for ${integration.provider}`);
    }

    let newData: any;

    if (integration.provider === 'hubspot') {
      const resp = await fetch("https://api.hubapi.com/oauth/v1/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          client_id: process.env.HUBSPOT_CLIENT_ID!,
          client_secret: process.env.HUBSPOT_CLIENT_SECRET!,
          refresh_token: refreshToken,
        }),
      });
      newData = await resp.json();
      if (!resp.ok) throw new Error(`HubSpot refresh failed: ${newData.message}`);
    } else if (integration.provider === 'pipedrive') {
      const resp = await fetch("https://oauth.pipedrive.com/oauth/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Authorization": `Basic ${btoa(`${process.env.PIPEDRIVE_CLIENT_ID}:${process.env.PIPEDRIVE_CLIENT_SECRET}`)}`
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: refreshToken,
        }),
      });
      newData = await resp.json();
      if (!resp.ok) throw new Error(`Pipedrive refresh failed: ${newData.error}`);
    } else if (integration.provider === 'salesforce') {
      const loginUrl = process.env.SALESFORCE_LOGIN_URL || 'https://login.salesforce.com';
      const resp = await fetch(`${loginUrl}/services/oauth2/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          client_id: process.env.SALESFORCE_CLIENT_ID!,
          client_secret: process.env.SALESFORCE_CLIENT_SECRET!,
          refresh_token: refreshToken,
        }),
      });
      newData = await resp.json();
      if (!resp.ok) throw new Error(`Salesforce refresh failed: ${newData.error_description}`);
      // Salesforce refresh doesn't return expires_in, default to 2 hours
      newData.expires_in = newData.expires_in || 7200;
    }

    const updatedConfig = {
      ...integration.config,
      accessToken: newData.access_token,
      refreshToken: newData.refresh_token || refreshToken, // Some providers don't always rotate refresh tokens
      expiresAt: Date.now() + (newData.expires_in * 1000),
    };

    const { data, error } = await (this.supabase as any)
      .from("crm_integrations")
      .update({ config: updatedConfig })
      .eq("id", integration.id)
      .select()
      .single();

    if (error) throw error;
    return data as CRMIntegration;
  }

  private async getIntegration(orgId: string, provider: string) {
    const { data, error } = await this.supabase
      .from("crm_integrations")
      .select("*")
      .eq("org_id", orgId)
      .eq("provider", provider)
      .single();

    if (error) return null;
    return data as CRMIntegration;
  }

  private async pushToHubSpot(accessToken: string, lead: any) {
    const response = await fetch("https://api.hubapi.com/crm/v3/objects/contacts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        properties: {
          email: lead.email,
          firstname: lead.first_name || "",
          lastname: lead.last_name || "",
          company: lead.company || "",
          phone: lead.phone || "",
          jobtitle: lead.job_title || ""
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`HubSpot Error: ${JSON.stringify(errorData)}`);
    }

    return response.json();
  }

  private async pushToPipedrive(accessToken: string, lead: any) {
    // Pipedrive usually uses API tokens in query params or Bearer in newer versions
    const response = await fetch("https://api.pipedrive.com/v1/persons", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: lead.name || `${lead.first_name} ${lead.last_name}`,
        email: [ { value: lead.email, primary: true } ],
        phone: [ { value: lead.phone, primary: true } ],
        org_id: lead.company ? { name: lead.company } : undefined
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Pipedrive Error: ${JSON.stringify(errorData)}`);
    }

    return response.json();
  }

  private async pushToSalesforce(accessToken: string, lead: any, instanceUrl: string) {
    const response = await fetch(`${instanceUrl}/services/data/v59.0/sobjects/Contact`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        Email: lead.email,
        FirstName: lead.first_name || "",
        LastName: lead.last_name || lead.email.split("@")[0],
        Title: lead.job_title || "",
        Phone: lead.phone || "",
        Company: lead.company || "",
        Description: `Imported from LeadFlow`
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Salesforce Error: ${JSON.stringify(errorData)}`);
    }

    return response.json();
  }

  // ========== IMPORT FROM CRM ==========

  async importFromHubSpot(orgId: string): Promise<any[]> {
    const integration = await this.getIntegration(orgId, 'hubspot');
    if (!integration || integration.status !== 'active') {
      throw new Error('HubSpot not connected');
    }
    const updated = await this.ensureValidToken(integration);
    const { accessToken } = updated.config;

    const response = await fetch("https://api.hubapi.com/crm/v3/objects/contacts?limit=100&properties=email,firstname,lastname,company,phone,jobtitle", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(`HubSpot import failed: ${JSON.stringify(err)}`);
    }

    const data = await response.json();
    return (data.results || []).map((c: any) => ({
      email: c.properties.email,
      first_name: c.properties.firstname || "",
      last_name: c.properties.lastname || "",
      company: c.properties.company || "",
      phone: c.properties.phone || "",
      job_title: c.properties.jobtitle || ""
    })).filter((c: any) => c.email);
  }

  async importFromPipedrive(orgId: string): Promise<any[]> {
    const integration = await this.getIntegration(orgId, 'pipedrive');
    if (!integration || integration.status !== 'active') {
      throw new Error('Pipedrive not connected');
    }
    const updated = await this.ensureValidToken(integration);
    const { accessToken } = updated.config;

    const response = await fetch("https://api.pipedrive.com/v1/persons?limit=100", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(`Pipedrive import failed: ${JSON.stringify(err)}`);
    }

    const data = await response.json();
    return (data.data || []).map((p: any) => ({
      email: p.email?.[0]?.value || "",
      first_name: p.first_name || p.name?.split(" ")[0] || "",
      last_name: p.last_name || p.name?.split(" ").slice(1).join(" ") || "",
      company: p.org_name || "",
      phone: p.phone?.[0]?.value || "",
      job_title: ""
    })).filter((c: any) => c.email);
  }

  async importFromSalesforce(orgId: string): Promise<any[]> {
    const integration = await this.getIntegration(orgId, 'salesforce');
    if (!integration || integration.status !== 'active') {
      throw new Error('Salesforce not connected');
    }
    const updated = await this.ensureValidToken(integration);
    const { accessToken, instanceUrl } = updated.config;

    if (!instanceUrl) throw new Error('Salesforce instance URL missing');

    const query = encodeURIComponent("SELECT Email, FirstName, LastName, Title, Phone, Account.Name FROM Contact WHERE Email != null LIMIT 100");
    const response = await fetch(`${instanceUrl}/services/data/v59.0/query/?q=${query}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(`Salesforce import failed: ${JSON.stringify(err)}`);
    }

    const data = await response.json();
    return (data.records || []).map((c: any) => ({
      email: c.Email,
      first_name: c.FirstName || "",
      last_name: c.LastName || "",
      company: c.Account?.Name || "",
      phone: c.Phone || "",
      job_title: c.Title || ""
    })).filter((c: any) => c.email);
  }

  async importContacts(orgId: string, provider: string): Promise<any[]> {
    if (provider === 'hubspot') return this.importFromHubSpot(orgId);
    if (provider === 'pipedrive') return this.importFromPipedrive(orgId);
    if (provider === 'salesforce') return this.importFromSalesforce(orgId);
    throw new Error(`Unsupported CRM provider: ${provider}`);
  }
}