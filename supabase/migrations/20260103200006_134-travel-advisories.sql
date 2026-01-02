-- Migration: 134-travel-advisories.sql
-- Description: Travel Advisories for Duty of Care & ISO 31030
-- Created: 2025-03-03
-- Standards: Duty of Care Policy, ISO 31030 TRM

-- ============================================
-- TRAVEL ADVISORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS travel_advisories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Source Info
  source VARCHAR(50) NOT NULL, -- 'bmkg', 'kemenlu', 'basarnas', 'internal', 'other'
  source_reference VARCHAR(255), -- External reference ID
  source_url TEXT,
  
  -- Advisory Type
  advisory_type VARCHAR(50) NOT NULL, -- 'weather', 'security', 'health', 'natural_disaster', 'maritime'
  
  -- Severity
  severity VARCHAR(20) NOT NULL DEFAULT 'info', -- 'info', 'advisory', 'watch', 'warning', 'danger'
  severity_code INTEGER, -- 1-5 scale
  
  -- Location
  affected_locations JSONB DEFAULT '[]',
  -- Structure: [
  --   {"name": "Selat Sunda", "latitude": -6.0, "longitude": 105.5, "radius_km": 50},
  --   ...
  -- ]
  affected_regions TEXT[], -- ['Lampung', 'Banten', 'Jakarta']
  
  -- Advisory Content
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  impact_description TEXT,
  recommendations TEXT[],
  
  -- Validity
  valid_from TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  
  -- Weather-specific fields (for BMKG data)
  weather_data JSONB DEFAULT '{}',
  -- Structure: {
  --   "wave_height_m": 2.5,
  --   "wind_speed_knots": 25,
  --   "visibility_km": 5,
  --   "precipitation_mm": 50,
  --   "temperature_c": 28
  -- }
  
  -- Maritime-specific fields
  maritime_data JSONB DEFAULT '{}',
  -- Structure: {
  --   "sea_state": "rough",
  --   "current_speed_knots": 3,
  --   "tide_status": "high"
  -- }
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  
  -- Constraints
  CONSTRAINT valid_source CHECK (source IN ('bmkg', 'kemenlu', 'basarnas', 'bnpb', 'internal', 'other')),
  CONSTRAINT valid_advisory_type CHECK (advisory_type IN ('weather', 'security', 'health', 'natural_disaster', 'maritime', 'volcanic', 'tsunami')),
  CONSTRAINT valid_severity CHECK (severity IN ('info', 'advisory', 'watch', 'warning', 'danger'))
);

-- ============================================
-- ADVISORY ACKNOWLEDGMENTS TABLE
-- Track guide acknowledgment of advisories
-- ============================================
CREATE TABLE IF NOT EXISTS advisory_acknowledgments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advisory_id UUID NOT NULL REFERENCES travel_advisories(id) ON DELETE CASCADE,
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  
  -- Acknowledged By
  acknowledged_by UUID NOT NULL REFERENCES users(id),
  acknowledged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Response
  acknowledgment_notes TEXT,
  mitigation_actions TEXT[],
  
  -- Decision
  proceed_with_trip BOOLEAN DEFAULT true,
  
  -- Unique constraint
  UNIQUE(advisory_id, trip_id, acknowledged_by)
);

-- ============================================
-- WEATHER CACHE TABLE
-- Cache BMKG API responses
-- ============================================
CREATE TABLE IF NOT EXISTS weather_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Location
  location_key VARCHAR(100) NOT NULL, -- 'lat_lng' format
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  region VARCHAR(100),
  
  -- Weather Data
  current_weather JSONB DEFAULT '{}',
  forecast_hourly JSONB DEFAULT '[]',
  forecast_daily JSONB DEFAULT '[]',
  maritime_conditions JSONB DEFAULT '{}',
  
  -- Source
  source VARCHAR(50) DEFAULT 'bmkg',
  raw_response JSONB,
  
  -- Cache Info
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  
  -- Unique per location
  UNIQUE(location_key)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_travel_advisories_source ON travel_advisories(source);
CREATE INDEX IF NOT EXISTS idx_travel_advisories_type ON travel_advisories(advisory_type);
CREATE INDEX IF NOT EXISTS idx_travel_advisories_severity ON travel_advisories(severity);
CREATE INDEX IF NOT EXISTS idx_travel_advisories_valid_from ON travel_advisories(valid_from);
CREATE INDEX IF NOT EXISTS idx_travel_advisories_valid_until ON travel_advisories(valid_until);
CREATE INDEX IF NOT EXISTS idx_travel_advisories_active ON travel_advisories(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_travel_advisories_regions ON travel_advisories USING GIN (affected_regions);

CREATE INDEX IF NOT EXISTS idx_advisory_acknowledgments_advisory_id ON advisory_acknowledgments(advisory_id);
CREATE INDEX IF NOT EXISTS idx_advisory_acknowledgments_trip_id ON advisory_acknowledgments(trip_id);
CREATE INDEX IF NOT EXISTS idx_advisory_acknowledgments_user_id ON advisory_acknowledgments(acknowledged_by);

CREATE INDEX IF NOT EXISTS idx_weather_cache_location ON weather_cache(location_key);
CREATE INDEX IF NOT EXISTS idx_weather_cache_expires ON weather_cache(expires_at);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE travel_advisories ENABLE ROW LEVEL SECURITY;
ALTER TABLE advisory_acknowledgments ENABLE ROW LEVEL SECURITY;
ALTER TABLE weather_cache ENABLE ROW LEVEL SECURITY;

-- Travel Advisories: All can view active, admins can manage
CREATE POLICY "Anyone can view active advisories"
  ON travel_advisories
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage advisories"
  ON travel_advisories
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('super_admin', 'ops_admin')
    )
  );

-- Advisory Acknowledgments: Guides can acknowledge, admins can view all
CREATE POLICY "Guides can acknowledge advisories"
  ON advisory_acknowledgments
  FOR INSERT
  WITH CHECK (acknowledged_by = auth.uid());

CREATE POLICY "Users can view own acknowledgments"
  ON advisory_acknowledgments
  FOR SELECT
  USING (acknowledged_by = auth.uid());

CREATE POLICY "Admins can view all acknowledgments"
  ON advisory_acknowledgments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('super_admin', 'ops_admin')
    )
  );

-- Weather Cache: System use, admins can view
CREATE POLICY "Admins can manage weather cache"
  ON weather_cache
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('super_admin', 'ops_admin')
    )
  );

CREATE POLICY "Authenticated users can view weather cache"
  ON weather_cache
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to get active advisories for a location
CREATE OR REPLACE FUNCTION get_location_advisories(
  p_latitude DECIMAL,
  p_longitude DECIMAL,
  p_radius_km INTEGER DEFAULT 100
)
RETURNS TABLE (
  id UUID,
  source VARCHAR,
  advisory_type VARCHAR,
  severity VARCHAR,
  title VARCHAR,
  description TEXT,
  recommendations TEXT[],
  valid_until TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ta.id,
    ta.source,
    ta.advisory_type,
    ta.severity,
    ta.title,
    ta.description,
    ta.recommendations,
    ta.valid_until
  FROM travel_advisories ta
  WHERE ta.is_active = true
    AND (ta.valid_until IS NULL OR ta.valid_until > NOW())
    AND EXISTS (
      SELECT 1 
      FROM jsonb_array_elements(ta.affected_locations) loc
      WHERE (
        earth_distance(
          ll_to_earth(p_latitude, p_longitude),
          ll_to_earth(
            (loc->>'latitude')::DECIMAL,
            (loc->>'longitude')::DECIMAL
          )
        ) / 1000
      ) <= COALESCE((loc->>'radius_km')::INTEGER, p_radius_km)
    )
  ORDER BY 
    CASE ta.severity
      WHEN 'danger' THEN 1
      WHEN 'warning' THEN 2
      WHEN 'watch' THEN 3
      WHEN 'advisory' THEN 4
      ELSE 5
    END,
    ta.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to check if weather cache is valid
CREATE OR REPLACE FUNCTION is_weather_cache_valid(p_location_key VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
  v_expires_at TIMESTAMPTZ;
BEGIN
  SELECT expires_at INTO v_expires_at
  FROM weather_cache
  WHERE location_key = p_location_key;
  
  IF v_expires_at IS NULL THEN
    RETURN false;
  END IF;
  
  RETURN v_expires_at > NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE travel_advisories IS 'Travel advisories from BMKG, Kemenlu, and other sources for Duty of Care compliance';
COMMENT ON TABLE advisory_acknowledgments IS 'Guide acknowledgments of travel advisories before trips';
COMMENT ON TABLE weather_cache IS 'Cached weather data from BMKG API to reduce API calls';
COMMENT ON COLUMN travel_advisories.severity IS 'Severity levels: info (FYI), advisory (be aware), watch (monitor), warning (take action), danger (do not proceed)';

