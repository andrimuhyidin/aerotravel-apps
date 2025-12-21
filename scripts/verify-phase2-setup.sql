-- Verification Script: Phase 2 Setup
-- Run this script di Supabase SQL Editor untuk verify semua Phase 2 features

-- ============================================
-- 1. CHECK TABLES
-- ============================================
DO $$
DECLARE
  missing_tables TEXT[] := ARRAY[]::TEXT[];
  required_tables TEXT[] := ARRAY[
    'pre_trip_assessments',
    'safety_briefings',
    'sos_location_history',
    'manifest_access_logs',
    'risk_assessment_overrides'
  ];
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY required_tables
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = tbl
    ) THEN
      missing_tables := array_append(missing_tables, tbl);
    END IF;
  END LOOP;
  
  IF array_length(missing_tables, 1) > 0 THEN
    RAISE WARNING 'Missing tables: %', array_to_string(missing_tables, ', ');
  ELSE
    RAISE NOTICE '✅ All required tables exist';
  END IF;
END $$;

-- ============================================
-- 2. CHECK COLUMNS
-- ============================================
-- Check pre_trip_assessments.weather_data
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pre_trip_assessments' AND column_name = 'weather_data'
  ) THEN
    RAISE NOTICE '✅ pre_trip_assessments.weather_data column exists';
  ELSE
    RAISE WARNING '❌ pre_trip_assessments.weather_data column missing';
  END IF;
END $$;

-- Check safety_briefings columns
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'safety_briefings' AND column_name = 'generated_at'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'safety_briefings' AND column_name = 'language'
  ) THEN
    RAISE NOTICE '✅ safety_briefings enhancement columns exist';
  ELSE
    RAISE WARNING '❌ safety_briefings enhancement columns missing';
  END IF;
END $$;

-- Check sos_alerts streaming columns
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sos_alerts' AND column_name = 'streaming_active'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sos_alerts' AND column_name = 'last_location_update'
  ) THEN
    RAISE NOTICE '✅ sos_alerts streaming columns exist';
  ELSE
    RAISE WARNING '❌ sos_alerts streaming columns missing';
  END IF;
END $$;

-- ============================================
-- 3. CHECK FUNCTIONS
-- ============================================
DO $$
DECLARE
  missing_functions TEXT[] := ARRAY[]::TEXT[];
  required_functions TEXT[] := ARRAY[
    'calculate_risk_score',
    'get_risk_level',
    'start_sos_streaming',
    'stop_sos_streaming',
    'get_active_sos_alerts',
    'get_manifest_access_summary',
    'get_guide_risk_trends',
    'detect_unsafe_risk_patterns'
  ];
  func TEXT;
BEGIN
  FOREACH func IN ARRAY required_functions
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_proc 
      WHERE proname = func
    ) THEN
      missing_functions := array_append(missing_functions, func);
    END IF;
  END LOOP;
  
  IF array_length(missing_functions, 1) > 0 THEN
    RAISE WARNING 'Missing functions: %', array_to_string(missing_functions, ', ');
  ELSE
    RAISE NOTICE '✅ All required functions exist';
  END IF;
END $$;

-- ============================================
-- 4. CHECK INDEXES
-- ============================================
DO $$
DECLARE
  missing_indexes TEXT[] := ARRAY[]::TEXT[];
  required_indexes TEXT[] := ARRAY[
    'idx_sos_location_history_sos_alert_id',
    'idx_sos_location_history_recorded_at',
    'idx_manifest_access_logs_trip_id',
    'idx_manifest_access_logs_guide_id',
    'idx_manifest_access_logs_accessed_at',
    'idx_risk_overrides_assessment_id',
    'idx_risk_overrides_trip_id',
    'idx_safety_briefings_generated_at',
    'idx_safety_briefings_language'
  ];
  idx TEXT;
BEGIN
  FOREACH idx IN ARRAY required_indexes
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = idx
    ) THEN
      missing_indexes := array_append(missing_indexes, idx);
    END IF;
  END LOOP;
  
  IF array_length(missing_indexes, 1) > 0 THEN
    RAISE WARNING 'Missing indexes: %', array_to_string(missing_indexes, ', ');
  ELSE
    RAISE NOTICE '✅ All required indexes exist';
  END IF;
END $$;

-- ============================================
-- 5. CHECK RLS POLICIES
-- ============================================
DO $$
DECLARE
  tables_without_rls TEXT[] := ARRAY[]::TEXT[];
  required_tables TEXT[] := ARRAY[
    'pre_trip_assessments',
    'safety_briefings',
    'sos_location_history',
    'manifest_access_logs',
    'risk_assessment_overrides'
  ];
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY required_tables
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_tables 
      WHERE tablename = tbl AND rowsecurity = true
    ) THEN
      tables_without_rls := array_append(tables_without_rls, tbl);
    END IF;
  END LOOP;
  
  IF array_length(tables_without_rls, 1) > 0 THEN
    RAISE WARNING 'Tables without RLS: %', array_to_string(tables_without_rls, ', ');
  ELSE
    RAISE NOTICE '✅ All tables have RLS enabled';
  END IF;
END $$;

-- ============================================
-- 6. TEST FUNCTIONS
-- ============================================
-- Test risk score calculation
DO $$
DECLARE
  test_score INTEGER;
BEGIN
  test_score := calculate_risk_score(2.0, 30.0, 'stormy', false, false);
  IF test_score > 70 THEN
    RAISE NOTICE '✅ Risk score calculation works (test score: %)', test_score;
  ELSE
    RAISE WARNING '❌ Risk score calculation may be incorrect (test score: %, expected > 70)', test_score;
  END IF;
END $$;

-- Test risk level
DO $$
DECLARE
  test_level TEXT;
BEGIN
  test_level := get_risk_level(75);
  IF test_level IN ('high', 'critical') THEN
    RAISE NOTICE '✅ Risk level function works (test level: %)', test_level;
  ELSE
    RAISE WARNING '❌ Risk level function may be incorrect (test level: %)', test_level;
  END IF;
END $$;

-- ============================================
-- 7. SUMMARY
-- ============================================
SELECT 
  'Phase 2 Setup Verification' AS check_type,
  CASE 
    WHEN (
      SELECT COUNT(*) FROM information_schema.tables 
      WHERE table_name IN (
        'pre_trip_assessments', 'safety_briefings', 'sos_location_history',
        'manifest_access_logs', 'risk_assessment_overrides'
      )
    ) = 5 THEN '✅ PASS'
    ELSE '❌ FAIL'
  END AS tables_check,
  CASE 
    WHEN (
      SELECT COUNT(*) FROM pg_proc 
      WHERE proname IN (
        'calculate_risk_score', 'get_risk_level', 'start_sos_streaming',
        'stop_sos_streaming', 'get_active_sos_alerts', 'get_manifest_access_summary',
        'get_guide_risk_trends', 'detect_unsafe_risk_patterns'
      )
    ) = 8 THEN '✅ PASS'
    ELSE '❌ FAIL'
  END AS functions_check,
  CASE 
    WHEN (
      SELECT COUNT(*) FROM pg_tables 
      WHERE tablename IN (
        'pre_trip_assessments', 'safety_briefings', 'sos_location_history',
        'manifest_access_logs', 'risk_assessment_overrides'
      ) AND rowsecurity = true
    ) = 5 THEN '✅ PASS'
    ELSE '❌ FAIL'
  END AS rls_check;

