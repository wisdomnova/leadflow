-- ============================================================================
-- Migration 0043: PowerSend Mailbox Pools
-- Evolves from 1-server-1-SMTP to 1-server-N-mailboxes architecture.
-- Each Smart Server becomes a "pool" containing multiple mailboxes that
-- rotate during campaign sends and warmup.
-- ============================================================================

-- 1. Create the server_mailboxes table
CREATE TABLE IF NOT EXISTS public.server_mailboxes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id UUID NOT NULL REFERENCES public.smart_servers(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- Identity
  email TEXT NOT NULL,
  display_name TEXT,

  -- SMTP Configuration (NULL = inherit from server defaults)
  smtp_host TEXT,
  smtp_port INTEGER DEFAULT 465,
  smtp_username TEXT,
  smtp_password TEXT,

  -- IMAP Configuration (for reply detection & warmup)
  imap_host TEXT,
  imap_port INTEGER DEFAULT 993,
  imap_username TEXT,
  imap_password TEXT,

  -- Status & Health
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'warming', 'paused', 'error', 'disabled')),
  reputation_score INTEGER DEFAULT 100,
  daily_limit INTEGER DEFAULT 30,
  current_usage INTEGER DEFAULT 0,
  total_sends INTEGER DEFAULT 0,
  last_sent_at TIMESTAMPTZ,
  error_message TEXT,

  -- Warmup tracking (per-mailbox)
  warmup_enabled BOOLEAN DEFAULT FALSE,
  warmup_day INTEGER DEFAULT 0,
  warmup_daily_sends INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(server_id, email)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_server_mailboxes_server ON public.server_mailboxes(server_id, status);
CREATE INDEX IF NOT EXISTS idx_server_mailboxes_org ON public.server_mailboxes(org_id);
CREATE INDEX IF NOT EXISTS idx_server_mailboxes_email ON public.server_mailboxes(email);

-- RLS
ALTER TABLE public.server_mailboxes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their org mailboxes"
  ON public.server_mailboxes FOR ALL
  USING (org_id::text = (auth.jwt() ->> 'org_id'));

CREATE POLICY "Service role manages mailboxes"
  ON public.server_mailboxes FOR ALL
  USING (current_setting('role') = 'service_role');


-- 2. Add default SMTP/IMAP columns to smart_servers (pool-level defaults)
ALTER TABLE public.smart_servers ADD COLUMN IF NOT EXISTS default_smtp_host TEXT;
ALTER TABLE public.smart_servers ADD COLUMN IF NOT EXISTS default_smtp_port INTEGER DEFAULT 465;
ALTER TABLE public.smart_servers ADD COLUMN IF NOT EXISTS default_imap_host TEXT;
ALTER TABLE public.smart_servers ADD COLUMN IF NOT EXISTS default_imap_port INTEGER DEFAULT 993;
ALTER TABLE public.smart_servers ADD COLUMN IF NOT EXISTS mailbox_count INTEGER DEFAULT 0;


-- 3. RPC: Pick the best mailbox from a server pool for sending
-- Uses round-robin by last_sent_at + respects daily limits
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
    AND m.status = 'active'
    AND m.current_usage < m.daily_limit
  ORDER BY m.last_sent_at ASC NULLS FIRST, m.reputation_score DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. RPC: Increment usage on a specific mailbox after a send
CREATE OR REPLACE FUNCTION increment_mailbox_usage(mailbox_id_param UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE server_mailboxes
  SET current_usage = current_usage + 1,
      total_sends = total_sends + 1,
      last_sent_at = NOW(),
      updated_at = NOW()
  WHERE id = mailbox_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 5. RPC: Reset daily usage for all mailboxes (called by midnight cron)
CREATE OR REPLACE FUNCTION reset_daily_mailbox_usage()
RETURNS VOID AS $$
BEGIN
  UPDATE server_mailboxes
  SET current_usage = 0,
      warmup_daily_sends = 0,
      updated_at = NOW()
  WHERE current_usage > 0 OR warmup_daily_sends > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 6. RPC: Update mailbox count on smart_servers (trigger-based)
CREATE OR REPLACE FUNCTION update_server_mailbox_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE smart_servers
    SET mailbox_count = (SELECT count(*) FROM server_mailboxes WHERE server_id = OLD.server_id),
        updated_at = NOW()
    WHERE id = OLD.server_id;
    RETURN OLD;
  ELSE
    UPDATE smart_servers
    SET mailbox_count = (SELECT count(*) FROM server_mailboxes WHERE server_id = NEW.server_id),
        updated_at = NOW()
    WHERE id = NEW.server_id;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_mailbox_count ON public.server_mailboxes;
CREATE TRIGGER trg_update_mailbox_count
  AFTER INSERT OR DELETE ON public.server_mailboxes
  FOR EACH ROW EXECUTE FUNCTION update_server_mailbox_count();


-- 7. Migrate existing smtp_config data into server_mailboxes
-- For any server that has smtp_config with a from_email, create a mailbox row
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT id, org_id, smtp_config, domain_name, name
    FROM smart_servers
    WHERE smtp_config IS NOT NULL
      AND smtp_config != '{}'::jsonb
      AND (smtp_config->>'from_email') IS NOT NULL
      AND (smtp_config->>'from_email') != ''
  LOOP
    INSERT INTO server_mailboxes (
      server_id, org_id, email, display_name,
      smtp_host, smtp_port, smtp_username, smtp_password,
      status, daily_limit
    ) VALUES (
      r.id, r.org_id,
      r.smtp_config->>'from_email',
      r.name,
      r.smtp_config->>'host',
      COALESCE((r.smtp_config->>'port')::integer, 465),
      r.smtp_config->>'username',
      r.smtp_config->>'password',
      'active',
      500
    )
    ON CONFLICT (server_id, email) DO NOTHING;

    -- Also populate server defaults
    UPDATE smart_servers
    SET default_smtp_host = r.smtp_config->>'host',
        default_smtp_port = COALESCE((r.smtp_config->>'port')::integer, 465)
    WHERE id = r.id AND default_smtp_host IS NULL;
  END LOOP;
END $$;

-- Update the mailbox_count for all servers after migration
UPDATE smart_servers s
SET mailbox_count = (SELECT count(*) FROM server_mailboxes m WHERE m.server_id = s.id);
