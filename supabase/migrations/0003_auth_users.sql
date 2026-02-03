-- Auth Expansion: Users and Subscription Management

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'user')),
    
    -- Verification & Recovery
    is_verified BOOLEAN DEFAULT false,
    reset_token TEXT,
    reset_token_expires TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Extend Organizations for Subscription Tracking
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'pro', 'enterprise')),
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trialing' CHECK (subscription_status IN ('trialing', 'active', 'past_due', 'canceled', 'unpaid')),
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- 3. Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see themselves"
ON users
FOR SELECT
USING (
    id::text = (auth.jwt() ->> 'userId')
);

CREATE POLICY "Admins can manage organization users"
ON users
FOR ALL
USING (
    org_id::text = (auth.jwt() ->> 'org_id') AND
    (auth.jwt() ->> 'role') = 'admin'
);

-- Index for auth performance
CREATE INDEX idx_users_email ON users(email);
