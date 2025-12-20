-- ============================================================================
-- LEADFLOW DATABASE SCHEMA - COMPLETE MIGRATIONS
-- ============================================================================
-- Consolidated SQL file with all database migrations
-- Execute this entire file to set up the Leadflow database
--
-- Database: Supabase PostgreSQL
-- Created: December 19, 2025
-- ============================================================================

-- ============================================================================
-- MIGRATION 001: Initial Schema
-- ============================================================================
-- Creates core tables for users, contacts, templates, campaigns, and billing

CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  price_monthly INTEGER NOT NULL,
  price_yearly INTEGER NOT NULL,
  email_limit INTEGER NOT NULL,
  user_limit INTEGER NOT NULL,
  features TEXT[] DEFAULT '{}',
  stripe_product_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  company_name VARCHAR(255),
  role VARCHAR(100),
  plan_id UUID REFERENCES plans(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  company VARCHAR(255),
  phone VARCHAR(20),
  website VARCHAR(255),
  tags TEXT[] DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active',
  last_activity TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(255),
  body TEXT,
  category VARCHAR(100),
  variables TEXT[] DEFAULT '{}',
  open_rate NUMERIC(5,2),
  reply_rate NUMERIC(5,2),
  times_used INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  template_id UUID REFERENCES email_templates(id),
  status VARCHAR(50) DEFAULT 'draft',
  sent_at TIMESTAMP,
  total_recipients INTEGER DEFAULT 0,
  open_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS campaign_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id),
  status VARCHAR(50) DEFAULT 'pending',
  opened_at TIMESTAMP,
  replied_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS billing_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(50) DEFAULT 'pending',
  invoice_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referral_link VARCHAR(255) UNIQUE,
  commission_rate NUMERIC(5,2) DEFAULT 15.00,
  total_earnings NUMERIC(10,2) DEFAULT 0,
  total_referrals INTEGER DEFAULT 0,
  active_subscriptions INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  referred_user_id UUID REFERENCES users(id),
  plan_id UUID REFERENCES plans(id),
  status VARCHAR(50) DEFAULT 'trial',
  earnings NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS api_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255),
  last_used TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP
);

-- ============================================================================
-- MIGRATION 004: Stripe Products
-- ============================================================================
-- Adds Stripe-related fields to plans table

ALTER TABLE plans 
ADD COLUMN IF NOT EXISTS stripe_price_id_monthly VARCHAR(255),
ADD COLUMN IF NOT EXISTS stripe_price_id_yearly VARCHAR(255);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_plans_stripe_product ON plans(stripe_product_id);
CREATE INDEX IF NOT EXISTS idx_plans_name ON plans(name);

-- ============================================================================
-- MIGRATION 005: Email Providers
-- ============================================================================
-- Creates tables for email provider configuration and logging

CREATE TABLE IF NOT EXISTS email_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  
  -- Gmail API
  gmail_access_token TEXT,
  gmail_refresh_token TEXT,
  gmail_expiry TIMESTAMP,
  
  -- Resend
  resend_api_key VARCHAR(255),
  
  -- SMTP
  smtp_host VARCHAR(255),
  smtp_port INTEGER,
  smtp_username VARCHAR(255),
  smtp_password VARCHAR(255),
  smtp_from_email VARCHAR(255),
  
  -- Skip
  skip_reason VARCHAR(255),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS email_provider_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  status VARCHAR(50),
  details TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_email_providers_user ON email_providers(user_id);
CREATE INDEX IF NOT EXISTS idx_email_providers_status ON email_providers(status);
CREATE INDEX IF NOT EXISTS idx_email_provider_logs_user ON email_provider_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_provider_logs_created ON email_provider_logs(created_at);

-- ============================================================================
-- MIGRATION 006: Payment Fields
-- ============================================================================
-- Adds payment and subscription tracking fields to users table

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'none',
ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS subscription_current_period_end TIMESTAMP,
ADD COLUMN IF NOT EXISTS billing_cycle VARCHAR(20) DEFAULT 'monthly';

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_stripe_subscription_id ON users(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_users_payment_status ON users(payment_status);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Create index on contacts for faster lookups
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);

-- Create index on campaigns for faster lookups
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);

-- Create index on campaign_recipients
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_campaign_id ON campaign_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_contact_id ON campaign_recipients(contact_id);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_status ON campaign_recipients(status);

-- ============================================================================
-- SEED DATA - DEFAULT PLANS
-- ============================================================================
-- Insert default plans with Stripe IDs

INSERT INTO plans (name, description, price_monthly, price_yearly, email_limit, user_limit, features, stripe_product_id, stripe_price_id_monthly, stripe_price_id_yearly)
VALUES 
  (
    'Trial',
    'Get started with Leadflow for free',
    0,
    0,
    100,
    1,
    ARRAY['Up to 100 contacts', 'Basic email templates', 'Limited campaigns', 'Email support'],
    'prod_TdQCRzBFbuvHTu',
    NULL,
    NULL
  ),
  (
    'Starter',
    'Perfect for individual sales professionals',
    2900,
    27800,
    10000,
    1,
    ARRAY['1 user, unlimited sending domains', '10,000 emails/month', 'Unlimited AI generator & personalization', 'AI subject lines & follow-up suggestions', 'Central inbox (Unibox)', 'Advanced analytics dashboard', 'Email & chat support'],
    'prod_TdQCRzBFbuvHTu',
    'price_1Sg9MBA7EYxH7wgxGptKpuHu',
    'price_1Sg9PNA7EYxH7wgxuDYOLXyQ'
  ),
  (
    'Growth',
    'Best for growing sales teams',
    9900,
    95000,
    100000,
    3,
    ARRAY['3 users, unlimited sending domains', '100,000 emails/month', 'Unlimited AI generator & personalization', 'AI subject lines & follow-up suggestions', 'Central inbox (Unibox)', 'Advanced analytics dashboard', 'Priority support (chat + email)'],
    'prod_TdQDStBMM7UG04',
    'price_1Sg9MzA7EYxH7wgx8gXPbni7',
    'price_1Sg9PmA7EYxH7wgxYjp7vTBw'
  ),
  (
    'Pro',
    'Enterprise-grade solution',
    29900,
    287000,
    1000000,
    10,
    ARRAY['Unlimited users & sending domains', 'Unlimited emails/month', 'Unlimited AI generator & personalization', 'Advanced segmentation & automation', 'Team collaboration & workflows', 'Full analytics & reporting', 'API access for integrations', 'Dedicated account manager', 'Priority 24/7 support', 'Custom integrations'],
    'prod_TdQDe5lTzymPYg',
    'price_1Sg9NMA7EYxH7wgxF6JEmjMa',
    'price_1Sg9QAA7EYxH7wgxCe6Fo37k'
  )
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View for user dashboard stats
CREATE OR REPLACE VIEW user_dashboard_stats AS
SELECT 
  u.id,
  u.email,
  COUNT(DISTINCT c.id) as total_contacts,
  COUNT(DISTINCT cam.id) as total_campaigns,
  COALESCE(SUM(cam.open_count), 0) as total_opens,
  COALESCE(SUM(cam.reply_count), 0) as total_replies,
  p.name as plan_name,
  u.payment_status,
  u.subscription_current_period_end
FROM users u
LEFT JOIN plans p ON u.plan_id = p.id
LEFT JOIN contacts c ON u.id = c.user_id
LEFT JOIN campaigns cam ON u.id = cam.user_id
GROUP BY u.id, u.email, p.name, u.payment_status, u.subscription_current_period_end;

-- ============================================================================
-- PAYMENT STATUS VALUES
-- ============================================================================
-- 'none'        - User hasn't started payment process
-- 'pending'     - User created but hasn't selected plan yet
-- 'processing'  - Currently at Stripe checkout
-- 'completed'   - Payment successful, subscription active
-- 'failed'      - Payment failed
-- 'cancelled'   - User cancelled subscription

-- ============================================================================
-- BILLING CYCLE VALUES
-- ============================================================================
-- 'monthly'  - Monthly billing
-- 'yearly'   - Annual billing (20% discount)
-- 'none'     - Trial/Free plan

-- ============================================================================
-- END OF MIGRATIONS
-- ============================================================================
