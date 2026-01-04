-- Migration: 135-incident-follow-ups.sql
-- Description: Post-Incident Support Tracking for Duty of Care
-- Created: 2025-03-03
-- Standards: Duty of Care Policy, ISO 31030 TRM

-- ============================================
-- INCIDENT FOLLOW-UPS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS incident_follow_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES incident_reports(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id),
  
  -- Follow-up Info
  follow_up_type VARCHAR(50) NOT NULL, -- 'medical', 'insurance', 'legal', 'psychological', 'administrative', 'compensation'
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Status Tracking
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'in_progress', 'waiting_response', 'completed', 'cancelled'
  priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  
  -- Timeline
  due_date DATE,
  next_action_date DATE,
  completed_at TIMESTAMPTZ,
  
  -- Assignment
  assigned_to UUID REFERENCES users(id),
  
  -- Notes & Documentation
  notes TEXT,
  action_taken TEXT[],
  attachments TEXT[],
  
  -- Resolution
  resolution_summary TEXT,
  outcome VARCHAR(50), -- 'resolved', 'escalated', 'closed_no_action', 'transferred'
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  
  -- Constraints
  CONSTRAINT valid_follow_up_type CHECK (follow_up_type IN ('medical', 'insurance', 'legal', 'psychological', 'administrative', 'compensation', 'family_support', 'other')),
  CONSTRAINT valid_follow_up_status CHECK (status IN ('pending', 'in_progress', 'waiting_response', 'completed', 'cancelled')),
  CONSTRAINT valid_follow_up_priority CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  CONSTRAINT valid_follow_up_outcome CHECK (outcome IS NULL OR outcome IN ('resolved', 'escalated', 'closed_no_action', 'transferred'))
);

-- ============================================
-- INCIDENT INJURIES TABLE
-- Track injuries from incidents
-- ============================================
CREATE TABLE IF NOT EXISTS incident_injuries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES incident_reports(id) ON DELETE CASCADE,
  
  -- Injured Person
  person_type VARCHAR(20) NOT NULL, -- 'passenger', 'crew', 'guide', 'other'
  person_name VARCHAR(255) NOT NULL,
  person_id UUID, -- Reference to passenger or user if applicable
  
  -- Injury Details
  injury_type VARCHAR(50) NOT NULL, -- 'minor', 'moderate', 'severe', 'critical', 'fatal'
  injury_description TEXT,
  body_parts_affected TEXT[],
  
  -- Treatment
  first_aid_given BOOLEAN DEFAULT false,
  first_aid_description TEXT,
  medical_attention_required BOOLEAN DEFAULT false,
  hospitalized BOOLEAN DEFAULT false,
  hospital_name VARCHAR(255),
  
  -- Status
  current_status VARCHAR(50) DEFAULT 'treated', -- 'treated', 'under_treatment', 'recovered', 'permanent_disability', 'deceased'
  
  -- Follow-up
  requires_follow_up BOOLEAN DEFAULT false,
  follow_up_notes TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_person_type CHECK (person_type IN ('passenger', 'crew', 'guide', 'other')),
  CONSTRAINT valid_injury_type CHECK (injury_type IN ('minor', 'moderate', 'severe', 'critical', 'fatal')),
  CONSTRAINT valid_injury_status CHECK (current_status IN ('treated', 'under_treatment', 'recovered', 'permanent_disability', 'deceased'))
);

-- ============================================
-- INCIDENT INSURANCE CLAIMS TABLE
-- Track insurance claims from incidents
-- ============================================
CREATE TABLE IF NOT EXISTS incident_insurance_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES incident_reports(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id),
  
  -- Claim Info
  claim_number VARCHAR(100),
  claim_type VARCHAR(50) NOT NULL, -- 'medical', 'property_damage', 'trip_cancellation', 'liability', 'comprehensive'
  
  -- Insurance Company
  insurance_company_id UUID REFERENCES insurance_companies(id),
  insurance_company_name VARCHAR(255),
  policy_number VARCHAR(100),
  
  -- Claimant
  claimant_name VARCHAR(255) NOT NULL,
  claimant_type VARCHAR(20) NOT NULL, -- 'passenger', 'company', 'third_party'
  claimant_contact VARCHAR(100),
  
  -- Claim Details
  description TEXT,
  amount_claimed DECIMAL(15, 2),
  amount_approved DECIMAL(15, 2),
  currency VARCHAR(3) DEFAULT 'IDR',
  
  -- Documents
  documents_submitted TEXT[],
  documents_required TEXT[],
  
  -- Timeline
  submitted_at TIMESTAMPTZ,
  acknowledged_at TIMESTAMPTZ,
  under_review_at TIMESTAMPTZ,
  decision_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  
  -- Status
  status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'submitted', 'under_review', 'approved', 'rejected', 'paid', 'closed'
  rejection_reason TEXT,
  
  -- Contact Person at Insurance
  adjuster_name VARCHAR(255),
  adjuster_phone VARCHAR(50),
  adjuster_email VARCHAR(255),
  
  -- Notes
  notes TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  
  -- Constraints
  CONSTRAINT valid_claim_type CHECK (claim_type IN ('medical', 'property_damage', 'trip_cancellation', 'liability', 'comprehensive', 'other')),
  CONSTRAINT valid_claimant_type CHECK (claimant_type IN ('passenger', 'company', 'third_party')),
  CONSTRAINT valid_claim_status CHECK (status IN ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'paid', 'closed'))
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_incident_follow_ups_incident_id ON incident_follow_ups(incident_id);
CREATE INDEX IF NOT EXISTS idx_incident_follow_ups_status ON incident_follow_ups(status);
CREATE INDEX IF NOT EXISTS idx_incident_follow_ups_assigned_to ON incident_follow_ups(assigned_to);
CREATE INDEX IF NOT EXISTS idx_incident_follow_ups_due_date ON incident_follow_ups(due_date);
CREATE INDEX IF NOT EXISTS idx_incident_follow_ups_priority ON incident_follow_ups(priority);

CREATE INDEX IF NOT EXISTS idx_incident_injuries_incident_id ON incident_injuries(incident_id);
CREATE INDEX IF NOT EXISTS idx_incident_injuries_injury_type ON incident_injuries(injury_type);
CREATE INDEX IF NOT EXISTS idx_incident_injuries_status ON incident_injuries(current_status);

CREATE INDEX IF NOT EXISTS idx_incident_insurance_claims_incident_id ON incident_insurance_claims(incident_id);
CREATE INDEX IF NOT EXISTS idx_incident_insurance_claims_status ON incident_insurance_claims(status);
CREATE INDEX IF NOT EXISTS idx_incident_insurance_claims_claim_number ON incident_insurance_claims(claim_number);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE incident_follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_injuries ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_insurance_claims ENABLE ROW LEVEL SECURITY;

-- Follow-ups: Admins and assigned users
CREATE POLICY "Admins can manage all follow-ups"
  ON incident_follow_ups
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('super_admin', 'ops_admin')
    )
  );

CREATE POLICY "Assigned users can view and update their follow-ups"
  ON incident_follow_ups
  FOR ALL
  USING (assigned_to = auth.uid());

-- Injuries: Same as follow-ups
CREATE POLICY "Admins can manage all injury records"
  ON incident_injuries
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('super_admin', 'ops_admin')
    )
  );

CREATE POLICY "Guides can view injuries for their incidents"
  ON incident_injuries
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM incident_reports ir
      WHERE ir.id = incident_injuries.incident_id
        AND ir.guide_id = auth.uid()
    )
  );

-- Insurance Claims: Admins only
CREATE POLICY "Admins can manage insurance claims"
  ON incident_insurance_claims
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('super_admin', 'ops_admin')
    )
  );

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to get incident summary with all related data
CREATE OR REPLACE FUNCTION get_incident_summary(p_incident_id UUID)
RETURNS TABLE (
  incident_id UUID,
  report_number VARCHAR,
  incident_type VARCHAR,
  severity VARCHAR,
  status VARCHAR,
  follow_ups_count INTEGER,
  pending_follow_ups INTEGER,
  injuries_count INTEGER,
  claims_count INTEGER,
  total_claimed DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ir.id as incident_id,
    ir.report_number,
    ir.incident_type,
    ir.severity,
    ir.status,
    (SELECT COUNT(*)::INTEGER FROM incident_follow_ups ifu WHERE ifu.incident_id = ir.id) as follow_ups_count,
    (SELECT COUNT(*)::INTEGER FROM incident_follow_ups ifu WHERE ifu.incident_id = ir.id AND ifu.status IN ('pending', 'in_progress')) as pending_follow_ups,
    (SELECT COUNT(*)::INTEGER FROM incident_injuries ii WHERE ii.incident_id = ir.id) as injuries_count,
    (SELECT COUNT(*)::INTEGER FROM incident_insurance_claims iic WHERE iic.incident_id = ir.id) as claims_count,
    (SELECT COALESCE(SUM(amount_claimed), 0) FROM incident_insurance_claims iic WHERE iic.incident_id = ir.id) as total_claimed
  FROM incident_reports ir
  WHERE ir.id = p_incident_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE incident_follow_ups IS 'Post-incident follow-up tasks for Duty of Care compliance';
COMMENT ON TABLE incident_injuries IS 'Records of injuries from incidents for medical tracking and insurance';
COMMENT ON TABLE incident_insurance_claims IS 'Insurance claim tracking for incidents';
COMMENT ON COLUMN incident_follow_ups.follow_up_type IS 'Types: medical, insurance, legal, psychological, administrative, compensation, family_support';

