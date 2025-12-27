-- Send queue hardening: add claimed_at for parallel processing safety
-- Production migration for campaign_recipients and verified_domains

-- 1) Add claimed_at to campaign_recipients to prevent double-sends in parallel invocations
ALTER TABLE campaign_recipients ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMP WITH TIME ZONE;
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_claimed ON campaign_recipients(claimed_at);

-- 2) Add verified_identity_arn to campaigns for SES validation
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS verified_identity_arn TEXT;

-- 3) Add is_verified to user_ses_accounts to track validation state
ALTER TABLE user_ses_accounts ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE user_ses_accounts ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;
