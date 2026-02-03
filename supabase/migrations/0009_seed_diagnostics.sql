-- Enhancing sending domains for custom tracking and dkim selectors
ALTER TABLE sending_domains ADD COLUMN IF NOT EXISTS tracking_domain TEXT;
ALTER TABLE sending_domains ADD COLUMN IF NOT EXISTS dkim_selector TEXT DEFAULT 'sig1';

-- Seed List Management
CREATE TABLE IF NOT EXISTS seed_list (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    provider TEXT NOT NULL, -- 'gmail', 'outlook', 'zoho', etc.
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Diagnostics Tests
CREATE TABLE IF NOT EXISTS seed_diagnostics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES email_accounts(id) ON DELETE CASCADE,
    subject TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'sending', 'polling', 'completed', 'failed'
    
    -- Statistics
    total_seeds INTEGER DEFAULT 0,
    inbox_count INTEGER DEFAULT 0,
    spam_count INTEGER DEFAULT 0,
    promotions_count INTEGER DEFAULT 0,
    
    -- Results detail: [{ email: '...', folder: 'inbox', header_score: 98 }]
    results JSONB DEFAULT '[]',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Policy for seed diagnostics
ALTER TABLE seed_diagnostics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their organization's diagnostics"
ON seed_diagnostics FOR ALL USING (org_id IN (SELECT id FROM organizations));
