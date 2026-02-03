-- Add update policy for organizations
CREATE POLICY "Admins can update their own organization"
ON organizations
FOR UPDATE
USING (
    id::text = (auth.jwt() ->> 'org_id') AND
    (auth.jwt() ->> 'role') = 'admin'
)
WITH CHECK (
    id::text = (auth.jwt() ->> 'org_id') AND
    (auth.jwt() ->> 'role') = 'admin'
);
