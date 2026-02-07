-- Migration for PowerSend (Smart Server) Infrastructure
-- This manages pools of high-reputation sending nodes provided by Mailreef or similar providers.

CREATE TABLE IF NOT EXISTS public.smart_servers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    
    name TEXT NOT NULL,
    provider TEXT DEFAULT 'mailreef',
    status TEXT DEFAULT 'active' CHECK (status IN ('provisioning', 'active', 'paused', 'error')),
    
    -- Network Metadata
    domain_name TEXT NOT NULL UNIQUE,
    ip_address TEXT,
    reputation_score INTEGER DEFAULT 100, -- 0-100
    
    -- Limits and Usage
    daily_limit INTEGER DEFAULT 500,
    current_usage INTEGER DEFAULT 0,
    last_sent_at TIMESTAMPTZ,
    
    -- Config (Encrypted in a real app, plaintext for this architecture)
    api_key TEXT,
    smtp_config JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast pool rotation lookups
CREATE INDEX IF NOT EXISTS idx_smart_servers_org_status ON public.smart_servers(org_id, status);

-- Enable RLS
ALTER TABLE public.smart_servers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their organization's smart servers"
ON public.smart_servers FOR ALL USING (
    org_id::text = (auth.jwt() ->> 'org_id')
);

-- Add a column to campaigns to link to a Smart Server Pool
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS use_powersend BOOLEAN DEFAULT false;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS powersend_config JSONB DEFAULT '{}'::jsonb;

-- Function to pick the best next server for a send (Rotation Logic)
CREATE OR REPLACE FUNCTION get_next_powersend_node(org_id_param UUID)
RETURNS SETOF public.smart_servers AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM smart_servers
    WHERE org_id = org_id_param
    AND status = 'active'
    AND current_usage < daily_limit
    ORDER BY last_sent_at ASC NULLS FIRST, reputation_score DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
