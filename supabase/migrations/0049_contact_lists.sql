-- ============================================================
-- 0049: Contact Lists — list-based contact segmentation
-- ============================================================
-- Creates a lead_lists table and a many-to-many join table
-- (lead_list_memberships) so contacts can belong to multiple
-- lists while campaigns target a specific list.

-- 1. lead_lists table
CREATE TABLE IF NOT EXISTS lead_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  color TEXT DEFAULT '#745DF3',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, name)
);

ALTER TABLE lead_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their org lists"
  ON lead_lists FOR ALL
  USING (org_id = (current_setting('request.jwt.claims', true)::json->>'org_id')::uuid);

-- 2. lead_list_memberships (many-to-many join)
CREATE TABLE IF NOT EXISTS lead_list_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES lead_lists(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(list_id, lead_id)
);

ALTER TABLE lead_list_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage memberships for their org lists"
  ON lead_list_memberships FOR ALL
  USING (
    list_id IN (SELECT id FROM lead_lists WHERE org_id = (current_setting('request.jwt.claims', true)::json->>'org_id')::uuid)
  );

-- 3. Add list_id to campaigns (optional — campaign can target a list)
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS list_id UUID REFERENCES lead_lists(id) ON DELETE SET NULL;

-- 4. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_lead_lists_org ON lead_lists(org_id);
CREATE INDEX IF NOT EXISTS idx_lead_list_memberships_list ON lead_list_memberships(list_id);
CREATE INDEX IF NOT EXISTS idx_lead_list_memberships_lead ON lead_list_memberships(lead_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_list ON campaigns(list_id);

-- 5. Helper RPC: Get lead count per list
CREATE OR REPLACE FUNCTION get_list_lead_counts(p_org_id UUID)
RETURNS TABLE(list_id UUID, lead_count BIGINT)
LANGUAGE sql STABLE
AS $$
  SELECT m.list_id, COUNT(m.lead_id)
  FROM lead_list_memberships m
  JOIN lead_lists l ON l.id = m.list_id
  WHERE l.org_id = p_org_id
  GROUP BY m.list_id;
$$;

-- 6. Helper RPC: Get lead IDs in a list (for campaign launch)
CREATE OR REPLACE FUNCTION get_leads_in_list(p_list_id UUID)
RETURNS TABLE(id UUID, email TEXT)
LANGUAGE sql STABLE
AS $$
  SELECT l.id, l.email
  FROM leads l
  JOIN lead_list_memberships m ON m.lead_id = l.id
  WHERE m.list_id = p_list_id;
$$;
