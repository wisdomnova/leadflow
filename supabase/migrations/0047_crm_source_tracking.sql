-- Add source column to leads for tracking import origin (manual, csv, hubspot, pipedrive, salesforce)
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';

-- Index for filtering by source
CREATE INDEX IF NOT EXISTS idx_leads_source ON public.leads(org_id, source);
