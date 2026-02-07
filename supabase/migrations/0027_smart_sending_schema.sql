-- 0027_smart_sending_schema.sql
-- Support for Smart Sending (AI-Optimization) and Usage Gating

-- 1. Add timezone and enrichment data to leads
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS timezone TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS country TEXT;

-- 2. Add plan tier and specialized usage tracking to organizations
-- tier: 'starter', 'pro', 'enterprise'
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS plan_tier TEXT DEFAULT 'starter' CHECK (plan_tier IN ('starter', 'pro', 'enterprise'));
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS smart_sending_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS ai_usage_limit INTEGER DEFAULT 500; -- Starter limit
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS ai_usage_current INTEGER DEFAULT 0;

-- 2b. IMPORTANT: Add missing config column to campaigns table
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS config JSONB DEFAULT '{}';

-- 3. Update existing organizations based on subscription_status if needed
-- (In a real app, the Stripe webhook would handle this, but for dev we assume active = pro if not specified)
UPDATE public.organizations 
SET plan_tier = 'pro', smart_sending_enabled = true 
WHERE subscription_status = 'active' AND plan_tier = 'starter';

-- 4. View to help debug campaign health
CREATE OR REPLACE VIEW campaign_health_check AS
SELECT 
    c.id as campaign_id,
    c.name as campaign_name,
    o.plan_tier,
    o.smart_sending_enabled as org_smart_enabled,
    (c.config->>'smart_sending')::boolean as campaign_smart_enabled,
    count(l.id) as lead_count,
    count(l.id) FILTER (WHERE l.timezone IS NULL) as leads_missing_timezone
FROM campaigns c
JOIN organizations o ON c.org_id = o.id
LEFT JOIN leads l ON c.id = l.campaign_id
GROUP BY c.id, o.id;
