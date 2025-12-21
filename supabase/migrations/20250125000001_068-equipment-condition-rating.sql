-- Migration: 068-equipment-condition-rating.sql
-- Description: Add condition rating to equipment checklist and EXIF data to photo uploads
-- Created: 2025-01-25

-- ============================================
-- ADD EXIF DATA COLUMN TO guide_photo_uploads
-- ============================================
-- Create table if not exists (for photo metadata tracking)
CREATE TABLE IF NOT EXISTS guide_photo_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id),
  trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
  photo_type VARCHAR(50) NOT NULL, -- 'equipment', 'evidence', 'incident', etc.
  item_id VARCHAR(100), -- For equipment items
  file_path TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  captured_at TIMESTAMPTZ,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  exif_data JSONB, -- EXIF metadata extracted from photo
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guide_photo_uploads_guide_id ON guide_photo_uploads(guide_id);
CREATE INDEX IF NOT EXISTS idx_guide_photo_uploads_trip_id ON guide_photo_uploads(trip_id);
CREATE INDEX IF NOT EXISTS idx_guide_photo_uploads_photo_type ON guide_photo_uploads(photo_type);
CREATE INDEX IF NOT EXISTS idx_guide_photo_uploads_uploaded_at ON guide_photo_uploads(uploaded_at DESC);

ALTER TABLE guide_photo_uploads ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Guides can view own photo uploads"
  ON guide_photo_uploads
  FOR SELECT
  USING (guide_id = auth.uid());

CREATE POLICY "Guides can insert own photo uploads"
  ON guide_photo_uploads
  FOR INSERT
  WITH CHECK (guide_id = auth.uid());

CREATE POLICY "Admins can view all photo uploads"
  ON guide_photo_uploads
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'ops_admin')
    )
  );

COMMENT ON TABLE guide_photo_uploads IS 'Photo upload metadata with EXIF data extraction';
COMMENT ON COLUMN guide_photo_uploads.exif_data IS 'EXIF metadata extracted from photo (GPS, timestamp, camera info)';

-- ============================================
-- ADD CONDITION RATING TO EQUIPMENT CHECKLIST
-- ============================================
-- Equipment items JSONB schema update:
-- {
--   "id": "life_jacket",
--   "name": "Life Jacket",
--   "checked": true,
--   "condition": "excellent" | "good" | "fair" | "poor",
--   "quantity": 10,
--   "photo_url": "...",
--   "photo_gps": { "latitude": -8.1319, "longitude": 114.3656 },
--   "photo_timestamp": "2025-01-23T10:00:00Z",
--   "notes": "...",
--   "needs_repair": false
-- }

-- Note: Condition rating is stored in equipment_items JSONB array
-- No schema change needed, just document the new field structure

COMMENT ON COLUMN guide_equipment_checklists.equipment_items IS 'Equipment items array with condition rating: excellent, good, fair, poor';

