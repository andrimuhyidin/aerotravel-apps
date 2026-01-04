-- Migration: 137-community-benefit-tracking.sql
-- Description: Community Benefit Tracking for GSTC Compliance
-- Created: 2025-03-03
-- Standards: GSTC Sustainable Tourism - Community Benefits

-- ============================================
-- LOCAL EMPLOYMENT METRICS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS local_employment_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES branches(id),
  
  -- Period
  period_month DATE NOT NULL, -- First day of month
  
  -- Employment Numbers
  total_employees INTEGER DEFAULT 0,
  local_employees INTEGER DEFAULT 0, -- From local community
  local_percentage DECIMAL(5, 2) GENERATED ALWAYS AS (
    CASE WHEN total_employees > 0 
         THEN (local_employees::DECIMAL / total_employees * 100)
         ELSE 0 
    END
  ) STORED,
  
  -- Gender Distribution
  female_employees INTEGER DEFAULT 0,
  male_employees INTEGER DEFAULT 0,
  female_percentage DECIMAL(5, 2),
  
  -- Employment Types
  full_time_employees INTEGER DEFAULT 0,
  part_time_employees INTEGER DEFAULT 0,
  seasonal_employees INTEGER DEFAULT 0,
  
  -- Local Vendors/Suppliers
  total_vendors INTEGER DEFAULT 0,
  local_vendors INTEGER DEFAULT 0,
  local_vendors_percentage DECIMAL(5, 2),
  
  -- Local Spending
  total_operational_spend DECIMAL(15, 2) DEFAULT 0,
  local_spend_amount DECIMAL(15, 2) DEFAULT 0,
  local_spend_percentage DECIMAL(5, 2),
  
  -- Categories of Local Spend
  local_food_spend DECIMAL(15, 2) DEFAULT 0,
  local_services_spend DECIMAL(15, 2) DEFAULT 0,
  local_supplies_spend DECIMAL(15, 2) DEFAULT 0,
  
  -- Notes
  notes TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  recorded_by UUID REFERENCES users(id),
  
  -- Unique per branch per month
  UNIQUE(branch_id, period_month)
);

-- ============================================
-- COMMUNITY CONTRIBUTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS community_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES branches(id),
  
  -- Contribution Info
  contribution_type VARCHAR(50) NOT NULL, -- 'donation', 'sponsorship', 'volunteer', 'training', 'infrastructure', 'conservation'
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Beneficiary
  beneficiary_name VARCHAR(255) NOT NULL,
  beneficiary_type VARCHAR(50), -- 'school', 'mosque', 'community_group', 'individual', 'ngo', 'government'
  beneficiary_location VARCHAR(255),
  
  -- Value
  monetary_value DECIMAL(15, 2),
  in_kind_value DECIMAL(15, 2),
  total_value DECIMAL(15, 2) GENERATED ALWAYS AS (
    COALESCE(monetary_value, 0) + COALESCE(in_kind_value, 0)
  ) STORED,
  currency VARCHAR(3) DEFAULT 'IDR',
  
  -- For volunteer contributions
  volunteer_hours DECIMAL(10, 2),
  volunteers_count INTEGER,
  
  -- Date
  contribution_date DATE NOT NULL,
  
  -- Documentation
  evidence_urls TEXT[],
  receipt_url TEXT,
  
  -- Impact
  estimated_beneficiaries INTEGER,
  impact_description TEXT,
  
  -- Status
  status VARCHAR(20) DEFAULT 'completed', -- 'planned', 'in_progress', 'completed', 'cancelled'
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  
  -- Constraints
  CONSTRAINT valid_contribution_type CHECK (contribution_type IN ('donation', 'sponsorship', 'volunteer', 'training', 'infrastructure', 'conservation', 'education', 'health', 'other')),
  CONSTRAINT valid_beneficiary_type CHECK (beneficiary_type IS NULL OR beneficiary_type IN ('school', 'mosque', 'church', 'community_group', 'individual', 'ngo', 'government', 'cooperative', 'other')),
  CONSTRAINT valid_contribution_status CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled'))
);

-- ============================================
-- LOCAL SUPPLIERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS local_suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES branches(id),
  
  -- Supplier Info
  supplier_name VARCHAR(255) NOT NULL,
  supplier_type VARCHAR(50) NOT NULL, -- 'food', 'fuel', 'equipment', 'services', 'hospitality'
  contact_person VARCHAR(255),
  phone VARCHAR(50),
  email VARCHAR(255),
  address TEXT,
  
  -- Location
  is_local BOOLEAN DEFAULT true,
  locality VARCHAR(100), -- Village/district name
  distance_km DECIMAL(10, 2),
  
  -- Business Info
  business_registration VARCHAR(100),
  is_small_business BOOLEAN DEFAULT false,
  is_women_owned BOOLEAN DEFAULT false,
  is_cooperative BOOLEAN DEFAULT false,
  employees_count INTEGER,
  
  -- Certification
  certifications TEXT[],
  
  -- Relationship
  partnership_since DATE,
  contract_type VARCHAR(50), -- 'regular', 'preferred', 'exclusive'
  
  -- Spending
  total_spend_ytd DECIMAL(15, 2) DEFAULT 0,
  average_monthly_spend DECIMAL(15, 2) DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Notes
  notes TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  
  -- Constraints
  CONSTRAINT valid_supplier_type CHECK (supplier_type IN ('food', 'fuel', 'equipment', 'services', 'hospitality', 'transportation', 'maintenance', 'other'))
);

-- ============================================
-- COMMUNITY FEEDBACK TABLE
-- Track feedback from local community
-- ============================================
CREATE TABLE IF NOT EXISTS community_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES branches(id),
  
  -- Feedback Source
  feedback_source VARCHAR(50) NOT NULL, -- 'community_meeting', 'survey', 'complaint', 'suggestion', 'social_media'
  source_name VARCHAR(255),
  source_contact VARCHAR(100),
  
  -- Feedback Content
  category VARCHAR(50) NOT NULL, -- 'environmental', 'economic', 'social', 'safety', 'noise', 'positive'
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  
  -- Sentiment
  sentiment VARCHAR(20) DEFAULT 'neutral', -- 'positive', 'neutral', 'negative'
  severity VARCHAR(20), -- For complaints: 'low', 'medium', 'high'
  
  -- Response
  response_required BOOLEAN DEFAULT false,
  response_text TEXT,
  responded_at TIMESTAMPTZ,
  responded_by UUID REFERENCES users(id),
  
  -- Resolution
  status VARCHAR(20) DEFAULT 'new', -- 'new', 'acknowledged', 'in_progress', 'resolved', 'closed'
  resolution_notes TEXT,
  
  -- Follow-up
  follow_up_date DATE,
  follow_up_notes TEXT,
  
  -- Audit
  received_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  
  -- Constraints
  CONSTRAINT valid_feedback_source CHECK (feedback_source IN ('community_meeting', 'survey', 'complaint', 'suggestion', 'social_media', 'direct', 'other')),
  CONSTRAINT valid_feedback_category CHECK (category IN ('environmental', 'economic', 'social', 'safety', 'noise', 'positive', 'operational', 'other')),
  CONSTRAINT valid_feedback_sentiment CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  CONSTRAINT valid_feedback_status CHECK (status IN ('new', 'acknowledged', 'in_progress', 'resolved', 'closed'))
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_local_employment_metrics_branch ON local_employment_metrics(branch_id);
CREATE INDEX IF NOT EXISTS idx_local_employment_metrics_month ON local_employment_metrics(period_month DESC);

CREATE INDEX IF NOT EXISTS idx_community_contributions_branch ON community_contributions(branch_id);
CREATE INDEX IF NOT EXISTS idx_community_contributions_type ON community_contributions(contribution_type);
CREATE INDEX IF NOT EXISTS idx_community_contributions_date ON community_contributions(contribution_date DESC);
CREATE INDEX IF NOT EXISTS idx_community_contributions_beneficiary ON community_contributions(beneficiary_name);

CREATE INDEX IF NOT EXISTS idx_local_suppliers_branch ON local_suppliers(branch_id);
CREATE INDEX IF NOT EXISTS idx_local_suppliers_type ON local_suppliers(supplier_type);
CREATE INDEX IF NOT EXISTS idx_local_suppliers_active ON local_suppliers(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_local_suppliers_local ON local_suppliers(is_local) WHERE is_local = true;

CREATE INDEX IF NOT EXISTS idx_community_feedback_branch ON community_feedback(branch_id);
CREATE INDEX IF NOT EXISTS idx_community_feedback_category ON community_feedback(category);
CREATE INDEX IF NOT EXISTS idx_community_feedback_status ON community_feedback(status);
CREATE INDEX IF NOT EXISTS idx_community_feedback_sentiment ON community_feedback(sentiment);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE local_employment_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE local_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_feedback ENABLE ROW LEVEL SECURITY;

-- Employment Metrics: Admins only
CREATE POLICY "Admins can manage employment metrics"
  ON local_employment_metrics
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('super_admin', 'ops_admin')
    )
  );

-- Community Contributions: Admins manage, all can view
CREATE POLICY "Admins can manage community contributions"
  ON community_contributions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('super_admin', 'ops_admin')
    )
  );

CREATE POLICY "Authenticated users can view contributions"
  ON community_contributions
  FOR SELECT
  USING (auth.uid() IS NOT NULL AND status = 'completed');

-- Local Suppliers: Admins manage
CREATE POLICY "Admins can manage local suppliers"
  ON local_suppliers
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('super_admin', 'ops_admin')
    )
  );

-- Community Feedback: Admins manage
CREATE POLICY "Admins can manage community feedback"
  ON community_feedback
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

-- Function to get community impact summary
CREATE OR REPLACE FUNCTION get_community_impact_summary(
  p_branch_id UUID,
  p_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
)
RETURNS TABLE (
  total_contributions DECIMAL,
  contribution_count INTEGER,
  volunteer_hours DECIMAL,
  beneficiaries_reached INTEGER,
  local_employment_rate DECIMAL,
  local_spend_rate DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  WITH contrib AS (
    SELECT 
      COALESCE(SUM(total_value), 0) as total_value,
      COUNT(*)::INTEGER as count,
      COALESCE(SUM(volunteer_hours), 0) as hours,
      COALESCE(SUM(estimated_beneficiaries), 0)::INTEGER as beneficiaries
    FROM community_contributions
    WHERE branch_id = p_branch_id
      AND EXTRACT(YEAR FROM contribution_date) = p_year
      AND status = 'completed'
  ),
  employment AS (
    SELECT 
      COALESCE(AVG(local_percentage), 0) as local_emp_rate,
      COALESCE(AVG(local_spend_percentage), 0) as local_spend_rate
    FROM local_employment_metrics
    WHERE branch_id = p_branch_id
      AND EXTRACT(YEAR FROM period_month) = p_year
  )
  SELECT 
    contrib.total_value,
    contrib.count,
    contrib.hours,
    contrib.beneficiaries,
    employment.local_emp_rate,
    employment.local_spend_rate
  FROM contrib, employment;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE local_employment_metrics IS 'Monthly employment and local spending metrics for GSTC community benefit tracking';
COMMENT ON TABLE community_contributions IS 'Donations, sponsorships, and volunteer activities for community benefit';
COMMENT ON TABLE local_suppliers IS 'Registry of local suppliers and vendors for sustainable sourcing';
COMMENT ON TABLE community_feedback IS 'Feedback from local community for stakeholder engagement';
COMMENT ON COLUMN local_employment_metrics.local_percentage IS 'Auto-calculated percentage of local employees';

