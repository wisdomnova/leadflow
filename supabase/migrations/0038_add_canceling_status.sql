-- Add 'canceling' to the subscription_status check constraint
-- This status is used when a user schedules cancellation (cancel_at_period_end = true)
-- They retain full access until the billing period ends

ALTER TABLE public.organizations DROP CONSTRAINT IF EXISTS organizations_subscription_status_check;

ALTER TABLE public.organizations ADD CONSTRAINT organizations_subscription_status_check 
  CHECK (subscription_status IN ('trialing', 'active', 'past_due', 'canceled', 'unpaid', 'canceling'));
