-- Supabase Cron Job: Daily warmup schedule reset
-- Run this SQL in your Supabase SQL Editor to configure the daily cron job

-- Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the Edge Function to run daily at midnight UTC
-- This calls the reset-warmup Edge Function every day at 00:00 UTC
SELECT cron.schedule(
  'reset-warmup-daily',
  '0 0 * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://hbmqnzrwdseokkaaookb.supabase.co/functions/v1/reset-warmup',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb
    ) AS request_id;
  $$
);

-- To view scheduled jobs:
-- SELECT * FROM cron.job;

-- To unschedule (if needed):
-- SELECT cron.unschedule('reset-warmup-daily');
