-- Migration: 057-marine-map-zones.sql
-- Description: Danger zones & signal hotspots for offline marine map
-- Created: 2025-01-23

-- ============================================
-- DANGER ZONES
-- ============================================
CREATE TABLE IF NOT EXISTS danger_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES branches(id), -- NULL = global zone
  
  -- Zone Info
  name VARCHAR(200) NOT NULL,
  description TEXT,
  zone_type VARCHAR(50) NOT NULL, -- 'coral_reef', 'shallow_water', 'strong_current', 'restricted_area', 'other'
  
  -- Geometry (GeoJSON)
  geometry JSONB NOT NULL, -- GeoJSON Polygon or Point with radius
  
  -- Severity
  severity VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_zone_type CHECK (zone_type IN ('coral_reef', 'shallow_water', 'strong_current', 'restricted_area', 'other')),
  CONSTRAINT valid_severity CHECK (severity IN ('low', 'medium', 'high', 'critical'))
);

-- ============================================
-- SIGNAL HOTSPOTS
-- ============================================
CREATE TABLE IF NOT EXISTS signal_hotspots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES branches(id), -- NULL = global hotspot
  
  -- Hotspot Info
  name VARCHAR(200) NOT NULL,
  description TEXT,
  signal_strength VARCHAR(20) DEFAULT 'medium', -- 'weak', 'medium', 'strong', 'excellent'
  
  -- Location
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  radius_meters INTEGER DEFAULT 500, -- Radius in meters
  
  -- Network Info
  network_type VARCHAR(20), -- '4g', '3g', '2g', 'wifi'
  operator VARCHAR(50), -- 'Telkomsel', 'Indosat', etc.
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES users(id),
  
  -- Audit
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_signal_strength CHECK (signal_strength IN ('weak', 'medium', 'strong', 'excellent')),
  CONSTRAINT valid_network_type CHECK (network_type IS NULL OR network_type IN ('4g', '3g', '2g', 'wifi'))
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_danger_zones_branch_id ON danger_zones(branch_id);
CREATE INDEX IF NOT EXISTS idx_danger_zones_type ON danger_zones(zone_type);
CREATE INDEX IF NOT EXISTS idx_danger_zones_severity ON danger_zones(severity);
CREATE INDEX IF NOT EXISTS idx_danger_zones_active ON danger_zones(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_signal_hotspots_branch_id ON signal_hotspots(branch_id);
CREATE INDEX IF NOT EXISTS idx_signal_hotspots_location ON signal_hotspots USING GIST (
  ll_to_earth(latitude, longitude)
); -- Spatial index for location queries
CREATE INDEX IF NOT EXISTS idx_signal_hotspots_active ON signal_hotspots(is_active) WHERE is_active = true;

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE danger_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE signal_hotspots ENABLE ROW LEVEL SECURITY;

-- Everyone can view active zones (for map display)
CREATE POLICY "Anyone can view active danger zones"
  ON danger_zones
  FOR SELECT
  USING (is_active = true);

-- Admins can manage zones
CREATE POLICY "Admins can manage danger zones"
  ON danger_zones
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'ops_admin')
      AND (
        users.role = 'super_admin'
        OR users.branch_id = danger_zones.branch_id
        OR danger_zones.branch_id IS NULL
      )
    )
  );

-- Everyone can view active hotspots
CREATE POLICY "Anyone can view active hotspots"
  ON signal_hotspots
  FOR SELECT
  USING (is_active = true);

-- Guides can report new hotspots
CREATE POLICY "Guides can create hotspots"
  ON signal_hotspots
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Admins can manage hotspots
CREATE POLICY "Admins can manage hotspots"
  ON signal_hotspots
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'ops_admin')
      AND (
        users.role = 'super_admin'
        OR users.branch_id = signal_hotspots.branch_id
        OR signal_hotspots.branch_id IS NULL
      )
    )
  );

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to find nearby danger zones
CREATE OR REPLACE FUNCTION find_nearby_danger_zones(
  lat DECIMAL,
  lng DECIMAL,
  radius_meters INTEGER DEFAULT 1000
)
RETURNS TABLE (
  id UUID,
  name VARCHAR,
  zone_type VARCHAR,
  severity VARCHAR,
  distance_meters DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dz.id,
    dz.name,
    dz.zone_type,
    dz.severity,
    -- Simplified distance calculation (for production, use PostGIS)
    SQRT(
      POWER((dz.geometry->>'latitude')::DECIMAL - lat, 2) * 111000 +
      POWER((dz.geometry->>'longitude')::DECIMAL - lng, 2) * 111000 * COS(RADIANS(lat))
    ) AS distance_meters
  FROM danger_zones dz
  WHERE dz.is_active = true
    -- Simplified radius check (for production, use PostGIS ST_DWithin)
    AND SQRT(
      POWER((dz.geometry->>'latitude')::DECIMAL - lat, 2) * 111000 +
      POWER((dz.geometry->>'longitude')::DECIMAL - lng, 2) * 111000 * COS(RADIANS(lat))
    ) <= radius_meters
  ORDER BY distance_meters ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to find nearby signal hotspots
CREATE OR REPLACE FUNCTION find_nearby_signal_hotspots(
  lat DECIMAL,
  lng DECIMAL,
  radius_meters INTEGER DEFAULT 5000
)
RETURNS TABLE (
  id UUID,
  name VARCHAR,
  signal_strength VARCHAR,
  network_type VARCHAR,
  distance_meters DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sh.id,
    sh.name,
    sh.signal_strength,
    sh.network_type,
    -- Haversine distance calculation
    (
      6371000 * acos(
        cos(RADIANS(lat)) * 
        cos(RADIANS(sh.latitude)) * 
        cos(RADIANS(sh.longitude) - RADIANS(lng)) + 
        sin(RADIANS(lat)) * 
        sin(RADIANS(sh.latitude))
      )
    ) AS distance_meters
  FROM signal_hotspots sh
  WHERE sh.is_active = true
    AND (
      6371000 * acos(
        cos(RADIANS(lat)) * 
        cos(RADIANS(sh.latitude)) * 
        cos(RADIANS(sh.longitude) - RADIANS(lng)) + 
        sin(RADIANS(lat)) * 
        sin(RADIANS(sh.latitude))
      )
    ) <= radius_meters
  ORDER BY distance_meters ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at
CREATE TRIGGER update_danger_zones_updated_at
  BEFORE UPDATE ON danger_zones
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_signal_hotspots_updated_at
  BEFORE UPDATE ON signal_hotspots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE danger_zones IS 'Marine danger zones (coral reefs, shallow water, etc.) for navigation safety';
COMMENT ON TABLE signal_hotspots IS 'Cell signal hotspots for offline map (where guides can get signal)';
COMMENT ON COLUMN danger_zones.geometry IS 'GeoJSON geometry (Polygon or Point with radius)';
COMMENT ON FUNCTION find_nearby_danger_zones IS 'Find danger zones within radius (meters)';
COMMENT ON FUNCTION find_nearby_signal_hotspots IS 'Find signal hotspots within radius (meters)';
