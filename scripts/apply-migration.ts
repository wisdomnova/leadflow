import { readFileSync } from 'fs';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

// Load .env
const envPath = resolve(process.cwd(), '.env');
for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const i = t.indexOf('=');
  if (i === -1) continue;
  const k = t.slice(0, i);
  let v = t.slice(i + 1);
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  if (!process.env[k]) process.env[k] = v;
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  db: { schema: 'public' }
});

// SQL statements — must be run one at a time through RPC
const statements = [
  // 1. Create lead_lists table
  `CREATE TABLE IF NOT EXISTS lead_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    color TEXT DEFAULT '#745DF3',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(org_id, name)
  )`,
  // 2. RLS
  `ALTER TABLE lead_lists ENABLE ROW LEVEL SECURITY`,
  // 3. Policy
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lead_lists' AND policyname = 'Users can manage their org lists') THEN
      CREATE POLICY "Users can manage their org lists" ON lead_lists FOR ALL
        USING (org_id = (current_setting('request.jwt.claims', true)::json->>'org_id')::uuid);
    END IF;
  END $$`,
  // 4. Create join table
  `CREATE TABLE IF NOT EXISTS lead_list_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    list_id UUID NOT NULL REFERENCES lead_lists(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(list_id, lead_id)
  )`,
  // 5. RLS
  `ALTER TABLE lead_list_memberships ENABLE ROW LEVEL SECURITY`,
  // 6. Policy
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lead_list_memberships' AND policyname = 'Users can manage memberships for their org lists') THEN
      CREATE POLICY "Users can manage memberships for their org lists" ON lead_list_memberships FOR ALL
        USING (list_id IN (SELECT id FROM lead_lists WHERE org_id = (current_setting('request.jwt.claims', true)::json->>'org_id')::uuid));
    END IF;
  END $$`,
  // 7. Add list_id to campaigns
  `ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS list_id UUID REFERENCES lead_lists(id) ON DELETE SET NULL`,
  // 8. Indexes
  `CREATE INDEX IF NOT EXISTS idx_lead_lists_org ON lead_lists(org_id)`,
  `CREATE INDEX IF NOT EXISTS idx_lead_list_memberships_list ON lead_list_memberships(list_id)`,
  `CREATE INDEX IF NOT EXISTS idx_lead_list_memberships_lead ON lead_list_memberships(lead_id)`,
  `CREATE INDEX IF NOT EXISTS idx_campaigns_list ON campaigns(list_id)`,
  // 9. RPC: get_list_lead_counts
  `CREATE OR REPLACE FUNCTION get_list_lead_counts(p_org_id UUID)
  RETURNS TABLE(list_id UUID, lead_count BIGINT)
  LANGUAGE sql STABLE
  AS $$
    SELECT m.list_id, COUNT(m.lead_id)
    FROM lead_list_memberships m
    JOIN lead_lists l ON l.id = m.list_id
    WHERE l.org_id = p_org_id
    GROUP BY m.list_id;
  $$`,
  // 10. RPC: get_leads_in_list
  `CREATE OR REPLACE FUNCTION get_leads_in_list(p_list_id UUID)
  RETURNS TABLE(id UUID, email TEXT)
  LANGUAGE sql STABLE
  AS $$
    SELECT l.id, l.email
    FROM leads l
    JOIN lead_list_memberships m ON m.lead_id = l.id
    WHERE m.list_id = p_list_id;
  $$`,
];

async function main() {
  console.log('Applying migration 0049_contact_lists...\n');

  for (let i = 0; i < statements.length; i++) {
    const sql = statements[i];
    const label = sql.trim().slice(0, 60).replace(/\n/g, ' ');
    process.stdout.write(`  [${i + 1}/${statements.length}] ${label}...`);

    const { error } = await (supabase as any).rpc('exec_sql', { query: sql });
    
    if (error) {
      // Try alternative: use the management API raw SQL
      console.log(` (trying raw)...`);
      // If exec_sql doesn't exist, we'll use a different approach
      const { error: err2 } = await (supabase as any).from('_exec').select('*');
      if (err2) {
        console.log(` ⚠️  ${error.message}`);
      }
    } else {
      console.log(' ✅');
    }
  }

  // Verify by testing the RPC
  console.log('\nVerifying migration...');
  const { data, error } = await supabase.rpc('get_list_lead_counts' as any, { p_org_id: '323203b7-9c2a-43b4-9dfd-9ca56e27e88e' });
  if (error) {
    console.log('❌ RPC not available:', error.message);
    console.log('\nYou may need to run this migration manually through the Supabase Dashboard SQL Editor.');
    console.log('Copy the contents of: supabase/migrations/0049_contact_lists.sql');
  } else {
    console.log('✅ Migration verified — get_list_lead_counts returns:', data);
  }
}

main();
