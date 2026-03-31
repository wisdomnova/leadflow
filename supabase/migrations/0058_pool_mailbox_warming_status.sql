-- Allow warming mailboxes to send (matches server-level get_next_powersend_node behavior).
-- Without this, mailboxes in warmup phase can't participate in campaign sends.
CREATE OR REPLACE FUNCTION get_next_pool_mailbox(server_id_param UUID)
RETURNS TABLE(
  mailbox_id UUID,
  email TEXT,
  smtp_host TEXT,
  smtp_port INTEGER,
  smtp_username TEXT,
  smtp_password TEXT,
  display_name TEXT
) AS $$
DECLARE
  srv RECORD;
BEGIN
  -- Get server defaults
  SELECT s.default_smtp_host, s.default_smtp_port, s.smtp_config
  INTO srv
  FROM smart_servers s WHERE s.id = server_id_param;

  RETURN QUERY
  SELECT
    m.id AS mailbox_id,
    m.email,
    COALESCE(m.smtp_host, srv.default_smtp_host, (srv.smtp_config->>'host')::text) AS smtp_host,
    COALESCE(m.smtp_port, srv.default_smtp_port, ((srv.smtp_config->>'port')::integer)) AS smtp_port,
    COALESCE(m.smtp_username, m.email) AS smtp_username,
    m.smtp_password,
    m.display_name
  FROM server_mailboxes m
  WHERE m.server_id = server_id_param
    AND m.status IN ('active', 'warming')
    AND m.current_usage < m.daily_limit
  ORDER BY m.last_sent_at ASC NULLS FIRST, m.reputation_score DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
