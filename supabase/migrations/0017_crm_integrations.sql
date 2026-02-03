-- Create crm_integrations table
CREATE TABLE IF NOT EXISTS public.crm_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL,
    provider TEXT NOT NULL,
    config JSONB NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'active',
    last_sync TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, provider)
);

-- Add RLS policies
ALTER TABLE public.crm_integrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their organization's crm integrations" ON public.crm_integrations;
CREATE POLICY "Users can view their organization's crm integrations" 
ON public.crm_integrations FOR SELECT 
USING (org_id::text = (auth.jwt() ->> 'org_id'));

DROP POLICY IF EXISTS "Users can manage their organization's crm integrations" ON public.crm_integrations;
CREATE POLICY "Users can manage their organization's crm integrations" 
ON public.crm_integrations FOR ALL 
USING (org_id::text = (auth.jwt() ->> 'org_id'));

-- Function to handle lead flow status push if needed
-- This table can also store mapping if we want to get fancy later
