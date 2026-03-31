-- ============================================================================
-- Migration 0056: Add mailbox daily usage reset
-- The server_mailboxes.current_usage was never reset daily, causing all
-- mailboxes to blow past their daily_limit after a few days of warmup sends.
-- This extends the existing reset_daily_server_usage() to also reset mailboxes.
-- ============================================================================

-- Replace the existing function to also reset mailbox usage
CREATE OR REPLACE FUNCTION reset_daily_server_usage()
RETURNS void AS $$
BEGIN
    -- Reset server-level usage
    UPDATE smart_servers
    SET current_usage = 0,
        updated_at = NOW()
    WHERE current_usage > 0;

    -- Reset mailbox-level usage (server_mailboxes)
    UPDATE server_mailboxes
    SET current_usage = 0,
        updated_at = NOW()
    WHERE current_usage > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
