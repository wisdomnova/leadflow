-- Fix: Allow warming nodes to participate in PowerSend rotation
-- Warming nodes already have daily_limit set by the warmup engine,
-- so they safely cap their own volume. Excluding them meant users
-- with only warming servers couldn't launch campaigns.

-- Also adds optional server_ids filter so campaigns can target specific servers.

CREATE OR REPLACE FUNCTION get_next_powersend_node(org_id_param UUID, server_ids_param UUID[] DEFAULT NULL)
RETURNS SETOF public.smart_servers AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM smart_servers
    WHERE org_id = org_id_param
    AND status IN ('active', 'warming')
    AND current_usage < daily_limit
    AND (server_ids_param IS NULL OR id = ANY(server_ids_param))
    ORDER BY last_sent_at ASC NULLS FIRST, reputation_score DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add powersend_server_ids column to campaigns for multi-server selection
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS powersend_server_ids UUID[] DEFAULT '{}';
