-- Migration: 073-incident-involved-people.sql
-- Description: Create junction table for people involved in incidents
-- Created: 2025-12-22

-- ============================================
-- JUNCTION TABLE: Incident Involved People
-- ============================================
CREATE TABLE IF NOT EXISTS incident_involved_people (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES incident_reports(id) ON DELETE CASCADE,
  person_id UUID NOT NULL, -- Can be booking_passengers.id or users.id
  person_type VARCHAR(20) NOT NULL CHECK (person_type IN ('passenger', 'guide', 'crew', 'other')),
  role_in_incident VARCHAR(50), -- e.g., 'victim', 'witness', 'responder', 'other'
  notes TEXT,
  branch_id UUID NOT NULL REFERENCES branches(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique person per incident
  UNIQUE(incident_id, person_id, person_type)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_incident_involved_incident_id ON incident_involved_people(incident_id);
CREATE INDEX IF NOT EXISTS idx_incident_involved_person_id ON incident_involved_people(person_id);
CREATE INDEX IF NOT EXISTS idx_incident_involved_person_type ON incident_involved_people(person_type);
CREATE INDEX IF NOT EXISTS idx_incident_involved_branch_id ON incident_involved_people(branch_id);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE incident_involved_people ENABLE ROW LEVEL SECURITY;

-- Guides can view involved people for their own incidents
CREATE POLICY "Guides can view involved people for their incidents"
  ON incident_involved_people
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM incident_reports ir
      WHERE ir.id = incident_involved_people.incident_id
        AND ir.guide_id = auth.uid()
    )
  );

-- Guides can insert involved people for their own incidents
CREATE POLICY "Guides can insert involved people for their incidents"
  ON incident_involved_people
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM incident_reports ir
      WHERE ir.id = incident_involved_people.incident_id
        AND ir.guide_id = auth.uid()
    )
  );

-- Guides can update involved people for their own incidents
CREATE POLICY "Guides can update involved people for their incidents"
  ON incident_involved_people
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM incident_reports ir
      WHERE ir.id = incident_involved_people.incident_id
        AND ir.guide_id = auth.uid()
    )
  );

-- Guides can delete involved people for their own incidents
CREATE POLICY "Guides can delete involved people for their incidents"
  ON incident_involved_people
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM incident_reports ir
      WHERE ir.id = incident_involved_people.incident_id
        AND ir.guide_id = auth.uid()
    )
  );

-- Admins can view all involved people
CREATE POLICY "Admins can view all involved people"
  ON incident_involved_people
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
CREATE TRIGGER update_incident_involved_people_updated_at
  BEFORE UPDATE ON incident_involved_people
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE incident_involved_people IS 'Junction table linking incidents to people involved (passengers, guides, crew)';
COMMENT ON COLUMN incident_involved_people.person_id IS 'ID of the person (booking_passengers.id for passengers, users.id for guides/crew)';
COMMENT ON COLUMN incident_involved_people.person_type IS 'Type of person: passenger, guide, crew, or other';
COMMENT ON COLUMN incident_involved_people.role_in_incident IS 'Role in the incident: victim, witness, responder, or other';

