-- Add last_sync_at to email_accounts for Gmail REST API sync
-- Used instead of IMAP UIDs for Google accounts
ALTER TABLE email_accounts ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMPTZ;
