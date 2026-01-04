-- Migration: 142-compliance-audit-logs.sql
-- Description: Compliance Audit Trail System for All Standards
-- Created: 2025-03-03
-- Standards: CHSE, GSTC, Duty of Care, ISO 31030

-- ============================================
-- COMPLIANCE AUDIT LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS compliance_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES branches(id),
  
  -- Audit Info
  audit_type VARCHAR(50) NOT NULL, -- 'chse', 'gstc', 'duty_of_care', 'iso_31030', 'internal', 'regulatory'
  audit_name VARCHAR(255) NOT NULL,
  audit_scope TEXT,
  
  -- Auditor
  auditor_name VARCHAR(255) NOT NULL,
  auditor_type VARCHAR(50) NOT NULL, -- 'internal', 'external', 'regulatory', 'certification_body'
  auditor_organization VARCHAR(255),
  auditor_credentials TEXT,
  
  -- Date
  audit_date DATE NOT NULL,
  audit_start_time TIMESTAMPTZ,
  audit_end_time TIMESTAMPTZ,
  
  -- Findings
  findings JSONB DEFAULT '[]',
  -- Structure: [
  --   {
  --     "id": "F001",
  --     "category": "documentation",
  --     "severity": "minor",
  --     "finding": "Missing pre-trip assessment for 2 trips",
  --     "requirement": "ISO 31030 4.3.1",
  --     "evidence": "Trip IDs: xxx, yyy"
  --   },
  --   ...
  -- ]
  
  -- Scoring
  compliance_score DECIMAL(5, 2),
  max_score DECIMAL(5, 2) DEFAULT 100,
  scoring_methodology TEXT,
  
  -- Score Breakdown by Category
  score_breakdown JSONB DEFAULT '{}',
  -- Structure: {
  --   "risk_management": {"score": 85, "max": 100, "weight": 0.3},
  --   "emergency_response": {"score": 90, "max": 100, "weight": 0.2},
  --   "training": {"score": 95, "max": 100, "weight": 0.2},
  --   "documentation": {"score": 80, "max": 100, "weight": 0.15},
  --   "environmental": {"score": 88, "max": 100, "weight": 0.15}
  -- }
  
  -- Non-conformities
  non_conformities_major INTEGER DEFAULT 0,
  non_conformities_minor INTEGER DEFAULT 0,
  observations INTEGER DEFAULT 0,
  
  non_conformities TEXT[],
  
  -- Corrective Actions
  corrective_actions_required TEXT[],
  corrective_action_deadline DATE,
  
  -- Result
  audit_result VARCHAR(50) DEFAULT 'pending', -- 'pass', 'conditional_pass', 'fail', 'pending'
  certification_recommendation BOOLEAN,
  
  -- Follow-up
  next_audit_date DATE,
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_date DATE,
  follow_up_notes TEXT,
  
  -- Evidence
  evidence_urls TEXT[],
  report_url TEXT,
  
  -- Signature
  signed_by VARCHAR(255),
  signature_date DATE,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  
  -- Constraints
  CONSTRAINT valid_audit_type CHECK (audit_type IN ('chse', 'gstc', 'duty_of_care', 'iso_31030', 'internal', 'regulatory', 'certification', 'surveillance')),
  CONSTRAINT valid_auditor_type CHECK (auditor_type IN ('internal', 'external', 'regulatory', 'certification_body', 'consultant')),
  CONSTRAINT valid_audit_result CHECK (audit_result IN ('pass', 'conditional_pass', 'fail', 'pending', 'cancelled'))
);

-- ============================================
-- COMPLIANCE CHECKLISTS TABLE
-- Standard-specific checklists
-- ============================================
CREATE TABLE IF NOT EXISTS compliance_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Checklist Info
  checklist_name VARCHAR(255) NOT NULL,
  checklist_code VARCHAR(50) UNIQUE,
  standard_type VARCHAR(50) NOT NULL, -- 'chse', 'gstc', 'duty_of_care', 'iso_31030'
  version VARCHAR(20) DEFAULT '1.0',
  
  -- Checklist Items
  items JSONB NOT NULL DEFAULT '[]',
  -- Structure: [
  --   {
  --     "id": "C001",
  --     "category": "Risk Management",
  --     "requirement": "Pre-trip risk assessment completed for all trips",
  --     "reference": "ISO 31030 4.3.1",
  --     "weight": 5,
  --     "verification_method": "Documentation review",
  --     "required": true
  --   },
  --   ...
  -- ]
  
  -- Metadata
  total_items INTEGER,
  total_weight INTEGER,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  effective_date DATE,
  expiry_date DATE,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  
  -- Constraints
  CONSTRAINT valid_standard_type CHECK (standard_type IN ('chse', 'gstc', 'duty_of_care', 'iso_31030', 'combined'))
);

-- ============================================
-- COMPLIANCE CHECKLIST ASSESSMENTS TABLE
-- Completed checklist assessments
-- ============================================
CREATE TABLE IF NOT EXISTS compliance_checklist_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id UUID NOT NULL REFERENCES compliance_checklists(id),
  audit_id UUID REFERENCES compliance_audit_logs(id),
  branch_id UUID NOT NULL REFERENCES branches(id),
  
  -- Assessment Info
  assessment_date DATE NOT NULL,
  assessor_id UUID NOT NULL REFERENCES users(id),
  
  -- Responses
  responses JSONB NOT NULL DEFAULT '[]',
  -- Structure: [
  --   {
  --     "item_id": "C001",
  --     "status": "compliant", -- 'compliant', 'non_compliant', 'partial', 'not_applicable'
  --     "score": 5,
  --     "max_score": 5,
  --     "evidence": "Pre-trip assessments found for all 15 trips",
  --     "notes": ""
  --   },
  --   ...
  -- ]
  
  -- Scoring
  total_score DECIMAL(10, 2),
  max_possible_score DECIMAL(10, 2),
  compliance_percentage DECIMAL(5, 2),
  
  -- Summary
  compliant_count INTEGER DEFAULT 0,
  non_compliant_count INTEGER DEFAULT 0,
  partial_count INTEGER DEFAULT 0,
  not_applicable_count INTEGER DEFAULT 0,
  
  -- Notes
  overall_notes TEXT,
  recommendations TEXT[],
  
  -- Status
  status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'submitted', 'reviewed', 'approved'
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_assessment_status CHECK (status IN ('draft', 'submitted', 'reviewed', 'approved'))
);

-- ============================================
-- COMPLIANCE STATUS TRACKER TABLE
-- Current compliance status per standard
-- ============================================
CREATE TABLE IF NOT EXISTS compliance_status_tracker (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES branches(id),
  
  -- Standard
  standard_type VARCHAR(50) NOT NULL,
  
  -- Current Status
  current_status VARCHAR(50) DEFAULT 'not_assessed', -- 'compliant', 'partially_compliant', 'non_compliant', 'not_assessed', 'expired'
  compliance_level DECIMAL(5, 2), -- Percentage
  
  -- Last Assessment
  last_assessment_date DATE,
  last_assessment_id UUID REFERENCES compliance_audit_logs(id),
  last_score DECIMAL(5, 2),
  
  -- Certification
  is_certified BOOLEAN DEFAULT false,
  certification_id UUID,
  certification_valid_until DATE,
  
  -- Issues
  open_non_conformities INTEGER DEFAULT 0,
  overdue_actions INTEGER DEFAULT 0,
  
  -- Next Steps
  next_assessment_date DATE,
  next_certification_date DATE,
  
  -- Audit
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique per branch per standard
  UNIQUE(branch_id, standard_type),
  
  -- Constraints
  CONSTRAINT valid_tracker_standard CHECK (standard_type IN ('chse', 'gstc', 'duty_of_care', 'iso_31030')),
  CONSTRAINT valid_compliance_status CHECK (current_status IN ('compliant', 'partially_compliant', 'non_compliant', 'not_assessed', 'expired'))
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_compliance_audit_logs_branch ON compliance_audit_logs(branch_id);
CREATE INDEX IF NOT EXISTS idx_compliance_audit_logs_type ON compliance_audit_logs(audit_type);
CREATE INDEX IF NOT EXISTS idx_compliance_audit_logs_date ON compliance_audit_logs(audit_date DESC);
CREATE INDEX IF NOT EXISTS idx_compliance_audit_logs_result ON compliance_audit_logs(audit_result);
CREATE INDEX IF NOT EXISTS idx_compliance_audit_logs_score ON compliance_audit_logs(compliance_score);

CREATE INDEX IF NOT EXISTS idx_compliance_checklists_standard ON compliance_checklists(standard_type);
CREATE INDEX IF NOT EXISTS idx_compliance_checklists_active ON compliance_checklists(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_compliance_checklist_assessments_checklist ON compliance_checklist_assessments(checklist_id);
CREATE INDEX IF NOT EXISTS idx_compliance_checklist_assessments_branch ON compliance_checklist_assessments(branch_id);
CREATE INDEX IF NOT EXISTS idx_compliance_checklist_assessments_date ON compliance_checklist_assessments(assessment_date DESC);

CREATE INDEX IF NOT EXISTS idx_compliance_status_tracker_branch ON compliance_status_tracker(branch_id);
CREATE INDEX IF NOT EXISTS idx_compliance_status_tracker_standard ON compliance_status_tracker(standard_type);
CREATE INDEX IF NOT EXISTS idx_compliance_status_tracker_status ON compliance_status_tracker(current_status);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE compliance_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_checklist_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_status_tracker ENABLE ROW LEVEL SECURITY;

-- Audit Logs: Admins manage
CREATE POLICY "Admins can manage audit logs"
  ON compliance_audit_logs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('super_admin', 'ops_admin')
    )
  );

CREATE POLICY "Authenticated users can view audit logs"
  ON compliance_audit_logs
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Checklists: Admins manage, all view
CREATE POLICY "Admins can manage compliance checklists"
  ON compliance_checklists
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('super_admin', 'ops_admin')
    )
  );

CREATE POLICY "Anyone can view active checklists"
  ON compliance_checklists
  FOR SELECT
  USING (is_active = true);

-- Checklist Assessments: Admins and assessors
CREATE POLICY "Admins can manage checklist assessments"
  ON compliance_checklist_assessments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('super_admin', 'ops_admin')
    )
  );

CREATE POLICY "Assessors can manage own assessments"
  ON compliance_checklist_assessments
  FOR ALL
  USING (assessor_id = auth.uid());

-- Status Tracker: Admins manage, all view
CREATE POLICY "Admins can manage compliance status"
  ON compliance_status_tracker
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('super_admin', 'ops_admin')
    )
  );

CREATE POLICY "Authenticated users can view compliance status"
  ON compliance_status_tracker
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update compliance status after assessment
CREATE OR REPLACE FUNCTION update_compliance_status_from_assessment()
RETURNS TRIGGER AS $$
BEGIN
  -- Get the standard type from checklist
  INSERT INTO compliance_status_tracker (
    branch_id,
    standard_type,
    current_status,
    compliance_level,
    last_assessment_date,
    last_score,
    last_updated_at
  )
  SELECT 
    NEW.branch_id,
    cc.standard_type,
    CASE 
      WHEN NEW.compliance_percentage >= 90 THEN 'compliant'
      WHEN NEW.compliance_percentage >= 70 THEN 'partially_compliant'
      ELSE 'non_compliant'
    END,
    NEW.compliance_percentage,
    NEW.assessment_date,
    NEW.compliance_percentage,
    NOW()
  FROM compliance_checklists cc
  WHERE cc.id = NEW.checklist_id
  ON CONFLICT (branch_id, standard_type) DO UPDATE SET
    current_status = CASE 
      WHEN NEW.compliance_percentage >= 90 THEN 'compliant'
      WHEN NEW.compliance_percentage >= 70 THEN 'partially_compliant'
      ELSE 'non_compliant'
    END,
    compliance_level = NEW.compliance_percentage,
    last_assessment_date = NEW.assessment_date,
    last_score = NEW.compliance_percentage,
    last_updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_compliance_status
  AFTER INSERT OR UPDATE ON compliance_checklist_assessments
  FOR EACH ROW
  WHEN (NEW.status = 'approved')
  EXECUTE FUNCTION update_compliance_status_from_assessment();

-- Function to get overall compliance dashboard data
CREATE OR REPLACE FUNCTION get_compliance_dashboard(p_branch_id UUID)
RETURNS TABLE (
  standard_type VARCHAR,
  status VARCHAR,
  compliance_level DECIMAL,
  last_assessment DATE,
  next_assessment DATE,
  open_issues INTEGER,
  is_certified BOOLEAN,
  cert_valid_until DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cst.standard_type,
    cst.current_status,
    cst.compliance_level,
    cst.last_assessment_date,
    cst.next_assessment_date,
    cst.open_non_conformities,
    cst.is_certified,
    cst.certification_valid_until
  FROM compliance_status_tracker cst
  WHERE cst.branch_id = p_branch_id
  ORDER BY cst.standard_type;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- INSERT DEFAULT CHECKLISTS
-- ============================================
INSERT INTO compliance_checklists (
  checklist_code,
  checklist_name,
  standard_type,
  version,
  items,
  total_items,
  is_active
) VALUES
(
  'CHSE-SELF-V1',
  'CHSE Self-Assessment Checklist',
  'chse',
  '1.0',
  '[
    {"id": "C1", "category": "Cleanliness", "requirement": "Cleaning protocols for all areas", "weight": 5, "required": true},
    {"id": "C2", "category": "Cleanliness", "requirement": "Waste management procedures", "weight": 5, "required": true},
    {"id": "H1", "category": "Health", "requirement": "Hand sanitizers available", "weight": 3, "required": true},
    {"id": "H2", "category": "Health", "requirement": "First aid kit complete", "weight": 5, "required": true},
    {"id": "S1", "category": "Safety", "requirement": "Life jackets for all passengers", "weight": 5, "required": true},
    {"id": "S2", "category": "Safety", "requirement": "Emergency procedures documented", "weight": 5, "required": true},
    {"id": "E1", "category": "Environment", "requirement": "Waste disposal procedures", "weight": 5, "required": true},
    {"id": "E2", "category": "Environment", "requirement": "No littering policy enforced", "weight": 5, "required": true}
  ]'::JSONB,
  8,
  true
),
(
  'ISO31030-V1',
  'ISO 31030 TRM Compliance Checklist',
  'iso_31030',
  '1.0',
  '[
    {"id": "R1", "category": "Risk Management", "requirement": "Pre-trip risk assessment for all trips", "reference": "ISO 31030 4.3.1", "weight": 10, "required": true},
    {"id": "R2", "category": "Risk Management", "requirement": "Destination risk profiles maintained", "reference": "ISO 31030 4.3.2", "weight": 8, "required": true},
    {"id": "E1", "category": "Emergency Response", "requirement": "SOS system implemented and tested", "reference": "ISO 31030 5.2.1", "weight": 10, "required": true},
    {"id": "E2", "category": "Emergency Response", "requirement": "Crisis communication plan documented", "reference": "ISO 31030 5.3", "weight": 8, "required": true},
    {"id": "T1", "category": "Training", "requirement": "TRM training for all guides", "reference": "ISO 31030 6.1", "weight": 8, "required": true},
    {"id": "T2", "category": "Training", "requirement": "Emergency response drills conducted", "reference": "ISO 31030 6.2", "weight": 6, "required": true},
    {"id": "D1", "category": "Duty of Care", "requirement": "Family notification system", "reference": "ISO 31030 7.1", "weight": 8, "required": true},
    {"id": "D2", "category": "Duty of Care", "requirement": "Medical information collected", "reference": "ISO 31030 7.2", "weight": 6, "required": true}
  ]'::JSONB,
  8,
  true
)
ON CONFLICT (checklist_code) DO NOTHING;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE compliance_audit_logs IS 'Audit trail for compliance assessments across all standards';
COMMENT ON TABLE compliance_checklists IS 'Standard-specific compliance checklists';
COMMENT ON TABLE compliance_checklist_assessments IS 'Completed checklist assessment records';
COMMENT ON TABLE compliance_status_tracker IS 'Current compliance status per standard for each branch';

