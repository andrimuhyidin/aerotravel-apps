-- Migration: 054-sos-alerts-table.sql
-- Description: Create SOS alerts table for emergency tracking
-- Created: 2025-01-24

-- ============================================
-- SOS ALERTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS sos_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES branches(id),
  
  -- Guide & Trip Info
  guide_id UUID NOT NULL REFERENCES users(id),
  trip_id UUID REFERENCES trips(id),
  
  -- Location
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  accuracy_meters DECIMAL(8, 2),
  
  -- Alert Details
  message TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- active, resolved, cancelled
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id),
  resolution_notes TEXT,
  
  -- Notifications
  whatsapp_sent BOOLEAN DEFAULT false,
  push_sent BOOLEAN DEFAULT false,
  nearby_crew_notified BOOLEAN DEFAULT false,
  emergency_contacts_notified BOOLEAN DEFAULT false,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT sos_alerts_status_check CHECK (status IN ('active', 'resolved', 'cancelled'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sos_alerts_guide_id ON sos_alerts(guide_id);
CREATE INDEX IF NOT EXISTS idx_sos_alerts_trip_id ON sos_alerts(trip_id);
CREATE INDEX IF NOT EXISTS idx_sos_alerts_status ON sos_alerts(status);
CREATE INDEX IF NOT EXISTS idx_sos_alerts_created_at ON sos_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sos_alerts_branch_id ON sos_alerts(branch_id);

-- RLS Policies
ALTER TABLE sos_alerts ENABLE ROW LEVEL SECURITY;

-- Guide can see own SOS alerts
CREATE POLICY "guide_own_sos_alerts" ON sos_alerts
  FOR ALL
  USING (
    guide_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('ops_admin', 'super_admin', 'finance_manager')
    )
  );

-- Comments
COMMENT ON TABLE sos_alerts IS 'SOS emergency alerts from guides';
COMMENT ON COLUMN sos_alerts.status IS 'Alert status: active, resolved, cancelled';
COMMENT ON COLUMN sos_alerts.whatsapp_sent IS 'Whether WhatsApp notification was sent to internal group';
COMMENT ON COLUMN sos_alerts.push_sent IS 'Whether push notification was sent to admin';
COMMENT ON COLUMN sos_alerts.nearby_crew_notified IS 'Whether nearby crew members were notified';
COMMENT ON COLUMN sos_alerts.emergency_contacts_notified IS 'Whether emergency contacts were notified';

