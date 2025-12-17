-- Migration: 011-live-tracking.sql
-- Description: Live Tracking, GPS Pings, Geofencing (PRD 5.4, 6.1)
-- Created: 2025-12-17

-- ============================================
-- MEETING POINTS (Geofencing - PRD 4.1.C)
-- ============================================
CREATE TABLE IF NOT EXISTS meeting_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES branches(id),
  
  -- Point Info
  name VARCHAR(200) NOT NULL, -- "Dermaga Ketapang"
  description TEXT,
  
  -- Location
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  
  -- Geofence
  radius_meters INTEGER DEFAULT 50, -- 50 meter radius
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- GPS PINGS (Live Tracking - PRD 6.1.C)
-- ============================================
CREATE TABLE IF NOT EXISTS gps_pings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id),
  guide_id UUID NOT NULL REFERENCES users(id),
  
  -- Location
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy_meters DECIMAL(6,2), -- GPS accuracy
  altitude_meters DECIMAL(8,2),
  heading DECIMAL(5,2), -- Direction in degrees
  speed_kmh DECIMAL(6,2),
  
  -- Metadata
  battery_percent INTEGER,
  is_charging BOOLEAN,
  network_type VARCHAR(20), -- wifi, 4g, 3g
  
  -- Timestamp
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Partitioned by date for performance
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create hypertable if TimescaleDB available (optional)
-- SELECT create_hypertable('gps_pings', 'created_at', if_not_exists => TRUE);

-- ============================================
-- GUIDE LOCATIONS (Current Position Cache)
-- ============================================
CREATE TABLE IF NOT EXISTS guide_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID NOT NULL REFERENCES users(id) UNIQUE,
  trip_id UUID REFERENCES trips(id),
  
  -- Current Location
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy_meters DECIMAL(6,2),
  
  -- Status
  is_online BOOLEAN DEFAULT true,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Audit
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INSURANCE MANIFESTS (Auto-Email - PRD 6.1.B)
-- ============================================
DO $$ BEGIN
  CREATE TYPE manifest_status AS ENUM (
    'pending',
    'generated',
    'sent',
    'failed'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS insurance_manifests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES branches(id),
  
  -- Date
  manifest_date DATE NOT NULL,
  
  -- Content
  passenger_count INTEGER NOT NULL,
  manifest_data JSONB NOT NULL, -- Array of passenger data
  
  -- File
  pdf_url TEXT,
  csv_url TEXT,
  
  -- Email
  status manifest_status NOT NULL DEFAULT 'pending',
  sent_to VARCHAR(200),
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(branch_id, manifest_date)
);

-- ============================================
-- DATA RETENTION LOGS (PRD 6.2.A)
-- ============================================
CREATE TABLE IF NOT EXISTS data_retention_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- What was deleted
  entity_type VARCHAR(100) NOT NULL, -- 'booking_passengers.id_card_url'
  entity_id UUID NOT NULL,
  
  -- Policy Applied
  retention_days INTEGER NOT NULL,
  original_trip_date DATE,
  
  -- Action
  deleted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  files_deleted TEXT[] -- List of deleted file URLs
);

-- ============================================
-- CRON JOB LOGS
-- ============================================
DO $$ BEGIN
  CREATE TYPE cron_job_status AS ENUM (
    'running',
    'completed',
    'failed'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS cron_job_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Job Info
  job_name VARCHAR(100) NOT NULL,
  job_type VARCHAR(50) NOT NULL, -- 'insurance_manifest', 'data_retention', 'reminder'
  
  -- Execution
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status cron_job_status NOT NULL DEFAULT 'running',
  
  -- Results
  records_processed INTEGER DEFAULT 0,
  error_message TEXT,
  
  -- Metadata
  metadata JSONB
);

-- ============================================
-- NOTIFICATION LOGS (WhatsApp/Email)
-- ============================================
DO $$ BEGIN
  CREATE TYPE notification_channel AS ENUM (
    'whatsapp',
    'email',
    'push',
    'sms'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE notification_status AS ENUM (
    'pending',
    'sent',
    'delivered',
    'read',
    'failed'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Recipient
  user_id UUID REFERENCES users(id),
  recipient_phone VARCHAR(20),
  recipient_email VARCHAR(200),
  
  -- Channel
  channel notification_channel NOT NULL,
  
  -- Content
  template_name VARCHAR(100),
  subject VARCHAR(300),
  body TEXT,
  
  -- Context
  entity_type VARCHAR(100), -- 'booking', 'trip', 'sos_alert'
  entity_id UUID,
  
  -- Status
  status notification_status NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  
  -- Error
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SETTINGS (Configurable Values)
-- ============================================
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES branches(id), -- NULL = global
  
  -- Setting
  key VARCHAR(100) NOT NULL,
  value TEXT NOT NULL,
  value_type VARCHAR(20) DEFAULT 'string', -- string, number, boolean, json
  
  -- Metadata
  description TEXT,
  is_public BOOLEAN DEFAULT false, -- Visible to frontend
  
  -- Audit
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(branch_id, key)
);

-- Insert default settings
INSERT INTO settings (key, value, value_type, description) VALUES
  ('late_penalty_amount', '25000', 'number', 'Denda keterlambatan guide (Rp)'),
  ('late_threshold_minutes', '0', 'number', 'Toleransi keterlambatan (menit)'),
  ('geofence_radius_meters', '50', 'number', 'Radius geofencing check-in'),
  ('data_retention_days', '30', 'number', 'Hari penyimpanan foto KTP'),
  ('split_bill_expiry_hours', '24', 'number', 'Jam kadaluarsa split bill'),
  ('points_per_100k', '10', 'number', 'Poin per Rp 100.000 transaksi'),
  ('referral_bonus_points', '10000', 'number', 'Bonus poin referral'),
  ('insurance_email', 'asuransi@aerotravel.co.id', 'string', 'Email tujuan manifest asuransi'),
  ('sla_ticket_minutes', '30', 'number', 'SLA ticket sebelum eskalasi')
ON CONFLICT (branch_id, key) DO NOTHING;

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_meeting_points_branch_id ON meeting_points(branch_id);
CREATE INDEX IF NOT EXISTS idx_meeting_points_location ON meeting_points(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_gps_pings_trip_id ON gps_pings(trip_id);
CREATE INDEX IF NOT EXISTS idx_gps_pings_guide_id ON gps_pings(guide_id);
CREATE INDEX IF NOT EXISTS idx_gps_pings_recorded_at ON gps_pings(recorded_at);
CREATE INDEX IF NOT EXISTS idx_guide_locations_guide_id ON guide_locations(guide_id);
CREATE INDEX IF NOT EXISTS idx_insurance_manifests_date ON insurance_manifests(manifest_date);
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_entity ON notification_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);

-- ============================================
-- TRIGGERS
-- ============================================
CREATE TRIGGER update_meeting_points_updated_at
  BEFORE UPDATE ON meeting_points
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_guide_locations_updated_at
  BEFORE UPDATE ON guide_locations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNCTION: Check if location is within geofence
-- ============================================
CREATE OR REPLACE FUNCTION is_within_geofence(
  p_lat DECIMAL,
  p_lng DECIMAL,
  p_meeting_point_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_point RECORD;
  v_distance DECIMAL;
BEGIN
  SELECT latitude, longitude, radius_meters
  INTO v_point
  FROM meeting_points
  WHERE id = p_meeting_point_id AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Haversine formula (simplified)
  v_distance := 111320 * SQRT(
    POWER(p_lat - v_point.latitude, 2) +
    POWER((p_lng - v_point.longitude) * COS(RADIANS(v_point.latitude)), 2)
  );
  
  RETURN v_distance <= v_point.radius_meters;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Get setting value
-- ============================================
CREATE OR REPLACE FUNCTION get_setting(
  p_key VARCHAR,
  p_branch_id UUID DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
  v_value TEXT;
BEGIN
  -- Try branch-specific first
  IF p_branch_id IS NOT NULL THEN
    SELECT value INTO v_value
    FROM settings
    WHERE key = p_key AND branch_id = p_branch_id;
    
    IF FOUND THEN
      RETURN v_value;
    END IF;
  END IF;
  
  -- Fall back to global
  SELECT value INTO v_value
  FROM settings
  WHERE key = p_key AND branch_id IS NULL;
  
  RETURN v_value;
END;
$$ LANGUAGE plpgsql;
