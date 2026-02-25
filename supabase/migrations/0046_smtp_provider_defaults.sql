-- ============================================================================
-- Migration 0046: SMTP Provider Defaults
-- Introduces org-level SMTP/IMAP provider presets so that bulk-imported
-- mailboxes inherit host/port settings automatically.
-- Each mailbox only needs credentials (email + password).
-- ============================================================================

-- 1. Provider defaults table
CREATE TABLE IF NOT EXISTS public.smtp_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- Identity
  name TEXT NOT NULL,                -- e.g. "Zoho Mail", "Namecheap Private Email"
  provider_type TEXT DEFAULT 'custom', -- 'zoho', 'namecheap', 'ovh', 'hostinger', 'titan', 'custom'

  -- Default SMTP settings
  smtp_host TEXT NOT NULL,
  smtp_port INTEGER DEFAULT 465,
  smtp_security TEXT DEFAULT 'ssl' CHECK (smtp_security IN ('ssl', 'tls', 'none')),

  -- Default IMAP settings
  imap_host TEXT NOT NULL,
  imap_port INTEGER DEFAULT 993,
  imap_security TEXT DEFAULT 'ssl' CHECK (imap_security IN ('ssl', 'tls', 'none')),

  -- Metadata
  is_default BOOLEAN DEFAULT FALSE,  -- If true, new accounts auto-inherit this provider
  account_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(org_id, name)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_smtp_providers_org ON public.smtp_providers(org_id);

-- RLS
ALTER TABLE public.smtp_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their org smtp providers"
  ON public.smtp_providers FOR ALL
  USING (org_id::text = (auth.jwt() ->> 'org_id'));

CREATE POLICY "Service role manages smtp providers"
  ON public.smtp_providers FOR ALL
  USING (current_setting('role') = 'service_role');


-- 2. Link email_accounts to smtp_providers for inheritance
ALTER TABLE public.email_accounts
  ADD COLUMN IF NOT EXISTS smtp_provider_id UUID REFERENCES public.smtp_providers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_email_accounts_smtp_provider ON public.email_accounts(smtp_provider_id);


-- 3. RPC: Resolve effective SMTP config for an email account
-- Falls back: account config → provider defaults → NULL
CREATE OR REPLACE FUNCTION resolve_smtp_config(account_id_param UUID)
RETURNS TABLE(
  smtp_host TEXT,
  smtp_port INTEGER,
  smtp_user TEXT,
  smtp_pass TEXT,
  imap_host TEXT,
  imap_port INTEGER,
  imap_user TEXT,
  imap_pass TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(
      NULLIF((a.config->>'smtpHost')::text, ''),
      p.smtp_host
    ) AS smtp_host,
    COALESCE(
      NULLIF((a.config->>'smtpPort')::text, '')::integer,
      p.smtp_port,
      465
    ) AS smtp_port,
    COALESCE(
      NULLIF((a.config->>'smtpUser')::text, ''),
      a.email
    ) AS smtp_user,
    COALESCE(
      NULLIF((a.config->>'smtpPass')::text, ''),
      ''
    ) AS smtp_pass,
    COALESCE(
      NULLIF((a.config->>'imapHost')::text, ''),
      p.imap_host
    ) AS imap_host,
    COALESCE(
      NULLIF((a.config->>'imapPort')::text, '')::integer,
      p.imap_port,
      993
    ) AS imap_port,
    COALESCE(
      NULLIF((a.config->>'imapUser')::text, ''),
      a.email
    ) AS imap_user,
    COALESCE(
      NULLIF((a.config->>'imapPass')::text, ''),
      ''
    ) AS imap_pass
  FROM email_accounts a
  LEFT JOIN smtp_providers p ON a.smtp_provider_id = p.id
  WHERE a.id = account_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. Trigger: Keep account_count in sync
CREATE OR REPLACE FUNCTION update_smtp_provider_account_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update old provider count
  IF OLD IS NOT NULL AND OLD.smtp_provider_id IS NOT NULL THEN
    UPDATE smtp_providers
    SET account_count = (SELECT count(*) FROM email_accounts WHERE smtp_provider_id = OLD.smtp_provider_id),
        updated_at = NOW()
    WHERE id = OLD.smtp_provider_id;
  END IF;

  -- Update new provider count
  IF NEW IS NOT NULL AND NEW.smtp_provider_id IS NOT NULL THEN
    UPDATE smtp_providers
    SET account_count = (SELECT count(*) FROM email_accounts WHERE smtp_provider_id = NEW.smtp_provider_id),
        updated_at = NOW()
    WHERE id = NEW.smtp_provider_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_smtp_provider_count ON public.email_accounts;
CREATE TRIGGER trg_update_smtp_provider_count
  AFTER INSERT OR UPDATE OF smtp_provider_id OR DELETE ON public.email_accounts
  FOR EACH ROW EXECUTE FUNCTION update_smtp_provider_account_count();
