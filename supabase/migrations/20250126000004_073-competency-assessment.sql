-- Migration: 073-competency-assessment.sql
-- Description: Competency Self-Assessment (P3 Optional)
-- Created: 2025-01-26

-- ============================================
-- TRAINING ASSESSMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS training_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
  guide_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Self-Rating (1-5 scale)
  self_rating INTEGER CHECK (self_rating >= 1 AND self_rating <= 5),
  
  -- Quiz Results
  quiz_score INTEGER, -- 0-100
  quiz_passed BOOLEAN DEFAULT false, -- true if score >= 70
  
  -- Submission
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(session_id, guide_id)
);

-- ============================================
-- TRAINING ASSESSMENT QUESTIONS TABLE
-- ============================================
DO $$ BEGIN
  CREATE TYPE question_type AS ENUM ('multiple_choice', 'rating');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS training_assessment_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
  
  -- Question Details
  question_text TEXT NOT NULL,
  question_type question_type NOT NULL DEFAULT 'multiple_choice',
  options JSONB, -- For multiple choice: ["Option A", "Option B", ...]
  correct_answer TEXT, -- Correct answer for multiple choice
  points INTEGER DEFAULT 1, -- Points for this question
  
  -- Order
  question_order INTEGER NOT NULL,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TRAINING ASSESSMENT ANSWERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS training_assessment_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES training_assessments(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES training_assessment_questions(id) ON DELETE CASCADE,
  
  -- Answer
  answer TEXT NOT NULL,
  is_correct BOOLEAN, -- Auto-calculated
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(assessment_id, question_id)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_training_assessments_session_id ON training_assessments(session_id);
CREATE INDEX IF NOT EXISTS idx_training_assessments_guide_id ON training_assessments(guide_id);
CREATE INDEX IF NOT EXISTS idx_training_assessments_submitted_at ON training_assessments(submitted_at DESC);

CREATE INDEX IF NOT EXISTS idx_assessment_questions_session_id ON training_assessment_questions(session_id);
CREATE INDEX IF NOT EXISTS idx_assessment_questions_order ON training_assessment_questions(session_id, question_order);

CREATE INDEX IF NOT EXISTS idx_assessment_answers_assessment_id ON training_assessment_answers(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_answers_question_id ON training_assessment_answers(question_id);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE training_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_assessment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_assessment_answers ENABLE ROW LEVEL SECURITY;

-- Guides can view and create their own assessments
CREATE POLICY "Guides can view own assessments"
  ON training_assessments
  FOR SELECT
  USING (auth.uid() = guide_id);

CREATE POLICY "Guides can create own assessments"
  ON training_assessments
  FOR INSERT
  WITH CHECK (auth.uid() = guide_id);

-- Guides can view questions for sessions they attend
CREATE POLICY "Guides can view assessment questions"
  ON training_assessment_questions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM training_attendance ta
      WHERE ta.session_id = training_assessment_questions.session_id
        AND ta.guide_id = auth.uid()
        AND ta.status = 'present'
    )
  );

-- Admins can manage questions
CREATE POLICY "Admins can manage assessment questions"
  ON training_assessment_questions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
        AND role IN ('super_admin', 'ops_admin')
    )
  );

-- Guides can view and create their own answers
CREATE POLICY "Guides can view own answers"
  ON training_assessment_answers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM training_assessments ta
      WHERE ta.id = training_assessment_answers.assessment_id
        AND ta.guide_id = auth.uid()
    )
  );

CREATE POLICY "Guides can create own answers"
  ON training_assessment_answers
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM training_assessments ta
      WHERE ta.id = training_assessment_answers.assessment_id
        AND ta.guide_id = auth.uid()
    )
  );

-- Admins can view all assessments
CREATE POLICY "Admins can view all assessments"
  ON training_assessments
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
COMMENT ON TABLE training_assessments IS 'Post-training assessments: self-rating + quiz results';
COMMENT ON TABLE training_assessment_questions IS 'Questions for training assessments (multiple choice or rating)';
COMMENT ON TABLE training_assessment_answers IS 'Answers submitted by guides for assessment questions';

