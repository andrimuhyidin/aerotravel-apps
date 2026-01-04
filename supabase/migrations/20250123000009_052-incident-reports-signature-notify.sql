-- Migration: 052-incident-reports-signature-notify.sql
-- Description: Add signature & auto-generate report number to incident_reports
-- Created: 2025-01-23

-- ============================================
-- ADD SIGNATURE & REPORT NUMBER COLUMNS
-- ============================================

-- Add report number column (auto-generated: INC-YYYYMMDD-XXX)
ALTER TABLE incident_reports
  ADD COLUMN IF NOT EXISTS report_number VARCHAR(50) UNIQUE;

-- Add signature columns
ALTER TABLE incident_reports
  ADD COLUMN IF NOT EXISTS signature_data TEXT, -- base64 signature image or typed text
  ADD COLUMN IF NOT EXISTS signature_method VARCHAR(20), -- 'draw', 'upload', 'typed'
  ADD COLUMN IF NOT EXISTS signature_timestamp TIMESTAMPTZ;

-- Add notification status
ALTER TABLE incident_reports
  ADD COLUMN IF NOT EXISTS notified_insurance BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS notified_admin BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS notification_sent_at TIMESTAMPTZ;

-- Add constraint for signature method
ALTER TABLE incident_reports
  DROP CONSTRAINT IF EXISTS valid_incident_signature_method;

ALTER TABLE incident_reports
  ADD CONSTRAINT valid_incident_signature_method CHECK (
    signature_method IS NULL OR signature_method IN ('draw', 'upload', 'typed')
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
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_incident_reports_report_number ON incident_reports(report_number);
CREATE INDEX IF NOT EXISTS idx_incident_reports_notified ON incident_reports(notified_insurance, notified_admin);

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON COLUMN incident_reports.report_number IS 'Auto-generated report number: INC-YYYYMMDD-XXX';
COMMENT ON COLUMN incident_reports.signature_data IS 'Signature data (base64 image or typed text)';
COMMENT ON COLUMN incident_reports.signature_method IS 'Signature method: draw, upload, or typed';
COMMENT ON COLUMN incident_reports.notified_insurance IS 'Whether insurance has been notified';
COMMENT ON COLUMN incident_reports.notified_admin IS 'Whether admin has been notified';
