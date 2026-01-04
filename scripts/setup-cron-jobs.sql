-- Setup Cron Jobs for Phase 3
-- Run this in Supabase SQL Editor

-- Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule Training Reminders (Daily at 08:00 UTC)
-- Note: This will fail if cron job already exists (safe to ignore)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'training-reminders-daily'
  ) THEN
    PERFORM cron.schedule(
      'training-reminders-daily',
      '0 8 * * *',
      'SELECT check_mandatory_training_reminders();'
    );
    RAISE NOTICE 'Cron job "training-reminders-daily" scheduled successfully';
  ELSE
    RAISE NOTICE 'Cron job "training-reminders-daily" already exists';
  END IF;
END $$;

-- Verify cron job
SELECT 
  jobid,
  jobname,
  schedule,
  command,
  active
FROM cron.job 
WHERE jobname = 'training-reminders-daily';

