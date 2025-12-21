-- Migration: 072-reward-expiration-cron.sql
-- Description: Create cron job for automatic reward points expiration
-- Created: 2025-12-22
-- Reference: Reward System Implementation Audit & Fixes

BEGIN;

-- ============================================
-- CRON JOB: Auto-Expire Reward Points
-- ============================================
-- Schedule: Daily at 01:00 UTC (08:00 WIB)
-- Purpose: Automatically expire points that are older than 12 months (FIFO)

-- Note: This requires pg_cron extension
-- Run this manually in Supabase SQL Editor if pg_cron is enabled
-- 
-- Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Remove existing job if exists
SELECT cron.unschedule('expire-reward-points-daily') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'expire-reward-points-daily'
);

-- Schedule new job
-- Daily at 01:00 UTC (08:00 WIB)
SELECT cron.schedule(
  'expire-reward-points-daily',
  '0 1 * * *', -- Daily at 01:00 UTC
  $$SELECT expire_reward_points()$$
);

-- ============================================
-- ALTERNATIVE: Manual trigger via API
-- ============================================
-- If pg_cron is not available, create an API endpoint that can be called
-- via external cron service (Vercel Cron, GitHub Actions, etc.)
-- See: app/api/admin/rewards/expire/route.ts

-- ============================================
-- VERIFICATION
-- ============================================
-- Run this query to verify cron job is scheduled:
-- SELECT * FROM cron.job WHERE jobname = 'expire-reward-points-daily';

-- To manually test expiration (for development):
-- SELECT expire_reward_points();

COMMIT;

