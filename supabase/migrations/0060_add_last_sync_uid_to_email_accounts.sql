-- Add last_sync_uid to email_accounts for IMAP incremental sync tracking.
-- Without this column, every IMAP sync restarts from UID 0 (i.e. re-fetches
-- ALL messages in the inbox every 15 minutes), causing massive egress and
-- duplicate processing.
ALTER TABLE email_accounts
  ADD COLUMN IF NOT EXISTS last_sync_uid BIGINT DEFAULT 0;

COMMENT ON COLUMN email_accounts.last_sync_uid IS 'IMAP UID watermark for incremental inbox sync';
