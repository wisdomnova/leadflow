-- Add missing columns to campaigns
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS click_count INTEGER DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS bounce_count INTEGER DEFAULT 0;

-- Update analytics_daily to include clicks
ALTER TABLE analytics_daily ADD COLUMN IF NOT EXISTS click_count INTEGER DEFAULT 0;

-- Create Campaign Recipients table (Tracks lead progress in each campaign)
CREATE TABLE IF NOT EXISTS campaign_recipients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'replied', 'bounced', 'unsubscribed', 'complained')),
    current_step INTEGER DEFAULT 0,
    last_sent_at TIMESTAMPTZ,
    replied_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(campaign_id, lead_id)
);

-- Store Unibox Messages (Synced via IMAP)
CREATE TABLE IF NOT EXISTS unibox_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    account_id UUID REFERENCES email_accounts(id) ON DELETE CASCADE,
    
    message_id TEXT UNIQUE,
    from_email TEXT NOT NULL,
    subject TEXT,
    snippet TEXT,
    received_at TIMESTAMPTZ DEFAULT NOW(),
    is_read BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RPC for atomic stats increment
CREATE OR REPLACE FUNCTION increment_campaign_stat(
    campaign_id_param UUID,
    column_param TEXT
) RETURNS VOID AS $$
BEGIN
    EXECUTE format('UPDATE campaigns SET %I = %I + 1 WHERE id = $1', column_param, column_param)
    USING campaign_id_param;
    
    -- Also update analytics_daily
    INSERT INTO analytics_daily (org_id, date, sent_count, open_count, reply_count, click_count, bounce_count)
    SELECT 
        org_id, 
        CURRENT_DATE, 
        CASE WHEN column_param = 'sent_count' THEN 1 ELSE 0 END,
        CASE WHEN column_param = 'open_count' THEN 1 ELSE 0 END,
        CASE WHEN column_param = 'reply_count' THEN 1 ELSE 0 END,
        CASE WHEN column_param = 'click_count' THEN 1 ELSE 0 END,
        CASE WHEN column_param = 'bounce_count' THEN 1 ELSE 0 END
    FROM campaigns WHERE id = campaign_id_param
    ON CONFLICT (org_id, date) DO UPDATE SET
        sent_count = analytics_daily.sent_count + (CASE WHEN column_param = 'sent_count' THEN 1 ELSE 0 END),
        open_count = analytics_daily.open_count + (CASE WHEN column_param = 'open_count' THEN 1 ELSE 0 END),
        reply_count = analytics_daily.reply_count + (CASE WHEN column_param = 'reply_count' THEN 1 ELSE 0 END),
        click_count = analytics_daily.click_count + (CASE WHEN column_param = 'click_count' THEN 1 ELSE 0 END),
        bounce_count = analytics_daily.bounce_count + (CASE WHEN column_param = 'bounce_count' THEN 1 ELSE 0 END);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
