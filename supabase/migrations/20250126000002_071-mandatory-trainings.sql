-- Migration: 071-mandatory-trainings.sql
-- Description: Mandatory Training Schedule & Compliance Tracking
-- Created: 2025-01-26

-- ============================================
-- ENUMS
-- ============================================
DO $$ BEGIN
  CREATE TYPE training_type AS ENUM ('sop', 'safety', 'drill', 'chse', 'first_aid', 'other');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE training_frequency AS ENUM ('monthly', 'quarterly', 'yearly');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE assignment_status AS ENUM ('pending', 'completed', 'overdue');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- MANDATORY TRAININGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS mandatory_trainings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES branches(id),
  
  -- Training Details
  training_type training_type NOT NULL,
  frequency training_frequency NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Created By
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- GUIDE MANDATORY TRAINING ASSIGNMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS guide_mandatory_training_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandatory_training_id UUID NOT NULL REFERENCES mandatory_trainings(id) ON DELETE CASCADE,
  guide_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Due Date & Completion
  due_date DATE NOT NULL,
  completed_at TIMESTAMPTZ,
  status assignment_status DEFAULT 'pending',
  
  -- Reminder Tracking
  last_reminder_sent_at TIMESTAMPTZ,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(mandatory_training_id, guide_id, due_date)
);

-- ============================================
-- FUNCTION: Check Training Compliance
-- ============================================
CREATE OR REPLACE FUNCTION check_training_compliance(p_guide_id UUID)
RETURNS TABLE (
  total_assignments INTEGER,
  completed_count INTEGER,
  pending_count INTEGER,
  overdue_count INTEGER,
  compliance_percentage DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  WITH stats AS (
    SELECT 
      COUNT(*)::INTEGER AS total,
      COUNT(*) FILTER (WHERE status = 'completed')::INTEGER AS completed,
      COUNT(*) FILTER (WHERE status = 'pending')::INTEGER AS pending,
      COUNT(*) FILTER (WHERE status = 'overdue')::INTEGER AS overdue
    FROM guide_mandatory_training_assignments
    WHERE guide_id = p_guide_id
  )
  SELECT 
    s.total,
    s.completed,
    s.pending,
    s.overdue,
    CASE 
      WHEN s.total > 0 THEN ROUND((s.completed::DECIMAL / s.total) * 100, 2)
      ELSE 100.00
    END AS compliance_percentage
  FROM stats s;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Get Overdue Trainings
-- ============================================
CREATE OR REPLACE FUNCTION get_overdue_trainings()
RETURNS TABLE (
  assignment_id UUID,
  guide_id UUID,
  guide_name TEXT,
  training_id UUID,
  training_title TEXT,
  training_type training_type,
  due_date DATE,
  days_overdue INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    gta.id AS assignment_id,
    gta.guide_id,
    CONCAT(u.first_name, ' ', u.last_name) AS guide_name,
    mt.id AS training_id,
    mt.title AS training_title,
    mt.training_type,
    gta.due_date,
    (CURRENT_DATE - gta.due_date)::INTEGER AS days_overdue
  FROM guide_mandatory_training_assignments gta
  JOIN mandatory_trainings mt ON mt.id = gta.mandatory_training_id
  JOIN users u ON u.id = gta.guide_id
  WHERE gta.status = 'pending'
    AND gta.due_date < CURRENT_DATE
    AND mt.is_active = true
  ORDER BY gta.due_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Update Assignment Status (Auto)
-- ============================================
CREATE OR REPLACE FUNCTION update_assignment_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update status based on due_date
  IF NEW.completed_at IS NOT NULL THEN
    NEW.status := 'completed';
  ELSIF NEW.due_date < CURRENT_DATE AND NEW.status = 'pending' THEN
    NEW.status := 'overdue';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_assignment_status
  BEFORE INSERT OR UPDATE ON guide_mandatory_training_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_assignment_status();

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_mandatory_trainings_branch_id ON mandatory_trainings(branch_id);
CREATE INDEX IF NOT EXISTS idx_mandatory_trainings_is_active ON mandatory_trainings(is_active);
CREATE INDEX IF NOT EXISTS idx_mandatory_trainings_training_type ON mandatory_trainings(training_type);

CREATE INDEX IF NOT EXISTS idx_assignments_guide_id ON guide_mandatory_training_assignments(guide_id);
CREATE INDEX IF NOT EXISTS idx_assignments_training_id ON guide_mandatory_training_assignments(mandatory_training_id);
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON guide_mandatory_training_assignments(due_date);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON guide_mandatory_training_assignments(status);
CREATE INDEX IF NOT EXISTS idx_assignments_overdue ON guide_mandatory_training_assignments(guide_id, status, due_date) WHERE status = 'overdue';

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE mandatory_trainings ENABLE ROW LEVEL SECURITY;
ALTER TABLE guide_mandatory_training_assignments ENABLE ROW LEVEL SECURITY;

-- Admins can view and manage mandatory trainings
CREATE POLICY "Admins can view mandatory trainings"
  ON mandatory_trainings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
        AND role IN ('super_admin', 'ops_admin')
    )
  );

CREATE POLICY "Admins can manage mandatory trainings"
  ON mandatory_trainings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
        AND role IN ('super_admin', 'ops_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
        AND role IN ('super_admin', 'ops_admin')
    )
  );

-- Guides can view their own assignments
CREATE POLICY "Guides can view own assignments"
  ON guide_mandatory_training_assignments
  FOR SELECT
  USING (auth.uid() = guide_id);

-- Admins can view all assignments
CREATE POLICY "Admins can view all assignments"
  ON guide_mandatory_training_assignments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
        AND role IN ('super_admin', 'ops_admin')
    )
  );

-- System can insert/update assignments (via service role or admin)
CREATE POLICY "System can manage assignments"
  ON guide_mandatory_training_assignments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
        AND role IN ('super_admin', 'ops_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
        AND role IN ('super_admin', 'ops_admin')
    )
  );

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE mandatory_trainings IS 'Mandatory training requirements per branch';
COMMENT ON TABLE guide_mandatory_training_assignments IS 'Individual guide assignments for mandatory trainings';
COMMENT ON FUNCTION check_training_compliance IS 'Calculate training compliance percentage for a guide';
COMMENT ON FUNCTION get_overdue_trainings IS 'Get all overdue mandatory training assignments';

