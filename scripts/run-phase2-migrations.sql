-- Phase 2: Run All Migrations
-- Execute this script in Supabase SQL Editor
-- Run each migration section one by one

-- ============================================
-- Migration 1: Risk Assessment Weather Enhancement
-- ============================================
-- File: 20250124000010_063-risk-assessment-weather-enhancement.sql

ALTER TABLE pre_trip_assessments
ADD COLUMN IF NOT EXISTS weather_data JSONB;

COMMENT ON COLUMN pre_trip_assessments.weather_data IS 'Weather data at the time of assessment, fetched from external API';

-- ============================================
-- Migration 2: Safety Briefing Enhancement
-- ============================================
-- File: 20250124000011_064-safety-briefing-enhancement.sql

ALTER TABLE trips
ADD COLUMN IF NOT EXISTS briefing_points JSONB,
ADD COLUMN IF NOT EXISTS briefing_generated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS briefing_generated_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS briefing_updated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS briefing_updated_by UUID REFERENCES users(id);

COMMENT ON COLUMN trips.briefing_points IS 'AI-generated briefing points in JSON format';
COMMENT ON COLUMN trips.briefing_generated_at IS 'Timestamp when briefing was first generated';
COMMENT ON COLUMN trips.briefing_generated_by IS 'User who generated the briefing';
COMMENT ON COLUMN trips.briefing_updated_at IS 'Timestamp when briefing was last updated/customized';
COMMENT ON COLUMN trips.briefing_updated_by IS 'User who last updated the briefing';

-- ============================================
-- Migration 3: SOS GPS Streaming
-- ============================================
-- File: 20250124000012_065-sos-gps-streaming.sql

CREATE TABLE IF NOT EXISTS sos_location_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sos_alert_id UUID NOT NULL REFERENCES sos_alerts(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy_meters DECIMAL(8, 2),
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sos_location_history_alert_id ON sos_location_history(sos_alert_id);
CREATE INDEX IF NOT EXISTS idx_sos_location_history_timestamp ON sos_location_history(timestamp DESC);

ALTER TABLE sos_location_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Guides can insert own SOS location history"
  ON sos_location_history
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sos_alerts
      WHERE sos_alerts.id = sos_location_history.sos_alert_id
      AND sos_alerts.guide_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all SOS location history"
  ON sos_location_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'ops_admin')
    )
  );

COMMENT ON TABLE sos_location_history IS 'Real-time GPS location history during an active SOS alert';

-- ============================================
-- Migration 4: Manifest Audit Log
-- ============================================
-- File: 20250124000013_066-manifest-audit-log.sql

CREATE TABLE IF NOT EXISTS manifest_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  access_type VARCHAR(50) NOT NULL,
  access_timestamp TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,
  branch_id UUID NOT NULL REFERENCES branches(id)
);

CREATE INDEX IF NOT EXISTS idx_manifest_access_logs_trip_id ON manifest_access_logs(trip_id);
CREATE INDEX IF NOT EXISTS idx_manifest_access_logs_user_id ON manifest_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_manifest_access_logs_access_timestamp ON manifest_access_logs(access_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_manifest_access_logs_branch_id ON manifest_access_logs(branch_id);

ALTER TABLE manifest_access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Guides can insert own manifest access logs"
  ON manifest_access_logs
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view branch manifest access logs"
  ON manifest_access_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'ops_admin')
      AND (
        users.role = 'super_admin'
        OR users.branch_id = manifest_access_logs.branch_id
      )
    )
  );

COMMENT ON TABLE manifest_access_logs IS 'Audit log for manifest access (view, download, print)';

-- ============================================
-- Migration 5: Risk Override Audit
-- ============================================
-- File: 20250124000014_067-risk-override-audit.sql

CREATE TABLE IF NOT EXISTS risk_assessment_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES pre_trip_assessments(id) ON DELETE CASCADE,
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  guide_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  risk_score INTEGER NOT NULL,
  override_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  override_reason TEXT NOT NULL,
  override_at TIMESTAMPTZ DEFAULT NOW(),
  branch_id UUID NOT NULL REFERENCES branches(id)
);

CREATE INDEX IF NOT EXISTS idx_risk_override_assessment_id ON risk_assessment_overrides(assessment_id);
CREATE INDEX IF NOT EXISTS idx_risk_override_trip_id ON risk_assessment_overrides(trip_id);
CREATE INDEX IF NOT EXISTS idx_risk_override_override_by ON risk_assessment_overrides(override_by);
CREATE INDEX IF NOT EXISTS idx_risk_override_branch_id ON risk_assessment_overrides(branch_id);

ALTER TABLE risk_assessment_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view branch risk overrides"
  ON risk_assessment_overrides
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'ops_admin')
      AND (
        users.role = 'super_admin'
        OR users.branch_id = risk_assessment_overrides.branch_id
      )
    )
  );

COMMENT ON TABLE risk_assessment_overrides IS 'Audit log for admin overrides of high-risk pre-trip assessments';

-- ============================================
-- Verification
-- ============================================
-- Run verification after all migrations
SELECT 
  'Phase 2 Migrations Complete' AS status,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN ('sos_location_history', 'manifest_access_logs', 'risk_assessment_overrides')) AS tables_created,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'pre_trip_assessments' AND column_name = 'weather_data') AS weather_column_added,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'trips' AND column_name = 'briefing_points') AS briefing_column_added;

