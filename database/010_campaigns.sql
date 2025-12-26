-- Campaign system: campaigns, sends, analytics, and reply tracking
-- Production-ready with constraints, indexes, and triggers

-- 1) Update campaigns table (already scaffolded in 009, now extend)
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES templates(id) ON DELETE SET NULL;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS subject TEXT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS preview_text TEXT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS from_name TEXT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS from_email TEXT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS reply_to TEXT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS total_recipients INTEGER DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS sent_count INTEGER DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS delivered_count INTEGER DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS opened_count INTEGER DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS clicked_count INTEGER DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS replied_count INTEGER DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS bounced_count INTEGER DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS unsubscribed_count INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_campaigns_template_id ON campaigns(template_id);

-- 2) Campaign sends: per-contact tracking
CREATE TABLE IF NOT EXISTS campaign_sends (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending|sent|delivered|bounced|opened|clicked|replied|unsubscribed
  message_id TEXT, -- email Message-ID header for reply matching
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  replied_at TIMESTAMP WITH TIME ZONE,
  bounce_reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT uq_campaign_send UNIQUE (campaign_id, contact_id)
);

CREATE INDEX IF NOT EXISTS idx_campaign_sends_campaign_id ON campaign_sends(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_sends_contact_id ON campaign_sends(contact_id);
CREATE INDEX IF NOT EXISTS idx_campaign_sends_user_id ON campaign_sends(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_sends_status ON campaign_sends(status);
CREATE INDEX IF NOT EXISTS idx_campaign_sends_message_id ON campaign_sends(message_id);

-- 3) Campaign recipients (selection snapshot before send)
CREATE TABLE IF NOT EXISTS campaign_recipients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  merge_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT uq_campaign_recipient UNIQUE (campaign_id, contact_id)
);

CREATE INDEX IF NOT EXISTS idx_campaign_recipients_campaign_id ON campaign_recipients(campaign_id);

-- 4) Email replies (link to campaign sends and inbox/messages)
CREATE TABLE IF NOT EXISTS email_replies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  campaign_send_id UUID REFERENCES campaign_sends(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  from_email TEXT NOT NULL,
  subject TEXT,
  body_text TEXT,
  body_html TEXT,
  received_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  reply_category TEXT, -- interested|not_interested|question|out_of_office|meeting_request|objection|other
  sentiment_score NUMERIC(3,2), -- -1.0 to 1.0
  is_read BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_replies_user_id ON email_replies(user_id);
CREATE INDEX IF NOT EXISTS idx_email_replies_campaign_send_id ON email_replies(campaign_send_id);
CREATE INDEX IF NOT EXISTS idx_email_replies_contact_id ON email_replies(contact_id);
CREATE INDEX IF NOT EXISTS idx_email_replies_category ON email_replies(reply_category);
CREATE INDEX IF NOT EXISTS idx_email_replies_received_at ON email_replies(received_at);

-- 5) Triggers to update campaign aggregate counts
CREATE OR REPLACE FUNCTION update_campaign_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE campaigns SET
      sent_count = (SELECT COUNT(*) FROM campaign_sends WHERE campaign_id = NEW.campaign_id AND sent_at IS NOT NULL),
      delivered_count = (SELECT COUNT(*) FROM campaign_sends WHERE campaign_id = NEW.campaign_id AND delivered_at IS NOT NULL),
      opened_count = (SELECT COUNT(*) FROM campaign_sends WHERE campaign_id = NEW.campaign_id AND opened_at IS NOT NULL),
      clicked_count = (SELECT COUNT(*) FROM campaign_sends WHERE campaign_id = NEW.campaign_id AND clicked_at IS NOT NULL),
      replied_count = (SELECT COUNT(*) FROM campaign_sends WHERE campaign_id = NEW.campaign_id AND replied_at IS NOT NULL),
      bounced_count = (SELECT COUNT(*) FROM campaign_sends WHERE campaign_id = NEW.campaign_id AND status = 'bounced'),
      unsubscribed_count = (SELECT COUNT(*) FROM campaign_sends WHERE campaign_id = NEW.campaign_id AND status = 'unsubscribed')
    WHERE id = NEW.campaign_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_campaign_counts ON campaign_sends;
CREATE TRIGGER trg_update_campaign_counts
  AFTER INSERT OR UPDATE ON campaign_sends
  FOR EACH ROW
  EXECUTE FUNCTION update_campaign_counts();
