-- Add lead_ids column to campaigns table for reliable lead selection storage
-- Previously lead_ids were only passed through the Inngest event payload,
-- which could be lost or truncated for large selections (2000+ leads).
ALTER TABLE public.campaigns
ADD COLUMN IF NOT EXISTS lead_ids UUID[] DEFAULT '{}';

COMMENT ON COLUMN public.campaigns.lead_ids IS 'Array of selected lead UUIDs. Stored at campaign creation for reliable retrieval by background jobs.';
