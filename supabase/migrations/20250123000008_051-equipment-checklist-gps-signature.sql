-- Migration: 051-equipment-checklist-gps-signature.sql
-- Description: Add GPS timestamp & signature to equipment checklist
-- Created: 2025-01-23

-- ============================================
-- ADD GPS & SIGNATURE COLUMNS
-- ============================================

-- Add GPS location columns
ALTER TABLE guide_equipment_checklists
  ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
  ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
  ADD COLUMN IF NOT EXISTS location_captured_at TIMESTAMPTZ;

-- Add signature columns
ALTER TABLE guide_equipment_checklists
  ADD COLUMN IF NOT EXISTS signature_data TEXT, -- base64 signature image or typed text
  ADD COLUMN IF NOT EXISTS signature_method VARCHAR(20), -- 'draw', 'upload', 'typed'
  ADD COLUMN IF NOT EXISTS signature_timestamp TIMESTAMPTZ;

-- Add constraint for signature method
ALTER TABLE guide_equipment_checklists
  DROP CONSTRAINT IF EXISTS valid_signature_method;

ALTER TABLE guide_equipment_checklists
  ADD CONSTRAINT valid_signature_method CHECK (
    signature_method IS NULL OR signature_method IN ('draw', 'upload', 'typed')
  );

-- ============================================
-- UPDATE EQUIPMENT ITEMS SCHEMA
-- ============================================
-- Equipment items JSONB should include:
-- {
--   "id": "life_jacket",
--   "name": "Life Jacket",
--   "checked": true,
--   "photo_url": "...",
--   "photo_gps": { "latitude": -8.1319, "longitude": 114.3656 },
--   "photo_timestamp": "2025-01-23T10:00:00Z",
--   "notes": "...",
--   "needs_repair": false
-- }

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON COLUMN guide_equipment_checklists.latitude IS 'GPS latitude where checklist was completed';
COMMENT ON COLUMN guide_equipment_checklists.longitude IS 'GPS longitude where checklist was completed';
COMMENT ON COLUMN guide_equipment_checklists.location_captured_at IS 'Timestamp when GPS location was captured';
COMMENT ON COLUMN guide_equipment_checklists.signature_data IS 'Signature data (base64 image or typed text)';
COMMENT ON COLUMN guide_equipment_checklists.signature_method IS 'Signature method: draw, upload, or typed';
COMMENT ON COLUMN guide_equipment_checklists.signature_timestamp IS 'Timestamp when signature was captured';
