-- Fix RLS policies to use 'app_role' instead of 'role'
-- This avoids the "role 'admin' does not exist" error from PostgREST/Postgres

-- 1. Organizations Policies
DROP POLICY IF EXISTS "Admins can update their organization" ON organizations;
CREATE POLICY "Admins can update their organization" ON organizations FOR UPDATE USING (id::text = (auth.jwt() ->> 'org_id') AND (auth.jwt() ->> 'app_role') = 'admin');

DROP POLICY IF EXISTS "Admins can delete their organization" ON organizations;
CREATE POLICY "Admins can delete their organization" ON organizations FOR DELETE USING (id::text = (auth.jwt() ->> 'org_id') AND (auth.jwt() ->> 'app_role') = 'admin');

-- 2. Users Policies
DROP POLICY IF EXISTS "Admins can manage organization users" ON users;
CREATE POLICY "Admins can manage organization users" ON users FOR ALL USING (
  org_id::text = (auth.jwt() ->> 'org_id') AND 
  (
    (auth.jwt() ->> 'app_role') = 'admin' OR 
    (auth.jwt() ->> 'role') = 'admin'
  )
);

-- 3. Email Accounts
DROP POLICY IF EXISTS "Admins can manage email accounts" ON email_accounts;
CREATE POLICY "Admins can manage email accounts" ON email_accounts FOR ALL USING (org_id::text = (auth.jwt() ->> 'org_id') AND (auth.jwt() ->> 'app_role') = 'admin');

-- 4. Campaigns
DROP POLICY IF EXISTS "Admins can manage campaigns" ON campaigns;
CREATE POLICY "Admins can manage campaigns" ON campaigns FOR ALL USING (org_id::text = (auth.jwt() ->> 'org_id') AND (auth.jwt() ->> 'app_role') = 'admin');
