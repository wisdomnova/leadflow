-- Add tags to leads for better segmentation
ALTER TABLE leads ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Add unique index for email within an organization to prevent duplicates
-- (This was already in the initial schema but good to ensure)
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_org_email ON leads(org_id, email);
