-- Migration: 050-pre-trip-risk-assessment.sql
-- Description: Pre-Trip Safety Risk Assessment with risk scoring
-- Created: 2025-01-23

-- ============================================
-- PRE-TRIP RISK ASSESSMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS pre_trip_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  guide_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id),
  
  -- Risk Factors
  wave_height DECIMAL(5,2), -- Meter
  wind_speed DECIMAL(5,2), -- km/h
  weather_condition VARCHAR(50), -- 'clear', 'cloudy', 'rainy', 'stormy'
  crew_ready BOOLEAN DEFAULT false,
  equipment_complete BOOLEAN DEFAULT false,
  
  -- Risk Score
  risk_score INTEGER NOT NULL DEFAULT 0, -- 0-100, higher = more risky
  risk_level VARCHAR(20) NOT NULL DEFAULT 'low', -- 'low', 'medium', 'high', 'critical'
  
  -- Assessment Result
  is_safe BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES users(id), -- Admin override
  approved_at TIMESTAMPTZ,
  approval_reason TEXT,
  
  -- GPS Location (where assessment was made)
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Notes
  notes TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_risk_level CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  CONSTRAINT valid_risk_score CHECK (risk_score >= 0 AND risk_score <= 100)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_pre_trip_assessments_trip_id ON pre_trip_assessments(trip_id);
CREATE INDEX IF NOT EXISTS idx_pre_trip_assessments_guide_id ON pre_trip_assessments(guide_id);
CREATE INDEX IF NOT EXISTS idx_pre_trip_assessments_branch_id ON pre_trip_assessments(branch_id);
CREATE INDEX IF NOT EXISTS idx_pre_trip_assessments_risk_level ON pre_trip_assessments(risk_level);
CREATE INDEX IF NOT EXISTS idx_pre_trip_assessments_is_safe ON pre_trip_assessments(is_safe);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE pre_trip_assessments ENABLE ROW LEVEL SECURITY;

-- Guides can view their own assessments
CREATE POLICY "Guides can view own assessments"
  ON pre_trip_assessments
  FOR SELECT
  USING (auth.uid() = guide_id);

-- Guides can create assessments for their trips
CREATE POLICY "Guides can create assessments"
  ON pre_trip_assessments
  FOR INSERT
  WITH CHECK (
    auth.uid() = guide_id
    AND EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = pre_trip_assessments.trip_id
      AND (
        EXISTS (
          SELECT 1 FROM trip_guides
          WHERE trip_guides.trip_id = trips.id
          AND trip_guides.guide_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM trip_crews
          WHERE trip_crews.trip_id = trips.id
          AND trip_crews.guide_id = auth.uid()
        )
      )
    )
  );

-- Admins can view all assessments in their branch
CREATE POLICY "Admins can view branch assessments"
  ON pre_trip_assessments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'ops_admin')
      AND (
        users.role = 'super_admin'
        OR users.branch_id = pre_trip_assessments.branch_id
      )
    )
  );

-- Admins can approve/override assessments
CREATE POLICY "Admins can approve assessments"
  ON pre_trip_assessments
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'ops_admin')
      AND (
        users.role = 'super_admin'
        OR users.branch_id = pre_trip_assessments.branch_id
      )
    )
  );

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to calculate risk score
CREATE OR REPLACE FUNCTION calculate_risk_score(
  wave_height_val DECIMAL,
  wind_speed_val DECIMAL,
  weather_condition_val VARCHAR,
  crew_ready_val BOOLEAN,
  equipment_complete_val BOOLEAN
)
RETURNS INTEGER AS $$
DECLARE
  score INTEGER := 0;
BEGIN
  -- Wave height scoring (0-40 points)
  IF wave_height_val IS NULL THEN
    score := score + 20; -- Unknown = medium risk
  ELSIF wave_height_val <= 0.5 THEN
    score := score + 0; -- Calm
  ELSIF wave_height_val <= 1.0 THEN
    score := score + 10; -- Low
  ELSIF wave_height_val <= 1.5 THEN
    score := score + 20; -- Medium
  ELSIF wave_height_val <= 2.0 THEN
    score := score + 30; -- High
  ELSE
    score := score + 40; -- Very high
  END IF;
  
  -- Wind speed scoring (0-30 points)
  IF wind_speed_val IS NULL THEN
    score := score + 15; -- Unknown = medium risk
  ELSIF wind_speed_val <= 10 THEN
    score := score + 0; -- Calm
  ELSIF wind_speed_val <= 20 THEN
    score := score + 10; -- Light
  ELSIF wind_speed_val <= 30 THEN
    score := score + 20; -- Moderate
  ELSE
    score := score + 30; -- Strong
  END IF;
  
  -- Weather condition scoring (0-20 points)
  IF weather_condition_val = 'clear' THEN
    score := score + 0;
  ELSIF weather_condition_val = 'cloudy' THEN
    score := score + 5;
  ELSIF weather_condition_val = 'rainy' THEN
    score := score + 15;
  ELSIF weather_condition_val = 'stormy' THEN
    score := score + 20;
  ELSE
    score := score + 10; -- Unknown
  END IF;
  
  -- Crew ready (0-5 points)
  IF NOT crew_ready_val THEN
    score := score + 5;
  END IF;
  
  -- Equipment complete (0-5 points)
  IF NOT equipment_complete_val THEN
    score := score + 5;
  END IF;
  
  RETURN LEAST(score, 100); -- Cap at 100
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to determine risk level from score
CREATE OR REPLACE FUNCTION get_risk_level(score INTEGER)
RETURNS VARCHAR AS $$
BEGIN
  IF score <= 20 THEN
    RETURN 'low';
  ELSIF score <= 50 THEN
    RETURN 'medium';
  ELSIF score <= 75 THEN
    RETURN 'high';
  ELSE
    RETURN 'critical';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to check if trip can start (certifications + risk assessment)
CREATE OR REPLACE FUNCTION can_trip_start(trip_uuid UUID, guide_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  has_valid_certs BOOLEAN;
  has_safe_assessment BOOLEAN;
BEGIN
  -- Check certifications
  SELECT check_guide_certifications_valid(guide_uuid) INTO has_valid_certs;
  
  -- Check risk assessment
  SELECT COALESCE(
    (
      SELECT is_safe
      FROM pre_trip_assessments
      WHERE trip_id = trip_uuid
        AND guide_id = guide_uuid
      ORDER BY created_at DESC
      LIMIT 1
    ),
    false
  ) INTO has_safe_assessment;
  
  RETURN has_valid_certs AND has_safe_assessment;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at
CREATE TRIGGER update_pre_trip_assessments_updated_at
  BEFORE UPDATE ON pre_trip_assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE pre_trip_assessments IS 'Pre-trip safety risk assessments with automatic risk scoring';
COMMENT ON COLUMN pre_trip_assessments.risk_score IS 'Risk score 0-100, calculated automatically';
COMMENT ON COLUMN pre_trip_assessments.risk_level IS 'Risk level: low (0-20), medium (21-50), high (51-75), critical (76-100)';
COMMENT ON COLUMN pre_trip_assessments.is_safe IS 'Trip can start if true (risk <= medium OR admin approved)';
COMMENT ON FUNCTION calculate_risk_score IS 'Calculate risk score from weather and safety factors';
COMMENT ON FUNCTION can_trip_start IS 'Check if trip can start (certifications valid + safe assessment)';
