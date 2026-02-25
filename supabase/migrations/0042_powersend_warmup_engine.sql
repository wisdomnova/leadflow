-- ============================================================================
-- Migration 0042: PowerSend Warmup Engine
-- Adds IP warmup scheduling, daily ramp-up, and warmup stats tracking
-- for PowerSend smart server nodes.
-- ============================================================================

-- 1. Add warmup-specific columns to smart_servers
ALTER TABLE public.smart_servers ADD COLUMN IF NOT EXISTS warmup_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE public.smart_servers ADD COLUMN IF NOT EXISTS warmup_day INTEGER DEFAULT 0;              -- current warmup day (0 = not started)
ALTER TABLE public.smart_servers ADD COLUMN IF NOT EXISTS warmup_started_at TIMESTAMPTZ;
ALTER TABLE public.smart_servers ADD COLUMN IF NOT EXISTS warmup_completed_at TIMESTAMPTZ;
ALTER TABLE public.smart_servers ADD COLUMN IF NOT EXISTS warmup_target_limit INTEGER DEFAULT 500;    -- the daily_limit to reach once warmup completes
ALTER TABLE public.smart_servers ADD COLUMN IF NOT EXISTS warmup_daily_sends INTEGER DEFAULT 0;       -- today's warmup sends for this node

-- 2. PowerSend Warmup Stats — one row per node per day
CREATE TABLE IF NOT EXISTS public.powersend_warmup_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id UUID NOT NULL REFERENCES public.smart_servers(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  warmup_day INTEGER NOT NULL DEFAULT 1,        -- which day of warmup schedule
  daily_limit INTEGER NOT NULL DEFAULT 10,       -- limit for this day
  sent_count INTEGER NOT NULL DEFAULT 0,         -- warmup emails sent today
  inbox_count INTEGER NOT NULL DEFAULT 0,        -- how many landed in inbox (if detectable)
  bounce_count INTEGER NOT NULL DEFAULT 0,       -- bounced warmup emails
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(server_id, date)
);

CREATE INDEX IF NOT EXISTS idx_ps_warmup_stats_server ON public.powersend_warmup_stats(server_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_ps_warmup_stats_org ON public.powersend_warmup_stats(org_id);

-- RLS
ALTER TABLE public.powersend_warmup_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org warmup stats"
  ON public.powersend_warmup_stats FOR SELECT
  USING (org_id::text = (auth.jwt() ->> 'org_id'));

CREATE POLICY "Service role manages warmup stats"
  ON public.powersend_warmup_stats FOR ALL
  USING (current_setting('role') = 'service_role');

-- 3. RPC: Get the warmup schedule limit for a given day
-- IP warmup best practices: start very low, ramp gradually over ~28 days
CREATE OR REPLACE FUNCTION get_powersend_warmup_limit(day_num INTEGER, target_limit INTEGER DEFAULT 500)
RETURNS INTEGER AS $$
BEGIN
  RETURN CASE
    WHEN day_num <= 1  THEN  10
    WHEN day_num = 2   THEN  25
    WHEN day_num = 3   THEN  50
    WHEN day_num = 4   THEN  75
    WHEN day_num = 5   THEN  100
    WHEN day_num <= 7  THEN  150
    WHEN day_num <= 10 THEN  200
    WHEN day_num <= 14 THEN  300
    WHEN day_num <= 21 THEN  400
    WHEN day_num <= 28 THEN  LEAST(500, target_limit)
    ELSE target_limit  -- warmup complete
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 4. RPC: Advance warmup day for all warming nodes (called by daily Inngest cron)
CREATE OR REPLACE FUNCTION advance_powersend_warmup()
RETURNS TABLE(
  server_id UUID,
  server_name TEXT,
  new_day INTEGER,
  new_limit INTEGER,
  completed BOOLEAN
) AS $$
DECLARE
  r RECORD;
  limit_val INTEGER;
  is_complete BOOLEAN;
BEGIN
  FOR r IN 
    SELECT s.id, s.name, s.warmup_day, s.warmup_target_limit
    FROM smart_servers s
    WHERE s.warmup_enabled = TRUE
      AND s.status = 'warming'
      AND s.warmup_completed_at IS NULL
  LOOP
    -- Increment day
    r.warmup_day := r.warmup_day + 1;
    
    -- Get limit for new day
    limit_val := get_powersend_warmup_limit(r.warmup_day, r.warmup_target_limit);
    
    -- Check if warmup is complete (reached target)
    is_complete := (r.warmup_day > 28) OR (limit_val >= r.warmup_target_limit);
    
    IF is_complete THEN
      -- Graduate: set to active, restore target limit
      UPDATE smart_servers
      SET warmup_day = r.warmup_day,
          daily_limit = r.warmup_target_limit,
          warmup_completed_at = NOW(),
          warmup_enabled = FALSE,
          status = 'active',
          warmup_daily_sends = 0,
          updated_at = NOW()
      WHERE id = r.id;
    ELSE
      -- Ramp up: increase daily limit
      UPDATE smart_servers
      SET warmup_day = r.warmup_day,
          daily_limit = limit_val,
          warmup_daily_sends = 0,
          updated_at = NOW()
      WHERE id = r.id;
      
      -- Create today's stats row
      INSERT INTO powersend_warmup_stats (server_id, org_id, date, warmup_day, daily_limit)
      SELECT r.id, s.org_id, CURRENT_DATE, r.warmup_day, limit_val
      FROM smart_servers s WHERE s.id = r.id
      ON CONFLICT (server_id, date) DO UPDATE
        SET warmup_day = EXCLUDED.warmup_day, daily_limit = EXCLUDED.daily_limit;
    END IF;
    
    server_id := r.id;
    server_name := r.name;
    new_day := r.warmup_day;
    new_limit := limit_val;
    completed := is_complete;
    RETURN NEXT;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. RPC: Increment warmup send count for a node
CREATE OR REPLACE FUNCTION increment_powersend_warmup_send(server_id_param UUID)
RETURNS VOID AS $$
BEGIN
  -- Increment on server itself
  UPDATE smart_servers
  SET warmup_daily_sends = warmup_daily_sends + 1,
      updated_at = NOW()
  WHERE id = server_id_param;
  
  -- Increment on today's stats row
  UPDATE powersend_warmup_stats
  SET sent_count = sent_count + 1
  WHERE server_id = server_id_param
    AND date = CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. RPC: Reset daily warmup sends at midnight (add to existing daily reset)
CREATE OR REPLACE FUNCTION reset_powersend_warmup_sends()
RETURNS VOID AS $$
BEGIN
  UPDATE smart_servers
  SET warmup_daily_sends = 0,
      updated_at = NOW()
  WHERE warmup_enabled = TRUE
    AND status = 'warming';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
