-- ============================================================================
-- Migration 0052: Add last_sync_uid to server_mailboxes for Unibox sync
-- PowerSend mailboxes need IMAP sync tracking so replies appear in Unibox.
-- ============================================================================

ALTER TABLE public.server_mailboxes
  ADD COLUMN IF NOT EXISTS last_sync_uid INTEGER DEFAULT 0;
