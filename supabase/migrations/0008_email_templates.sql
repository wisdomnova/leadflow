-- Migration to add reusable templates table

CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    subject TEXT,
    body TEXT,
    category TEXT DEFAULT 'Cold Outreach',
    is_starred BOOLEAN DEFAULT false,
    
    -- Cache stats (can be updated by background jobs later)
    open_rate FLOAT DEFAULT 0.0,
    reply_rate FLOAT DEFAULT 0.0,
    use_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for organization-scoped lookups
CREATE INDEX IF NOT EXISTS idx_email_templates_org_id ON email_templates(org_id);

-- Enable RLS if not already handled by a broad policy
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Dynamic Policy: Users can only see/edit templates in their organization
CREATE POLICY "Users can manage their organization's templates"
ON email_templates
FOR ALL
USING (org_id IN (SELECT id FROM organizations));
