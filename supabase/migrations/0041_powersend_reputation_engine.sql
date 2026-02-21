-- ============================================================================
-- Migration 0041: PowerSend Reputation Engine
-- Adds reputation history tracking, auto-warmup logic, and health-check support
-- ============================================================================

-- 1. Reputation history log — one row per health-check per node
CREATE TABLE IF NOT EXISTS public.server_reputation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id UUID NOT NULL REFERENCES public.smart_servers(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  reputation_score INTEGER NOT NULL,          -- snapshot at check time
  previous_score INTEGER,                      -- score before this check
  bounce_rate NUMERIC(5,2) DEFAULT 0,          -- % bounces in last 24h
  complaint_rate NUMERIC(5,2) DEFAULT 0,       -- % complaints in last 24h
  delivery_rate NUMERIC(5,2) DEFAULT 100,      -- % successful deliveries in last 24h
  
  source TEXT DEFAULT 'system',                -- 'system' | 'mailreef_api' | 'manual'
  notes TEXT,
  
  checked_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rep_log_server ON public.server_reputation_log(server_id, checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_rep_log_org ON public.server_reputation_log(org_id);

-- RLS
ALTER TABLE public.server_reputation_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org reputation logs"
  ON public.server_reputation_log FOR SELECT
  USING (org_id::text = (auth.jwt() ->> 'org_id'));

CREATE POLICY "Service role manages reputation logs"
  ON public.server_reputation_log FOR ALL
  USING (current_setting('role') = 'service_role');

-- 2. Add tracking columns to smart_servers
ALTER TABLE public.smart_servers ADD COLUMN IF NOT EXISTS last_health_check TIMESTAMPTZ;
ALTER TABLE public.smart_servers ADD COLUMN IF NOT EXISTS health_check_count INTEGER DEFAULT 0;
ALTER TABLE public.smart_servers ADD COLUMN IF NOT EXISTS auto_warmup_at TIMESTAMPTZ;          -- when the node was auto-moved to warmup
ALTER TABLE public.smart_servers ADD COLUMN IF NOT EXISTS warmup_restored_at TIMESTAMPTZ;       -- when reputation recovered
ALTER TABLE public.smart_servers ADD COLUMN IF NOT EXISTS bounce_rate NUMERIC(5,2) DEFAULT 0;
ALTER TABLE public.smart_servers ADD COLUMN IF NOT EXISTS complaint_rate NUMERIC(5,2) DEFAULT 0;
ALTER TABLE public.smart_servers ADD COLUMN IF NOT EXISTS delivery_rate NUMERIC(5,2) DEFAULT 100;

-- Update status check to allow 'warming' as a valid status (for auto-warmup)
-- The original CHECK was ('provisioning', 'active', 'paused', 'error')
-- We need to add 'warming' — drop and re-add the constraint
DO $$
BEGIN
  -- Drop old constraint if it exists
  ALTER TABLE public.smart_servers DROP CONSTRAINT IF EXISTS smart_servers_status_check;
  -- Re-add with 'warming' included
  ALTER TABLE public.smart_servers ADD CONSTRAINT smart_servers_status_check 
    CHECK (status IN ('provisioning', 'active', 'paused', 'error', 'warming'));
END $$;

-- 3. Function: Auto-warmup nodes with low reputation
-- Called by the Inngest cron. Moves active nodes below threshold to 'warming',
-- and restores warming nodes that have recovered.
CREATE OR REPLACE FUNCTION enforce_reputation_guard(
  low_threshold INTEGER DEFAULT 70,
  restore_threshold INTEGER DEFAULT 85
)
RETURNS TABLE(
  server_id UUID,
  action TEXT,
  old_status TEXT,
  new_status TEXT,
  reputation INTEGER
) AS $$
BEGIN
  -- Move active servers below threshold to warming
  RETURN QUERY
  UPDATE smart_servers
  SET status = 'warming',
      auto_warmup_at = NOW(),
      daily_limit = GREATEST(daily_limit / 4, 25),  -- Reduce to 25% of normal, min 25
      updated_at = NOW()
  WHERE status = 'active'
    AND reputation_score < low_threshold
  RETURNING id AS server_id, 'demoted'::text AS action, 'active'::text AS old_status, 'warming'::text AS new_status, reputation_score AS reputation;

  -- Restore warming servers that have recovered
  RETURN QUERY
  UPDATE smart_servers
  SET status = 'active',
      warmup_restored_at = NOW(),
      daily_limit = GREATEST(daily_limit * 4, 500),  -- Restore to ~original, min 500
      updated_at = NOW()
  WHERE status = 'warming'
    AND reputation_score >= restore_threshold
  RETURNING id AS server_id, 'restored'::text AS action, 'warming'::text AS old_status, 'active'::text AS new_status, reputation_score AS reputation;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Function: Update a server's reputation based on delivery metrics
CREATE OR REPLACE FUNCTION update_server_reputation(
  server_id_param UUID,
  new_bounce_rate NUMERIC,
  new_complaint_rate NUMERIC,
  new_delivery_rate NUMERIC,
  check_source TEXT DEFAULT 'system'
)
RETURNS INTEGER AS $$
DECLARE
  old_score INTEGER;
  new_score INTEGER;
  v_org_id UUID;
BEGIN
  -- Get current score
  SELECT reputation_score, org_id INTO old_score, v_org_id
  FROM smart_servers WHERE id = server_id_param;
  
  IF NOT FOUND THEN
    RETURN -1;
  END IF;
  
  -- Score algorithm:
  -- Start at 100, deduct for bounces and complaints, reward for delivery
  -- bounce_rate: each 1% above 2% costs 5 points
  -- complaint_rate: each 0.1% above 0.1% costs 10 points
  -- delivery_rate: each 1% below 98% costs 2 points
  new_score := 100;
  new_score := new_score - GREATEST(0, ((new_bounce_rate - 2.0) * 5)::INTEGER);
  new_score := new_score - GREATEST(0, ((new_complaint_rate - 0.1) * 100)::INTEGER);
  new_score := new_score - GREATEST(0, ((98.0 - new_delivery_rate) * 2)::INTEGER);
  
  -- Clamp between 0 and 100
  new_score := GREATEST(0, LEAST(100, new_score));
  
  -- Smooth: blend 70% new + 30% old for stability
  new_score := ((new_score * 7 + old_score * 3) / 10)::INTEGER;
  
  -- Update server
  UPDATE smart_servers
  SET reputation_score = new_score,
      bounce_rate = new_bounce_rate,
      complaint_rate = new_complaint_rate,
      delivery_rate = new_delivery_rate,
      last_health_check = NOW(),
      health_check_count = health_check_count + 1,
      updated_at = NOW()
  WHERE id = server_id_param;
  
  -- Log the check
  INSERT INTO server_reputation_log (server_id, org_id, reputation_score, previous_score, bounce_rate, complaint_rate, delivery_rate, source)
  VALUES (server_id_param, v_org_id, new_score, old_score, new_bounce_rate, new_complaint_rate, new_delivery_rate, check_source);
  
  RETURN new_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
