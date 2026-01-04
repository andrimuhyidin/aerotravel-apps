-- Migration: 065-sos-gps-streaming.sql
-- Description: SOS GPS Streaming & Location History for real-time tracking
-- Created: 2025-01-24

-- ============================================
-- SOS LOCATION HISTORY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS sos_location_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sos_alert_id UUID NOT NULL REFERENCES sos_alerts(id) ON DELETE CASCADE,
  
  -- Location
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy_meters DECIMAL(8, 2),
  
  -- Timestamp
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Index for efficient queries
  CONSTRAINT sos_location_history_sos_alert_fk FOREIGN KEY (sos_alert_id) REFERENCES sos_alerts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sos_location_history_sos_alert_id ON sos_location_history(sos_alert_id);
CREATE INDEX IF NOT EXISTS idx_sos_location_history_recorded_at ON sos_location_history(recorded_at DESC);

-- ============================================
-- UPDATE sos_alerts TABLE
-- ============================================
-- Add streaming status
ALTER TABLE sos_alerts
ADD COLUMN IF NOT EXISTS streaming_active BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_location_update TIMESTAMPTZ;

-- ============================================
-- FUNCTION: Start GPS Streaming
-- ============================================
CREATE OR REPLACE FUNCTION start_sos_streaming(p_sos_alert_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE sos_alerts
  SET streaming_active = true,
      last_location_update = NOW(),
      updated_at = NOW()
  WHERE id = p_sos_alert_id
    AND status = 'active';
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Stop GPS Streaming
-- ============================================
CREATE OR REPLACE FUNCTION stop_sos_streaming(p_sos_alert_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE sos_alerts
  SET streaming_active = false,
      updated_at = NOW()
  WHERE id = p_sos_alert_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Get Active SOS Alerts with Latest Location
-- ============================================
CREATE OR REPLACE FUNCTION get_active_sos_alerts()
RETURNS TABLE (
  id UUID,
  guide_id UUID,
  guide_name TEXT,
  trip_id UUID,
  trip_code TEXT,
  latitude DECIMAL,
  longitude DECIMAL,
  last_location_update TIMESTAMPTZ,
  streaming_active BOOLEAN,
  created_at TIMESTAMPTZ,
  location_history_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sa.id,
    sa.guide_id,
    u.full_name::TEXT AS guide_name,
    sa.trip_id,
    t.trip_code::TEXT,
    sa.latitude,
    sa.longitude,
    sa.last_location_update,
    sa.streaming_active,
    sa.created_at,
    COUNT(slh.id) AS location_history_count
  FROM sos_alerts sa
  INNER JOIN users u ON u.id = sa.guide_id
  LEFT JOIN trips t ON t.id = sa.trip_id
  LEFT JOIN sos_location_history slh ON slh.sos_alert_id = sa.id
  WHERE sa.status = 'active'
  GROUP BY sa.id, u.full_name, t.trip_code
  ORDER BY sa.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE sos_location_history ENABLE ROW LEVEL SECURITY;

-- Guides can view their own location history
CREATE POLICY "Guides can view own location history"
  ON sos_location_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sos_alerts
      WHERE sos_alerts.id = sos_location_history.sos_alert_id
        AND sos_alerts.guide_id = auth.uid()
    )
  );

-- Admins can view all location history
CREATE POLICY "Admins can view all location history"
  ON sos_location_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
        AND role IN ('super_admin', 'ops_admin')
    )
  );

-- System can insert location history (via service role)
CREATE POLICY "System can insert location history"
  ON sos_location_history
  FOR INSERT
  USING (true)
  WITH CHECK (true);

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE sos_location_history IS 'GPS location history for SOS alerts (streaming every 10 seconds)';
COMMENT ON FUNCTION start_sos_streaming IS 'Start GPS streaming for SOS alert';
COMMENT ON FUNCTION stop_sos_streaming IS 'Stop GPS streaming for SOS alert';
COMMENT ON FUNCTION get_active_sos_alerts IS 'Get all active SOS alerts with latest location and history count';

