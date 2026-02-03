-- Add join settings to organizations
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS join_token UUID DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS auto_join_enabled BOOLEAN DEFAULT false;

-- Create index for token lookups
CREATE INDEX IF NOT EXISTS idx_organizations_join_token ON organizations(join_token);
