-- 0028_fix_unibox_relationship.sql
-- Add lead_id to unibox_messages to enable relationship with leads table

ALTER TABLE public.unibox_messages 
ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_unibox_messages_lead_id ON public.unibox_messages(lead_id);

-- Backfill lead_id based on from_email and org_id
-- This helps recover relationships for existing messages
UPDATE public.unibox_messages m
SET lead_id = l.id
FROM public.leads l
WHERE m.from_email = l.email 
  AND m.org_id = l.org_id
  AND m.lead_id IS NULL;
