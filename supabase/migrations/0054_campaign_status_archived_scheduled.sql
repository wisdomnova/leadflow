-- Add 'archived' and 'scheduled' to the campaigns status check constraint
-- The original constraint only allowed: draft, running, paused, completed
ALTER TABLE public.campaigns DROP CONSTRAINT IF EXISTS campaigns_status_check;
ALTER TABLE public.campaigns ADD CONSTRAINT campaigns_status_check 
  CHECK (status IN ('draft', 'running', 'paused', 'completed', 'archived', 'scheduled'));
