-- LeadFlow Core Schema
-- Production Grade Migration

-- 1. Organizations (Tenancy)
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    category TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Email Accounts (The Sending Engine)
-- Supports SES, Gmail OAuth, Outlook OAuth, and SMTP
CREATE TABLE IF NOT EXISTS email_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    provider TEXT NOT NULL CHECK (provider IN ('aws_ses', 'google', 'outlook', 'custom_smtp')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'error', 'reconnect_required', 'paused')),
    
    -- Config JSON for flexibility (SES keys, SMTP hosts, etc)
    config JSONB DEFAULT '{}',
    
    -- Quota Management
    daily_limit INTEGER DEFAULT 100,
    sent_today INTEGER DEFAULT 0,
    last_sent_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, email)
);

-- 3. Campaigns
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'paused', 'completed')),
    
    -- Sequence Logic
    steps JSONB DEFAULT '[]', -- Array of email templates with delays
    
    -- Stats Cache (for dashboard performance)
    total_leads INTEGER DEFAULT 0,
    sent_count INTEGER DEFAULT 0,
    open_count INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Leads
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    
    email TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    company TEXT,
    job_title TEXT,
    
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'replied', 'bounced', 'unsubscribed')),
    
    last_contacted_at TIMESTAMPTZ,
    custom_fields JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, email)
);

-- 5. Activity Log (Audit Trail)
CREATE TABLE IF NOT EXISTS activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID, -- References the team member performing the action
    
    action_type TEXT NOT NULL, -- e.g., 'campaign.started', 'lead.replied', 'email_account.added'
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Analytics Snapshots (Optimized for Recharts)
CREATE TABLE IF NOT EXISTS analytics_daily (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    
    sent_count INTEGER DEFAULT 0,
    open_count INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    bounce_count INTEGER DEFAULT 0,
    
    UNIQUE(org_id, date)
);

-- Indexes for performance
CREATE INDEX idx_leads_org_status ON leads(org_id, status);
CREATE INDEX idx_campaigns_org_status ON campaigns(org_id, status);
CREATE INDEX idx_activity_org_date ON activity_log(org_id, created_at DESC);
CREATE INDEX idx_analytics_org_date ON analytics_daily(org_id, date DESC);

-- RLS (Row Level Security) - Simplified for use with Custom JWT
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_daily ENABLE ROW LEVEL SECURITY;

-- Note: Policies will be created once we define the 'org_id' claim in the Custom JWT.
