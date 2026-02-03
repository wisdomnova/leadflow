-- Unibox Enhancements
-- 1. Update unibox_messages to track direction
ALTER TABLE unibox_messages ADD COLUMN IF NOT EXISTS direction TEXT DEFAULT 'inbound' CHECK (direction IN ('inbound', 'outbound'));
ALTER TABLE unibox_messages ADD COLUMN IF NOT EXISTS sender_name TEXT;

-- 2. Update leads to support Unibox features
ALTER TABLE leads ADD COLUMN IF NOT EXISTS is_starred BOOLEAN DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS sentiment TEXT DEFAULT 'Neutral' CHECK (sentiment IN ('Positive', 'Neutral', 'Negative'));
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_message_received_at TIMESTAMPTZ;

-- 3. Update leads status check constraint (if possible we would drop and recreate, but here we just add a new migration)
-- Adding a trigger or just being aware of it in code is usually easier in Supabase migrations if they are already live.
-- However, we can try to drop and recreate the constraint.
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_check;
ALTER TABLE leads ADD CONSTRAINT leads_status_check CHECK (status IN ('new', 'in_progress', 'replied', 'bounced', 'unsubscribed', 'Interested', 'Follow-up', 'Out of Office', 'Not Interested', 'Closed Won'));
