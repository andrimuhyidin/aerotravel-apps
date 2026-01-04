-- Migration: 020-guide-preferences
-- Description: Guide preferences for auto-assignment algorithm
-- Created: 2025-12-18

-- ============================================
-- GUIDE PREFERENCES
-- ============================================
CREATE TABLE IF NOT EXISTS guide_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Favorite Destinations (array of destination names/cities)
  favorite_destinations TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Trip Type Preferences (array of package_type enum values)
  -- Values: 'open_trip', 'private_trip', 'corporate', 'kol_trip'
  preferred_trip_types TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Duration Preferences (array: '1D', '2D', '3D', '4D+')
  preferred_durations TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(guide_id)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_guide_preferences_guide_id ON guide_preferences(guide_id);

-- RLS Policies
ALTER TABLE guide_preferences ENABLE ROW LEVEL SECURITY;

-- Guides can manage their own preferences
CREATE POLICY "guide_preferences_select_own"
  ON guide_preferences
  FOR SELECT
  USING (guide_id = auth.uid());

CREATE POLICY "guide_preferences_insert_own"
  ON guide_preferences
  FOR INSERT
  WITH CHECK (guide_id = auth.uid());

CREATE POLICY "guide_preferences_update_own"
  ON guide_preferences
  FOR UPDATE
  USING (guide_id = auth.uid());

-- Internal staff can view all preferences (for auto-assignment)
CREATE POLICY "guide_preferences_select_internal"
  ON guide_preferences
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'ops_admin', 'hr_admin')
    )
  );

COMMIT;
