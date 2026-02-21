-- Atomic increment for smart_servers usage tracking during PowerSend campaigns
CREATE OR REPLACE FUNCTION increment_server_usage(server_id_param UUID)
RETURNS void AS $$
BEGIN
    UPDATE smart_servers
    SET current_usage = current_usage + 1,
        total_sends = COALESCE(total_sends, 0) + 1,
        last_sent_at = NOW(),
        updated_at = NOW()
    WHERE id = server_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Daily reset of current_usage on all smart_servers (called by midnight cron)
CREATE OR REPLACE FUNCTION reset_daily_server_usage()
RETURNS void AS $$
BEGIN
    UPDATE smart_servers
    SET current_usage = 0,
        updated_at = NOW()
    WHERE current_usage > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
