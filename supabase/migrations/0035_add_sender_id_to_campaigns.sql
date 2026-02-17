-- Add sender_id to campaigns table to support campaign attribution
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS sender_id UUID REFERENCES public.email_accounts(id) ON DELETE SET NULL;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_campaigns_sender_id ON public.campaigns(sender_id);
