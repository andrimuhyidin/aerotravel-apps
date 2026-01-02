-- Migration: 130-destination-risk-profiles.sql
-- Description: Destination Risk Database for ISO 31030 Compliance
-- Created: 2025-03-03
-- Standards: ISO 31030 Travel Risk Management

-- ============================================
-- ENUMS
-- ============================================
DO $$ BEGIN
  CREATE TYPE risk_category AS ENUM ('marine', 'land', 'mixed', 'air');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE threat_level AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- DESTINATION RISK PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS destination_risk_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES branches(id),
  
  -- Location Info
  location_name VARCHAR(255) NOT NULL,
  location_code VARCHAR(50), -- Short code for identification
  description TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  region VARCHAR(100), -- e.g., 'Lampung', 'Bali'
  
  -- Risk Classification
  risk_category risk_category NOT NULL DEFAULT 'marine',
  threat_level threat_level NOT NULL DEFAULT 'low',
  
  -- Risk Factors (JSONB for flexibility)
  risk_factors JSONB DEFAULT '{}', 
  -- Structure: {
  --   "weather": { "level": "medium", "notes": "..." },
  --   "security": { "level": "low", "notes": "..." },
  --   "health": { "level": "low", "notes": "..." },
  --   "infrastructure": { "level": "low", "notes": "..." },
  --   "natural_hazards": { "level": "medium", "notes": "..." }
  -- }
  
  -- Seasonal Variations (JSONB for monthly risk changes)
  seasonal_risks JSONB DEFAULT '{}',
  -- Structure: {
  --   "1": { "level": "high", "notes": "Monsoon season" },
  --   "2": { "level": "high", "notes": "..." },
  --   ...
  -- }
  
  -- Mitigation Measures
  mitigation_measures TEXT[],
  required_equipment TEXT[],
  emergency_procedures TEXT[],
  
  -- Assessment Info
  last_assessed_at TIMESTAMPTZ,
  assessed_by UUID REFERENCES users(id),
  valid_until DATE,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  
  -- Constraints
  UNIQUE(branch_id, location_code)
);

-- ============================================
-- DESTINATION RISK HISTORY TABLE
-- Track changes to risk profiles for audit
-- ============================================
CREATE TABLE IF NOT EXISTS destination_risk_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_id UUID NOT NULL REFERENCES destination_risk_profiles(id) ON DELETE CASCADE,
  
  -- Change Info
  previous_threat_level threat_level,
  new_threat_level threat_level,
  previous_risk_factors JSONB,
  new_risk_factors JSONB,
  
  -- Reason for change
  change_reason TEXT,
  
  -- Changed By
  changed_by UUID NOT NULL REFERENCES users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TRIP DESTINATION RISK ASSESSMENTS
-- Link trips to destination risk at time of departure
-- ============================================
CREATE TABLE IF NOT EXISTS trip_destination_risks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  destination_id UUID REFERENCES destination_risk_profiles(id),
  
  -- Snapshot of risk at trip time
  threat_level_at_departure threat_level,
  risk_factors_snapshot JSONB,
  seasonal_risk_snapshot JSONB,
  
  -- Guide acknowledgment
  acknowledged_by UUID REFERENCES users(id),
  acknowledged_at TIMESTAMPTZ,
  acknowledgment_notes TEXT,
  
  -- Created
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_destination_risk_profiles_branch_id ON destination_risk_profiles(branch_id);
CREATE INDEX IF NOT EXISTS idx_destination_risk_profiles_threat_level ON destination_risk_profiles(threat_level);
CREATE INDEX IF NOT EXISTS idx_destination_risk_profiles_location ON destination_risk_profiles(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_destination_risk_profiles_active ON destination_risk_profiles(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_destination_risk_profiles_region ON destination_risk_profiles(region);

CREATE INDEX IF NOT EXISTS idx_destination_risk_history_destination_id ON destination_risk_history(destination_id);
CREATE INDEX IF NOT EXISTS idx_destination_risk_history_changed_at ON destination_risk_history(changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_trip_destination_risks_trip_id ON trip_destination_risks(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_destination_risks_destination_id ON trip_destination_risks(destination_id);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE destination_risk_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE destination_risk_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_destination_risks ENABLE ROW LEVEL SECURITY;

-- Destination Risk Profiles: Admins can manage, all authenticated can view
CREATE POLICY "Anyone can view active destination risks"
  ON destination_risk_profiles
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage destination risks"
  ON destination_risk_profiles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
        AND role IN ('super_admin', 'ops_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
        AND role IN ('super_admin', 'ops_admin')
    )
  );

-- Destination Risk History: Admins only
CREATE POLICY "Admins can view risk history"
  ON destination_risk_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
        AND role IN ('super_admin', 'ops_admin')
    )
  );

CREATE POLICY "Admins can insert risk history"
  ON destination_risk_history
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
        AND role IN ('super_admin', 'ops_admin')
    )
  );

-- Trip Destination Risks: Guides can view for their trips
CREATE POLICY "Guides can view trip destination risks"
  ON trip_destination_risks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM trip_guides
      WHERE trip_guides.trip_id = trip_destination_risks.trip_id
        AND trip_guides.guide_id = auth.uid()
    )
  );

CREATE POLICY "Guides can acknowledge trip destination risks"
  ON trip_destination_risks
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM trip_guides
      WHERE trip_guides.trip_id = trip_destination_risks.trip_id
        AND trip_guides.guide_id = auth.uid()
    )
  );

CREATE POLICY "System can create trip destination risks"
  ON trip_destination_risks
  FOR INSERT
  WITH CHECK (true);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to get current month's seasonal risk
CREATE OR REPLACE FUNCTION get_current_seasonal_risk(p_destination_id UUID)
RETURNS TABLE (
  month INTEGER,
  level VARCHAR,
  notes TEXT
) AS $$
DECLARE
  v_current_month INTEGER;
  v_seasonal_risks JSONB;
BEGIN
  v_current_month := EXTRACT(MONTH FROM CURRENT_DATE);
  
  SELECT drp.seasonal_risks INTO v_seasonal_risks
  FROM destination_risk_profiles drp
  WHERE drp.id = p_destination_id;
  
  RETURN QUERY
  SELECT 
    v_current_month,
    (v_seasonal_risks->v_current_month::TEXT->>'level')::VARCHAR,
    (v_seasonal_risks->v_current_month::TEXT->>'notes')::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate overall risk score
CREATE OR REPLACE FUNCTION calculate_destination_risk_score(p_destination_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_threat_level threat_level;
  v_base_score INTEGER;
  v_seasonal_modifier INTEGER := 0;
  v_current_month INTEGER;
  v_seasonal_level VARCHAR;
BEGIN
  -- Get base threat level
  SELECT threat_level INTO v_threat_level
  FROM destination_risk_profiles
  WHERE id = p_destination_id;
  
  -- Convert to score
  CASE v_threat_level
    WHEN 'low' THEN v_base_score := 25;
    WHEN 'medium' THEN v_base_score := 50;
    WHEN 'high' THEN v_base_score := 75;
    WHEN 'critical' THEN v_base_score := 100;
    ELSE v_base_score := 50;
  END CASE;
  
  -- Get seasonal modifier
  v_current_month := EXTRACT(MONTH FROM CURRENT_DATE);
  
  SELECT (seasonal_risks->v_current_month::TEXT->>'level')::VARCHAR
  INTO v_seasonal_level
  FROM destination_risk_profiles
  WHERE id = p_destination_id;
  
  CASE v_seasonal_level
    WHEN 'low' THEN v_seasonal_modifier := -10;
    WHEN 'medium' THEN v_seasonal_modifier := 0;
    WHEN 'high' THEN v_seasonal_modifier := 15;
    WHEN 'critical' THEN v_seasonal_modifier := 25;
    ELSE v_seasonal_modifier := 0;
  END CASE;
  
  RETURN LEAST(100, GREATEST(0, v_base_score + v_seasonal_modifier));
END;
$$ LANGUAGE plpgsql;

-- Trigger to log risk history on update
CREATE OR REPLACE FUNCTION log_destination_risk_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.threat_level IS DISTINCT FROM NEW.threat_level 
     OR OLD.risk_factors IS DISTINCT FROM NEW.risk_factors THEN
    INSERT INTO destination_risk_history (
      destination_id,
      previous_threat_level,
      new_threat_level,
      previous_risk_factors,
      new_risk_factors,
      changed_by
    ) VALUES (
      NEW.id,
      OLD.threat_level,
      NEW.threat_level,
      OLD.risk_factors,
      NEW.risk_factors,
      auth.uid()
    );
  END IF;
  
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_destination_risk_change
  BEFORE UPDATE ON destination_risk_profiles
  FOR EACH ROW
  EXECUTE FUNCTION log_destination_risk_change();

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE destination_risk_profiles IS 'Destination risk database for ISO 31030 compliance - stores risk profiles for all trip destinations';
COMMENT ON TABLE destination_risk_history IS 'Audit trail for changes to destination risk profiles';
COMMENT ON TABLE trip_destination_risks IS 'Snapshot of destination risk at time of trip departure with guide acknowledgment';
COMMENT ON COLUMN destination_risk_profiles.risk_factors IS 'JSON object with risk factors: weather, security, health, infrastructure, natural_hazards';
COMMENT ON COLUMN destination_risk_profiles.seasonal_risks IS 'JSON object with monthly risk variations (1-12)';

