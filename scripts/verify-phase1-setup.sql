-- ============================================
-- Phase 1: Verification Script
-- ============================================
-- Run this script to verify Phase 1 setup is correct
-- ============================================

-- 1. Check if functions exist
SELECT 
  'Functions Check' AS check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'detect_guide_absence') 
      AND EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'auto_delete_manifest_data')
    THEN '✅ All functions exist'
    ELSE '❌ Missing functions'
  END AS status;

-- 2. Check if tables exist
SELECT 
  'Tables Check' AS check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guide_absence_logs')
      AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guide_absence_notifications')
      AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'data_retention_logs')
    THEN '✅ All tables exist'
    ELSE '❌ Missing tables'
  END AS status;

-- 3. Check if pg_cron extension is enabled
SELECT 
  'Extension Check' AS check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron')
    THEN '✅ pg_cron extension enabled'
    ELSE '❌ pg_cron extension not enabled'
  END AS status;

-- 4. Check if cron jobs are scheduled
SELECT 
  'Cron Jobs Check' AS check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'detect-absence')
      AND EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'auto-delete-manifest')
    THEN '✅ All cron jobs scheduled'
    ELSE '❌ Missing cron jobs'
  END AS status;

-- 5. List all scheduled cron jobs
SELECT 
  jobid,
  jobname,
  schedule,
  command,
  active,
  CASE 
    WHEN active THEN '✅ Active'
    ELSE '❌ Inactive'
  END AS status
FROM cron.job 
WHERE jobname IN ('detect-absence', 'auto-delete-manifest')
ORDER BY jobname;

-- 6. Check RLS policies
SELECT 
  'RLS Policies Check' AS check_type,
  COUNT(*) AS policy_count
FROM pg_policies 
WHERE tablename IN ('guide_absence_logs', 'guide_absence_notifications', 'data_retention_logs');

-- 7. Check indexes
SELECT 
  'Indexes Check' AS check_type,
  COUNT(*) AS index_count
FROM pg_indexes 
WHERE tablename IN ('guide_absence_logs', 'guide_absence_notifications', 'data_retention_logs');

