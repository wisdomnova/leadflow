-- Affiliate and Billing Logic Expansion
-- This migration adds support for the discount-based affiliate program and advanced billing fields

-- 1. Add affiliate columns to public.users (though orgs own subscriptions, users share IDs or we link orgs)
-- In LeadFlow, org_id is the primary unit of billing.
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES public.organizations(id) ON DELETE SET NULL;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS is_affiliate_eligible BOOLEAN DEFAULT false;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS current_discount_percent INTEGER DEFAULT 0;

-- 2. Referrals Table
CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    referred_org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    signup_date TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'churned')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(affiliate_org_id, referred_org_id)
);

-- 3. Affiliate Tiers Config (Internal Reference)
CREATE TABLE IF NOT EXISTS public.affiliate_tier_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL, -- 'Silver', 'Gold', 'Platinum'
    min_referrals INTEGER NOT NULL,
    discount_percent INTEGER NOT NULL,
    description TEXT
);

INSERT INTO public.affiliate_tier_config (name, min_referrals, discount_percent, description)
VALUES
    ('Silver', 1, 20, '1-5 Active Referrals: 20% Off Monthly'),
    ('Gold', 6, 50, '6-15 Active Referrals: 50% Off Monthly'),
    ('Platinum', 16, 100, '16+ Active Referrals: FREE Monthly Subscription')
ON CONFLICT (name) DO NOTHING;

-- 4. Subscription History (Invoices)
CREATE TABLE IF NOT EXISTS public.billing_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    stripe_invoice_id TEXT,
    amount_paid DECIMAL(10, 2),
    status TEXT, -- 'paid', 'open', 'uncollectible'
    invoice_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their org's referrals" ON public.referrals
    FOR SELECT USING (affiliate_org_id::text = (auth.jwt() ->> 'org_id'));

CREATE POLICY "Users can see their org's billing history" ON public.billing_history
    FOR SELECT USING (org_id::text = (auth.jwt() ->> 'org_id'));

-- Indexes
CREATE INDEX idx_referrals_affiliate_id ON public.referrals(affiliate_org_id);
CREATE INDEX idx_referrals_status ON public.referrals(status);
CREATE INDEX idx_billing_history_org_id ON public.billing_history(org_id);
