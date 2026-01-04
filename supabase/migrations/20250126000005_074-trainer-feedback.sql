-- Migration: 074-trainer-feedback.sql
-- Description: Trainer Feedback (P3 Optional)
-- Created: 2025-01-26

-- ============================================
-- ENUMS
-- ============================================
DO $$ BEGIN
  CREATE TYPE feedback_rating AS ENUM ('excellent', 'good', 'needs_improvement');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- TRAINING FEEDBACK TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS training_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
  guide_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trainer_id UUID NOT NULL REFERENCES users(id),
  
  -- Feedback
  rating feedback_rating NOT NULL,
  comment TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(session_id, guide_id, trainer_id)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_training_feedback_session_id ON training_feedback(session_id);
CREATE INDEX IF NOT EXISTS idx_training_feedback_guide_id ON training_feedback(guide_id);
CREATE INDEX IF NOT EXISTS idx_training_feedback_trainer_id ON training_feedback(trainer_id);
CREATE INDEX IF NOT EXISTS idx_training_feedback_rating ON training_feedback(rating);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE training_feedback ENABLE ROW LEVEL SECURITY;

-- Trainers can view and create feedback for sessions they created
CREATE POLICY "Trainers can view own feedback"
  ON training_feedback
  FOR SELECT
  USING (
    trainer_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM training_sessions ts
      WHERE ts.id = training_feedback.session_id
        AND ts.created_by = auth.uid()
    )
  );

CREATE POLICY "Trainers can create feedback"
  ON training_feedback
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM training_sessions ts
      WHERE ts.id = training_feedback.session_id
        AND ts.created_by = auth.uid()
    )
    AND trainer_id = auth.uid()
  );

CREATE POLICY "Trainers can update own feedback"
  ON training_feedback
  FOR UPDATE
  USING (trainer_id = auth.uid())
  WITH CHECK (trainer_id = auth.uid());

-- Guides can view feedback about themselves
CREATE POLICY "Guides can view own feedback"
  ON training_feedback
  FOR SELECT
  USING (auth.uid() = guide_id);

-- Admins can view all feedback
CREATE POLICY "Admins can view all feedback"
  ON training_feedback
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
COMMENT ON TABLE training_feedback IS 'Feedback from trainer to guide after training session';

