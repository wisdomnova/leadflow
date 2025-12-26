-- Email infrastructure: SES accounts, verified domains, warmup schedules, campaigns, and events
-- Safe for production: constraints, indexes, and defaults included.

-- 1) SES account credentials per user
CREATE TABLE IF NOT EXISTS user_ses_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  aws_access_key_id TEXT NOT NULL,
  aws_secret_access_key TEXT NOT NULL,
  aws_region TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT fk_user_ses_accounts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_user_ses_accounts_user_id ON user_ses_accounts(user_id);

-- 2) Verified domains (DKIM/SPF/DMARC status tracking)
CREATE TABLE IF NOT EXISTS verified_domains (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  domain TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'aws_ses',
  ses_identity_arn TEXT,
  dkim_tokens JSONB, -- array of strings from SES
  spf_status TEXT DEFAULT 'pending', -- pending|verified|failed
  dkim_status TEXT DEFAULT 'pending', -- pending|verified|failed
  dmarc_status TEXT DEFAULT 'pending', -- pending|verified|failed
  tracking_domain TEXT, -- optional CNAME tracking
  last_verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT uq_verified_domain UNIQUE (user_id, domain),
  CONSTRAINT fk_verified_domains_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_verified_domains_user_id ON verified_domains(user_id);
CREATE INDEX IF NOT EXISTS idx_verified_domains_domain ON verified_domains(domain);

-- 3) Warmup schedules per user
CREATE TABLE IF NOT EXISTS user_warmup_schedule (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  provider TEXT NOT NULL, -- aws_ses|gmail|resend|smtp
  domain TEXT,
  start_date DATE NOT NULL,
  total_days INTEGER NOT NULL DEFAULT 14,
  current_day INTEGER NOT NULL DEFAULT 1,
  daily_limit INTEGER NOT NULL DEFAULT 25, -- evolves per day
  enforced BOOLEAN NOT NULL DEFAULT TRUE, -- enforce caps on sending
  status TEXT NOT NULL DEFAULT 'active', -- active|paused|completed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT fk_user_warmup_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_user_warmup_user_id ON user_warmup_schedule(user_id);
CREATE INDEX IF NOT EXISTS idx_user_warmup_status ON user_warmup_schedule(status);

-- 4) Daily warmup usage log
CREATE TABLE IF NOT EXISTS warmup_daily_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  schedule_id UUID NOT NULL,
  day_number INTEGER NOT NULL,
  date DATE NOT NULL,
  sent_count INTEGER NOT NULL DEFAULT 0,
  limit INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT fk_warmup_log_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_warmup_log_schedule FOREIGN KEY (schedule_id) REFERENCES user_warmup_schedule(id) ON DELETE CASCADE,
  CONSTRAINT uq_warmup_log UNIQUE (schedule_id, date)
);
CREATE INDEX IF NOT EXISTS idx_warmup_log_user_id ON warmup_daily_log(user_id);
CREATE INDEX IF NOT EXISTS idx_warmup_log_schedule_id ON warmup_daily_log(schedule_id);

-- 5) Campaigns (basic scaffold)
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  provider TEXT NOT NULL,
  domain TEXT,
  status TEXT NOT NULL DEFAULT 'draft', -- draft|scheduled|sending|paused|completed
  scheduled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT fk_campaigns_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);

-- 6) Email events (deliverability telemetry)
CREATE TABLE IF NOT EXISTS email_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  campaign_id UUID,
  contact_id UUID,
  event_type TEXT NOT NULL, -- sent|delivered|open|click|bounce|unsubscribe|spamreport
  provider TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  meta JSONB,
  CONSTRAINT fk_email_events_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_email_events_campaign FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_email_events_user_id ON email_events(user_id);
CREATE INDEX IF NOT EXISTS idx_email_events_campaign_id ON email_events(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_events_event_type ON email_events(event_type);

-- 7) Triggers to maintain updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_updated_at_ses ON user_ses_accounts;
CREATE TRIGGER trg_set_updated_at_ses BEFORE UPDATE ON user_ses_accounts FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at_domains ON verified_domains;
CREATE TRIGGER trg_set_updated_at_domains BEFORE UPDATE ON verified_domains FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at_warmup ON user_warmup_schedule;
CREATE TRIGGER trg_set_updated_at_warmup BEFORE UPDATE ON user_warmup_schedule FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_set_updated_at_campaigns ON campaigns;
CREATE TRIGGER trg_set_updated_at_campaigns BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE FUNCTION set_updated_at();
