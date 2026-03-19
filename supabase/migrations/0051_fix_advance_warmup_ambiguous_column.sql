-- ============================================================
-- 0051: Fix advance_powersend_warmup() ambiguous column reference
-- ============================================================
-- BUG: The function's RETURNS TABLE declares "server_id UUID" which
-- creates a variable that conflicts with the "server_id" column in
-- the INSERT INTO powersend_warmup_stats statement, causing:
--   ERROR: column reference "server_id" is ambiguous
-- This prevented the daily ramp-up cron from ever advancing warmup day.
--
-- FIX: Rename the output columns to use out_ prefix to avoid conflicts.
-- Also reset daily sends as part of the advance.

-- Must drop first because return type is changing
DROP FUNCTION IF EXISTS advance_powersend_warmup();

CREATE OR REPLACE FUNCTION advance_powersend_warmup()
RETURNS TABLE(
  out_server_id UUID,
  out_server_name TEXT,
  out_new_day INTEGER,
  out_new_limit INTEGER,
  out_completed BOOLEAN
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
    
    out_server_id := r.id;
    out_server_name := r.name;
    out_new_day := r.warmup_day;
    out_new_limit := limit_val;
    out_completed := is_complete;
    RETURN NEXT;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
