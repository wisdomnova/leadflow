-- Add warmup-specific columns to email_accounts if they don't exist
ALTER TABLE email_accounts 
ADD COLUMN IF NOT EXISTS warmup_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS warmup_status TEXT DEFAULT 'Paused' CHECK (warmup_status IN ('Warming', 'Paused', 'Error')),
ADD COLUMN IF NOT EXISTS warmup_daily_limit INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS warmup_ramp_up INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS warmup_reply_rate INTEGER DEFAULT 30;

-- Create a table for tracking warmup performance over time
CREATE TABLE IF NOT EXISTS warmup_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES email_accounts(id) ON DELETE CASCADE,
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE,
    sent_count INTEGER DEFAULT 0,
    replies_count INTEGER DEFAULT 0,
    spam_count INTEGER DEFAULT 0,
    inbox_count INTEGER DEFAULT 0,
    health_score INTEGER DEFAULT 100,
    UNIQUE(account_id, date)
);

-- Enable RLS
ALTER TABLE warmup_stats ENABLE ROW LEVEL SECURITY;

-- Polices
DROP POLICY IF EXISTS "Users can view their own org's warmup stats" ON warmup_stats;
CREATE POLICY "Users can view their own org's warmup stats" 
ON warmup_stats FOR SELECT 
TO authenticated 
USING (
    org_id::text = (auth.jwt() ->> 'org_id')
);
