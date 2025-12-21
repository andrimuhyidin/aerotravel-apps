-- Migration: 066-manifest-audit-log.sql
-- Description: Manifest Access Audit Log for UU PDP compliance
-- Created: 2025-01-24

-- ============================================
-- MANIFEST ACCESS LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS manifest_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  guide_id UUID NOT NULL REFERENCES users(id),
  branch_id UUID NOT NULL REFERENCES branches(id),
  
  -- Access Details
  access_type VARCHAR(20) NOT NULL, -- 'view', 'download', 'export'
  accessed_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Metadata
  ip_address INET,
  user_agent TEXT,
  device_info JSONB,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_access_type CHECK (access_type IN ('view', 'download', 'export'))
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_manifest_access_logs_trip_id ON manifest_access_logs(trip_id);
CREATE INDEX IF NOT EXISTS idx_manifest_access_logs_guide_id ON manifest_access_logs(guide_id);
CREATE INDEX IF NOT EXISTS idx_manifest_access_logs_accessed_at ON manifest_access_logs(accessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_manifest_access_logs_branch_id ON manifest_access_logs(branch_id);

-- ============================================
-- FUNCTION: Get Manifest Access Summary
-- ============================================
CREATE OR REPLACE FUNCTION get_manifest_access_summary(p_trip_id UUID)
RETURNS TABLE (
  total_views INTEGER,
  total_downloads INTEGER,
  first_access TIMESTAMPTZ,
  last_access TIMESTAMPTZ,
  access_count_by_guide JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) FILTER (WHERE access_type = 'view')::INTEGER AS total_views,
    COUNT(*) FILTER (WHERE access_type = 'download')::INTEGER AS total_downloads,
    MIN(accessed_at) AS first_access,
    MAX(accessed_at) AS last_access,
    jsonb_object_agg(
      guide_id::TEXT,
      COUNT(*)::TEXT
    ) FILTER (WHERE guide_id IS NOT NULL) AS access_count_by_guide
  FROM manifest_access_logs
  WHERE trip_id = p_trip_id
  GROUP BY trip_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE manifest_access_logs ENABLE ROW LEVEL SECURITY;

-- Guides can view their own access logs
CREATE POLICY "Guides can view own access logs"
  ON manifest_access_logs
  FOR SELECT
  USING (auth.uid() = guide_id);

-- Admins can view all access logs
CREATE POLICY "Admins can view all access logs"
  ON manifest_access_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
        AND role IN ('super_admin', 'ops_admin')
    )
  );

-- System can insert access logs (via service role or authenticated user)
CREATE POLICY "System can insert access logs"
  ON manifest_access_logs
  FOR INSERT
  USING (true)
  WITH CHECK (auth.uid() = guide_id);

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE manifest_access_logs IS 'Audit log for manifest access (UU PDP compliance)';
COMMENT ON COLUMN manifest_access_logs.access_type IS 'Type of access: view (page view), download (PDF), export (data export)';
COMMENT ON FUNCTION get_manifest_access_summary IS 'Get summary of manifest access for a trip';

