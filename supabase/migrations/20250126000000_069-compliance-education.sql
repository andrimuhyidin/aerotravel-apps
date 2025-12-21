-- Migration: 069-compliance-education.sql
-- Description: Compliance Education Tracking (Optional)
-- Created: 2025-01-26

-- ============================================
-- GUIDE COMPLIANCE EDUCATION LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS guide_compliance_education_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id),
  
  -- Section Read
  section_read TEXT NOT NULL, -- 'introduction', 'standards', 'feature-mapping', etc.
  
  -- Engagement
  read_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_compliance_education_logs_guide_id ON guide_compliance_education_logs(guide_id);
CREATE INDEX IF NOT EXISTS idx_compliance_education_logs_read_at ON guide_compliance_education_logs(read_at DESC);
CREATE INDEX IF NOT EXISTS idx_compliance_education_logs_section ON guide_compliance_education_logs(section_read);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE guide_compliance_education_logs ENABLE ROW LEVEL SECURITY;

-- Guides can view their own logs
CREATE POLICY "Guides can view own compliance education logs"
  ON guide_compliance_education_logs
  FOR SELECT
  USING (auth.uid() = guide_id);

-- Guides can insert their own logs
CREATE POLICY "Guides can track own compliance education"
  ON guide_compliance_education_logs
  FOR INSERT
  WITH CHECK (auth.uid() = guide_id);

-- Admins can view all logs
CREATE POLICY "Admins can view all compliance education logs"
  ON guide_compliance_education_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
        AND role IN ('super_admin', 'ops_admin')
    )
  );

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE guide_compliance_education_logs IS 'Optional tracking for guide engagement with compliance education content';

