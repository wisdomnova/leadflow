-- Add sender_ids JSONB array to campaigns for multi-account sender rotation
-- Maintains backward compatibility with existing sender_id UUID column

ALTER TABLE public.campaigns
ADD COLUMN IF NOT EXISTS sender_ids JSONB DEFAULT '[]'::jsonb;

-- Comment for clarity
COMMENT ON COLUMN public.campaigns.sender_ids IS 'Array of email_account UUIDs for multi-sender rotation. If populated, takes priority over sender_id for sending.';
