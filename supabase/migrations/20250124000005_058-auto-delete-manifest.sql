-- Migration: 058-auto-delete-manifest.sql
-- Description: Auto-Delete Manifest Data (H+72) - Automatically delete manifest data 72 hours after trip completion
-- Created: 2025-01-24
-- 
-- Features:
-- - Auto-delete manifest data 72 hours after trip completion
-- - Soft delete for audit trail
-- - Log deletion for compliance
-- - Cron job ready (to be configured in Supabase)

-- ============================================
-- TABLE: data_retention_logs
-- ============================================
CREATE TABLE IF NOT EXISTS data_retention_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES branches(id),
  
  -- Deletion Info
  table_name VARCHAR(100) NOT NULL,
  record_id UUID,
  record_type VARCHAR(50), -- 'manifest', 'trip_data', etc.
  trip_id UUID REFERENCES trips(id),
  
  -- Deletion Details
  deleted_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_by UUID REFERENCES users(id), -- NULL for auto-deletion
  deletion_reason TEXT,
  retention_period_hours INTEGER, -- e.g., 72
  
  -- Metadata (for audit)
  metadata JSONB,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_data_retention_logs_trip_id ON data_retention_logs(trip_id);
CREATE INDEX IF NOT EXISTS idx_data_retention_logs_table_name ON data_retention_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_data_retention_logs_deleted_at ON data_retention_logs(deleted_at);

-- ============================================
-- FUNCTION: auto_delete_manifest_data()
-- ============================================
CREATE OR REPLACE FUNCTION auto_delete_manifest_data()
RETURNS TABLE (
  deleted_count INTEGER,
  trips_processed INTEGER
) AS $$
DECLARE
  deleted_trips INTEGER := 0;
  deleted_manifest_checks INTEGER := 0;
  deleted_manifest_details INTEGER := 0;
  trip_record RECORD;
  cutoff_time TIMESTAMPTZ;
BEGIN
  -- Calculate cutoff time: 72 hours ago
  cutoff_time := NOW() - INTERVAL '72 hours';
  
  -- Find completed trips older than 72 hours
  FOR trip_record IN
    SELECT id, trip_code, branch_id, completed_at
    FROM trips
    WHERE status = 'completed'
      AND completed_at IS NOT NULL
      AND completed_at < cutoff_time
      AND NOT EXISTS (
        -- Exclude if already deleted in logs
        SELECT 1 FROM data_retention_logs
        WHERE table_name = 'trip_manifest'
          AND trip_id = trips.id
          AND deleted_at::DATE = CURRENT_DATE
      )
  LOOP
    -- Delete manifest_checks for this trip
    DELETE FROM manifest_checks
    WHERE trip_id = trip_record.id;
    
    GET DIAGNOSTICS deleted_manifest_checks = ROW_COUNT;
    
    -- Delete manifest_details for this trip
    DELETE FROM manifest_details
    WHERE trip_id = trip_record.id;
    
    GET DIAGNOSTICS deleted_manifest_details = ROW_COUNT;
    
    -- Delete trip_manifest for this trip (soft delete by setting deleted_at)
    UPDATE trip_manifest
    SET deleted_at = NOW(),
        updated_at = NOW()
    WHERE trip_id = trip_record.id
      AND deleted_at IS NULL;
    
    -- Log deletion
    INSERT INTO data_retention_logs (
      branch_id,
      table_name,
      record_id,
      record_type,
      trip_id,
      deleted_at,
      deletion_reason,
      retention_period_hours,
      metadata
    ) VALUES (
      trip_record.branch_id,
      'trip_manifest',
      trip_record.id,
      'manifest',
      trip_record.id,
      NOW(),
      'Auto-deletion after 72 hours (H+72)',
      72,
      jsonb_build_object(
        'trip_code', trip_record.trip_code,
        'completed_at', trip_record.completed_at,
        'manifest_checks_deleted', deleted_manifest_checks,
        'manifest_details_deleted', deleted_manifest_details
      )
    );
    
    deleted_trips := deleted_trips + 1;
  END LOOP;
  
  RETURN QUERY SELECT
    (deleted_manifest_checks + deleted_manifest_details)::INTEGER AS deleted_count,
    deleted_trips AS trips_processed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: clear_manifest_indexeddb(trip_id UUID)
-- ============================================
-- This function is called from API endpoint to clear IndexedDB
-- The actual IndexedDB cleanup is handled client-side via API call
CREATE OR REPLACE FUNCTION clear_manifest_indexeddb(trip_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- This function is a placeholder for API endpoint
  -- Actual IndexedDB cleanup is done via API: /api/admin/manifest/cleanup
  -- This function can be used to mark trips as "indexeddb_cleared"
  
  UPDATE trip_manifest
  SET updated_at = NOW()
  WHERE trip_id = trip_id_param;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE data_retention_logs ENABLE ROW LEVEL SECURITY;

-- Allow admins to view all retention logs
CREATE POLICY "Admins can view all retention logs"
  ON data_retention_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
        AND role IN ('super_admin', 'ops_admin')
    )
  );

-- Allow system to insert retention logs (via service role)
CREATE POLICY "System can insert retention logs"
  ON data_retention_logs
  FOR INSERT
  USING (true)
  WITH CHECK (true);

-- ============================================
-- CRON JOB SETUP (to be configured in Supabase Dashboard)
-- ============================================
-- Run daily at 02:00 UTC: 0 2 * * *
-- SQL: SELECT auto_delete_manifest_data();
--
-- To setup in Supabase:
-- 1. Go to Database > Extensions
-- 2. Enable pg_cron extension
-- 3. Run: SELECT cron.schedule('auto-delete-manifest', '0 2 * * *', 'SELECT auto_delete_manifest_data();');

COMMENT ON FUNCTION auto_delete_manifest_data() IS 'Automatically deletes manifest data 72 hours after trip completion (H+72)';
COMMENT ON TABLE data_retention_logs IS 'Logs of data retention deletions for compliance audit';

