-- ============================================================
-- 0050: Fix Reputation Guard overriding user-initiated warmup
-- ============================================================
-- BUG: enforce_reputation_guard() restores ALL 'warming' nodes
-- with reputation >= 85, including nodes the user manually
-- put into warmup mode. This causes warmup to "reset" on every
-- 15-minute reputation check.
--
-- FIX: Only restore nodes that were AUTO-demoted by the guard
-- (warmup_enabled = false), never touch user-initiated warmup
-- (warmup_enabled = true).

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
  -- Demote active servers below threshold to auto-warmup
  RETURN QUERY
  UPDATE smart_servers
  SET status = 'warming',
      auto_warmup_at = NOW(),
      daily_limit = GREATEST(daily_limit / 4, 25),
      updated_at = NOW()
  WHERE status = 'active'
    AND reputation_score < low_threshold
  RETURNING id AS server_id, 'demoted'::text AS action, 'active'::text AS old_status, 'warming'::text AS new_status, reputation_score AS reputation;

  -- Restore ONLY auto-demoted nodes (warmup_enabled = false) that recovered
  -- Never touch user-initiated warmup nodes (warmup_enabled = true)
  RETURN QUERY
  UPDATE smart_servers
  SET status = 'active',
      warmup_restored_at = NOW(),
      daily_limit = GREATEST(daily_limit * 4, 500),
      updated_at = NOW()
  WHERE status = 'warming'
    AND warmup_enabled = false
    AND reputation_score >= restore_threshold
  RETURNING id AS server_id, 'restored'::text AS action, 'warming'::text AS old_status, 'active'::text AS new_status, reputation_score AS reputation;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
