-- ============================================================================
-- Migration 0055: Fix campaign_recipients status constraint for replies
-- The IMAP sync sets status='replied' but the CHECK constraint didn't allow it.
-- Also adds replied_at timestamp column for tracking when a reply was received.
-- ============================================================================

-- 1. Drop the old CHECK constraint
ALTER TABLE public.campaign_recipients DROP CONSTRAINT IF EXISTS campaign_recipients_status_check;

-- 2. Add the updated constraint with 'replied' included
ALTER TABLE public.campaign_recipients
  ADD CONSTRAINT campaign_recipients_status_check
  CHECK (status IN ('queued', 'active', 'paused', 'completed', 'bounced', 'unsubscribed', 'replied'));

-- 3. Add replied_at timestamp column
ALTER TABLE public.campaign_recipients
  ADD COLUMN IF NOT EXISTS replied_at TIMESTAMPTZ;
