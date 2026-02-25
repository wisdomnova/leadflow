-- Pending plan downgrade columns
-- When a user downgrades, we store the target tier and the date it should take effect.
-- The user keeps their current plan_tier until plan_change_at, at which point an Inngest
-- cron job applies the pending_plan_tier.

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS pending_plan_tier TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS plan_change_at TIMESTAMPTZ DEFAULT NULL;

-- Index for the cron job that applies pending downgrades
CREATE INDEX IF NOT EXISTS idx_orgs_pending_downgrade 
  ON organizations(plan_change_at) WHERE pending_plan_tier IS NOT NULL;
