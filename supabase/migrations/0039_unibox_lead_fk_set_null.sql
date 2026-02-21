-- Change unibox_messages.lead_id FK from ON DELETE CASCADE to ON DELETE SET NULL
-- This prevents reply messages from being deleted when leads are removed
-- Messages should be preserved as conversation history regardless of lead lifecycle

-- Drop the existing CASCADE constraint
ALTER TABLE public.unibox_messages DROP CONSTRAINT IF EXISTS unibox_messages_lead_id_fkey;

-- Re-add with SET NULL behavior
ALTER TABLE public.unibox_messages 
ADD CONSTRAINT unibox_messages_lead_id_fkey 
  FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE SET NULL;
