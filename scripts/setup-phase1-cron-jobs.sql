-- ============================================
-- Phase 1: Setup Cron Jobs
-- ============================================
-- Run this script in Supabase Dashboard > SQL Editor
-- 
-- Prerequisites:
-- 1. pg_cron extension must be enabled
-- 2. Migrations 057 and 058 must be run first
-- ============================================

-- Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================
-- Cron Job 1: Absence Detection (H+15)
-- ============================================
-- Schedule: Every 15 minutes
-- Purpose: Detect guides who haven't checked in 15 minutes after meeting time

-- Remove existing job if exists
SELECT cron.unschedule('detect-absence') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'detect-absence'
);

-- Schedule new job
SELECT cron.schedule(
  'detect-absence',                    -- Job name
  '*/15 * * * *',                      -- Schedule: every 15 minutes
  $$SELECT detect_guide_absence();$$    -- SQL to execute
);

-- ============================================
-- Cron Job 2: Auto-Delete Manifest (H+72)
-- ============================================
-- Schedule: Daily at 02:00 UTC (09:00 WIB)
-- Purpose: Automatically delete manifest data 72 hours after trip completion

-- Remove existing job if exists
SELECT cron.unschedule('auto-delete-manifest') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'auto-delete-manifest'
);

-- Schedule new job
SELECT cron.schedule(
  'auto-delete-manifest',                    -- Job name
  '0 2 * * *',                                -- Schedule: daily at 02:00 UTC
  $$SELECT auto_delete_manifest_data();$$     -- SQL to execute
);

-- ============================================
-- Verify Cron Jobs
-- ============================================
-- Run this query to verify cron jobs are scheduled:
-- SELECT jobid, jobname, schedule, command, active FROM cron.job WHERE jobname IN ('detect-absence', 'auto-delete-manifest');

-- ============================================
-- Manual Test (Optional)
-- ============================================
-- Test absence detection:
-- SELECT detect_guide_absence();

-- Test manifest deletion:
-- SELECT auto_delete_manifest_data();

