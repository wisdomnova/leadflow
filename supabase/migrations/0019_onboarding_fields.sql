-- Migration: Add onboarding fields to users and organizations
-- Description: Stores data collected during the multi-step onboarding flow.

-- Add role field to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_role TEXT;

-- Add onboarding fields to organizations
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS onboarding_goal TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS monthly_sends_estimate TEXT;

-- Add a flag to track if onboarding is completed
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
