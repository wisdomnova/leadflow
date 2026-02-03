-- Sending Domains Management
-- Supporting verification for AWS SES or other providers

CREATE TABLE IF NOT EXISTS sending_domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    domain_name TEXT NOT NULL,
    
    -- Verification Statuses
    spf_status TEXT DEFAULT 'pending' CHECK (spf_status IN ('verified', 'pending', 'failed', 'missing')),
    dkim_status TEXT DEFAULT 'pending' CHECK (dkim_status IN ('verified', 'pending', 'failed', 'missing')),
    dmarc_status TEXT DEFAULT 'pending' CHECK (dmarc_status IN ('verified', 'pending', 'failed', 'missing')),
    tracking_status TEXT DEFAULT 'pending' CHECK (tracking_status IN ('verified', 'pending', 'failed', 'missing')),
    
    -- Verification Tokens/Values (for TXT records)
    verification_token TEXT,
    dkim_tokens TEXT[], -- Array of tokens for CNAME records
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(org_id, domain_name)
);

-- RLS
ALTER TABLE sending_domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their organization's domains"
ON sending_domains
FOR ALL
USING (
    org_id::text = (auth.jwt() ->> 'org_id')
);

-- Index
CREATE INDEX idx_domains_org ON sending_domains(org_id);
