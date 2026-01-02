-- Migration: 140-trm-training-modules.sql
-- Description: TRM-Specific Training Modules for ISO 31030 Compliance
-- Created: 2025-03-03
-- Standards: ISO 31030 Travel Risk Management

-- ============================================
-- INSERT TRM MANDATORY TRAININGS
-- ============================================
INSERT INTO mandatory_trainings (training_type, title, description, frequency, valid_months, is_active)
VALUES
  ('trm', 'Travel Risk Management Fundamentals', 'Dasar-dasar manajemen risiko perjalanan sesuai ISO 31030', 'yearly', 12, true),
  ('crisis', 'Crisis Response & Communication', 'Prosedur tanggap darurat dan komunikasi krisis', 'yearly', 12, true),
  ('first_responder', 'First Responder Certification', 'Sertifikasi pertolongan pertama dan penanganan darurat medis', 'yearly', 12, true),
  ('marine_safety', 'Marine Safety & Navigation', 'Keselamatan maritim dan navigasi dasar', 'quarterly', 3, true),
  ('environmental', 'Environmental Awareness', 'Kesadaran lingkungan dan prosedur GSTC', 'yearly', 12, true),
  ('chse', 'CHSE Protocol Training', 'Protokol Kebersihan, Kesehatan, Keselamatan, dan Kelestarian Lingkungan', 'yearly', 12, true)
ON CONFLICT (training_type) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  frequency = EXCLUDED.frequency,
  valid_months = EXCLUDED.valid_months,
  is_active = EXCLUDED.is_active;

-- ============================================
-- TRM TRAINING MODULES TABLE
-- Detailed training content
-- ============================================
CREATE TABLE IF NOT EXISTS trm_training_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES branches(id),
  
  -- Module Info
  module_code VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  training_type VARCHAR(50) NOT NULL, -- 'trm', 'crisis', 'first_responder', 'marine_safety', 'environmental', 'chse'
  
  -- Content
  objectives TEXT[],
  learning_outcomes TEXT[],
  topics JSONB DEFAULT '[]',
  -- Structure: [
  --   {"topic": "Risk Identification", "duration_minutes": 30, "content": "..."},
  --   ...
  -- ]
  
  -- Duration
  total_duration_minutes INTEGER,
  
  -- Assessment
  has_quiz BOOLEAN DEFAULT true,
  passing_score INTEGER DEFAULT 70,
  max_attempts INTEGER DEFAULT 3,
  
  -- Materials
  material_urls TEXT[],
  video_urls TEXT[],
  
  -- Prerequisites
  prerequisites TEXT[],
  required_certifications TEXT[],
  
  -- Audience
  target_roles TEXT[] DEFAULT ARRAY['guide'],
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  version VARCHAR(20) DEFAULT '1.0',
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  
  -- Constraints
  CONSTRAINT valid_training_type CHECK (training_type IN ('trm', 'crisis', 'first_responder', 'marine_safety', 'environmental', 'chse', 'other'))
);

-- ============================================
-- TRM QUIZ QUESTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS trm_quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES trm_training_modules(id) ON DELETE CASCADE,
  
  -- Question
  question_text TEXT NOT NULL,
  question_type VARCHAR(50) DEFAULT 'multiple_choice', -- 'multiple_choice', 'true_false', 'scenario'
  
  -- Options (for multiple choice)
  options JSONB DEFAULT '[]',
  -- Structure: [
  --   {"id": "a", "text": "Option A", "is_correct": false},
  --   {"id": "b", "text": "Option B", "is_correct": true},
  --   ...
  -- ]
  
  -- For true/false
  correct_answer BOOLEAN,
  
  -- Explanation
  explanation TEXT,
  
  -- Points
  points INTEGER DEFAULT 1,
  
  -- Order
  order_index INTEGER DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Constraints
  CONSTRAINT valid_question_type CHECK (question_type IN ('multiple_choice', 'true_false', 'scenario', 'open_ended'))
);

-- ============================================
-- TRM TRAINING COMPLETIONS TABLE
-- Track individual training completions
-- ============================================
CREATE TABLE IF NOT EXISTS trm_training_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES trm_training_modules(id),
  user_id UUID NOT NULL REFERENCES users(id),
  branch_id UUID REFERENCES branches(id),
  
  -- Progress
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  progress_percentage DECIMAL(5, 2) DEFAULT 0,
  
  -- Topics Completed
  topics_completed JSONB DEFAULT '[]',
  current_topic_index INTEGER DEFAULT 0,
  
  -- Time Tracking
  total_time_spent_minutes INTEGER DEFAULT 0,
  
  -- Quiz Results
  quiz_attempts INTEGER DEFAULT 0,
  quiz_score DECIMAL(5, 2),
  quiz_passed BOOLEAN DEFAULT false,
  quiz_completed_at TIMESTAMPTZ,
  quiz_answers JSONB DEFAULT '[]',
  
  -- Certificate
  certificate_issued BOOLEAN DEFAULT false,
  certificate_url TEXT,
  certificate_number VARCHAR(100),
  valid_until DATE,
  
  -- Status
  status VARCHAR(20) DEFAULT 'in_progress', -- 'in_progress', 'completed', 'failed', 'expired'
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique per user per module
  UNIQUE(module_id, user_id),
  
  -- Constraints
  CONSTRAINT valid_completion_status CHECK (status IN ('in_progress', 'completed', 'failed', 'expired'))
);

-- ============================================
-- TRM COMPETENCY ASSESSMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS trm_competency_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  assessor_id UUID REFERENCES users(id),
  branch_id UUID REFERENCES branches(id),
  
  -- Assessment Type
  assessment_type VARCHAR(50) NOT NULL, -- 'initial', 'periodic', 'incident_review', 'promotion'
  
  -- Competency Areas
  competencies JSONB NOT NULL DEFAULT '[]',
  -- Structure: [
  --   {"area": "Risk Identification", "score": 85, "notes": "..."},
  --   {"area": "Emergency Response", "score": 90, "notes": "..."},
  --   ...
  -- ]
  
  -- Overall Score
  overall_score DECIMAL(5, 2),
  
  -- Assessment Date
  assessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Result
  result VARCHAR(20) DEFAULT 'pending', -- 'pending', 'passed', 'failed', 'needs_improvement'
  
  -- Recommendations
  recommendations TEXT[],
  improvement_areas TEXT[],
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_date DATE,
  
  -- Documentation
  evidence_urls TEXT[],
  notes TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_assessment_type CHECK (assessment_type IN ('initial', 'periodic', 'incident_review', 'promotion', 'refresher')),
  CONSTRAINT valid_assessment_result CHECK (result IN ('pending', 'passed', 'failed', 'needs_improvement'))
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_trm_training_modules_type ON trm_training_modules(training_type);
CREATE INDEX IF NOT EXISTS idx_trm_training_modules_active ON trm_training_modules(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_trm_quiz_questions_module_id ON trm_quiz_questions(module_id);
CREATE INDEX IF NOT EXISTS idx_trm_quiz_questions_order ON trm_quiz_questions(order_index);

CREATE INDEX IF NOT EXISTS idx_trm_training_completions_module_id ON trm_training_completions(module_id);
CREATE INDEX IF NOT EXISTS idx_trm_training_completions_user_id ON trm_training_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_trm_training_completions_status ON trm_training_completions(status);
CREATE INDEX IF NOT EXISTS idx_trm_training_completions_valid_until ON trm_training_completions(valid_until);

CREATE INDEX IF NOT EXISTS idx_trm_competency_assessments_user_id ON trm_competency_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_trm_competency_assessments_type ON trm_competency_assessments(assessment_type);
CREATE INDEX IF NOT EXISTS idx_trm_competency_assessments_result ON trm_competency_assessments(result);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE trm_training_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE trm_quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE trm_training_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE trm_competency_assessments ENABLE ROW LEVEL SECURITY;

-- Training Modules: All can view, admins manage
CREATE POLICY "Anyone can view active training modules"
  ON trm_training_modules
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage training modules"
  ON trm_training_modules
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('super_admin', 'ops_admin')
    )
  );

-- Quiz Questions: Similar
CREATE POLICY "Anyone can view active quiz questions"
  ON trm_quiz_questions
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage quiz questions"
  ON trm_quiz_questions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('super_admin', 'ops_admin')
    )
  );

-- Training Completions: Users can view and update own
CREATE POLICY "Users can view own training completions"
  ON trm_training_completions
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own training completions"
  ON trm_training_completions
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can start training"
  ON trm_training_completions
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all training completions"
  ON trm_training_completions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('super_admin', 'ops_admin')
    )
  );

-- Competency Assessments: Users can view own, admins manage
CREATE POLICY "Users can view own competency assessments"
  ON trm_competency_assessments
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage competency assessments"
  ON trm_competency_assessments
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

-- Function to check training compliance for a user
CREATE OR REPLACE FUNCTION check_user_training_compliance(p_user_id UUID)
RETURNS TABLE (
  training_type VARCHAR,
  title VARCHAR,
  is_compliant BOOLEAN,
  completed_at TIMESTAMPTZ,
  valid_until DATE,
  days_until_expiry INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mt.training_type,
    mt.title,
    (ttc.status = 'completed' AND ttc.valid_until > CURRENT_DATE) as is_compliant,
    ttc.completed_at,
    ttc.valid_until,
    (ttc.valid_until - CURRENT_DATE)::INTEGER as days_until_expiry
  FROM mandatory_trainings mt
  LEFT JOIN trm_training_modules tm ON tm.training_type = mt.training_type AND tm.is_active = true
  LEFT JOIN trm_training_completions ttc ON ttc.module_id = tm.id AND ttc.user_id = p_user_id
  WHERE mt.is_active = true
  ORDER BY mt.training_type;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate overall training compliance rate
CREATE OR REPLACE FUNCTION calculate_branch_training_compliance(p_branch_id UUID)
RETURNS TABLE (
  total_guides INTEGER,
  fully_compliant INTEGER,
  compliance_rate DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  WITH guide_compliance AS (
    SELECT 
      u.id as user_id,
      COUNT(DISTINCT mt.training_type) as required_count,
      COUNT(DISTINCT CASE 
        WHEN ttc.status = 'completed' AND ttc.valid_until > CURRENT_DATE 
        THEN mt.training_type 
      END) as completed_count
    FROM users u
    CROSS JOIN mandatory_trainings mt
    LEFT JOIN trm_training_modules tm ON tm.training_type = mt.training_type AND tm.is_active = true
    LEFT JOIN trm_training_completions ttc ON ttc.module_id = tm.id AND ttc.user_id = u.id
    WHERE u.branch_id = p_branch_id
      AND u.role = 'guide'
      AND mt.is_active = true
    GROUP BY u.id
  )
  SELECT 
    COUNT(*)::INTEGER as total_guides,
    COUNT(CASE WHEN required_count = completed_count THEN 1 END)::INTEGER as fully_compliant,
    CASE WHEN COUNT(*) > 0 
         THEN ROUND((COUNT(CASE WHEN required_count = completed_count THEN 1 END)::DECIMAL / COUNT(*) * 100), 1)
         ELSE 0 
    END as compliance_rate
  FROM guide_compliance;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- INSERT DEFAULT TRM TRAINING MODULE
-- ============================================
INSERT INTO trm_training_modules (
  id,
  module_code,
  title,
  description,
  training_type,
  objectives,
  learning_outcomes,
  topics,
  total_duration_minutes,
  is_active
) VALUES (
  gen_random_uuid(),
  'TRM-101',
  'Travel Risk Management Fundamentals',
  'Modul dasar untuk memahami dan menerapkan manajemen risiko perjalanan sesuai ISO 31030',
  'trm',
  ARRAY[
    'Memahami konsep dasar Travel Risk Management',
    'Mengidentifikasi risiko dalam operasi perjalanan wisata',
    'Menerapkan prosedur mitigasi risiko',
    'Memahami tanggung jawab Duty of Care'
  ],
  ARRAY[
    'Mampu melakukan penilaian risiko pre-trip',
    'Mampu mengidentifikasi potensi bahaya',
    'Mampu mengambil keputusan berbasis risiko',
    'Memahami protokol komunikasi darurat'
  ],
  '[
    {"topic": "Pengenalan ISO 31030", "duration_minutes": 20, "order": 1},
    {"topic": "Identifikasi Risiko", "duration_minutes": 30, "order": 2},
    {"topic": "Penilaian Risiko", "duration_minutes": 30, "order": 3},
    {"topic": "Mitigasi & Kontrol", "duration_minutes": 30, "order": 4},
    {"topic": "Duty of Care", "duration_minutes": 20, "order": 5},
    {"topic": "Studi Kasus", "duration_minutes": 30, "order": 6}
  ]'::JSONB,
  160,
  true
) ON CONFLICT (module_code) DO NOTHING;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE trm_training_modules IS 'Training modules for ISO 31030 TRM compliance';
COMMENT ON TABLE trm_quiz_questions IS 'Quiz questions for training module assessments';
COMMENT ON TABLE trm_training_completions IS 'Individual training completion records with certification tracking';
COMMENT ON TABLE trm_competency_assessments IS 'Periodic competency assessments for TRM skills';

