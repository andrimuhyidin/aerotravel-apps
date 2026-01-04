-- Migration: 074-incident-injuries.sql
-- Description: Create injury details table for ISO 21101 compliance
-- Created: 2025-12-22

-- ============================================
-- TABLE: Incident Injuries
-- ============================================
CREATE TABLE IF NOT EXISTS incident_injuries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES incident_reports(id) ON DELETE CASCADE,
  person_id UUID NOT NULL, -- FK to booking_passengers.id or users.id
  person_type VARCHAR(20) NOT NULL CHECK (person_type IN ('passenger', 'guide', 'crew', 'other')),
  body_part VARCHAR(50) NOT NULL CHECK (body_part IN ('head', 'torso', 'arm', 'leg', 'other')),
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('minor', 'moderate', 'severe', 'critical')),
  first_aid_given BOOLEAN DEFAULT false,
  first_aid_description TEXT,
  hospital_required BOOLEAN DEFAULT false,
  hospital_name TEXT,
  branch_id UUID NOT NULL REFERENCES branches(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_incident_injuries_incident_id ON incident_injuries(incident_id);
CREATE INDEX IF NOT EXISTS idx_incident_injuries_person_id ON incident_injuries(person_id);
CREATE INDEX IF NOT EXISTS idx_incident_injuries_severity ON incident_injuries(severity);
CREATE INDEX IF NOT EXISTS idx_incident_injuries_branch_id ON incident_injuries(branch_id);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE incident_injuries ENABLE ROW LEVEL SECURITY;

-- Guides can view injuries for their own incidents
CREATE POLICY "Guides can view injuries for their incidents"
  ON incident_injuries
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM incident_reports ir
      WHERE ir.id = incident_injuries.incident_id
        AND ir.guide_id = auth.uid()
    )
  );

-- Guides can insert injuries for their own incidents
CREATE POLICY "Guides can insert injuries for their incidents"
  ON incident_injuries
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM incident_reports ir
      WHERE ir.id = incident_injuries.incident_id
        AND ir.guide_id = auth.uid()
    )
  );

-- Guides can update injuries for their own incidents
CREATE POLICY "Guides can update injuries for their incidents"
  ON incident_injuries
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM incident_reports ir
      WHERE ir.id = incident_injuries.incident_id
        AND ir.guide_id = auth.uid()
    )
  );

-- Guides can delete injuries for their own incidents
CREATE POLICY "Guides can delete injuries for their incidents"
  ON incident_injuries
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM incident_reports ir
      WHERE ir.id = incident_injuries.incident_id
        AND ir.guide_id = auth.uid()
    )
  );

-- Admins can view all injuries
CREATE POLICY "Admins can view all injuries"
  ON incident_injuries
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('super_admin', 'ops_admin')
    )
  );

-- ============================================
-- TRIGGERS
-- ============================================
CREATE TRIGGER update_incident_injuries_updated_at
  BEFORE UPDATE ON incident_injuries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE incident_injuries IS 'Detailed injury information for ISO 21101 compliance';
COMMENT ON COLUMN incident_injuries.person_id IS 'ID of the injured person (booking_passengers.id for passengers, users.id for guides/crew)';
COMMENT ON COLUMN incident_injuries.person_type IS 'Type of person: passenger, guide, crew, or other';
COMMENT ON COLUMN incident_injuries.body_part IS 'Body part affected: head, torso, arm, leg, or other';
COMMENT ON COLUMN incident_injuries.severity IS 'Injury severity: minor, moderate, severe, or critical';
COMMENT ON COLUMN incident_injuries.first_aid_given IS 'Whether first aid was administered';
COMMENT ON COLUMN incident_injuries.hospital_required IS 'Whether hospital treatment was required';

