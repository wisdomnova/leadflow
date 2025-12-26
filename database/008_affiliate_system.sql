-- Affiliate System Migration
-- This migration adds support for the discount-based affiliate program

-- 1. Add affiliate columns to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20) UNIQUE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_affiliate BOOLEAN DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS affiliate_tier VARCHAR(50) DEFAULT 'none'; -- none, starter, tier1, tier2, tier3
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS affiliate_status VARCHAR(50) DEFAULT 'inactive'; -- inactive, active, suspended

-- Create affiliate_referrals table to track all referrals
CREATE TABLE IF NOT EXISTS public.affiliate_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  signup_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  thirty_day_mark_date TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'pending', -- pending, active, churned, disqualified
  subscription_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(affiliate_id, referred_user_id)
);

-- Create affiliate_tiers table to track tier changes and history
CREATE TABLE IF NOT EXISTS public.affiliate_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  tier VARCHAR(50) NOT NULL, -- starter, tier1, tier2, tier3
  active_referral_count INT DEFAULT 0,
  discount_percentage INT DEFAULT 0,
  stripe_coupon_id VARCHAR(255),
  effective_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_date TIMESTAMP WITH TIME ZONE,
  next_billing_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create affiliate_discount_config table for tier definitions
CREATE TABLE IF NOT EXISTS public.affiliate_discount_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier VARCHAR(50) UNIQUE NOT NULL, -- starter, tier1, tier2, tier3
  min_referrals INT NOT NULL,
  max_referrals INT,
  discount_percentage INT NOT NULL,
  stripe_coupon_id VARCHAR(255),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create affiliate_applications table for audit trail
CREATE TABLE IF NOT EXISTS public.affiliate_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'approved', -- applied, approved, rejected, suspended
  application_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_date TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default tier configurations
INSERT INTO public.affiliate_discount_config (tier, min_referrals, max_referrals, discount_percentage, description)
VALUES
  ('starter', 0, 5, 100, 'Entry tier: 100% discount on Starter plan'),
  ('tier1', 1, 5, 50, '1-5 active referrals: 50% discount on Starter'),
  ('tier2', 6, 10, 100, '6-10 active referrals: FREE Starter plan'),
  ('tier3', 11, 9999, 99, '11+ active referrals: FREE Professional plan')
ON CONFLICT (tier) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_affiliate_id ON public.affiliate_referrals(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_referred_user_id ON public.affiliate_referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_status ON public.affiliate_referrals(status);
CREATE INDEX IF NOT EXISTS idx_affiliate_tiers_user_id ON public.affiliate_tiers(user_id);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON public.users(referral_code);
CREATE INDEX IF NOT EXISTS idx_users_referred_by ON public.users(referred_by);
CREATE INDEX IF NOT EXISTS idx_users_is_affiliate ON public.users(is_affiliate);
CREATE INDEX IF NOT EXISTS idx_affiliate_applications_user_id ON public.affiliate_applications(user_id);
