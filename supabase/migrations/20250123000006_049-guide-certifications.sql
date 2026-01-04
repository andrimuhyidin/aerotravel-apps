-- Migration: 049-guide-certifications.sql
-- Description: Guide Certification Tracker (SIM Kapal, First Aid, ALIN)
-- Created: 2025-01-23

-- ============================================
-- GUIDE CERTIFICATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS guide_certifications_tracker (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id),
  
  -- Certification Info
  certification_type VARCHAR(50) NOT NULL, -- 'sim_kapal', 'first_aid', 'alin', 'other'
  certification_name VARCHAR(200) NOT NULL,
  certificate_number VARCHAR(100),
  issuing_authority VARCHAR(200), -- Lembaga yang mengeluarkan
  
  -- Dates
  issued_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  
  -- Document
  document_url TEXT, -- URL to certificate image/document
  document_verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMPTZ,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'verified', 'expired', 'rejected'
  is_active BOOLEAN DEFAULT true,
  
  -- Notes
  notes TEXT,
  rejection_reason TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_certification_type CHECK (certification_type IN ('sim_kapal', 'first_aid', 'alin', 'other')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'verified', 'expired', 'rejected')),
  CONSTRAINT valid_dates CHECK (expiry_date >= issued_date)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_guide_certifications_guide_id ON guide_certifications_tracker(guide_id);
CREATE INDEX IF NOT EXISTS idx_guide_certifications_branch_id ON guide_certifications_tracker(branch_id);
CREATE INDEX IF NOT EXISTS idx_guide_certifications_type ON guide_certifications_tracker(certification_type);
CREATE INDEX IF NOT EXISTS idx_guide_certifications_status ON guide_certifications_tracker(status);
CREATE INDEX IF NOT EXISTS idx_guide_certifications_expiry_date ON guide_certifications_tracker(expiry_date);
CREATE INDEX IF NOT EXISTS idx_guide_certifications_active ON guide_certifications_tracker(is_active) WHERE is_active = true;

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE guide_certifications_tracker ENABLE ROW LEVEL SECURITY;

-- Guides can view their own certifications
CREATE POLICY "Guides can view own certifications"
  ON guide_certifications_tracker
  FOR SELECT
  USING (auth.uid() = guide_id);

-- Guides can insert their own certifications
CREATE POLICY "Guides can insert own certifications"
  ON guide_certifications_tracker
  FOR INSERT
  WITH CHECK (auth.uid() = guide_id);

-- Guides can update their own pending certifications
CREATE POLICY "Guides can update own pending certifications"
  ON guide_certifications_tracker
  FOR UPDATE
  USING (auth.uid() = guide_id AND status = 'pending')
  WITH CHECK (auth.uid() = guide_id);

-- Admins can view all certifications in their branch
CREATE POLICY "Admins can view branch certifications"
  ON guide_certifications_tracker
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (
        users.role IN ('super_admin', 'ops_admin')
        OR (
          users.role = 'guide'
          AND users.branch_id = guide_certifications_tracker.branch_id
        )
      )
    )
  );

-- Admins can verify/reject certifications
CREATE POLICY "Admins can verify certifications"
  ON guide_certifications_tracker
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'ops_admin')
      AND (
        users.role = 'super_admin'
        OR users.branch_id = guide_certifications_tracker.branch_id
      )
    )
  );

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to check if guide has valid certifications
CREATE OR REPLACE FUNCTION check_guide_certifications_valid(guide_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  required_types TEXT[] := ARRAY['sim_kapal', 'first_aid', 'alin'];
  cert_count INTEGER;
BEGIN
  -- Check if guide has all required certifications that are verified and not expired
  SELECT COUNT(DISTINCT certification_type)
  INTO cert_count
  FROM guide_certifications_tracker
  WHERE guide_id = guide_uuid
    AND certification_type = ANY(required_types)
    AND status = 'verified'
    AND is_active = true
    AND expiry_date >= CURRENT_DATE;
  
  RETURN cert_count = array_length(required_types, 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get expiring certifications (H-30)
CREATE OR REPLACE FUNCTION get_expiring_certifications(days_ahead INTEGER DEFAULT 30)
RETURNS TABLE (
  guide_id UUID,
  certification_type VARCHAR(50),
  certification_name VARCHAR(200),
  expiry_date DATE,
  days_until_expiry INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    gct.guide_id,
    gct.certification_type,
    gct.certification_name,
    gct.expiry_date,
    (gct.expiry_date - CURRENT_DATE)::INTEGER AS days_until_expiry
  FROM guide_certifications_tracker gct
  WHERE gct.status = 'verified'
    AND gct.is_active = true
    AND gct.expiry_date >= CURRENT_DATE
    AND gct.expiry_date <= CURRENT_DATE + (days_ahead || ' days')::INTERVAL
  ORDER BY gct.expiry_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to auto-expire certifications
CREATE OR REPLACE FUNCTION auto_expire_certifications()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE guide_certifications_tracker
  SET 
    status = 'expired',
    is_active = false,
    updated_at = NOW()
  WHERE status = 'verified'
    AND is_active = true
    AND expiry_date < CURRENT_DATE;
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_guide_certifications_updated_at
  BEFORE UPDATE ON guide_certifications_tracker
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE guide_certifications_tracker IS 'Track guide certifications (SIM Kapal, First Aid, ALIN) with expiry tracking';
COMMENT ON COLUMN guide_certifications_tracker.certification_type IS 'Type: sim_kapal, first_aid, alin, other';
COMMENT ON COLUMN guide_certifications_tracker.status IS 'Status: pending (uploaded, waiting verification), verified (active), expired, rejected';
COMMENT ON FUNCTION check_guide_certifications_valid IS 'Check if guide has all required valid certifications';
COMMENT ON FUNCTION get_expiring_certifications IS 'Get certifications expiring within specified days (default 30)';
COMMENT ON FUNCTION auto_expire_certifications IS 'Auto-expire certifications past expiry date';
