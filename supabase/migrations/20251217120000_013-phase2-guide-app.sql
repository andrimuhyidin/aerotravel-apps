-- Migration: 013-phase2-guide-app.sql
-- Description: Phase 2 - Guide App additions (SOS, Manifest Checks, Salary Deductions)
-- Created: 2025-12-17

-- ============================================
-- SOS ALERTS TABLE (PRD 6.1.A)
-- ============================================
DO $$ BEGIN
  CREATE TYPE sos_alert_type AS ENUM (
    'emergency',
    'medical',
    'security',
    'weather',
    'mechanical',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE sos_status AS ENUM (
    'active',
    'acknowledged',
    'resolved'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS sos_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id),
  guide_id UUID NOT NULL REFERENCES users(id),
  
  -- Alert Info
  alert_type sos_alert_type NOT NULL DEFAULT 'emergency',
  
  -- Location
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy_meters DECIMAL(6,2),
  
  -- Message
  message TEXT,
  
  -- Status
  status sos_status NOT NULL DEFAULT 'active',
  
  -- Acknowledgement
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES users(id),
  
  -- Resolution
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id),
  resolution_notes TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MANIFEST CHECKS TABLE (Digital Manifest)
-- ============================================
CREATE TABLE IF NOT EXISTS manifest_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id),
  passenger_id UUID NOT NULL REFERENCES booking_passengers(id),
  
  -- Boarding Check
  boarded_at TIMESTAMPTZ,
  boarded_by UUID REFERENCES users(id),
  
  -- Return Check
  returned_at TIMESTAMPTZ,
  returned_by UUID REFERENCES users(id),
  
  -- Notes
  notes TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(trip_id, passenger_id)
);

-- ============================================
-- SALARY DEDUCTIONS TABLE (Auto-Penalty)
-- ============================================
DO $$ BEGIN
  CREATE TYPE deduction_reason AS ENUM (
    'late_check_in',
    'missing_documentation',
    'complaint',
    'damage',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS salary_deductions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID NOT NULL REFERENCES users(id),
  trip_id UUID REFERENCES trips(id),
  
  -- Deduction
  amount DECIMAL(10,2) NOT NULL,
  reason deduction_reason NOT NULL,
  description TEXT,
  
  -- Status
  is_applied BOOLEAN DEFAULT false, -- Applied to payroll
  applied_at TIMESTAMPTZ,
  applied_by UUID REFERENCES users(id),
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_sos_alerts_trip_id ON sos_alerts(trip_id);
CREATE INDEX IF NOT EXISTS idx_sos_alerts_guide_id ON sos_alerts(guide_id);
CREATE INDEX IF NOT EXISTS idx_sos_alerts_status ON sos_alerts(status);
CREATE INDEX IF NOT EXISTS idx_sos_alerts_created_at ON sos_alerts(created_at);
CREATE INDEX IF NOT EXISTS idx_manifest_checks_trip_id ON manifest_checks(trip_id);
CREATE INDEX IF NOT EXISTS idx_manifest_checks_passenger_id ON manifest_checks(passenger_id);
CREATE INDEX IF NOT EXISTS idx_salary_deductions_guide_id ON salary_deductions(guide_id);
CREATE INDEX IF NOT EXISTS idx_salary_deductions_trip_id ON salary_deductions(trip_id);

-- ============================================
-- TRIGGERS
-- ============================================
CREATE TRIGGER update_manifest_checks_updated_at
  BEFORE UPDATE ON manifest_checks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE sos_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE manifest_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_deductions ENABLE ROW LEVEL SECURITY;

-- SOS Alerts: Guide can create, Admin can view/update
CREATE POLICY "Guides can create SOS alerts"
  ON sos_alerts FOR INSERT
  WITH CHECK (auth.uid() = guide_id);

CREATE POLICY "Guides can view own SOS alerts"
  ON sos_alerts FOR SELECT
  USING (auth.uid() = guide_id);

CREATE POLICY "Admin can view all SOS alerts"
  ON sos_alerts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'ops_admin', 'finance_manager')
    )
  );

CREATE POLICY "Admin can update SOS alerts"
  ON sos_alerts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'ops_admin')
    )
  );

-- Manifest Checks: Guide can create/update for assigned trips
CREATE POLICY "Guides can manage manifest checks for assigned trips"
  ON manifest_checks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM trip_guides
      WHERE trip_guides.trip_id = manifest_checks.trip_id
      AND trip_guides.guide_id = auth.uid()
    )
  );

CREATE POLICY "Admin can manage all manifest checks"
  ON manifest_checks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'ops_admin')
    )
  );

-- Salary Deductions: Guide can view own, Admin can manage
CREATE POLICY "Guides can view own salary deductions"
  ON salary_deductions FOR SELECT
  USING (auth.uid() = guide_id);

CREATE POLICY "Admin can manage salary deductions"
  ON salary_deductions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'ops_admin', 'finance_manager')
    )
  );
