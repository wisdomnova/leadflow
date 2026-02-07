-- Migration for Production-Grade Warmup Features
-- 1. Optimized Ramp-up logic
-- 2. Enhanced warmup stats for health tracking

-- RPC for bulk ramp-up of daily limits
CREATE OR REPLACE FUNCTION bulk_ramp_up_warmup()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE email_accounts 
    SET warmup_daily_limit = LEAST(warmup_daily_limit + warmup_ramp_up, 100)
    WHERE warmup_enabled = true 
    AND warmup_status = 'Warming'
    AND id IN (
        -- Only ramp up if the account actually hit its quota yesterday (proof of health)
        -- and had zero spam flags yesterday
        SELECT account_id 
        FROM warmup_stats 
        WHERE date = CURRENT_DATE - INTERVAL '1 day'
        AND sent_count >= (SELECT warmup_daily_limit FROM email_accounts ea WHERE ea.id = account_id) - 1
        AND spam_count = 0
    );
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if an email belongs to our seed/warmup network
CREATE OR REPLACE FUNCTION is_warmup_sender(sender_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if it's in our seed list
    IF EXISTS (SELECT 1 FROM warmup_seeds WHERE email = sender_email) THEN
        RETURN TRUE;
    END IF;
    
    -- Check if it's another user in our own system (The Secret Club)
    IF EXISTS (SELECT 1 FROM email_accounts WHERE email = sender_email) THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add 'reply' category to the valid categories
ALTER TABLE warmup_content DROP CONSTRAINT IF EXISTS warmup_content_category_check;
ALTER TABLE warmup_content ADD CONSTRAINT warmup_content_category_check CHECK (category IN ('subject', 'body', 'reply'));

-- Seed with some realistic replies
INSERT INTO warmup_content (category, content, tone) VALUES
('reply', 'That sounds perfect. Let''s move forward with that approach.', 'professional'),
('reply', 'Thanks for the quick response! I''ll check the details and get back to you.', 'professional'),
('reply', 'I completely agree. Great point about the timing as well.', 'professional'),
('reply', 'Exactly what I was thinking. Happy to help if you need anything else.', 'professional'),
('reply', 'I appreciate the feedback! I''ll incorporate these changes today.', 'professional'),
('reply', 'Let''s circle back on this in a couple of days once we have more data.', 'professional');
