-- Migration: 145-permenparekraf-self-assessment.sql
-- Description: Permenparekraf No.4/2021 Self-Assessment and Grading System
-- Created: 2026-01-03
-- Purpose: Implement self-assessment framework for tourism business standards

BEGIN;

-- ============================================
-- SELF-ASSESSMENT SUBMISSIONS
-- ============================================
CREATE TABLE IF NOT EXISTS permenparekraf_self_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES branches(id),
  
  -- Assessment details
  assessment_date DATE NOT NULL,
  assessment_type VARCHAR(50) NOT NULL CHECK (assessment_type IN (
    'agen_perjalanan_wisata',    -- Travel Agency
    'biro_perjalanan_wisata',     -- Tour Operator
    'penyelenggara_perjalanan_wisata', -- Event Organizer
    'usaha_daya_tarik_wisata'     -- Tourist Attraction
  )),
  assessment_year INTEGER NOT NULL,
  
  -- Grading results
  total_score INTEGER CHECK (total_score BETWEEN 0 AND 1000),
  grade VARCHAR(5) CHECK (grade IN ('A', 'B', 'C', 'D', 'TL')), -- TL = Tidak Lulus
  
  -- Assessment sections (JSONB for flexibility)
  section_scores JSONB NOT NULL DEFAULT '{}', -- {legalitas: 95, sdm: 80, sarana: 85, ...}
  
  -- Required sections based on Permenparekraf
  section_legalitas INTEGER CHECK (section_legalitas BETWEEN 0 AND 100),
  section_sdm INTEGER CHECK (section_sdm BETWEEN 0 AND 100),
  section_sarana_prasarana INTEGER CHECK (section_sarana_prasarana BETWEEN 0 AND 100),
  section_pelayanan INTEGER CHECK (section_pelayanan BETWEEN 0 AND 100),
  section_keuangan INTEGER CHECK (section_keuangan BETWEEN 0 AND 100),
  section_lingkungan INTEGER CHECK (section_lingkungan BETWEEN 0 AND 100),
  
  -- Supporting documents
  evidence_urls TEXT[],
  evidence_notes TEXT,
  
  -- Review and approval
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  
  -- Status workflow
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN (
    'draft',
    'submitted',
    'under_review',
    'revision_required',
    'approved',
    'rejected'
  )),
  
  -- Certificate
  certificate_number VARCHAR(100),
  certificate_url TEXT,
  certificate_valid_until DATE,
  
  -- Audit
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ASSESSMENT CRITERIA (Configurable)
-- ============================================
CREATE TABLE IF NOT EXISTS permenparekraf_criteria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_type VARCHAR(50) NOT NULL, -- 'agen_perjalanan_wisata', 'bpw'
  section_code VARCHAR(50) NOT NULL, -- 'legalitas', 'sdm', 'sarana_prasarana'
  
  -- Criteria details
  criteria_code VARCHAR(20) NOT NULL,
  criteria_name TEXT NOT NULL,
  description TEXT,
  
  -- Scoring
  max_score INTEGER NOT NULL,
  weight DECIMAL(3,2) DEFAULT 1.0,
  
  -- Requirements
  is_mandatory BOOLEAN DEFAULT false,
  required_evidence VARCHAR(200)[], -- ['nib', 'skdn', 'sisupar']
  
  -- Verification method
  verification_method VARCHAR(50), -- 'document', 'inspection', 'interview', 'observation'
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(business_type, section_code, criteria_code)
);

-- ============================================
-- ASSESSMENT RESPONSES (Detail)
-- ============================================
CREATE TABLE IF NOT EXISTS permenparekraf_assessment_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES permenparekraf_self_assessments(id) ON DELETE CASCADE,
  criteria_id UUID NOT NULL REFERENCES permenparekraf_criteria(id),
  
  -- Response
  score_achieved INTEGER NOT NULL,
  evidence_provided BOOLEAN DEFAULT false,
  evidence_urls TEXT[],
  notes TEXT,
  
  -- Verification
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMPTZ,
  verification_notes TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(assessment_id, criteria_id)
);

-- ============================================
-- GRADING CONFIGURATION
-- ============================================
CREATE TABLE IF NOT EXISTS permenparekraf_grading_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_type VARCHAR(50) NOT NULL,
  
  -- Grade thresholds
  grade VARCHAR(5) NOT NULL CHECK (grade IN ('A', 'B', 'C', 'D', 'TL')),
  min_score INTEGER NOT NULL,
  max_score INTEGER NOT NULL,
  
  -- Requirements
  mandatory_sections TEXT[], -- Sections that must pass
  min_section_score INTEGER, -- Minimum score per section to pass
  
  -- Benefits/Privileges
  benefits TEXT,
  validity_years INTEGER DEFAULT 3,
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(business_type, grade)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_permenparekraf_assessments_branch ON permenparekraf_self_assessments(branch_id);
CREATE INDEX IF NOT EXISTS idx_permenparekraf_assessments_type ON permenparekraf_self_assessments(assessment_type);
CREATE INDEX IF NOT EXISTS idx_permenparekraf_assessments_status ON permenparekraf_self_assessments(status);
CREATE INDEX IF NOT EXISTS idx_permenparekraf_assessments_grade ON permenparekraf_self_assessments(grade);
CREATE INDEX IF NOT EXISTS idx_permenparekraf_assessments_date ON permenparekraf_self_assessments(assessment_date DESC);

CREATE INDEX IF NOT EXISTS idx_permenparekraf_criteria_type ON permenparekraf_criteria(business_type);
CREATE INDEX IF NOT EXISTS idx_permenparekraf_criteria_section ON permenparekraf_criteria(section_code);
CREATE INDEX IF NOT EXISTS idx_permenparekraf_criteria_active ON permenparekraf_criteria(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_permenparekraf_responses_assessment ON permenparekraf_assessment_responses(assessment_id);
CREATE INDEX IF NOT EXISTS idx_permenparekraf_responses_criteria ON permenparekraf_assessment_responses(criteria_id);

-- ============================================
-- TRIGGERS
-- ============================================
CREATE TRIGGER update_permenparekraf_assessments_updated_at
  BEFORE UPDATE ON permenparekraf_self_assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_permenparekraf_criteria_updated_at
  BEFORE UPDATE ON permenparekraf_criteria
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_permenparekraf_responses_updated_at
  BEFORE UPDATE ON permenparekraf_assessment_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE permenparekraf_self_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE permenparekraf_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE permenparekraf_assessment_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE permenparekraf_grading_config ENABLE ROW LEVEL SECURITY;

-- Self-Assessments: Admin can manage all
CREATE POLICY "Admin can manage assessments"
  ON permenparekraf_self_assessments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('super_admin', 'ops_admin')
    )
  );

-- Criteria: Anyone can view active criteria
CREATE POLICY "Anyone can view active criteria"
  ON permenparekraf_criteria
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admin can manage criteria"
  ON permenparekraf_criteria
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('super_admin', 'ops_admin')
    )
  );

-- Assessment Responses: Admin only
CREATE POLICY "Admin can manage responses"
  ON permenparekraf_assessment_responses
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('super_admin', 'ops_admin')
    )
  );

-- Grading Config: Anyone can view, admin can manage
CREATE POLICY "Anyone can view grading config"
  ON permenparekraf_grading_config
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admin can manage grading config"
  ON permenparekraf_grading_config
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

-- Function: Calculate assessment grade
CREATE OR REPLACE FUNCTION calculate_assessment_grade(p_total_score INTEGER, p_business_type VARCHAR)
RETURNS VARCHAR(5) AS $$
DECLARE
  v_grade VARCHAR(5);
BEGIN
  SELECT grade
  INTO v_grade
  FROM permenparekraf_grading_config
  WHERE business_type = p_business_type
    AND p_total_score >= min_score
    AND p_total_score <= max_score
    AND is_active = true
  ORDER BY min_score DESC
  LIMIT 1;
  
  RETURN COALESCE(v_grade, 'TL');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SEED DATA: Default Criteria for Agen Perjalanan Wisata
-- ============================================
INSERT INTO permenparekraf_criteria (business_type, section_code, criteria_code, criteria_name, max_score, is_mandatory, order_index)
VALUES
  -- Legalitas (20%)
  ('agen_perjalanan_wisata', 'legalitas', 'L-01', 'Memiliki NIB dan izin usaha yang valid', 50, true, 1),
  ('agen_perjalanan_wisata', 'legalitas', 'L-02', 'Terdaftar di SISUPAR', 30, true, 2),
  ('agen_perjalanan_wisata', 'legalitas', 'L-03', 'Memiliki keanggotaan ASITA/ASTINDO', 20, false, 3),
  
  -- SDM (20%)
  ('agen_perjalanan_wisata', 'sdm', 'S-01', 'Memiliki minimal 2 guide bersertifikat', 40, true, 1),
  ('agen_perjalanan_wisata', 'sdm', 'S-02', 'SDM yang kompeten dan terlatih', 30, true, 2),
  ('agen_perjalanan_wisata', 'sdm', 'S-03', 'Program pelatihan berkala untuk staff', 30, false, 3),
  
  -- Sarana Prasarana (20%)
  ('agen_perjalanan_wisata', 'sarana_prasarana', 'SP-01', 'Kantor dengan alamat tetap dan jelas', 40, true, 1),
  ('agen_perjalanan_wisata', 'sarana_prasarana', 'SP-02', 'Fasilitas operasional memadai', 30, true, 2),
  ('agen_perjalanan_wisata', 'sarana_prasarana', 'SP-03', 'Sistem IT dan komunikasi', 30, false, 3),
  
  -- Pelayanan (20%)
  ('agen_perjalanan_wisata', 'pelayanan', 'P-01', 'SOP pelayanan terdokumentasi', 40, true, 1),
  ('agen_perjalanan_wisata', 'pelayanan', 'P-02', 'Kepuasan pelanggan minimal 80%', 30, true, 2),
  ('agen_perjalanan_wisata', 'pelayanan', 'P-03', 'Mekanisme penanganan komplain', 30, true, 3),
  
  -- Keuangan (10%)
  ('agen_perjalanan_wisata', 'keuangan', 'K-01', 'Laporan keuangan teraudit', 50, false, 1),
  ('agen_perjalanan_wisata', 'keuangan', 'K-02', 'Sistem pembukuan yang baik', 50, true, 2),
  
  -- Lingkungan (10%)
  ('agen_perjalanan_wisata', 'lingkungan', 'E-01', 'Menerapkan prinsip pariwisata berkelanjutan', 50, false, 1),
  ('agen_perjalanan_wisata', 'lingkungan', 'E-02', 'Program CSR atau pemberdayaan masyarakat', 50, false, 2)
ON CONFLICT (business_type, section_code, criteria_code) DO NOTHING;

-- ============================================
-- SEED DATA: Grading Configuration
-- ============================================
INSERT INTO permenparekraf_grading_config (business_type, grade, min_score, max_score, benefits, validity_years)
VALUES
  ('agen_perjalanan_wisata', 'A', 900, 1000, 'Akses prioritas ke event pariwisata, promosi khusus, validitas 3 tahun', 3),
  ('agen_perjalanan_wisata', 'B', 750, 899, 'Promosi di platform resmi, validitas 3 tahun', 3),
  ('agen_perjalanan_wisata', 'C', 600, 749, 'Terdaftar sebagai usaha standar, validitas 2 tahun', 2),
  ('agen_perjalanan_wisata', 'D', 450, 599, 'Perlu perbaikan, validitas 1 tahun dengan evaluasi', 1),
  ('agen_perjalangan_wisata', 'TL', 0, 449, 'Tidak lulus, wajib perbaikan dalam 6 bulan', 0)
ON CONFLICT (business_type, grade) DO NOTHING;

COMMIT;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE permenparekraf_self_assessments IS 'Permenparekraf No.4/2021 - Self-assessment submissions';
COMMENT ON TABLE permenparekraf_criteria IS 'Assessment criteria based on Permenparekraf standards';
COMMENT ON TABLE permenparekraf_assessment_responses IS 'Detailed responses for each assessment criteria';
COMMENT ON TABLE permenparekraf_grading_config IS 'Grading configuration and thresholds';

