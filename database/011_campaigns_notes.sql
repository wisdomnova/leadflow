-- Add notes field to campaigns table for production use
-- This allows users to annotate campaigns with internal notes (goals, follow-up strategy, etc.)

ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS body TEXT;

-- Create index on notes for potential searching
CREATE INDEX IF NOT EXISTS idx_campaigns_notes ON campaigns(notes);
