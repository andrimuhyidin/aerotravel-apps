-- Migration: 055-auto-insurance-manifest.sql
-- Description: Auto-Insurance Manifest system (PRD 6.1.B)
-- Created: 2025-01-24
-- 
-- Features:
-- - Insurance manifest table for tracking
-- - Standardized format for insurance companies
-- - Cron job ready (to be configured in Supabase)

-- ============================================
-- INSURANCE COMPANIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS insurance_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES branches(id),
  
  -- Company Info
  name VARCHAR(200) NOT NULL,
  code VARCHAR(50) NOT NULL, -- e.g., JASARAHARJA, ALLIANZ
  email VARCHAR(200) NOT NULL,
  phone VARCHAR(20),
  
  -- Configuration
  is_active BOOLEAN DEFAULT true,
  format_type VARCHAR(50) DEFAULT 'csv', -- csv, pdf, excel
  template_config JSONB, -- Template configuration for different formats
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  UNIQUE(branch_id, code)
);

-- ============================================
-- INSURANCE MANIFESTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS insurance_manifests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES branches(id),
  
  -- Trip Info
  trip_id UUID NOT NULL REFERENCES trips(id),
  trip_date DATE NOT NULL,
  
  -- Insurance Company
  insurance_company_id UUID REFERENCES insurance_companies(id),
  insurance_company_name VARCHAR(200), -- Denormalized for historical records
  
  -- Manifest Data
  passenger_count INTEGER NOT NULL,
  manifest_data JSONB NOT NULL, -- Full passenger data (Nama, NIK, Tanggal Lahir, etc.)
  
  -- File Storage
  file_url TEXT, -- URL to generated CSV/PDF file
  file_format VARCHAR(50) DEFAULT 'csv', -- csv, pdf, excel
  file_size_bytes INTEGER,
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, sent, failed, cancelled
  sent_at TIMESTAMPTZ,
  sent_to_email VARCHAR(200),
  error_message TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT insurance_manifests_status_check CHECK (status IN ('pending', 'sent', 'failed', 'cancelled'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_insurance_manifests_trip_id ON insurance_manifests(trip_id);
CREATE INDEX IF NOT EXISTS idx_insurance_manifests_trip_date ON insurance_manifests(trip_date);
CREATE INDEX IF NOT EXISTS idx_insurance_manifests_status ON insurance_manifests(status);
CREATE INDEX IF NOT EXISTS idx_insurance_manifests_insurance_company_id ON insurance_manifests(insurance_company_id);
CREATE INDEX IF NOT EXISTS idx_insurance_manifests_branch_id ON insurance_manifests(branch_id);
CREATE INDEX IF NOT EXISTS idx_insurance_companies_branch_id ON insurance_companies(branch_id);

-- RLS Policies
ALTER TABLE insurance_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_manifests ENABLE ROW LEVEL SECURITY;

-- Insurance companies: Only admins can manage
CREATE POLICY "admin_manage_insurance_companies" ON insurance_companies
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('ops_admin', 'super_admin', 'finance_manager')
    )
  );

-- Insurance manifests: Admins can see all, guides can see related trips
CREATE POLICY "admin_view_insurance_manifests" ON insurance_manifests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('ops_admin', 'super_admin', 'finance_manager')
    )
  );

CREATE POLICY "guide_view_own_trip_manifests" ON insurance_manifests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM trip_guides
      WHERE trip_id = insurance_manifests.trip_id
      AND guide_id = auth.uid()
    )
  );

-- Comments
COMMENT ON TABLE insurance_companies IS 'Insurance companies for auto-manifest system';
COMMENT ON TABLE insurance_manifests IS 'Auto-generated insurance manifests for trips';
COMMENT ON COLUMN insurance_manifests.manifest_data IS 'Full passenger data in JSON format: [{name, nik, birth_date, ...}]';
COMMENT ON COLUMN insurance_manifests.status IS 'Manifest status: pending (generated but not sent), sent, failed, cancelled';

-- ============================================
-- FUNCTION: Generate Insurance Manifest
-- ============================================
CREATE OR REPLACE FUNCTION generate_insurance_manifest(
  p_trip_id UUID,
  p_insurance_company_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_manifest_id UUID;
  v_trip_date DATE;
  v_passenger_count INTEGER;
  v_manifest_data JSONB;
  v_insurance_company_id UUID;
  v_insurance_company_name VARCHAR(200);
  v_branch_id UUID;
BEGIN
  -- Get trip info
  SELECT 
    t.trip_date,
    t.branch_id,
    COUNT(bp.id)
  INTO 
    v_trip_date,
    v_branch_id,
    v_passenger_count
  FROM trips t
  LEFT JOIN trip_bookings tb ON tb.trip_id = t.id
  LEFT JOIN booking_passengers bp ON bp.booking_id = tb.booking_id
  WHERE t.id = p_trip_id
  GROUP BY t.id, t.trip_date, t.branch_id;
  
  IF v_trip_date IS NULL THEN
    RAISE EXCEPTION 'Trip not found: %', p_trip_id;
  END IF;
  
  -- Get or use default insurance company
  IF p_insurance_company_id IS NULL THEN
    SELECT id, name INTO v_insurance_company_id, v_insurance_company_name
    FROM insurance_companies
    WHERE branch_id = v_branch_id
    AND is_active = true
    ORDER BY created_at DESC
    LIMIT 1;
  ELSE
    SELECT id, name INTO v_insurance_company_id, v_insurance_company_name
    FROM insurance_companies
    WHERE id = p_insurance_company_id;
  END IF;
  
  -- Build manifest data (passenger list)
  SELECT jsonb_agg(
    jsonb_build_object(
      'name', bp.full_name,
      'nik', bp.id_number,
      'birth_date', bp.date_of_birth,
      'gender', NULL, -- Not available in booking_passengers
      'phone', bp.phone,
      'email', bp.email
    )
  )
  INTO v_manifest_data
  FROM booking_passengers bp
  INNER JOIN trip_bookings tb ON tb.booking_id = bp.booking_id
  INNER JOIN bookings b ON b.id = bp.booking_id
  WHERE tb.trip_id = p_trip_id
  AND b.status = 'confirmed';
  
  -- Create manifest record
  INSERT INTO insurance_manifests (
    branch_id,
    trip_id,
    trip_date,
    insurance_company_id,
    insurance_company_name,
    passenger_count,
    manifest_data,
    status
  )
  VALUES (
    v_branch_id,
    p_trip_id,
    v_trip_date,
    v_insurance_company_id,
    v_insurance_company_name,
    v_passenger_count,
    v_manifest_data,
    'pending'
  )
  RETURNING id INTO v_manifest_id;
  
  RETURN v_manifest_id;
END;
$$;

-- ============================================
-- CRON JOB: Auto-Generate Insurance Manifests
-- ============================================
-- Note: This will be configured in Supabase Dashboard > Database > Cron Jobs
-- Schedule: Every day at 06:00 WIB (23:00 UTC previous day)
-- 
-- To enable:
-- 1. Go to Supabase Dashboard > Database > Cron Jobs
-- 2. Create new cron job:
--    - Name: auto_insurance_manifest
--    - Schedule: 0 23 * * * (every day at 23:00 UTC = 06:00 WIB)
--    - SQL: SELECT generate_daily_insurance_manifests();
--
-- Function to be called by cron:
CREATE OR REPLACE FUNCTION generate_daily_insurance_manifests()
RETURNS TABLE(manifest_id UUID, trip_id UUID, status TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_trip RECORD;
  v_manifest_id UUID;
BEGIN
  -- Get all confirmed trips for today
  FOR v_trip IN
    SELECT DISTINCT t.id, t.branch_id
    FROM trips t
    INNER JOIN trip_bookings tb ON tb.trip_id = t.id
    INNER JOIN bookings b ON b.id = tb.booking_id
    WHERE t.trip_date = CURRENT_DATE
    AND t.status = 'confirmed'
    AND b.status = 'confirmed'
    AND NOT EXISTS (
      SELECT 1 FROM insurance_manifests im
      WHERE im.trip_id = t.id
      AND im.trip_date = CURRENT_DATE
    )
  LOOP
    BEGIN
      -- Generate manifest for this trip
      SELECT generate_insurance_manifest(v_trip.id) INTO v_manifest_id;
      
      manifest_id := v_manifest_id;
      trip_id := v_trip.id;
      status := 'generated';
      
      RETURN NEXT;
    EXCEPTION
      WHEN OTHERS THEN
        manifest_id := NULL;
        trip_id := v_trip.id;
        status := 'error: ' || SQLERRM;
        
        RETURN NEXT;
    END;
  END LOOP;
  
  RETURN;
END;
$$;

-- Comments
COMMENT ON FUNCTION generate_insurance_manifest IS 'Generate insurance manifest for a trip';
COMMENT ON FUNCTION generate_daily_insurance_manifests IS 'Cron job function: Auto-generate insurance manifests for today trips (runs at 06:00 WIB)';

