-- Robust Campaign State Management
-- Supporting multi-step sequences and per-lead tracking

CREATE TABLE IF NOT EXISTS campaign_recipients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    
    -- State Tracking
    status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'active', 'paused', 'completed', 'bounced', 'unsubscribed')),
    current_step INTEGER DEFAULT 0,
    next_send_at TIMESTAMPTZ DEFAULT NOW(),
    last_sent_at TIMESTAMPTZ,
    
    -- Stats
    opens INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    replies INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(campaign_id, lead_id)
);

-- RLS
ALTER TABLE campaign_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their campaign recipients"
ON campaign_recipients
FOR ALL
USING (
    org_id::text = (auth.jwt() ->> 'org_id')
);

-- Indexing
CREATE INDEX idx_campaign_recipients_status ON campaign_recipients(status, next_send_at);
CREATE INDEX idx_campaign_recipients_lead ON campaign_recipients(lead_id);
