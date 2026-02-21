-- ============================================================================
-- Migration 0040: Referral System v2
-- Simple "both get 20%" model with anti-abuse tracking
-- ============================================================================

-- Drop old affiliate tier config if it exists (no longer used)
DROP TABLE IF EXISTS public.affiliate_tier_config CASCADE;

-- Recreate referrals table with anti-abuse columns
-- (drop and recreate — the old referrals table had different schema)
DROP TABLE IF EXISTS public.referrals CASCADE;

CREATE TABLE public.referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Parties
  referrer_org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  referred_org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  referred_user_email TEXT NOT NULL,
  
  -- Status: pending → rewarded | rejected
  -- pending  = user signed up but hasn't paid yet
  -- rewarded = first payment confirmed, both parties got 20% coupon
  -- rejected = flagged by anti-abuse and denied
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'rewarded', 'rejected')),
  
  -- Anti-abuse signals (captured at signup time)
  signup_ip INET,
  signup_fingerprint TEXT,          -- browser fingerprint hash
  signup_user_agent TEXT,
  signup_email_domain TEXT,         -- e.g. "gmail.com" — to detect domain clustering
  
  -- Referrer's IP at time they generated the link (for self-referral detection)
  referrer_ip INET,
  
  -- Abuse flags
  is_flagged BOOLEAN DEFAULT FALSE, -- auto-flagged for manual review
  flag_reason TEXT,                  -- why it was flagged
  reviewed_at TIMESTAMPTZ,          -- when admin reviewed
  reviewed_by UUID,                 -- admin who reviewed
  
  -- Stripe coupon references
  referrer_coupon_id TEXT,           -- Stripe coupon applied to referrer
  referred_coupon_id TEXT,           -- Stripe coupon applied to referred
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  rewarded_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT no_self_referral CHECK (referrer_org_id != referred_org_id),
  CONSTRAINT unique_referred UNIQUE (referred_org_id)  -- one org can only be referred once
);

-- Index for fast lookups
CREATE INDEX idx_referrals_referrer ON public.referrals(referrer_org_id);
CREATE INDEX idx_referrals_status ON public.referrals(status);
CREATE INDEX idx_referrals_signup_ip ON public.referrals(signup_ip);
CREATE INDEX idx_referrals_signup_fingerprint ON public.referrals(signup_fingerprint);

-- Ensure organizations has the columns we need
-- referral_code: unique code for sharing (already exists from signup, but ensure it's there)
-- referred_by: which org referred this one
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'referral_code') THEN
    ALTER TABLE public.organizations ADD COLUMN referral_code TEXT UNIQUE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'referred_by') THEN
    ALTER TABLE public.organizations ADD COLUMN referred_by UUID REFERENCES public.organizations(id) ON DELETE SET NULL;
  END IF;

  -- Drop old affiliate columns that are no longer needed
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'affiliate_link_code') THEN
    ALTER TABLE public.organizations DROP COLUMN affiliate_link_code;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'current_discount_percent') THEN
    ALTER TABLE public.organizations DROP COLUMN current_discount_percent;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'is_affiliate_eligible') THEN
    ALTER TABLE public.organizations DROP COLUMN is_affiliate_eligible;
  END IF;
END $$;

-- RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org referrals"
  ON public.referrals FOR SELECT
  USING (
    referrer_org_id = (current_setting('request.jwt.claims', true)::json->>'org_id')::uuid
    OR referred_org_id = (current_setting('request.jwt.claims', true)::json->>'org_id')::uuid
  );

-- Only service role can insert/update referrals
CREATE POLICY "Service role manages referrals"
  ON public.referrals FOR ALL
  USING (current_setting('role') = 'service_role');
