-- Migration: 138-marine-protection-zones.sql
-- Description: Marine Protection Zone Compliance for GSTC
-- Created: 2025-03-03
-- Standards: GSTC Sustainable Tourism - Biodiversity & Marine Protection

-- ============================================
-- MARINE PROTECTION ZONES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS marine_protection_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Zone Info
  zone_name VARCHAR(255) NOT NULL,
  zone_code VARCHAR(50) UNIQUE,
  zone_type VARCHAR(50) NOT NULL, -- 'no_anchor', 'no_fishing', 'speed_limit', 'no_entry', 'seasonal', 'buffer'
  
  -- Location (GeoJSON polygon)
  polygon_coordinates JSONB NOT NULL,
  -- Structure: {
  --   "type": "Polygon",
  --   "coordinates": [[[lng1, lat1], [lng2, lat2], ...]]
  -- }
  
  -- Center point for quick lookups
  center_latitude DECIMAL(10, 8),
  center_longitude DECIMAL(11, 8),
  radius_km DECIMAL(10, 2),
  
  -- Restrictions
  restrictions TEXT[] NOT NULL,
  max_speed_knots DECIMAL(5, 2),
  max_vessels INTEGER,
  allowed_activities TEXT[],
  prohibited_activities TEXT[],
  
  -- Seasonal restrictions
  seasonal_restrictions JSONB DEFAULT '{}',
  -- Structure: {
  --   "breeding_season": {"start_month": 4, "end_month": 8, "restrictions": ["no_anchor", "reduced_speed"]},
  --   ...
  -- }
  
  -- Penalty Info
  penalty_info TEXT,
  authority VARCHAR(255), -- Governing authority
  contact_info JSONB,
  
  -- Source
  source VARCHAR(100), -- 'kkp', 'local_government', 'internal', 'mpa_network'
  source_reference VARCHAR(255),
  designation_date DATE,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  
  -- Constraints
  CONSTRAINT valid_zone_type CHECK (zone_type IN ('no_anchor', 'no_fishing', 'speed_limit', 'no_entry', 'seasonal', 'buffer', 'sanctuary', 'conservation'))
);

-- ============================================
-- TRIP ZONE COMPLIANCE TABLE
-- Track zone entries and compliance
-- ============================================
CREATE TABLE IF NOT EXISTS trip_zone_compliance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  zone_id UUID NOT NULL REFERENCES marine_protection_zones(id),
  branch_id UUID REFERENCES branches(id),
  
  -- Entry/Exit
  entered_at TIMESTAMPTZ NOT NULL,
  exited_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  
  -- Location at entry
  entry_latitude DECIMAL(10, 8),
  entry_longitude DECIMAL(11, 8),
  
  -- Compliance
  compliance_status VARCHAR(20) NOT NULL DEFAULT 'compliant', -- 'compliant', 'minor_violation', 'major_violation', 'warning'
  
  -- Violations (if any)
  violations JSONB DEFAULT '[]',
  -- Structure: [
  --   {"type": "speed_exceeded", "details": "22 knots in 10 knot zone", "timestamp": "..."},
  --   {"type": "anchoring", "details": "Dropped anchor in no-anchor zone", "timestamp": "..."}
  -- ]
  
  -- Guide acknowledgment
  acknowledged_by UUID REFERENCES users(id),
  acknowledged_at TIMESTAMPTZ,
  
  -- Notes
  notes TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_compliance_status CHECK (compliance_status IN ('compliant', 'minor_violation', 'major_violation', 'warning', 'pending_review'))
);

-- ============================================
-- ZONE VIOLATION REPORTS TABLE
-- Detailed violation tracking
-- ============================================
CREATE TABLE IF NOT EXISTS zone_violation_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  compliance_id UUID NOT NULL REFERENCES trip_zone_compliance(id) ON DELETE CASCADE,
  zone_id UUID NOT NULL REFERENCES marine_protection_zones(id),
  trip_id UUID NOT NULL REFERENCES trips(id),
  branch_id UUID REFERENCES branches(id),
  
  -- Violation Details
  violation_type VARCHAR(50) NOT NULL, -- 'speed_exceeded', 'anchoring', 'fishing', 'waste_dumping', 'unauthorized_entry'
  severity VARCHAR(20) NOT NULL DEFAULT 'minor', -- 'minor', 'moderate', 'major', 'critical'
  description TEXT NOT NULL,
  
  -- Location
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Time
  occurred_at TIMESTAMPTZ NOT NULL,
  
  -- Evidence
  evidence_urls TEXT[],
  gps_data JSONB,
  
  -- Resolution
  status VARCHAR(20) DEFAULT 'reported', -- 'reported', 'under_review', 'resolved', 'escalated'
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id),
  
  -- Penalty
  penalty_applied VARCHAR(100),
  penalty_amount DECIMAL(15, 2),
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  reported_by UUID REFERENCES users(id),
  
  -- Constraints
  CONSTRAINT valid_violation_type CHECK (violation_type IN ('speed_exceeded', 'anchoring', 'fishing', 'waste_dumping', 'unauthorized_entry', 'noise', 'wildlife_disturbance', 'other')),
  CONSTRAINT valid_violation_severity CHECK (severity IN ('minor', 'moderate', 'major', 'critical')),
  CONSTRAINT valid_violation_status CHECK (status IN ('reported', 'under_review', 'resolved', 'escalated', 'dismissed'))
);

-- ============================================
-- MARINE WILDLIFE SIGHTINGS TABLE
-- Track wildlife for conservation
-- ============================================
CREATE TABLE IF NOT EXISTS marine_wildlife_sightings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
  zone_id UUID REFERENCES marine_protection_zones(id),
  branch_id UUID REFERENCES branches(id),
  
  -- Sighting Info
  species_name VARCHAR(255) NOT NULL,
  species_type VARCHAR(50) NOT NULL, -- 'mammal', 'fish', 'turtle', 'bird', 'coral', 'other'
  common_name VARCHAR(255),
  
  -- Count
  estimated_count INTEGER DEFAULT 1,
  count_certainty VARCHAR(20) DEFAULT 'estimated', -- 'exact', 'estimated', 'approximate'
  
  -- Location
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  
  -- Time
  sighted_at TIMESTAMPTZ NOT NULL,
  
  -- Behavior
  behavior_observed TEXT,
  health_status VARCHAR(50), -- 'healthy', 'injured', 'stranded', 'deceased'
  
  -- Documentation
  photo_urls TEXT[],
  notes TEXT,
  
  -- Conservation Status
  conservation_status VARCHAR(50), -- 'least_concern', 'vulnerable', 'endangered', 'critically_endangered'
  
  -- Report to authorities
  reported_to_authority BOOLEAN DEFAULT false,
  authority_reference VARCHAR(255),
  
  -- Sighted by
  sighted_by UUID NOT NULL REFERENCES users(id),
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_species_type CHECK (species_type IN ('mammal', 'fish', 'turtle', 'bird', 'coral', 'invertebrate', 'other')),
  CONSTRAINT valid_count_certainty CHECK (count_certainty IN ('exact', 'estimated', 'approximate')),
  CONSTRAINT valid_health_status CHECK (health_status IS NULL OR health_status IN ('healthy', 'injured', 'stranded', 'deceased')),
  CONSTRAINT valid_conservation_status CHECK (conservation_status IS NULL OR conservation_status IN ('least_concern', 'near_threatened', 'vulnerable', 'endangered', 'critically_endangered'))
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_marine_protection_zones_active ON marine_protection_zones(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_marine_protection_zones_type ON marine_protection_zones(zone_type);
CREATE INDEX IF NOT EXISTS idx_marine_protection_zones_location ON marine_protection_zones(center_latitude, center_longitude);

CREATE INDEX IF NOT EXISTS idx_trip_zone_compliance_trip_id ON trip_zone_compliance(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_zone_compliance_zone_id ON trip_zone_compliance(zone_id);
CREATE INDEX IF NOT EXISTS idx_trip_zone_compliance_status ON trip_zone_compliance(compliance_status);
CREATE INDEX IF NOT EXISTS idx_trip_zone_compliance_entered_at ON trip_zone_compliance(entered_at DESC);

CREATE INDEX IF NOT EXISTS idx_zone_violation_reports_zone_id ON zone_violation_reports(zone_id);
CREATE INDEX IF NOT EXISTS idx_zone_violation_reports_trip_id ON zone_violation_reports(trip_id);
CREATE INDEX IF NOT EXISTS idx_zone_violation_reports_status ON zone_violation_reports(status);
CREATE INDEX IF NOT EXISTS idx_zone_violation_reports_severity ON zone_violation_reports(severity);

CREATE INDEX IF NOT EXISTS idx_marine_wildlife_sightings_trip_id ON marine_wildlife_sightings(trip_id);
CREATE INDEX IF NOT EXISTS idx_marine_wildlife_sightings_species ON marine_wildlife_sightings(species_type);
CREATE INDEX IF NOT EXISTS idx_marine_wildlife_sightings_location ON marine_wildlife_sightings(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_marine_wildlife_sightings_date ON marine_wildlife_sightings(sighted_at DESC);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE marine_protection_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_zone_compliance ENABLE ROW LEVEL SECURITY;
ALTER TABLE zone_violation_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE marine_wildlife_sightings ENABLE ROW LEVEL SECURITY;

-- Marine Zones: Public view, admin manage
CREATE POLICY "Anyone can view active marine zones"
  ON marine_protection_zones
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage marine zones"
  ON marine_protection_zones
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('super_admin', 'ops_admin')
    )
  );

-- Zone Compliance: Guides can view their trips, admins all
CREATE POLICY "Guides can view own trip zone compliance"
  ON trip_zone_compliance
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM trip_guides
      WHERE trip_guides.trip_id = trip_zone_compliance.trip_id
        AND trip_guides.guide_id = auth.uid()
    )
  );

CREATE POLICY "System can create zone compliance records"
  ON trip_zone_compliance
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can manage all zone compliance"
  ON trip_zone_compliance
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('super_admin', 'ops_admin')
    )
  );

-- Violation Reports: Similar to compliance
CREATE POLICY "Admins can manage violation reports"
  ON zone_violation_reports
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('super_admin', 'ops_admin')
    )
  );

-- Wildlife Sightings: Guides can create, all can view
CREATE POLICY "Guides can report wildlife sightings"
  ON marine_wildlife_sightings
  FOR INSERT
  WITH CHECK (sighted_by = auth.uid());

CREATE POLICY "Anyone can view wildlife sightings"
  ON marine_wildlife_sightings
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to check if point is inside a zone
CREATE OR REPLACE FUNCTION is_point_in_zone(
  p_latitude DECIMAL,
  p_longitude DECIMAL,
  p_zone_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_zone marine_protection_zones%ROWTYPE;
  v_distance DECIMAL;
BEGIN
  SELECT * INTO v_zone
  FROM marine_protection_zones
  WHERE id = p_zone_id AND is_active = true;
  
  IF v_zone.id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Simple radius-based check
  -- For production, use PostGIS ST_Contains with polygon
  v_distance := earth_distance(
    ll_to_earth(p_latitude, p_longitude),
    ll_to_earth(v_zone.center_latitude, v_zone.center_longitude)
  ) / 1000; -- Convert to km
  
  RETURN v_distance <= v_zone.radius_km;
END;
$$ LANGUAGE plpgsql;

-- Function to get zones near a point
CREATE OR REPLACE FUNCTION get_nearby_zones(
  p_latitude DECIMAL,
  p_longitude DECIMAL,
  p_radius_km INTEGER DEFAULT 50
)
RETURNS TABLE (
  zone_id UUID,
  zone_name VARCHAR,
  zone_type VARCHAR,
  restrictions TEXT[],
  distance_km DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mpz.id as zone_id,
    mpz.zone_name,
    mpz.zone_type,
    mpz.restrictions,
    (earth_distance(
      ll_to_earth(p_latitude, p_longitude),
      ll_to_earth(mpz.center_latitude, mpz.center_longitude)
    ) / 1000)::DECIMAL as distance_km
  FROM marine_protection_zones mpz
  WHERE mpz.is_active = true
    AND (earth_distance(
      ll_to_earth(p_latitude, p_longitude),
      ll_to_earth(mpz.center_latitude, mpz.center_longitude)
    ) / 1000) <= p_radius_km
  ORDER BY distance_km;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE marine_protection_zones IS 'Marine protected areas and restricted zones for GSTC biodiversity compliance';
COMMENT ON TABLE trip_zone_compliance IS 'Track trip entries into marine protection zones and compliance status';
COMMENT ON TABLE zone_violation_reports IS 'Detailed reports of zone violations for enforcement and improvement';
COMMENT ON TABLE marine_wildlife_sightings IS 'Wildlife sightings for conservation monitoring and reporting';

