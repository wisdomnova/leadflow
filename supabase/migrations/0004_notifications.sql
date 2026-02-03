-- Migration 006: Notifications Table
-- Description: Creates a table to store user notifications for various system events.

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) DEFAULT 'info', -- 'success', 'warning', 'info', 'error'
  category VARCHAR(50), -- 'email_events', 'billing_alerts', 'campaign_updates', 'system'
  is_read BOOLEAN DEFAULT FALSE,
  link VARCHAR(255), -- Optional link to redirect user
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create Policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications" 
ON notifications FOR SELECT 
USING (user_id::text = (auth.jwt() ->> 'userId'));

DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications" 
ON notifications FOR UPDATE 
USING (user_id::text = (auth.jwt() ->> 'userId'));

-- Create Index for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
