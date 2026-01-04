-- Migration: 201-near-miss-reports.sql
-- Description: Near-miss reporting for ISO 45001 preventive safety
-- Created: 2026-01-04

-- ============================================
-- NEAR-MISS REPORTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS near_miss_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
  guide_id UUID NOT NULL REFERENCES users(id),
  branch_id UUID NOT NULL REFERENCES branches(id),
  
  -- Incident Details
  incident_date DATE NOT NULL,
  location TEXT,
  description TEXT NOT NULL CHECK (LENGTH(description) >= 10),
  potential_consequence TEXT,
  contributing_factors TEXT[],
  corrective_actions TEXT,
  
  -- Severity Assessment
  potential_severity VARCHAR(20) DEFAULT 'minor', -- 'minor', 'moderate', 'major', 'critical'
  likelihood VARCHAR(20) DEFAULT 'unlikely', -- 'unlikely', 'possible', 'likely'
  
  -- Status Tracking
  status VARCHAR(20) DEFAULT 'reported', -- 'reported', 'under_review', 'action_taken', 'closed'
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_near_miss_trip_id ON near_miss_reports(trip_id);
CREATE INDEX IF NOT EXISTS idx_near_miss_guide_id ON near_miss_reports(guide_id);
CREATE INDEX IF NOT EXISTS idx_near_miss_branch_id ON near_miss_reports(branch_id);
CREATE INDEX IF NOT EXISTS idx_near_miss_incident_date ON near_miss_reports(incident_date DESC);
CREATE INDEX IF NOT EXISTS idx_near_miss_status ON near_miss_reports(status);
CREATE INDEX IF NOT EXISTS idx_near_miss_severity ON near_miss_reports(potential_severity);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE near_miss_reports ENABLE ROW LEVEL SECURITY;

-- Guides can view their own reports
CREATE POLICY "Guides can view own near-miss reports"
  ON near_miss_reports
  FOR SELECT
  USING (auth.uid() = guide_id);

-- Guides can create near-miss reports
CREATE POLICY "Guides can create near-miss reports"
  ON near_miss_reports
  FOR INSERT
  WITH CHECK (auth.uid() = guide_id);

-- Admins can view all reports in their branch
CREATE POLICY "Admins can view branch near-miss reports"
  ON near_miss_reports
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'ops_admin')
      AND (
        users.role = 'super_admin'
        OR users.branch_id = near_miss_reports.branch_id
      )
    )
  );

-- Admins can update reports (review)
CREATE POLICY "Admins can update near-miss reports"
  ON near_miss_reports
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'ops_admin')
    )
  );

-- ============================================
-- FUNCTION: Get near-miss statistics
-- ============================================
CREATE OR REPLACE FUNCTION get_near_miss_stats(
  p_branch_id UUID DEFAULT NULL,
  p_start_date DATE DEFAULT NOW() - INTERVAL '30 days',
  p_end_date DATE DEFAULT NOW()
)
RETURNS TABLE (
  total_reports INTEGER,
  by_severity JSONB,
  by_status JSONB,
  action_taken_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH stats AS (
    SELECT 
      COUNT(*)::INTEGER as total,
      jsonb_object_agg(potential_severity, severity_count) as sev_dist,
      jsonb_object_agg(status, status_count) as status_dist,
      ROUND(
        (COUNT(*) FILTER (WHERE status IN ('action_taken', 'closed'))::NUMERIC / 
         NULLIF(COUNT(*)::NUMERIC, 0)) * 100, 
        2
      ) as action_rate
    FROM (
      SELECT 
        potential_severity,
        status,
        COUNT(*) as severity_count,
        COUNT(*) as status_count
      FROM near_miss_reports
      WHERE (p_branch_id IS NULL OR branch_id = p_branch_id)
        AND incident_date BETWEEN p_start_date AND p_end_date
      GROUP BY potential_severity, status
    ) sub
  )
  SELECT 
    total,
    sev_dist,
    status_dist,
    action_rate
  FROM stats;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGER: Update timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_near_miss_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_near_miss_timestamp
  BEFORE UPDATE ON near_miss_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_near_miss_timestamp();

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE near_miss_reports IS 'Near-miss incident reports for preventive safety (ISO 45001)';
COMMENT ON COLUMN near_miss_reports.potential_consequence IS 'What could have happened if circumstances were slightly different';
COMMENT ON COLUMN near_miss_reports.contributing_factors IS 'Factors that contributed to the near-miss (e.g., fatigue, weather, equipment)';

