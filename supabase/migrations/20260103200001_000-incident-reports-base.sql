-- Migration: 000-incident-reports-base.sql
-- Description: Create base incident_reports table for compliance standards
-- Created: 2025-01-22
-- Required for: CHSE, Duty of Care, ISO 31030 compliance

-- ============================================
-- BASE TABLE: incident_reports
-- ============================================
CREATE TABLE IF NOT EXISTS incident_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  guide_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id),
  
  -- Report Identification
  report_number VARCHAR(50) UNIQUE,
  
  -- Incident Details
  incident_type VARCHAR(50) NOT NULL, -- 'medical', 'accident', 'injury', 'equipment_damage', 'weather_issue', 'complaint', 'security', 'other'
  chronology TEXT NOT NULL,
  severity VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  status VARCHAR(20) DEFAULT 'reported', -- 'reported', 'investigating', 'resolved', 'closed'
  
  -- Witnesses & People Involved
  witnesses TEXT,
  
  -- Media
  photo_urls TEXT[] DEFAULT '{}',
  voice_note_url TEXT,
  
  -- Signature
  signature_data TEXT, -- base64 signature image or typed text
  signature_method VARCHAR(20), -- 'draw', 'upload', 'typed'
  signature_timestamp TIMESTAMPTZ,
  
  -- Notifications
  notified_insurance BOOLEAN DEFAULT false,
  notified_admin BOOLEAN DEFAULT false,
  notification_sent_at TIMESTAMPTZ,
  
  -- Reporting
  reported_at TIMESTAMPTZ DEFAULT NOW(),
  reported_by UUID REFERENCES users(id),
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_incident_type CHECK (incident_type IN ('medical', 'accident', 'injury', 'equipment_damage', 'weather_issue', 'complaint', 'security', 'other')),
  CONSTRAINT valid_severity CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  CONSTRAINT valid_status CHECK (status IN ('reported', 'investigating', 'resolved', 'closed')),
  CONSTRAINT valid_signature_method CHECK (signature_method IS NULL OR signature_method IN ('draw', 'upload', 'typed'))
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_incident_reports_trip_id ON incident_reports(trip_id);
CREATE INDEX IF NOT EXISTS idx_incident_reports_guide_id ON incident_reports(guide_id);
CREATE INDEX IF NOT EXISTS idx_incident_reports_branch_id ON incident_reports(branch_id);
CREATE INDEX IF NOT EXISTS idx_incident_reports_status ON incident_reports(status);
CREATE INDEX IF NOT EXISTS idx_incident_reports_incident_type ON incident_reports(incident_type);
CREATE INDEX IF NOT EXISTS idx_incident_reports_report_number ON incident_reports(report_number);
CREATE INDEX IF NOT EXISTS idx_incident_reports_created_at ON incident_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_incident_reports_notified ON incident_reports(notified_insurance, notified_admin);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE incident_reports ENABLE ROW LEVEL SECURITY;

-- Guides can view their own incidents
DROP POLICY IF EXISTS "Guides can view own incidents" ON incident_reports;
CREATE POLICY "Guides can view own incidents"
  ON incident_reports
  FOR SELECT
  USING (auth.uid() = guide_id);

-- Guides can create incidents
DROP POLICY IF EXISTS "Guides can create incidents" ON incident_reports;
CREATE POLICY "Guides can create incidents"
  ON incident_reports
  FOR INSERT
  WITH CHECK (auth.uid() = guide_id);

-- Guides can update their own incidents
DROP POLICY IF EXISTS "Guides can update own incidents" ON incident_reports;
CREATE POLICY "Guides can update own incidents"
  ON incident_reports
  FOR UPDATE
  USING (auth.uid() = guide_id);

-- Admins can view all incidents in their branch
DROP POLICY IF EXISTS "Admins can view branch incidents" ON incident_reports;
CREATE POLICY "Admins can view branch incidents"
  ON incident_reports
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'ops_admin', 'admin')
    )
  );

-- Admins can update incidents in their branch
DROP POLICY IF EXISTS "Admins can update branch incidents" ON incident_reports;
CREATE POLICY "Admins can update branch incidents"
  ON incident_reports
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'ops_admin', 'admin')
    )
  );

-- ============================================
-- FUNCTION: Auto-generate Report Number
-- ============================================
CREATE OR REPLACE FUNCTION generate_incident_report_number()
RETURNS TRIGGER AS $$
DECLARE
  date_prefix VARCHAR(8);
  sequence_num INTEGER;
  new_report_number VARCHAR(50);
BEGIN
  -- Generate date prefix (YYYYMMDD)
  date_prefix := TO_CHAR(NOW(), 'YYYYMMDD');
  
  -- Get next sequence number for today
  SELECT COALESCE(MAX(CAST(SUBSTRING(report_number FROM 13) AS INTEGER)), 0) + 1
  INTO sequence_num
  FROM incident_reports
  WHERE report_number LIKE 'INC-' || date_prefix || '-%';
  
  -- Generate report number: INC-YYYYMMDD-XXX
  new_report_number := 'INC-' || date_prefix || '-' || LPAD(sequence_num::TEXT, 3, '0');
  
  NEW.report_number := new_report_number;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGER: Auto-generate Report Number
-- ============================================
DROP TRIGGER IF EXISTS auto_generate_incident_report_number ON incident_reports;
CREATE TRIGGER auto_generate_incident_report_number
  BEFORE INSERT ON incident_reports
  FOR EACH ROW
  WHEN (NEW.report_number IS NULL)
  EXECUTE FUNCTION generate_incident_report_number();

-- ============================================
-- FUNCTION: Update timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_incident_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_incident_reports_updated_at ON incident_reports;
CREATE TRIGGER trigger_update_incident_reports_updated_at
  BEFORE UPDATE ON incident_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_incident_reports_updated_at();

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE incident_reports IS 'Incident reports for compliance with CHSE, Duty of Care, and ISO 31030';
COMMENT ON COLUMN incident_reports.report_number IS 'Auto-generated unique report number (INC-YYYYMMDD-XXX)';
COMMENT ON COLUMN incident_reports.incident_type IS 'Type of incident: medical, accident, injury, equipment_damage, weather_issue, complaint, security, other';
COMMENT ON COLUMN incident_reports.severity IS 'Incident severity level: low, medium, high, critical';
COMMENT ON COLUMN incident_reports.signature_data IS 'Digital signature data (base64 image or typed text)';
COMMENT ON COLUMN incident_reports.notified_insurance IS 'Whether insurance company has been notified';
COMMENT ON COLUMN incident_reports.notified_admin IS 'Whether admin has been notified';

