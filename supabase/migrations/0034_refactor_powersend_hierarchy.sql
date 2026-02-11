-- Migration to align PowerSend with Mailreef architecture
-- 1. Make domain_name optional on smart_servers
ALTER TABLE public.smart_servers ALTER COLUMN domain_name DROP NOT NULL;
ALTER TABLE public.smart_servers DROP CONSTRAINT IF EXISTS smart_servers_domain_name_key;

-- 2. Link email accounts to smart servers
ALTER TABLE public.email_accounts ADD COLUMN IF NOT EXISTS server_id UUID REFERENCES public.smart_servers(id) ON DELETE SET NULL;

-- 3. Link domains to smart servers
ALTER TABLE public.sending_domains ADD COLUMN IF NOT EXISTS server_id UUID REFERENCES public.smart_servers(id) ON DELETE SET NULL;

-- Update RLS for email_accounts to ensure users can see their own
-- (Already handled by org_id policy in 0002_rls_policies.sql probably)
