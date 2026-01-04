-- Migration: 076-competency-quiz.sql
-- Description: Create competency quiz system for training
-- Created: 2025-12-22

-- ============================================
-- TABLE: Training Quizzes
-- ============================================
CREATE TABLE IF NOT EXISTS training_quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id UUID REFERENCES guide_training_records(id) ON DELETE CASCADE,
  quiz_title VARCHAR(255) NOT NULL,
  quiz_description TEXT,
  passing_score INTEGER DEFAULT 70, -- Percentage (0-100)
  time_limit_minutes INTEGER, -- NULL = no time limit
  max_attempts INTEGER DEFAULT 3,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  branch_id UUID NOT NULL REFERENCES branches(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: Quiz Questions
-- ============================================
CREATE TABLE IF NOT EXISTS quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES training_quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type VARCHAR(20) DEFAULT 'multiple_choice', -- 'multiple_choice', 'true_false', 'short_answer'
  options JSONB, -- For multiple choice: [{text: "...", is_correct: true}, ...]
  correct_answer TEXT, -- For true/false or short answer
  points INTEGER DEFAULT 1,
  order_index INTEGER DEFAULT 0,
  explanation TEXT, -- Shown after answering
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: Quiz Attempts
-- ============================================
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES training_quizzes(id) ON DELETE CASCADE,
  guide_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  training_id UUID REFERENCES guide_training_records(id) ON DELETE SET NULL,
  branch_id UUID NOT NULL REFERENCES branches(id),
  score INTEGER, -- Percentage (0-100)
  total_points INTEGER,
  earned_points INTEGER,
  passed BOOLEAN DEFAULT false,
  time_taken_seconds INTEGER,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  answers JSONB, -- {question_id: {answer: "...", is_correct: true, points: 1}}
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_training_quizzes_training_id ON training_quizzes(training_id);
CREATE INDEX IF NOT EXISTS idx_training_quizzes_branch_id ON training_quizzes(branch_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_id ON quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_id ON quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_guide_id ON quiz_attempts(guide_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_training_id ON quiz_attempts(training_id);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE training_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Guides can view active quizzes for their training
CREATE POLICY "Guides can view active quizzes"
  ON training_quizzes
  FOR SELECT
  USING (
    is_active = true
    AND (
      training_id IN (
        SELECT id FROM guide_training_records WHERE guide_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
          AND users.role IN ('super_admin', 'ops_admin', 'trainer')
      )
    )
  );

-- Admins/Trainers can manage quizzes
CREATE POLICY "Admins can manage quizzes"
  ON training_quizzes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('super_admin', 'ops_admin', 'trainer')
    )
  );

-- Guides can view questions for quizzes they can access
CREATE POLICY "Guides can view quiz questions"
  ON quiz_questions
  FOR SELECT
  USING (
    quiz_id IN (
      SELECT id FROM training_quizzes
      WHERE is_active = true
        AND (
          training_id IN (
            SELECT id FROM guide_training_records WHERE guide_id = auth.uid()
          )
          OR EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
              AND users.role IN ('super_admin', 'ops_admin', 'trainer')
          )
        )
    )
  );

-- Admins/Trainers can manage questions
CREATE POLICY "Admins can manage quiz questions"
  ON quiz_questions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('super_admin', 'ops_admin', 'trainer')
    )
  );

-- Guides can view their own attempts
CREATE POLICY "Guides can view own attempts"
  ON quiz_attempts
  FOR SELECT
  USING (auth.uid() = guide_id);

-- Guides can create their own attempts
CREATE POLICY "Guides can create own attempts"
  ON quiz_attempts
  FOR INSERT
  WITH CHECK (auth.uid() = guide_id);

-- Admins can view all attempts
CREATE POLICY "Admins can view all attempts"
  ON quiz_attempts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('super_admin', 'ops_admin', 'trainer')
    )
  );

-- ============================================
-- TRIGGERS
-- ============================================
CREATE TRIGGER update_training_quizzes_updated_at
  BEFORE UPDATE ON training_quizzes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quiz_questions_updated_at
  BEFORE UPDATE ON quiz_questions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quiz_attempts_updated_at
  BEFORE UPDATE ON quiz_attempts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to check if guide can receive certificate (must pass quiz)
CREATE OR REPLACE FUNCTION check_quiz_requirement_for_certificate(
  p_training_id UUID,
  p_guide_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_quiz_id UUID;
  v_passing_score INTEGER;
  v_best_score INTEGER;
BEGIN
  -- Get quiz for this training
  SELECT id, passing_score
  INTO v_quiz_id, v_passing_score
  FROM training_quizzes
  WHERE training_id = p_training_id
    AND is_active = true
  LIMIT 1;

  -- If no quiz required, return true
  IF v_quiz_id IS NULL THEN
    RETURN true;
  END IF;

  -- Get best score from attempts
  SELECT COALESCE(MAX(score), 0)
  INTO v_best_score
  FROM quiz_attempts
  WHERE quiz_id = v_quiz_id
    AND guide_id = p_guide_id
    AND passed = true;

  -- Return true if best score >= passing score
  RETURN v_best_score >= v_passing_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE training_quizzes IS 'Quizzes for training competency assessment';
COMMENT ON TABLE quiz_questions IS 'Questions for training quizzes';
COMMENT ON TABLE quiz_attempts IS 'Guide attempts at completing quizzes';
COMMENT ON FUNCTION check_quiz_requirement_for_certificate IS 'Check if guide has passed required quiz for certificate';

