-- Add mailbox_id to unibox_messages for PowerSend server_mailboxes.
-- The existing account_id references email_accounts only.
-- PowerSend replies need a separate FK to server_mailboxes.

ALTER TABLE public.unibox_messages
  ADD COLUMN IF NOT EXISTS mailbox_id UUID REFERENCES server_mailboxes(id) ON DELETE SET NULL;

-- Make account_id nullable (PowerSend messages won't have one)
ALTER TABLE public.unibox_messages
  ALTER COLUMN account_id DROP NOT NULL;

-- Index for efficient lookups by mailbox
CREATE INDEX IF NOT EXISTS idx_unibox_messages_mailbox_id
  ON public.unibox_messages(mailbox_id);
