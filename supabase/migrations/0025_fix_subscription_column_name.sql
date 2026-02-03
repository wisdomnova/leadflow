-- Fix column naming mismatch between migration and code
-- Rename stripe_subscription_id to subscription_id

ALTER TABLE organizations 
RENAME COLUMN stripe_subscription_id TO subscription_id;

-- Add index for webhook performance
CREATE INDEX IF NOT EXISTS idx_orgs_subscription_id ON organizations(subscription_id);
