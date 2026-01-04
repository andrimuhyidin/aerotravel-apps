-- Migration: 077-trainer-feedback.sql
-- Description: Create trainer feedback system
-- Created: 2025-12-22

-- ============================================
-- TABLE: Trainer Feedback
-- ============================================
CREATE TABLE IF NOT EXISTS trainer_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id UUID REFERENCES guide_training_records(id) ON DELETE CASCADE,
  guide_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trainer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  branch_id UUID NOT NULL REFERENCES branches(id),
  
  -- Feedback ratings (1-5 scale)
  overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
  content_quality INTEGER CHECK (content_quality >= 1 AND content_quality <= 5),
  trainer_effectiveness INTEGER CHECK (trainer_effectiveness >= 1 AND trainer_effectiveness <= 5),
  material_clarity INTEGER CHECK (material_clarity >= 1 AND material_clarity <= 5),
  practical_applicability INTEGER CHECK (practical_applicability >= 1 AND practical_applicability <= 5),
  
  -- Feedback text
  strengths TEXT, -- What went well
  improvements TEXT, -- Areas for improvement
  suggestions TEXT, -- Suggestions for future training
  additional_comments TEXT,
  
  -- Metadata
  feedback_date TIMESTAMPTZ DEFAULT NOW(),
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_trainer_feedback_training_id ON trainer_feedback(training_id);
CREATE INDEX IF NOT EXISTS idx_trainer_feedback_guide_id ON trainer_feedback(guide_id);
CREATE INDEX IF NOT EXISTS idx_trainer_feedback_trainer_id ON trainer_feedback(trainer_id);
CREATE INDEX IF NOT EXISTS idx_trainer_feedback_branch_id ON trainer_feedback(branch_id);
CREATE INDEX IF NOT EXISTS idx_trainer_feedback_feedback_date ON trainer_feedback(feedback_date);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE trainer_feedback ENABLE ROW LEVEL SECURITY;

-- Guides can view their own feedback
CREATE POLICY "Guides can view own feedback"
  ON trainer_feedback
  FOR SELECT
  USING (auth.uid() = guide_id);

-- Guides can create feedback for their training
CREATE POLICY "Guides can create feedback"
  ON trainer_feedback
  FOR INSERT
  WITH CHECK (
    auth.uid() = guide_id
    AND training_id IN (
      SELECT id FROM guide_training_records WHERE guide_id = auth.uid()
    )
  );

-- Admins/Trainers can view all feedback
CREATE POLICY "Admins can view all feedback"
  ON trainer_feedback
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('super_admin', 'ops_admin', 'trainer')
    )
  );

-- Trainers can view feedback for their trainings
CREATE POLICY "Trainers can view own feedback"
  ON trainer_feedback
  FOR SELECT
  USING (
    trainer_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM guide_training_records
      WHERE id = trainer_feedback.training_id
        AND trainer_id = auth.uid()
    )
  );

-- ============================================
-- TRIGGERS
-- ============================================
CREATE TRIGGER update_trainer_feedback_updated_at
  BEFORE UPDATE ON trainer_feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to calculate average feedback rating for trainer
CREATE OR REPLACE FUNCTION get_trainer_avg_rating(p_trainer_id UUID)
RETURNS DECIMAL(3, 2) AS $$
DECLARE
  v_avg_rating DECIMAL(3, 2);
BEGIN
  SELECT AVG(overall_rating)::DECIMAL(3, 2)
  INTO v_avg_rating
  FROM trainer_feedback
  WHERE trainer_id = p_trainer_id
    AND overall_rating IS NOT NULL;

  RETURN COALESCE(v_avg_rating, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE trainer_feedback IS 'Feedback from guides about training sessions and trainers';
COMMENT ON FUNCTION get_trainer_avg_rating IS 'Calculate average rating for a trainer';

