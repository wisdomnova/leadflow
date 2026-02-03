-- Policies for Custom JWT Multi-tenancy
-- Assumes 'org_id' is a claim in the JWT

-- Organization Policies
CREATE POLICY "Users can see their own organization"
ON organizations
FOR SELECT
USING (
    id::text = (auth.jwt() ->> 'org_id')
);

-- Email Account Policies
CREATE POLICY "Users can see organization email accounts"
ON email_accounts
FOR SELECT
USING (
    org_id::text = (auth.jwt() ->> 'org_id')
);

CREATE POLICY "Admins can manage email accounts"
ON email_accounts
FOR ALL
USING (
    org_id::text = (auth.jwt() ->> 'org_id') AND
    (auth.jwt() ->> 'role') = 'admin'
);

-- Campaign Policies
CREATE POLICY "Users can see organization campaigns"
ON campaigns
FOR SELECT
USING (
    org_id::text = (auth.jwt() ->> 'org_id')
);

CREATE POLICY "Admins can manage campaigns"
ON campaigns
FOR ALL
USING (
    org_id::text = (auth.jwt() ->> 'org_id') AND
    (auth.jwt() ->> 'role') = 'admin'
);

-- Leads Policies
CREATE POLICY "Users can see organization leads"
ON leads
FOR ALL
USING (
    org_id::text = (auth.jwt() ->> 'org_id')
);

-- Activity Log Policies
CREATE POLICY "Users can see organization activity"
ON activity_log
FOR SELECT
USING (
    org_id::text = (auth.jwt() ->> 'org_id')
);

-- Analytics Policies
CREATE POLICY "Users can see organization analytics"
ON analytics_daily
FOR SELECT
USING (
    org_id::text = (auth.jwt() ->> 'org_id')
);
