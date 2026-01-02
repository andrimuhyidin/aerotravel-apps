-- Migration: 143-pdp-consent-management.sql
-- Description: UU PDP 2022 Compliance - Consent Management, Data Export, Breach Notification
-- Created: 2026-01-03
-- Purpose: Implement granular consent management per-purpose as required by Indonesian PDP Law

BEGIN;

-- ============================================
-- CONSENT PURPOSES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS consent_purposes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purpose_code VARCHAR(50) UNIQUE NOT NULL,
  purpose_name VARCHAR(200) NOT NULL,
  description TEXT,
  is_mandatory BOOLEAN DEFAULT false,
  category VARCHAR(50) NOT NULL CHECK (category IN ('operational', 'marketing', 'analytics', 'third_party')),
  legal_basis TEXT, -- Legal justification for processing
  retention_period INTEGER, -- Days to retain data for this purpose
  
  -- Audit
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- USER CONSENTS PER PURPOSE
-- ============================================
CREATE TABLE IF NOT EXISTS user_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose_id UUID NOT NULL REFERENCES consent_purposes(id),
  
  -- Consent details
  consent_given BOOLEAN NOT NULL,
  consent_method VARCHAR(20) CHECK (consent_method IN ('checkbox', 'signature', 'verbal', 'implicit')),
  consent_timestamp TIMESTAMPTZ DEFAULT NOW(),
  
  -- Technical details (for audit trail)
  ip_address INET,
  user_agent TEXT,
  device_info JSONB,
  
  -- Withdrawal
  withdrawn_at TIMESTAMPTZ,
  withdrawal_reason TEXT,
  
  -- Version tracking (if consent terms change)
  consent_version INTEGER DEFAULT 1,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, purpose_id)
);

-- ============================================
-- DATA EXPORT REQUESTS
-- ============================================
CREATE TABLE IF NOT EXISTS data_export_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  
  -- Request details
  request_type VARCHAR(20) NOT NULL CHECK (request_type IN ('export', 'delete')),
  export_format VARCHAR(10) DEFAULT 'json' CHECK (export_format IN ('json', 'csv', 'pdf')),
  
  -- Status tracking
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'expired')),
  
  -- Result
  file_url TEXT,
  file_size_bytes BIGINT,
  expires_at TIMESTAMPTZ, -- Export files expire after 7 days
  
  -- Processing details
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DATA BREACH INCIDENTS
-- ============================================
CREATE TABLE IF NOT EXISTS data_breach_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Incident details
  incident_date TIMESTAMPTZ NOT NULL,
  detected_at TIMESTAMPTZ NOT NULL,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  
  -- Affected data
  affected_data_types TEXT[] NOT NULL, -- ['email', 'phone', 'ktp', 'location']
  affected_users_count INTEGER,
  affected_user_ids UUID[], -- For targeted notification
  
  -- Description
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  root_cause TEXT,
  attack_vector TEXT,
  
  -- Response
  remediation_steps TEXT,
  remediation_completed_at TIMESTAMPTZ,
  
  -- Notifications
  notification_sent_at TIMESTAMPTZ,
  notification_method VARCHAR(50), -- 'email', 'push', 'sms', 'all'
  reported_to_authority_at TIMESTAMPTZ,
  authority_report_number VARCHAR(100),
  
  -- Status
  status VARCHAR(20) DEFAULT 'investigating' CHECK (status IN ('investigating', 'contained', 'resolved', 'closed')),
  
  -- Audit
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DATA RETENTION POLICIES
-- ============================================
CREATE TABLE IF NOT EXISTS data_retention_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Policy details
  data_type VARCHAR(100) NOT NULL UNIQUE, -- 'ktp_photos', 'manifests', 'location_tracking', 'passenger_consents'
  table_name VARCHAR(100) NOT NULL,
  description TEXT,
  
  -- Retention period
  retention_days INTEGER NOT NULL,
  legal_basis TEXT, -- UU PDP, tax law, etc.
  
  -- Auto-deletion
  auto_delete_enabled BOOLEAN DEFAULT true,
  delete_function_name VARCHAR(100), -- Function to call for cleanup
  last_cleanup_at TIMESTAMPTZ,
  next_cleanup_at TIMESTAMPTZ,
  
  -- Audit
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_consent_purposes_category ON consent_purposes(category);
CREATE INDEX IF NOT EXISTS idx_consent_purposes_active ON consent_purposes(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_user_consents_user_id ON user_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_consents_purpose_id ON user_consents(purpose_id);
CREATE INDEX IF NOT EXISTS idx_user_consents_consent_given ON user_consents(consent_given);
CREATE INDEX IF NOT EXISTS idx_user_consents_withdrawn ON user_consents(withdrawn_at) WHERE withdrawn_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_data_export_requests_user_id ON data_export_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_data_export_requests_status ON data_export_requests(status);
CREATE INDEX IF NOT EXISTS idx_data_export_requests_pending ON data_export_requests(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_data_export_requests_expires ON data_export_requests(expires_at);

CREATE INDEX IF NOT EXISTS idx_data_breach_incidents_severity ON data_breach_incidents(severity);
CREATE INDEX IF NOT EXISTS idx_data_breach_incidents_status ON data_breach_incidents(status);
CREATE INDEX IF NOT EXISTS idx_data_breach_incidents_date ON data_breach_incidents(incident_date DESC);

CREATE INDEX IF NOT EXISTS idx_data_retention_policies_active ON data_retention_policies(is_active) WHERE is_active = true;

-- ============================================
-- TRIGGERS
-- ============================================
CREATE TRIGGER update_consent_purposes_updated_at
  BEFORE UPDATE ON consent_purposes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_consents_updated_at
  BEFORE UPDATE ON user_consents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_data_breach_incidents_updated_at
  BEFORE UPDATE ON data_breach_incidents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_data_retention_policies_updated_at
  BEFORE UPDATE ON data_retention_policies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE consent_purposes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_export_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_breach_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_retention_policies ENABLE ROW LEVEL SECURITY;

-- Consent Purposes: Anyone can read active purposes
CREATE POLICY "Anyone can view active consent purposes"
  ON consent_purposes
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admin can manage consent purposes"
  ON consent_purposes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('super_admin', 'ops_admin')
    )
  );

-- User Consents: Users can view and manage their own consents
CREATE POLICY "Users can view own consents"
  ON user_consents
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own consents"
  ON user_consents
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own consents"
  ON user_consents
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Admin can view all consents"
  ON user_consents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('super_admin', 'ops_admin')
    )
  );

-- Data Export Requests: Users can manage their own requests
CREATE POLICY "Users can view own export requests"
  ON data_export_requests
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own export requests"
  ON data_export_requests
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admin can view all export requests"
  ON data_export_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('super_admin', 'ops_admin')
    )
  );

-- Data Breach Incidents: Only admin can access
CREATE POLICY "Admin can manage breach incidents"
  ON data_breach_incidents
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('super_admin', 'ops_admin')
    )
  );

-- Data Retention Policies: Only admin can access
CREATE POLICY "Admin can manage retention policies"
  ON data_retention_policies
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('super_admin', 'ops_admin')
    )
  );

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function: Get user consent status for a specific purpose
CREATE OR REPLACE FUNCTION get_user_consent(p_user_id UUID, p_purpose_code VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
  v_consent_given BOOLEAN;
BEGIN
  SELECT uc.consent_given
  INTO v_consent_given
  FROM user_consents uc
  JOIN consent_purposes cp ON cp.id = uc.purpose_id
  WHERE uc.user_id = p_user_id
    AND cp.purpose_code = p_purpose_code
    AND uc.withdrawn_at IS NULL;
  
  RETURN COALESCE(v_consent_given, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get user's consent summary
CREATE OR REPLACE FUNCTION get_user_consent_summary(p_user_id UUID)
RETURNS TABLE(
  purpose_code VARCHAR,
  purpose_name VARCHAR,
  consent_given BOOLEAN,
  consent_timestamp TIMESTAMPTZ,
  is_mandatory BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cp.purpose_code,
    cp.purpose_name,
    COALESCE(uc.consent_given, false) AS consent_given,
    uc.consent_timestamp,
    cp.is_mandatory
  FROM consent_purposes cp
  LEFT JOIN user_consents uc ON uc.purpose_id = cp.id AND uc.user_id = p_user_id AND uc.withdrawn_at IS NULL
  WHERE cp.is_active = true
  ORDER BY cp.is_mandatory DESC, cp.purpose_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Expire old export files
CREATE OR REPLACE FUNCTION expire_old_export_files()
RETURNS INTEGER AS $$
DECLARE
  v_expired_count INTEGER := 0;
BEGIN
  UPDATE data_export_requests
  SET status = 'expired'
  WHERE status = 'completed'
    AND expires_at < NOW()
    AND status != 'expired';
  
  GET DIAGNOSTICS v_expired_count = ROW_COUNT;
  
  RETURN v_expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SEED DATA: Default Consent Purposes
-- ============================================
INSERT INTO consent_purposes (purpose_code, purpose_name, description, is_mandatory, category, legal_basis, retention_period)
VALUES
  ('essential_service', 'Layanan Esensial', 'Pemrosesan data untuk menyediakan layanan booking dan operasional trip', true, 'operational', 'UU PDP Pasal 16 - Persetujuan Eksplisit', 365),
  ('payment_processing', 'Pemrosesan Pembayaran', 'Pemrosesan data pembayaran dan invoice', true, 'operational', 'UU PDP Pasal 16 - Kepentingan Kontrak', 730),
  ('safety_tracking', 'Pelacakan Keselamatan', 'GPS tracking dan monitoring untuk keselamatan trip', true, 'operational', 'UU PDP Pasal 16 - Kepentingan Vital', 90),
  ('marketing_promo', 'Marketing & Promosi', 'Pengiriman promosi, newsletter, dan penawaran khusus', false, 'marketing', 'UU PDP Pasal 16 - Persetujuan', 365),
  ('analytics_improvement', 'Analitik & Pengembangan', 'Analisis penggunaan aplikasi untuk meningkatkan layanan', false, 'analytics', 'UU PDP Pasal 16 - Persetujuan', 180),
  ('photo_documentation', 'Dokumentasi Foto Trip', 'Penggunaan foto trip untuk keperluan promosi', false, 'marketing', 'UU PDP Pasal 16 - Persetujuan', 730),
  ('third_party_sharing', 'Berbagi dengan Mitra', 'Berbagi data dengan mitra bisnis (hotel, asuransi, dll)', false, 'third_party', 'UU PDP Pasal 16 - Persetujuan', 90)
ON CONFLICT (purpose_code) DO NOTHING;

-- ============================================
-- SEED DATA: Default Data Retention Policies
-- ============================================
INSERT INTO data_retention_policies (data_type, table_name, description, retention_days, legal_basis, delete_function_name)
VALUES
  ('ktp_photos', 'bookings', 'KTP photos dari customer booking', 30, 'UU PDP - Data sensitif harus dihapus setelah tidak diperlukan', 'cleanupKtpPhotos'),
  ('passenger_ktp', 'booking_passengers', 'KTP photos dari passenger manifest', 30, 'UU PDP - Data sensitif', 'cleanupPassengerDocuments'),
  ('manifest_data', 'trips', 'Passenger manifest setelah trip selesai', 72, 'UU PDP - Data pelacakan harus segera dihapus', 'cleanupTripManifests'),
  ('location_tracking', 'guide_location_logs', 'GPS tracking logs dari guide', 90, 'UU PDP - Data lokasi harus dibatasi waktu penyimpanan', 'cleanupLocationLogs'),
  ('passenger_consents', 'passenger_consents', 'Consent forms dari passengers', 365, 'Keperluan legal - simpan 1 tahun', 'cleanupPassengerConsents'),
  ('audit_logs', 'audit_logs', 'System audit logs', 730, 'Tax compliance - simpan 2 tahun', 'cleanupAuditLogs')
ON CONFLICT (data_type) DO NOTHING;

COMMIT;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE consent_purposes IS 'UU PDP 2022 - Define all consent purposes for granular user consent';
COMMENT ON TABLE user_consents IS 'UU PDP 2022 - Track user consent per purpose with full audit trail';
COMMENT ON TABLE data_export_requests IS 'UU PDP 2022 - Handle user data portability requests (right to access)';
COMMENT ON TABLE data_breach_incidents IS 'UU PDP 2022 - Track and manage data breach incidents';
COMMENT ON TABLE data_retention_policies IS 'UU PDP 2022 - Define data retention periods per data type';

