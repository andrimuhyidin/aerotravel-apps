-- Migration: business-licenses.sql
-- Description: Business License Compliance System (NIB, SKDN, SISUPAR, TDUP, ASITA, CHSE)
-- Created: 2026-01-02
-- Purpose: Track and monitor business licenses for Permenparekraf/ASITA/Sisupar compliance

BEGIN;

-- ============================================
-- ENUMS
-- ============================================

-- License types enum
DO $$ BEGIN
  CREATE TYPE license_type AS ENUM (
    'nib',      -- Nomor Induk Berusaha (OSS)
    'skdn',     -- Surat Keterangan Domisili Niaga
    'sisupar',  -- Sistem Informasi Usaha Pariwisata
    'tdup',     -- Tanda Daftar Usaha Pariwisata
    'asita',    -- Keanggotaan ASITA
    'chse'      -- Cleanliness, Health, Safety, Environment
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- License status enum
DO $$ BEGIN
  CREATE TYPE license_status AS ENUM (
    'valid',
    'warning',    -- 30 days before expiry
    'critical',   -- 7 days before expiry
    'expired',
    'suspended'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- MAIN BUSINESS LICENSES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS business_licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_type license_type NOT NULL,
  license_number VARCHAR(100) NOT NULL,
  license_name VARCHAR(200) NOT NULL,
  
  -- Issuing authority
  issued_by VARCHAR(200) NOT NULL,
  issued_date DATE NOT NULL,
  expiry_date DATE,  -- NULL for perpetual licenses
  
  -- Status tracking
  status license_status NOT NULL DEFAULT 'valid',
  
  -- Documents
  document_url TEXT,
  
  -- Additional info
  notes TEXT,
  
  -- Reminder tracking
  reminder_30d_sent BOOLEAN DEFAULT false,
  reminder_15d_sent BOOLEAN DEFAULT false,
  reminder_7d_sent BOOLEAN DEFAULT false,
  reminder_1d_sent BOOLEAN DEFAULT false,
  
  -- Audit
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(license_type, license_number)
);

-- ============================================
-- ASITA MEMBERSHIP DETAILS
-- Extends business_licenses for ASITA-specific data
-- ============================================
CREATE TABLE IF NOT EXISTS asita_membership (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id UUID NOT NULL REFERENCES business_licenses(id) ON DELETE CASCADE,
  
  nia VARCHAR(50) NOT NULL UNIQUE,  -- Nomor Induk Anggota
  membership_type VARCHAR(50) NOT NULL CHECK (membership_type IN ('regular', 'premium', 'corporate')),
  dpd_region VARCHAR(100),  -- DPD ASITA region (e.g., "DPD ASITA Lampung")
  member_since DATE NOT NULL,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- COMPLIANCE ALERTS TABLE
-- Tracks alerts for license expiry and renewals
-- ============================================
CREATE TABLE IF NOT EXISTS compliance_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id UUID NOT NULL REFERENCES business_licenses(id) ON DELETE CASCADE,
  
  -- Alert details
  alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN (
    'expiry_30d',
    'expiry_15d', 
    'expiry_7d',
    'expiry_1d',
    'expired',
    'renewal_reminder',
    'status_change'
  )),
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  message TEXT NOT NULL,
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  is_resolved BOOLEAN DEFAULT false,
  read_by UUID REFERENCES users(id),
  read_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  
  -- Notifications sent tracking
  email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMPTZ,
  whatsapp_sent BOOLEAN DEFAULT false,
  whatsapp_sent_at TIMESTAMPTZ,
  push_sent BOOLEAN DEFAULT false,
  push_sent_at TIMESTAMPTZ,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_business_licenses_type ON business_licenses(license_type);
CREATE INDEX IF NOT EXISTS idx_business_licenses_status ON business_licenses(status);
CREATE INDEX IF NOT EXISTS idx_business_licenses_expiry ON business_licenses(expiry_date);
CREATE INDEX IF NOT EXISTS idx_business_licenses_expiry_status ON business_licenses(expiry_date, status);

CREATE INDEX IF NOT EXISTS idx_asita_membership_license ON asita_membership(license_id);
CREATE INDEX IF NOT EXISTS idx_asita_membership_nia ON asita_membership(nia);

CREATE INDEX IF NOT EXISTS idx_compliance_alerts_license ON compliance_alerts(license_id);
CREATE INDEX IF NOT EXISTS idx_compliance_alerts_unread ON compliance_alerts(is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_compliance_alerts_unresolved ON compliance_alerts(is_resolved) WHERE is_resolved = false;
CREATE INDEX IF NOT EXISTS idx_compliance_alerts_created ON compliance_alerts(created_at DESC);

-- ============================================
-- TRIGGERS
-- ============================================

-- Update updated_at on business_licenses
CREATE TRIGGER update_business_licenses_updated_at
  BEFORE UPDATE ON business_licenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update updated_at on asita_membership
CREATE TRIGGER update_asita_membership_updated_at
  BEFORE UPDATE ON asita_membership
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE business_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE asita_membership ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_alerts ENABLE ROW LEVEL SECURITY;

-- Business Licenses: Only super_admin and ops_admin can manage
CREATE POLICY "Admin can view licenses"
  ON business_licenses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('super_admin', 'ops_admin', 'finance_manager', 'investor')
    )
  );

CREATE POLICY "Admin can insert licenses"
  ON business_licenses
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('super_admin', 'ops_admin')
    )
  );

CREATE POLICY "Admin can update licenses"
  ON business_licenses
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('super_admin', 'ops_admin')
    )
  );

CREATE POLICY "Admin can delete licenses"
  ON business_licenses
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'super_admin'
    )
  );

-- ASITA Membership: Same as business_licenses
CREATE POLICY "Admin can manage asita_membership"
  ON asita_membership
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('super_admin', 'ops_admin')
    )
  );

-- Compliance Alerts: Viewable by admins, resolvable by super_admin/ops_admin
CREATE POLICY "Admin can view alerts"
  ON compliance_alerts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('super_admin', 'ops_admin', 'finance_manager', 'investor')
    )
  );

CREATE POLICY "Admin can manage alerts"
  ON compliance_alerts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('super_admin', 'ops_admin')
    )
  );

-- ============================================
-- FUNCTION: Check and update license statuses
-- Called by cron job daily at 07:00 WIB (00:00 UTC)
-- ============================================
CREATE OR REPLACE FUNCTION check_license_expiry()
RETURNS TABLE(
  updated_count INTEGER,
  new_alerts_count INTEGER
) AS $$
DECLARE
  v_updated INTEGER := 0;
  v_alerts INTEGER := 0;
  license_record RECORD;
  days_until_expiry INTEGER;
  alert_type_val VARCHAR(50);
  severity_val VARCHAR(20);
  message_val TEXT;
BEGIN
  -- Loop through all licenses with expiry dates
  FOR license_record IN 
    SELECT id, license_type, license_name, license_number, expiry_date, status,
           reminder_30d_sent, reminder_15d_sent, reminder_7d_sent, reminder_1d_sent
    FROM business_licenses
    WHERE expiry_date IS NOT NULL
      AND status != 'suspended'
  LOOP
    days_until_expiry := license_record.expiry_date - CURRENT_DATE;
    
    -- Update status based on days until expiry
    IF days_until_expiry < 0 AND license_record.status != 'expired' THEN
      UPDATE business_licenses 
      SET status = 'expired', updated_at = NOW() 
      WHERE id = license_record.id;
      v_updated := v_updated + 1;
      
      -- Create expired alert
      INSERT INTO compliance_alerts (license_id, alert_type, severity, message)
      VALUES (
        license_record.id,
        'expired',
        'critical',
        format('Izin %s (%s) telah EXPIRED pada %s. Segera lakukan perpanjangan!',
          license_record.license_name,
          license_record.license_number,
          license_record.expiry_date::TEXT)
      );
      v_alerts := v_alerts + 1;
      
    ELSIF days_until_expiry <= 7 AND license_record.status NOT IN ('expired', 'critical') THEN
      UPDATE business_licenses 
      SET status = 'critical', updated_at = NOW() 
      WHERE id = license_record.id;
      v_updated := v_updated + 1;
      
    ELSIF days_until_expiry <= 30 AND license_record.status NOT IN ('expired', 'critical', 'warning') THEN
      UPDATE business_licenses 
      SET status = 'warning', updated_at = NOW() 
      WHERE id = license_record.id;
      v_updated := v_updated + 1;
    END IF;
    
    -- Generate alerts based on days until expiry (only if not already sent)
    IF days_until_expiry = 30 AND NOT license_record.reminder_30d_sent THEN
      INSERT INTO compliance_alerts (license_id, alert_type, severity, message)
      VALUES (
        license_record.id,
        'expiry_30d',
        'warning',
        format('Izin %s (%s) akan expired dalam 30 hari (%s). Siapkan dokumen perpanjangan.',
          license_record.license_name,
          license_record.license_number,
          license_record.expiry_date::TEXT)
      );
      UPDATE business_licenses SET reminder_30d_sent = true WHERE id = license_record.id;
      v_alerts := v_alerts + 1;
      
    ELSIF days_until_expiry = 15 AND NOT license_record.reminder_15d_sent THEN
      INSERT INTO compliance_alerts (license_id, alert_type, severity, message)
      VALUES (
        license_record.id,
        'expiry_15d',
        'warning',
        format('Izin %s (%s) akan expired dalam 15 hari (%s). Segera ajukan perpanjangan.',
          license_record.license_name,
          license_record.license_number,
          license_record.expiry_date::TEXT)
      );
      UPDATE business_licenses SET reminder_15d_sent = true WHERE id = license_record.id;
      v_alerts := v_alerts + 1;
      
    ELSIF days_until_expiry = 7 AND NOT license_record.reminder_7d_sent THEN
      INSERT INTO compliance_alerts (license_id, alert_type, severity, message)
      VALUES (
        license_record.id,
        'expiry_7d',
        'critical',
        format('URGENT: Izin %s (%s) akan expired dalam 7 hari (%s)!',
          license_record.license_name,
          license_record.license_number,
          license_record.expiry_date::TEXT)
      );
      UPDATE business_licenses SET reminder_7d_sent = true WHERE id = license_record.id;
      v_alerts := v_alerts + 1;
      
    ELSIF days_until_expiry = 1 AND NOT license_record.reminder_1d_sent THEN
      INSERT INTO compliance_alerts (license_id, alert_type, severity, message)
      VALUES (
        license_record.id,
        'expiry_1d',
        'critical',
        format('KRITIS: Izin %s (%s) akan expired BESOK (%s)! Operasional terancam ilegal.',
          license_record.license_name,
          license_record.license_number,
          license_record.expiry_date::TEXT)
      );
      UPDATE business_licenses SET reminder_1d_sent = true WHERE id = license_record.id;
      v_alerts := v_alerts + 1;
    END IF;
  END LOOP;
  
  updated_count := v_updated;
  new_alerts_count := v_alerts;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Get compliance score (0-100%)
-- Score = (valid licenses / total licenses) * 100
-- ============================================
CREATE OR REPLACE FUNCTION get_compliance_score()
RETURNS INTEGER AS $$
DECLARE
  total_count INTEGER;
  valid_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_count FROM business_licenses;
  
  IF total_count = 0 THEN
    RETURN 100; -- No licenses = 100% (nothing to comply with)
  END IF;
  
  SELECT COUNT(*) INTO valid_count 
  FROM business_licenses 
  WHERE status = 'valid';
  
  RETURN ROUND((valid_count::DECIMAL / total_count) * 100);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Get ASITA membership info
-- Returns NULL if not an ASITA member
-- ============================================
CREATE OR REPLACE FUNCTION get_asita_membership()
RETURNS TABLE(
  is_member BOOLEAN,
  nia VARCHAR(50),
  membership_type VARCHAR(50),
  dpd_region VARCHAR(100),
  member_since DATE,
  expiry_date DATE,
  status license_status
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    true AS is_member,
    am.nia,
    am.membership_type,
    am.dpd_region,
    am.member_since,
    bl.expiry_date,
    bl.status
  FROM business_licenses bl
  JOIN asita_membership am ON am.license_id = bl.id
  WHERE bl.license_type = 'asita'
    AND bl.status != 'suspended'
  LIMIT 1;
  
  -- If no rows returned, return a "not member" row
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::VARCHAR(50), NULL::VARCHAR(50), NULL::VARCHAR(100), NULL::DATE, NULL::DATE, NULL::license_status;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- CRON JOB: Daily license expiry check
-- Runs at 00:00 UTC (07:00 WIB)
-- ============================================
-- Note: Requires pg_cron extension enabled in Supabase
-- If using Vercel Cron, comment out this section
DO $$
BEGIN
  -- Check if pg_cron extension is available
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Schedule the job
    PERFORM cron.schedule(
      'check-license-expiry-daily',
      '0 0 * * *',
      'SELECT * FROM check_license_expiry()'
    );
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'pg_cron not available, use Vercel Cron instead';
END $$;

COMMIT;

