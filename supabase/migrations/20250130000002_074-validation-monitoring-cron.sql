-- Migration: 074-validation-monitoring-cron.sql
-- Description: Validation monitoring with cron job and logs
-- Created: 2025-01-30

-- ============================================
-- VALIDATION LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS validation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Validation Run Info
  validation_type VARCHAR(50) NOT NULL, -- 'trips', 'guides', 'payments', 'contracts', 'all'
  run_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Results
  total_checks INTEGER NOT NULL DEFAULT 0,
  passed INTEGER NOT NULL DEFAULT 0,
  failed INTEGER NOT NULL DEFAULT 0,
  warnings INTEGER NOT NULL DEFAULT 0,
  criticals INTEGER NOT NULL DEFAULT 0,
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'running', -- 'running', 'completed', 'failed'
  
  -- Detailed Results (JSONB for flexibility)
  results JSONB, -- Full validation results
  
  -- Error Info (if failed)
  error_message TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_validation_logs_run_at ON validation_logs(run_at DESC);
CREATE INDEX IF NOT EXISTS idx_validation_logs_status ON validation_logs(status);
CREATE INDEX IF NOT EXISTS idx_validation_logs_validation_type ON validation_logs(validation_type);
CREATE INDEX IF NOT EXISTS idx_validation_logs_criticals ON validation_logs(criticals DESC) WHERE criticals > 0;

-- ============================================
-- FUNCTION: Run Daily Validation Check
-- ============================================
CREATE OR REPLACE FUNCTION run_daily_validation_check()
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
  v_trips_count INTEGER := 0;
  v_trips_passed INTEGER := 0;
  v_trips_failed INTEGER := 0;
  v_trips_warnings INTEGER := 0;
  v_trips_criticals INTEGER := 0;
  v_guides_count INTEGER := 0;
  v_guides_passed INTEGER := 0;
  v_guides_failed INTEGER := 0;
  v_guides_warnings INTEGER := 0;
  v_guides_criticals INTEGER := 0;
  v_trip_result RECORD;
  v_guide_result RECORD;
  v_total_checks INTEGER := 0;
  v_total_passed INTEGER := 0;
  v_total_failed INTEGER := 0;
  v_total_warnings INTEGER := 0;
  v_total_criticals INTEGER := 0;
  v_results JSONB;
BEGIN
  -- Create log entry
  INSERT INTO validation_logs (
    validation_type,
    status,
    run_at
  ) VALUES (
    'all',
    'running',
    NOW()
  ) RETURNING id INTO v_log_id;

  BEGIN
    -- Validate trips
    FOR v_trip_result IN
      SELECT * FROM validate_all_trips_integrity()
    LOOP
      v_trips_count := v_trips_count + 1;
      IF v_trip_result.issues_count > 0 THEN
        v_trips_failed := v_trips_failed + 1;
        v_trips_criticals := v_trips_criticals + COALESCE(v_trip_result.critical_count, 0);
        v_trips_warnings := v_trips_warnings + COALESCE(v_trip_result.warnings_count, 0);
      ELSE
        v_trips_passed := v_trips_passed + 1;
      END IF;
    END LOOP;

    -- Validate guides
    FOR v_guide_result IN
      SELECT * FROM validate_all_guides_integrity()
    LOOP
      v_guides_count := v_guides_count + 1;
      IF v_guide_result.issues_count > 0 THEN
        v_guides_failed := v_guides_failed + 1;
        v_guides_criticals := v_guides_criticals + COALESCE(v_guide_result.critical_count, 0);
        v_guides_warnings := v_guides_warnings + COALESCE(v_guide_result.warnings_count, 0);
      ELSE
        v_guides_passed := v_guides_passed + 1;
      END IF;
    END LOOP;

    -- Calculate totals
    v_total_checks := v_trips_count + v_guides_count;
    v_total_passed := v_trips_passed + v_guides_passed;
    v_total_failed := v_trips_failed + v_guides_failed;
    v_total_warnings := v_trips_warnings + v_guides_warnings;
    v_total_criticals := v_trips_criticals + v_guides_criticals;

    -- Build results JSON
    v_results := jsonb_build_object(
      'trips', jsonb_build_object(
        'checked', v_trips_count,
        'passed', v_trips_passed,
        'failed', v_trips_failed,
        'warnings', v_trips_warnings,
        'criticals', v_trips_criticals
      ),
      'guides', jsonb_build_object(
        'checked', v_guides_count,
        'passed', v_guides_passed,
        'failed', v_guides_failed,
        'warnings', v_guides_warnings,
        'criticals', v_guides_criticals
      )
    );

    -- Update log entry
    UPDATE validation_logs
    SET 
      total_checks = v_total_checks,
      passed = v_total_passed,
      failed = v_total_failed,
      warnings = v_total_warnings,
      criticals = v_total_criticals,
      status = 'completed',
      results = v_results
    WHERE id = v_log_id;

  EXCEPTION
    WHEN OTHERS THEN
      -- Log error
      UPDATE validation_logs
      SET 
        status = 'failed',
        error_message = SQLERRM
      WHERE id = v_log_id;
      
      RAISE;
  END;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Get Validation Summary (for alerts)
-- ============================================
CREATE OR REPLACE FUNCTION get_validation_summary(p_hours INTEGER DEFAULT 24)
RETURNS TABLE(
  total_runs INTEGER,
  last_run_at TIMESTAMPTZ,
  total_criticals INTEGER,
  total_warnings INTEGER,
  needs_attention BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER AS total_runs,
    MAX(run_at) AS last_run_at,
    SUM(criticals)::INTEGER AS total_criticals,
    SUM(warnings)::INTEGER AS total_warnings,
    (SUM(criticals) > 0 OR SUM(warnings) > 10) AS needs_attention
  FROM validation_logs
  WHERE run_at >= NOW() - (p_hours || ' hours')::INTERVAL
    AND status = 'completed';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- CRON JOB SCHEDULE
-- ============================================
-- Schedule job to run daily at 02:00 AM
-- Note: Uncomment when ready to use (requires pg_cron extension enabled)
/*
SELECT cron.schedule(
  'daily-validation-check',
  '0 2 * * *',  -- Daily at 02:00 AM
  $$SELECT run_daily_validation_check();$$
);
*/

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE validation_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view validation logs
CREATE POLICY "Admins can view validation logs"
  ON validation_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
        AND role IN ('super_admin', 'ops_admin', 'finance_manager')
    )
  );

-- System can insert validation logs (via service role)
-- No INSERT policy needed - service role bypasses RLS

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE validation_logs IS 
  'Logs for automated data validation runs. Stores summary results for monitoring and alerting.';

COMMENT ON FUNCTION run_daily_validation_check() IS 
  'Run comprehensive validation check on all trips and guides. Returns log ID.';

COMMENT ON FUNCTION get_validation_summary(INTEGER) IS 
  'Get validation summary for the last N hours. Returns stats and needs_attention flag.';

