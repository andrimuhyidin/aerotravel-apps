-- Migration: facility_checklist
-- Description: Facility checklist untuk guide verifikasi ketersediaan fasilitas trip
-- Created: 2025-12-19

-- ============================================
-- TRIP FACILITY CHECKLIST
-- ============================================
-- Checklist untuk guide memverifikasi bahwa fasilitas/layanan yang ditentukan admin/ops sudah tersedia
CREATE TABLE IF NOT EXISTS trip_facility_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  guide_id UUID NOT NULL REFERENCES users(id),
  branch_id UUID NOT NULL REFERENCES branches(id),
  
  -- Facility Info
  facility_code VARCHAR(100) NOT NULL, -- Code dari master facilities (transport_pp, meal_3x, dll)
  
  -- Status
  checked BOOLEAN NOT NULL DEFAULT false, -- Apakah facility sudah tersedia/verified
  
  -- Notes (optional)
  notes TEXT, -- Catatan dari guide tentang facility ini
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- One checklist entry per guide per facility per trip
  UNIQUE(trip_id, guide_id, facility_code)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_trip_facility_checklist_trip_id 
  ON trip_facility_checklist(trip_id);

CREATE INDEX IF NOT EXISTS idx_trip_facility_checklist_guide_id 
  ON trip_facility_checklist(guide_id);

CREATE INDEX IF NOT EXISTS idx_trip_facility_checklist_facility_code 
  ON trip_facility_checklist(facility_code);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE trip_facility_checklist ENABLE ROW LEVEL SECURITY;

-- Guides can view their own checklist
CREATE POLICY "Guides can view own facility checklist"
  ON trip_facility_checklist
  FOR SELECT
  USING (auth.uid() = guide_id);

-- Guides can insert their own checklist
CREATE POLICY "Guides can create own facility checklist"
  ON trip_facility_checklist
  FOR INSERT
  WITH CHECK (auth.uid() = guide_id);

-- Guides can update their own checklist
CREATE POLICY "Guides can update own facility checklist"
  ON trip_facility_checklist
  FOR UPDATE
  USING (auth.uid() = guide_id);

-- Admins can view all checklists
CREATE POLICY "Admins can view all facility checklists"
  ON trip_facility_checklist
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'ops_admin')
      AND (
        users.role = 'super_admin'
        OR users.branch_id = trip_facility_checklist.branch_id
      )
    )
  );

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_facility_checklist_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_trip_facility_checklist_updated_at
  BEFORE UPDATE ON trip_facility_checklist
  FOR EACH ROW
  EXECUTE FUNCTION update_facility_checklist_updated_at();

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE trip_facility_checklist IS 'Checklist untuk guide verifikasi ketersediaan fasilitas/layanan trip yang ditentukan oleh admin/ops';
COMMENT ON COLUMN trip_facility_checklist.facility_code IS 'Code dari master facilities (transport_pp, meal_3x, snorkeling_gear, dll)';
COMMENT ON COLUMN trip_facility_checklist.checked IS 'Apakah facility sudah tersedia dan verified oleh guide';
