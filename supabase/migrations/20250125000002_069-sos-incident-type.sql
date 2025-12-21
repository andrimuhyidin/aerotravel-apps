-- Migration: 069-sos-incident-type.sql
-- Description: Add incident type, cancellation, and admin acknowledgment to SOS alerts
-- Created: 2025-01-25

-- ============================================
-- ADD INCIDENT TYPE COLUMN
-- ============================================
ALTER TABLE sos_alerts
ADD COLUMN IF NOT EXISTS incident_type VARCHAR(50), -- 'medical', 'security', 'weather', 'accident', 'other'
ADD COLUMN IF NOT EXISTS cancelled_reason TEXT,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS acknowledged_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS eta_minutes INTEGER, -- Estimated time of arrival in minutes
ADD COLUMN IF NOT EXISTS voice_note_url TEXT, -- URL to voice note audio file
ADD COLUMN IF NOT EXISTS transcript TEXT; -- Transcript of voice note (optional, AI-generated)

-- Add constraint for incident type
ALTER TABLE sos_alerts
DROP CONSTRAINT IF EXISTS valid_incident_type;

ALTER TABLE sos_alerts
ADD CONSTRAINT valid_incident_type CHECK (
  incident_type IS NULL OR incident_type IN ('medical', 'security', 'weather', 'accident', 'other')
);

-- ============================================
-- UPDATE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_sos_alerts_incident_type ON sos_alerts(incident_type);
CREATE INDEX IF NOT EXISTS idx_sos_alerts_acknowledged_at ON sos_alerts(acknowledged_at);
CREATE INDEX IF NOT EXISTS idx_sos_alerts_status ON sos_alerts(status);

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON COLUMN sos_alerts.incident_type IS 'Type of emergency: medical, security, weather, accident, other';
COMMENT ON COLUMN sos_alerts.cancelled_reason IS 'Reason for cancelling SOS (if false alarm)';
COMMENT ON COLUMN sos_alerts.cancelled_at IS 'Timestamp when SOS was cancelled';
COMMENT ON COLUMN sos_alerts.acknowledged_at IS 'Timestamp when admin acknowledged the SOS';
COMMENT ON COLUMN sos_alerts.acknowledged_by IS 'Admin who acknowledged the SOS';
COMMENT ON COLUMN sos_alerts.eta_minutes IS 'Estimated time of arrival in minutes (set by admin)';
COMMENT ON COLUMN sos_alerts.voice_note_url IS 'URL to voice note audio file (optional)';
COMMENT ON COLUMN sos_alerts.transcript IS 'Transcript of voice note (optional, AI-generated)';

