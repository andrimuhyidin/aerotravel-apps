-- Migration: 027-guide-training.sql
-- Description: Training modules & quiz system
-- Created: 2025-12-19

BEGIN;

-- ============================================
-- TRAINING MODULES
-- ============================================
DO $$ BEGIN
  CREATE TYPE training_category AS ENUM (
    'safety',
    'customer_service',
    'navigation',
    'first_aid',
    'equipment',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE training_status AS ENUM (
    'not_started',
    'in_progress',
    'completed',
    'failed'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS guide_training_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Module Info
  title VARCHAR(200) NOT NULL,
  description TEXT,
  content TEXT NOT NULL, -- Markdown or HTML content
  category training_category NOT NULL,
  
  -- Duration
  duration_minutes INTEGER NOT NULL,
  
  -- Requirements
  is_required BOOLEAN DEFAULT false,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TRAINING PROGRESS
-- ============================================
CREATE TABLE IF NOT EXISTS guide_training_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES guide_training_modules(id) ON DELETE CASCADE,
  
  -- Progress
  status training_status DEFAULT 'not_started',
  progress_percent INTEGER DEFAULT 0,
  
  -- Completion
  completed_at TIMESTAMPTZ,
  score INTEGER, -- 0-100, for quiz-based modules
  
  -- Audit
  started_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(guide_id, module_id)
);

-- ============================================
-- TRAINING QUIZES
-- ============================================
CREATE TABLE IF NOT EXISTS guide_training_quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES guide_training_modules(id) ON DELETE CASCADE,
  
  -- Question
  question TEXT NOT NULL,
  question_type VARCHAR(20) DEFAULT 'multiple_choice', -- 'multiple_choice', 'true_false', 'text'
  
  -- Options (for multiple choice)
  options JSONB, -- Array of {id, text, is_correct}
  
  -- Correct Answer
  correct_answer TEXT, -- For text questions
  
  -- Points
  points INTEGER DEFAULT 1,
  
  -- Order
  display_order INTEGER DEFAULT 0,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- QUIZ ATTEMPTS
-- ============================================
CREATE TABLE IF NOT EXISTS guide_training_quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES guide_training_modules(id) ON DELETE CASCADE,
  
  -- Answers
  answers JSONB NOT NULL, -- {question_id: answer}
  
  -- Score
  score INTEGER NOT NULL, -- 0-100
  passed BOOLEAN DEFAULT false, -- Usually >= 70
  
  -- Audit
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CERTIFICATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS guide_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES guide_training_modules(id) ON DELETE CASCADE,
  
  -- Certificate Info
  certificate_number VARCHAR(100) UNIQUE,
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- NULL = no expiration
  
  -- Status
  is_valid BOOLEAN DEFAULT true,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_guide_training_modules_category ON guide_training_modules(category);
CREATE INDEX IF NOT EXISTS idx_guide_training_modules_required ON guide_training_modules(is_required);
CREATE INDEX IF NOT EXISTS idx_guide_training_progress_guide_id ON guide_training_progress(guide_id);
CREATE INDEX IF NOT EXISTS idx_guide_training_progress_module_id ON guide_training_progress(module_id);
CREATE INDEX IF NOT EXISTS idx_guide_training_quizzes_module_id ON guide_training_quizzes(module_id);
CREATE INDEX IF NOT EXISTS idx_guide_training_quiz_attempts_guide_id ON guide_training_quiz_attempts(guide_id);
CREATE INDEX IF NOT EXISTS idx_guide_certifications_guide_id ON guide_certifications(guide_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE guide_training_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE guide_training_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE guide_training_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE guide_training_quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE guide_certifications ENABLE ROW LEVEL SECURITY;

-- Training modules: All guides can view
CREATE POLICY "guide_training_modules_view" ON guide_training_modules
  FOR SELECT
  USING (is_active = true);

-- Training progress: Guides can manage own progress
CREATE POLICY "guide_training_progress_own" ON guide_training_progress
  FOR ALL
  USING (guide_id = auth.uid());

-- Quizzes: All guides can view
CREATE POLICY "guide_training_quizzes_view" ON guide_training_quizzes
  FOR SELECT
  USING (true);

-- Quiz attempts: Guides can manage own attempts
CREATE POLICY "guide_training_quiz_attempts_own" ON guide_training_quiz_attempts
  FOR ALL
  USING (guide_id = auth.uid());

-- Certifications: Guides can view own
CREATE POLICY "guide_certifications_own" ON guide_certifications
  FOR SELECT
  USING (guide_id = auth.uid());

-- Staff can view all
CREATE POLICY "guide_training_progress_staff" ON guide_training_progress
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'ops_admin')
    )
  );

COMMIT;

