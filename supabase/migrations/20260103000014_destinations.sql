-- Migration: 20260103000014_destinations.sql
-- Description: Destinations table untuk SEO destination landing pages
-- Created: 2026-01-03

-- ============================================
-- DESTINATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS destinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  
  -- Basic Info
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  province TEXT,
  description TEXT,
  long_description TEXT,
  
  -- Media
  featured_image TEXT,
  gallery TEXT[] DEFAULT '{}',
  
  -- Highlights & Info
  highlights TEXT[] DEFAULT '{}',
  best_time TEXT, -- e.g., "April - Oktober (musim kemarau)"
  
  -- Weather Information (JSONB for flexibility)
  weather_info JSONB DEFAULT '{}',
  -- Structure: {
  --   "drySeasonStart": "April",
  --   "drySeasonEnd": "Oktober",
  --   "wetSeasonStart": "November",
  --   "wetSeasonEnd": "Maret",
  --   "avgTemperature": "26-32°C"
  -- }
  
  -- Geo Location
  coordinates JSONB,
  -- Structure: {
  --   "lat": -5.732,
  --   "lng": 105.189
  -- }
  
  -- Attractions (JSONB array)
  attractions JSONB DEFAULT '[]',
  -- Structure: [
  --   {
  --     "name": "Spot Snorkeling Pahawang Besar",
  --     "description": "...",
  --     "type": "snorkeling" // snorkeling, diving, beach, island, activity
  --   }
  -- ]
  
  -- Travel Tips
  tips TEXT[] DEFAULT '{}',
  
  -- FAQs (JSONB array)
  faqs JSONB DEFAULT '[]',
  -- Structure: [
  --   {
  --     "question": "Kapan waktu terbaik?",
  --     "answer": "..."
  --   }
  -- ]
  
  -- Link to destination risk profiles (optional)
  risk_profile_id UUID REFERENCES destination_risk_profiles(id) ON DELETE SET NULL,
  
  -- SEO
  meta_title VARCHAR(200),
  meta_description VARCHAR(500),
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  -- Constraints
  UNIQUE(branch_id, slug)
);

-- ============================================
-- INDEXES
-- ============================================
-- Slug lookup (unique per branch)
CREATE INDEX IF NOT EXISTS idx_destinations_slug ON destinations(branch_id, slug) WHERE deleted_at IS NULL;

-- Province filtering
CREATE INDEX IF NOT EXISTS idx_destinations_province ON destinations(province) WHERE deleted_at IS NULL;

-- Full-text search (name + description)
CREATE INDEX IF NOT EXISTS idx_destinations_search ON destinations USING gin(to_tsvector('indonesian', coalesce(name, '') || ' ' || coalesce(description, '') || ' ' || coalesce(long_description, '')));

-- Highlights array search (GIN index)
CREATE INDEX IF NOT EXISTS idx_destinations_highlights ON destinations USING gin(highlights) WHERE deleted_at IS NULL;

-- Branch filtering
CREATE INDEX IF NOT EXISTS idx_destinations_branch ON destinations(branch_id) WHERE deleted_at IS NULL;

-- Geo-location indexing (for future map features)
CREATE INDEX IF NOT EXISTS idx_destinations_coordinates ON destinations USING gin(coordinates) WHERE deleted_at IS NULL AND coordinates IS NOT NULL;

-- Risk profile link
CREATE INDEX IF NOT EXISTS idx_destinations_risk_profile ON destinations(risk_profile_id) WHERE risk_profile_id IS NOT NULL;

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE destinations ENABLE ROW LEVEL SECURITY;

-- Public can read all destinations (for SEO pages)
CREATE POLICY destinations_public_read ON destinations
  FOR SELECT
  TO anon, authenticated
  USING (deleted_at IS NULL);

-- Authenticated users can insert destinations in their branch
CREATE POLICY destinations_branch_insert ON destinations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.branch_id = destinations.branch_id
      AND users.role IN ('super_admin', 'marketing', 'ops_admin')
    )
  );

-- Authenticated users can update destinations in their branch
CREATE POLICY destinations_branch_update ON destinations
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.branch_id = destinations.branch_id
      AND users.role IN ('super_admin', 'marketing', 'ops_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.branch_id = destinations.branch_id
      AND users.role IN ('super_admin', 'marketing', 'ops_admin')
    )
  );

-- Only super_admin can delete
CREATE POLICY destinations_branch_delete ON destinations
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'super_admin'
    )
  );

-- ============================================
-- FUNCTIONS
-- ============================================

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_destinations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER destinations_updated_at
  BEFORE UPDATE ON destinations
  FOR EACH ROW
  EXECUTE FUNCTION update_destinations_updated_at();

-- Function to find packages by destination name
CREATE OR REPLACE FUNCTION get_packages_by_destination(dest_name TEXT, p_branch_id UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  destination TEXT,
  province TEXT,
  thumbnail_url TEXT,
  duration_days INTEGER,
  duration_nights INTEGER,
  min_pax INTEGER,
  max_pax INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.slug,
    p.destination,
    p.province,
    p.thumbnail_url,
    p.duration_days,
    p.duration_nights,
    p.min_pax,
    p.max_pax
  FROM packages p
  WHERE p.destination = dest_name
    AND p.deleted_at IS NULL
    AND p.status = 'published'
    AND (p_branch_id IS NULL OR p.branch_id = p_branch_id)
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE destinations IS 'Destinations untuk SEO destination landing pages';
COMMENT ON COLUMN destinations.weather_info IS 'JSONB object dengan drySeasonStart, drySeasonEnd, wetSeasonStart, wetSeasonEnd, avgTemperature';
COMMENT ON COLUMN destinations.coordinates IS 'JSONB object dengan lat dan lng untuk geo-location';
COMMENT ON COLUMN destinations.attractions IS 'JSONB array dengan name, description, dan type (snorkeling, diving, beach, island, activity)';
COMMENT ON COLUMN destinations.faqs IS 'JSONB array dengan question dan answer';
COMMENT ON COLUMN destinations.risk_profile_id IS 'Link ke destination_risk_profiles table untuk ISO 31030 compliance';

