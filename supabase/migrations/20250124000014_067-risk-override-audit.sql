-- Migration: 067-risk-override-audit.sql
-- Description: Risk Assessment Override Audit & Historical Trends
-- Created: 2025-01-24

-- ============================================
-- RISK ASSESSMENT OVERRIDES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS risk_assessment_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES pre_trip_assessments(id) ON DELETE CASCADE,
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  guide_id UUID NOT NULL REFERENCES users(id),
  branch_id UUID NOT NULL REFERENCES branches(id),
  
  -- Override Details
  risk_score INTEGER NOT NULL,
  override_by UUID NOT NULL REFERENCES users(id),
  override_reason TEXT NOT NULL,
  override_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_risk_score CHECK (risk_score >= 0 AND risk_score <= 200)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_risk_overrides_assessment_id ON risk_assessment_overrides(assessment_id);
CREATE INDEX IF NOT EXISTS idx_risk_overrides_trip_id ON risk_assessment_overrides(trip_id);
CREATE INDEX IF NOT EXISTS idx_risk_overrides_guide_id ON risk_assessment_overrides(guide_id);
CREATE INDEX IF NOT EXISTS idx_risk_overrides_override_by ON risk_assessment_overrides(override_by);
CREATE INDEX IF NOT EXISTS idx_risk_overrides_override_at ON risk_assessment_overrides(override_at DESC);
CREATE INDEX IF NOT EXISTS idx_risk_overrides_branch_id ON risk_assessment_overrides(branch_id);

-- ============================================
-- FUNCTION: Get Risk Trends per Guide
-- ============================================
CREATE OR REPLACE FUNCTION get_guide_risk_trends(
  p_guide_id UUID,
  p_weeks INTEGER DEFAULT 4
)
RETURNS TABLE (
  week_start DATE,
  week_end DATE,
  total_assessments INTEGER,
  avg_risk_score DECIMAL,
  max_risk_score INTEGER,
  min_risk_score INTEGER,
  blocked_count INTEGER,
  override_count INTEGER,
  risk_level_distribution JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH weekly_data AS (
    SELECT 
      DATE_TRUNC('week', created_at)::DATE AS week_start,
      (DATE_TRUNC('week', created_at) + INTERVAL '6 days')::DATE AS week_end,
      COUNT(*)::INTEGER AS total_assessments,
      AVG(risk_score)::DECIMAL AS avg_risk_score,
      MAX(risk_score)::INTEGER AS max_risk_score,
      MIN(risk_score)::INTEGER AS min_risk_score,
      COUNT(*) FILTER (WHERE risk_score > 70)::INTEGER AS blocked_count,
      COUNT(*) FILTER (WHERE approved_by IS NOT NULL)::INTEGER AS override_count,
      jsonb_build_object(
        'low', COUNT(*) FILTER (WHERE risk_level = 'low'),
        'medium', COUNT(*) FILTER (WHERE risk_level = 'medium'),
        'high', COUNT(*) FILTER (WHERE risk_level = 'high'),
        'critical', COUNT(*) FILTER (WHERE risk_level = 'critical')
      ) AS risk_level_distribution
    FROM pre_trip_assessments
    WHERE guide_id = p_guide_id
      AND created_at >= (NOW() - (p_weeks || ' weeks')::INTERVAL)
    GROUP BY DATE_TRUNC('week', created_at)
    ORDER BY week_start DESC
  )
  SELECT * FROM weekly_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Detect Unsafe Patterns
-- ============================================
CREATE OR REPLACE FUNCTION detect_unsafe_risk_patterns(
  p_guide_id UUID,
  p_weeks INTEGER DEFAULT 4
)
RETURNS TABLE (
  pattern_type TEXT,
  pattern_description TEXT,
  severity TEXT,
  occurrence_count INTEGER,
  recommendation TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH guide_stats AS (
    SELECT 
      COUNT(*) AS total_assessments,
      AVG(risk_score) AS avg_risk_score,
      COUNT(*) FILTER (WHERE risk_score > 70) AS high_risk_count,
      COUNT(*) FILTER (WHERE approved_by IS NOT NULL) AS override_count
    FROM pre_trip_assessments
    WHERE guide_id = p_guide_id
      AND created_at >= (NOW() - (p_weeks || ' weeks')::INTERVAL)
  )
  SELECT 
    'high_risk_frequency'::TEXT AS pattern_type,
    'Frequent high-risk assessments'::TEXT AS pattern_description,
    CASE 
      WHEN (gs.high_risk_count::DECIMAL / NULLIF(gs.total_assessments, 0)) > 0.3 THEN 'high'
      WHEN (gs.high_risk_count::DECIMAL / NULLIF(gs.total_assessments, 0)) > 0.2 THEN 'medium'
      ELSE 'low'
    END AS severity,
    gs.high_risk_count::INTEGER AS occurrence_count,
    'Consider additional safety training or review trip planning process'::TEXT AS recommendation
  FROM guide_stats gs
  WHERE gs.high_risk_count > 0
  
  UNION ALL
  
  SELECT 
    'frequent_overrides'::TEXT,
    'Frequent admin overrides required'::TEXT,
    CASE 
      WHEN (gs.override_count::DECIMAL / NULLIF(gs.total_assessments, 0)) > 0.2 THEN 'high'
      WHEN (gs.override_count::DECIMAL / NULLIF(gs.total_assessments, 0)) > 0.1 THEN 'medium'
      ELSE 'low'
    END,
    gs.override_count::INTEGER,
    'Review risk assessment accuracy and guide training'::TEXT
  FROM guide_stats gs
  WHERE gs.override_count > 0
  
  UNION ALL
  
  SELECT 
    'increasing_risk_trend'::TEXT,
    'Risk scores trending upward'::TEXT,
    'medium'::TEXT,
    0::INTEGER,
    'Monitor closely and provide additional support'::TEXT
  WHERE EXISTS (
    SELECT 1
    FROM (
      SELECT 
        DATE_TRUNC('week', created_at) AS week,
        AVG(risk_score) AS week_avg
      FROM pre_trip_assessments
      WHERE guide_id = p_guide_id
        AND created_at >= (NOW() - (p_weeks || ' weeks')::INTERVAL)
      GROUP BY DATE_TRUNC('week', created_at)
      ORDER BY week DESC
      LIMIT 2
    ) recent_weeks
    HAVING COUNT(*) = 2 
      AND MAX(week_avg) > MIN(week_avg) + 10
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE risk_assessment_overrides ENABLE ROW LEVEL SECURITY;

-- Guides can view their own overrides
CREATE POLICY "Guides can view own overrides"
  ON risk_assessment_overrides
  FOR SELECT
  USING (auth.uid() = guide_id);

-- Admins can view all overrides
CREATE POLICY "Admins can view all overrides"
  ON risk_assessment_overrides
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
        AND role IN ('super_admin', 'ops_admin')
    )
  );

-- System can insert overrides (via service role or admin)
CREATE POLICY "System can insert overrides"
  ON risk_assessment_overrides
  FOR INSERT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
        AND role IN ('super_admin', 'ops_admin')
    )
  )
  WITH CHECK (auth.uid() = override_by);

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE risk_assessment_overrides IS 'Audit log for risk assessment admin overrides';
COMMENT ON FUNCTION get_guide_risk_trends IS 'Get weekly risk trend statistics for a guide';
COMMENT ON FUNCTION detect_unsafe_risk_patterns IS 'Detect unsafe patterns in guide risk assessments';

