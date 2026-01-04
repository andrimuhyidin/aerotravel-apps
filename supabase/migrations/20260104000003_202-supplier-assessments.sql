-- Migration: 202-supplier-assessments.sql
-- Description: Supplier environmental assessment (ISO 14001)
-- Created: 2026-01-04

-- ============================================
-- SUPPLIER ASSESSMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS supplier_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES branches(id),
  
  -- Supplier Information
  supplier_name VARCHAR(255) NOT NULL,
  supplier_type VARCHAR(50) NOT NULL, -- 'transport', 'accommodation', 'food', 'equipment', 'other'
  contact_person VARCHAR(255),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  
  -- Environmental Assessment
  has_environmental_policy BOOLEAN DEFAULT false,
  waste_management_score INTEGER CHECK (waste_management_score BETWEEN 1 AND 5), -- 1 (poor) to 5 (excellent)
  carbon_reduction_efforts TEXT,
  uses_renewable_energy BOOLEAN DEFAULT false,
  has_certifications BOOLEAN DEFAULT false,
  certification_urls TEXT[],
  
  -- Overall Rating
  overall_rating INTEGER CHECK (overall_rating BETWEEN 1 AND 5), -- 1 (poor) to 5 (excellent)
  compliance_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'compliant', 'non_compliant', 'improving'
  
  -- Assessment Details
  assessment_date DATE NOT NULL,
  next_review_date DATE,
  assessed_by UUID REFERENCES users(id),
  assessment_notes TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_supplier_assessments_branch_id ON supplier_assessments(branch_id);
CREATE INDEX IF NOT EXISTS idx_supplier_assessments_supplier_type ON supplier_assessments(supplier_type);
CREATE INDEX IF NOT EXISTS idx_supplier_assessments_compliance_status ON supplier_assessments(compliance_status);
CREATE INDEX IF NOT EXISTS idx_supplier_assessments_next_review ON supplier_assessments(next_review_date);
CREATE INDEX IF NOT EXISTS idx_supplier_assessments_is_active ON supplier_assessments(is_active);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE supplier_assessments ENABLE ROW LEVEL SECURITY;

-- Admins can view all supplier assessments
CREATE POLICY "Admins can view supplier assessments"
  ON supplier_assessments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'ops_admin')
      AND (
        users.role = 'super_admin'
        OR users.branch_id = supplier_assessments.branch_id
      )
    )
  );

-- Admins can insert supplier assessments
CREATE POLICY "Admins can create supplier assessments"
  ON supplier_assessments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'ops_admin')
    )
  );

-- Admins can update supplier assessments
CREATE POLICY "Admins can update supplier assessments"
  ON supplier_assessments
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'ops_admin')
    )
  );

-- ============================================
-- FUNCTION: Get supplier compliance summary
-- ============================================
CREATE OR REPLACE FUNCTION get_supplier_compliance_summary(
  p_branch_id UUID DEFAULT NULL
)
RETURNS TABLE (
  total_suppliers INTEGER,
  compliant_count INTEGER,
  non_compliant_count INTEGER,
  pending_count INTEGER,
  average_rating NUMERIC,
  due_for_review INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total,
    COUNT(*) FILTER (WHERE compliance_status = 'compliant')::INTEGER as compliant,
    COUNT(*) FILTER (WHERE compliance_status = 'non_compliant')::INTEGER as non_compliant,
    COUNT(*) FILTER (WHERE compliance_status = 'pending')::INTEGER as pending,
    ROUND(AVG(overall_rating), 2) as avg_rating,
    COUNT(*) FILTER (WHERE next_review_date <= CURRENT_DATE + INTERVAL '30 days')::INTEGER as due_review
  FROM supplier_assessments
  WHERE is_active = true
    AND (p_branch_id IS NULL OR branch_id = p_branch_id);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Get suppliers by type
-- ============================================
CREATE OR REPLACE FUNCTION get_suppliers_by_type(
  p_branch_id UUID DEFAULT NULL
)
RETURNS TABLE (
  supplier_type VARCHAR,
  count BIGINT,
  avg_rating NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sa.supplier_type,
    COUNT(*) as supplier_count,
    ROUND(AVG(sa.overall_rating), 2) as average_rating
  FROM supplier_assessments sa
  WHERE sa.is_active = true
    AND (p_branch_id IS NULL OR sa.branch_id = p_branch_id)
  GROUP BY sa.supplier_type
  ORDER BY supplier_count DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGER: Update timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_supplier_assessment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  
  -- Auto-set next review date if not provided (1 year from assessment)
  IF NEW.next_review_date IS NULL THEN
    NEW.next_review_date = NEW.assessment_date + INTERVAL '1 year';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_supplier_assessment_timestamp
  BEFORE UPDATE ON supplier_assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_supplier_assessment_timestamp();

CREATE TRIGGER trigger_set_next_review_date
  BEFORE INSERT ON supplier_assessments
  FOR EACH ROW
  WHEN (NEW.next_review_date IS NULL)
  EXECUTE FUNCTION update_supplier_assessment_timestamp();

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE supplier_assessments IS 'Environmental compliance tracking for suppliers (ISO 14001)';
COMMENT ON COLUMN supplier_assessments.waste_management_score IS 'Score from 1 (poor) to 5 (excellent) for supplier waste management practices';
COMMENT ON COLUMN supplier_assessments.overall_rating IS 'Overall environmental performance rating from 1 (poor) to 5 (excellent)';
COMMENT ON FUNCTION get_supplier_compliance_summary IS 'Get summary statistics of supplier environmental compliance';

