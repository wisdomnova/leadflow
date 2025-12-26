-- Campaign Sequences (Drip Campaigns)
-- Enables multi-step email sequences with delays and conditions
-- Production-ready with full tracking and state management

-- 1) Campaign sequences table (a campaign that sends multiple emails over time)
CREATE TABLE IF NOT EXISTS campaign_sequences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  sequence_number INTEGER NOT NULL DEFAULT 1, -- which email in the sequence (1, 2, 3, etc)
  email_subject TEXT NOT NULL,
  email_body TEXT NOT NULL,
  template_id UUID REFERENCES templates(id) ON DELETE SET NULL,
  delay_days INTEGER DEFAULT 0, -- days to wait after previous email sends
  delay_hours INTEGER DEFAULT 0, -- additional hours
  send_on_day_of_week VARCHAR(10), -- optional: Monday, Tuesday, etc to send on specific day
  send_at_time TIME, -- optional: send at specific time of day (in user's timezone)
  enabled BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT uq_sequence_number UNIQUE (campaign_id, sequence_number)
);

CREATE INDEX IF NOT EXISTS idx_campaign_sequences_campaign_id ON campaign_sequences(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_sequences_enabled ON campaign_sequences(enabled);

-- 2) Campaign sequence sends (track sending of each email in sequence to each contact)
CREATE TABLE IF NOT EXISTS campaign_sequence_sends (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  sequence_number INTEGER NOT NULL, -- which email in the sequence
  message_id TEXT, -- email Message-ID header
  status TEXT NOT NULL DEFAULT 'pending', -- pending|scheduled|sent|delivered|bounced|opened|clicked|replied|unsubscribed|skipped
  scheduled_for TIMESTAMP WITH TIME ZONE, -- when this email is scheduled to send
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  replied_at TIMESTAMP WITH TIME ZONE,
  bounce_reason TEXT,
  skip_reason TEXT, -- why email was skipped (unsubscribed, opted_out, bounced_previous, etc)
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT uq_sequence_send UNIQUE (campaign_id, contact_id, sequence_number)
);

CREATE INDEX IF NOT EXISTS idx_campaign_sequence_sends_campaign_id ON campaign_sequence_sends(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_sequence_sends_contact_id ON campaign_sequence_sends(contact_id);
CREATE INDEX IF NOT EXISTS idx_campaign_sequence_sends_status ON campaign_sequence_sends(status);
CREATE INDEX IF NOT EXISTS idx_campaign_sequence_sends_scheduled_for ON campaign_sequence_sends(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_campaign_sequence_sends_sent_at ON campaign_sequence_sends(sent_at);

-- 3) Campaign settings (updated to support sequences and advanced features)
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS is_sequence BOOLEAN DEFAULT FALSE;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS sequence_type VARCHAR(50), -- sequential|branch|conditional
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS paused_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS paused_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS stopped_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS stopped_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS notes TEXT;

-- 4) Campaign pause/resume/stop history
CREATE TABLE IF NOT EXISTS campaign_status_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  action TEXT NOT NULL, -- pause|resume|stop|send|complete
  reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campaign_status_history_campaign_id ON campaign_status_history(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_status_history_user_id ON campaign_status_history(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_status_history_action ON campaign_status_history(action);
CREATE INDEX IF NOT EXISTS idx_campaign_status_history_created_at ON campaign_status_history(created_at);

-- 5) Update campaign counts trigger to handle sequences
CREATE OR REPLACE FUNCTION update_campaign_counts_v2()
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
      unsubscribed_count = (SELECT COUNT(*) FROM campaign_sends WHERE campaign_id = NEW.campaign_id AND status = 'unsubscribed'),
      updated_at = NOW()
    WHERE id = NEW.campaign_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6) Helper function: get sequence send status for a contact
CREATE OR REPLACE FUNCTION get_sequence_progress(p_campaign_id UUID, p_contact_id UUID)
RETURNS TABLE (sequence_number INTEGER, status TEXT, sent_at TIMESTAMP WITH TIME ZONE, opened_at TIMESTAMP WITH TIME ZONE) AS $$
BEGIN
  RETURN QUERY
  SELECT
    css.sequence_number,
    css.status,
    css.sent_at,
    css.opened_at
  FROM campaign_sequence_sends css
  WHERE css.campaign_id = p_campaign_id AND css.contact_id = p_contact_id
  ORDER BY css.sequence_number;
END;
$$ LANGUAGE plpgsql;

-- 7) Helper function: check if contact should skip sequence (bounced/unsubscribed)
CREATE OR REPLACE FUNCTION should_skip_sequence(p_campaign_id UUID, p_contact_id UUID, p_sequence_number INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  prev_bounced BOOLEAN;
  contact_unsubscribed BOOLEAN;
BEGIN
  -- Check if any previous email in sequence bounced
  SELECT EXISTS(
    SELECT 1 FROM campaign_sequence_sends
    WHERE campaign_id = p_campaign_id
    AND contact_id = p_contact_id
    AND sequence_number < p_sequence_number
    AND status = 'bounced'
  ) INTO prev_bounced;
  
  -- Check if contact is unsubscribed
  SELECT EXISTS(
    SELECT 1 FROM campaign_sequence_sends
    WHERE campaign_id = p_campaign_id
    AND contact_id = p_contact_id
    AND status = 'unsubscribed'
  ) INTO contact_unsubscribed;
  
  RETURN prev_bounced OR contact_unsubscribed;
END;
$$ LANGUAGE plpgsql;
