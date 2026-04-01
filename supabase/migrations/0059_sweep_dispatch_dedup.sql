-- ============================================================================
-- Migration 0059: Add dispatched_at to campaign_recipients
-- Prevents the campaign sweep from re-dispatching leads that are already
-- queued in Inngest, which caused event queue flooding and sending gaps.
-- ============================================================================

-- Track when a recipient was last dispatched to the Inngest event queue.
-- If dispatched_at is set and recent, the sweep skips the recipient.
-- After 30 minutes with no send (safety net), the sweep re-dispatches.
ALTER TABLE public.campaign_recipients
  ADD COLUMN IF NOT EXISTS dispatched_at TIMESTAMPTZ;

-- Partial index: only covers rows the sweep actually queries (active + unsent)
CREATE INDEX IF NOT EXISTS idx_cr_sweep_dispatch
  ON public.campaign_recipients(campaign_id, dispatched_at)
  WHERE status = 'active' AND last_sent_at IS NULL;
