-- Migration: 144-mra-tp-certifications.sql
-- Description: ASEAN MRA-TP Guide Certification Framework
-- Created: 2026-01-03
-- Purpose: Implement MRA-TP and BNSP certification tracking for tourism professionals

BEGIN;

-- ============================================
-- UPDATE CERTIFICATION TYPES
-- Add MRA-TP and BNSP certification types
-- ============================================

-- First, update any existing invalid certification types to 'other'
UPDATE guide_certifications_tracker
SET certification_type = 'other'
WHERE certification_type NOT IN (
  'sim_kapal', 'first_aid', 'alin', 'other',
  'mra_tp_general', 'mra_tp_specialized',
  'bnsp_tour_guide', 'bnsp_tour_leader', 'bnsp_tour_planner', 'bnsp_tour_manager'
);

-- Drop existing constraint
ALTER TABLE guide_certifications_tracker 
  DROP CONSTRAINT IF EXISTS valid_certification_type;

-- Add new constraint with MRA-TP types
ALTER TABLE guide_certifications_tracker
  ADD CONSTRAINT valid_certification_type CHECK (
    certification_type IN (
      'sim_kapal', 'first_aid', 'alin', 'other',
      -- New MRA-TP types
      'mra_tp_general',      -- ASEAN MRA-TP General Tour Guide
      'mra_tp_specialized',  -- ASEAN MRA-TP Specialized Tour Guide  
      'bnsp_tour_guide',     -- BNSP Pemandu Wisata
      'bnsp_tour_leader',    -- BNSP Pimpinan Perjalanan Wisata
      'bnsp_tour_planner',   -- BNSP Perencana Perjalanan Wisata
      'bnsp_tour_manager'    -- BNSP Manajer Perjalanan Wisata
    )
  );

-- ============================================
-- COMPETENCY ASSESSMENT TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS guide_competency_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  certification_type VARCHAR(50) NOT NULL,
  assessment_date DATE NOT NULL,
  
  -- Assessor information
  assessor_name VARCHAR(200),
  assessor_institution VARCHAR(200),
  assessor_license_number VARCHAR(100),
  
  -- Competency scores (MRA-TP framework)
  knowledge_score DECIMAL(5,2) CHECK (knowledge_score BETWEEN 0 AND 100), -- Pengetahuan
  skill_score DECIMAL(5,2) CHECK (skill_score BETWEEN 0 AND 100),         -- Keterampilan
  attitude_score DECIMAL(5,2) CHECK (attitude_score BETWEEN 0 AND 100),   -- Sikap
  overall_score DECIMAL(5,2) CHECK (overall_score BETWEEN 0 AND 100),
  
  -- Result
  result VARCHAR(20) CHECK (result IN ('competent', 'not_yet_competent', 'pending')),
  competency_gaps TEXT[], -- Areas needing improvement
  recommendations TEXT,
  
  -- Certificate
  certificate_number VARCHAR(100),
  certificate_url TEXT,
  certificate_valid_until DATE,
  
  -- Notes
  notes TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MRA-TP COMPETENCY UNITS TABLE
-- Based on ASEAN MRA-TP competency standards
-- ============================================
CREATE TABLE IF NOT EXISTS mra_tp_competency_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_code VARCHAR(50) UNIQUE NOT NULL,
  unit_title VARCHAR(200) NOT NULL,
  description TEXT,
  
  -- Classification
  category VARCHAR(50) NOT NULL CHECK (category IN ('core', 'functional', 'elective')),
  level INTEGER CHECK (level BETWEEN 1 AND 4), -- MRA-TP levels 1-4
  
  -- Requirements
  prerequisite_units VARCHAR(50)[],
  minimum_score DECIMAL(5,2) DEFAULT 70.00,
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- GUIDE COMPETENCY UNIT PROGRESS
-- Track individual guide progress on each competency unit
-- ============================================
CREATE TABLE IF NOT EXISTS guide_competency_unit_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES mra_tp_competency_units(id),
  
  -- Progress
  status VARCHAR(20) DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'failed')),
  score DECIMAL(5,2) CHECK (score BETWEEN 0 AND 100),
  attempts_count INTEGER DEFAULT 0,
  
  -- Dates
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  expires_at DATE,
  
  -- Evidence
  evidence_urls TEXT[],
  assessor_notes TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(guide_id, unit_id)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_guide_competency_assessments_guide ON guide_competency_assessments(guide_id);
CREATE INDEX IF NOT EXISTS idx_guide_competency_assessments_cert_type ON guide_competency_assessments(certification_type);
CREATE INDEX IF NOT EXISTS idx_guide_competency_assessments_result ON guide_competency_assessments(result);
CREATE INDEX IF NOT EXISTS idx_guide_competency_assessments_date ON guide_competency_assessments(assessment_date DESC);

CREATE INDEX IF NOT EXISTS idx_mra_tp_units_category ON mra_tp_competency_units(category);
CREATE INDEX IF NOT EXISTS idx_mra_tp_units_level ON mra_tp_competency_units(level);
CREATE INDEX IF NOT EXISTS idx_mra_tp_units_active ON mra_tp_competency_units(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_guide_unit_progress_guide ON guide_competency_unit_progress(guide_id);
CREATE INDEX IF NOT EXISTS idx_guide_unit_progress_unit ON guide_competency_unit_progress(unit_id);
CREATE INDEX IF NOT EXISTS idx_guide_unit_progress_status ON guide_competency_unit_progress(status);

-- ============================================
-- TRIGGERS
-- ============================================
CREATE TRIGGER update_guide_competency_assessments_updated_at
  BEFORE UPDATE ON guide_competency_assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mra_tp_units_updated_at
  BEFORE UPDATE ON mra_tp_competency_units
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_guide_unit_progress_updated_at
  BEFORE UPDATE ON guide_competency_unit_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE guide_competency_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE mra_tp_competency_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE guide_competency_unit_progress ENABLE ROW LEVEL SECURITY;

-- Competency Assessments: Guide can view own, admin can manage all
CREATE POLICY "Guide can view own assessments"
  ON guide_competency_assessments
  FOR SELECT
  USING (guide_id = auth.uid());

CREATE POLICY "Admin can manage assessments"
  ON guide_competency_assessments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('super_admin', 'ops_admin')
    )
  );

-- MRA-TP Units: Anyone can view active units
CREATE POLICY "Anyone can view active competency units"
  ON mra_tp_competency_units
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admin can manage competency units"
  ON mra_tp_competency_units
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('super_admin', 'ops_admin')
    )
  );

-- Unit Progress: Guide can view/update own, admin can view all
CREATE POLICY "Guide can view own progress"
  ON guide_competency_unit_progress
  FOR SELECT
  USING (guide_id = auth.uid());

CREATE POLICY "Guide can update own progress"
  ON guide_competency_unit_progress
  FOR UPDATE
  USING (guide_id = auth.uid());

CREATE POLICY "Admin can manage all progress"
  ON guide_competency_unit_progress
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

-- Function: Check if guide has MRA-TP certification
CREATE OR REPLACE FUNCTION has_mra_tp_certification(p_guide_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_has_cert BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1
    FROM guide_certifications_tracker
    WHERE guide_id = p_guide_id
      AND certification_type IN ('mra_tp_general', 'mra_tp_specialized', 'bnsp_tour_guide', 'bnsp_tour_leader', 'bnsp_tour_planner')
      AND status = 'verified'
      AND is_active = true
      AND expiry_date >= CURRENT_DATE
  ) INTO v_has_cert;
  
  RETURN v_has_cert;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get guide competency completion percentage
CREATE OR REPLACE FUNCTION get_guide_competency_completion(p_guide_id UUID)
RETURNS DECIMAL(5,2) AS $$
DECLARE
  v_total_units INTEGER;
  v_completed_units INTEGER;
BEGIN
  -- Count total active core and functional units
  SELECT COUNT(*)
  INTO v_total_units
  FROM mra_tp_competency_units
  WHERE category IN ('core', 'functional')
    AND is_active = true;
  
  IF v_total_units = 0 THEN
    RETURN 0;
  END IF;
  
  -- Count completed units for guide
  SELECT COUNT(*)
  INTO v_completed_units
  FROM guide_competency_unit_progress gp
  JOIN mra_tp_competency_units u ON u.id = gp.unit_id
  WHERE gp.guide_id = p_guide_id
    AND gp.status = 'completed'
    AND u.category IN ('core', 'functional')
    AND u.is_active = true;
  
  RETURN ROUND((v_completed_units::DECIMAL / v_total_units) * 100, 2);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SEED DATA: MRA-TP Competency Units (Core)
-- ============================================
INSERT INTO mra_tp_competency_units (unit_code, unit_title, description, category, level, minimum_score)
VALUES
  ('MRA-TP-CORE-01', 'Customer Service in Tourism', 'Provide quality customer service to tourists', 'core', 1, 70.00),
  ('MRA-TP-CORE-02', 'Communication Skills', 'Communicate effectively with tourists and stakeholders', 'core', 1, 70.00),
  ('MRA-TP-CORE-03', 'Tourism Product Knowledge', 'Demonstrate knowledge of local tourism products and attractions', 'core', 2, 75.00),
  ('MRA-TP-CORE-04', 'Safety and Emergency Procedures', 'Apply safety and emergency procedures in tourism operations', 'core', 2, 80.00),
  ('MRA-TP-CORE-05', 'Cultural Sensitivity', 'Demonstrate cultural awareness and sensitivity', 'core', 2, 70.00),
  ('MRA-TP-FUNC-01', 'Tour Planning and Preparation', 'Plan and prepare tour itineraries', 'functional', 2, 75.00),
  ('MRA-TP-FUNC-02', 'Tour Leading and Coordination', 'Lead and coordinate tour groups effectively', 'functional', 3, 75.00),
  ('MRA-TP-FUNC-03', 'Tourism Legislation', 'Understand and apply tourism legislation and regulations', 'functional', 2, 70.00),
  ('MRA-TP-FUNC-04', 'Risk Management', 'Identify and manage risks in tourism operations', 'functional', 3, 80.00),
  ('MRA-TP-FUNC-05', 'Sustainable Tourism Practices', 'Apply sustainable tourism principles', 'functional', 2, 70.00),
  ('BNSP-TG-01', 'Indonesian Tourism Geography', 'Knowledge of Indonesian destinations and attractions', 'functional', 2, 75.00),
  ('BNSP-TG-02', 'Bahasa Indonesia and Foreign Language', 'Communication in Indonesian and at least one foreign language', 'functional', 2, 70.00)
ON CONFLICT (unit_code) DO NOTHING;

COMMIT;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE guide_competency_assessments IS 'MRA-TP competency assessments for tour guides';
COMMENT ON TABLE mra_tp_competency_units IS 'ASEAN MRA-TP competency units and standards';
COMMENT ON TABLE guide_competency_unit_progress IS 'Individual guide progress tracking for competency units';

