-- Migration: 054-training-attendance.sql
-- Description: Training attendance marking & session management
-- Created: 2025-01-23

-- ============================================
-- TRAINING SESSIONS (Admin creates)
-- ============================================
CREATE TABLE IF NOT EXISTS training_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES branches(id),
  
  -- Session Info
  title VARCHAR(200) NOT NULL,
  description TEXT,
  session_type VARCHAR(50) NOT NULL, -- 'sop', 'safety', 'drill', 'other'
  training_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  location VARCHAR(200),
  
  -- Module Link (optional - can link to existing module)
  module_id UUID REFERENCES guide_training_modules(id),
  
  -- Status
  status VARCHAR(20) DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed', 'cancelled'
  is_active BOOLEAN DEFAULT true,
  
  -- Created by
  created_by UUID NOT NULL REFERENCES users(id),
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_session_type CHECK (session_type IN ('sop', 'safety', 'drill', 'other')),
  CONSTRAINT valid_status CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled'))
);

-- ============================================
-- TRAINING ATTENDANCE
-- ============================================
CREATE TABLE IF NOT EXISTS training_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
  guide_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id),
  
  -- Attendance Status
  attendance_status VARCHAR(20) NOT NULL, -- 'present', 'absent', 'late', 'excused'
  arrived_at TIMESTAMPTZ, -- Actual arrival time
  left_at TIMESTAMPTZ, -- Actual departure time
  
  -- Notes
  notes TEXT,
  
  -- Marked by
  marked_by UUID REFERENCES users(id), -- Admin who marked attendance
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_attendance_status CHECK (attendance_status IN ('present', 'absent', 'late', 'excused')),
  UNIQUE(session_id, guide_id) -- One attendance record per guide per session
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_training_sessions_branch_id ON training_sessions(branch_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_training_date ON training_sessions(training_date);
CREATE INDEX IF NOT EXISTS idx_training_sessions_status ON training_sessions(status);
CREATE INDEX IF NOT EXISTS idx_training_attendance_session_id ON training_attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_training_attendance_guide_id ON training_attendance(guide_id);
CREATE INDEX IF NOT EXISTS idx_training_attendance_status ON training_attendance(attendance_status);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_attendance ENABLE ROW LEVEL SECURITY;

-- Admins can manage training sessions
CREATE POLICY "Admins can manage training sessions"
  ON training_sessions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'ops_admin')
      AND (
        users.role = 'super_admin'
        OR users.branch_id = training_sessions.branch_id
      )
    )
  );

-- Guides can view sessions in their branch
CREATE POLICY "Guides can view branch sessions"
  ON training_sessions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (
        users.role IN ('super_admin', 'ops_admin')
        OR (
          users.role = 'guide'
          AND users.branch_id = training_sessions.branch_id
        )
      )
    )
  );

-- Admins can manage attendance
CREATE POLICY "Admins can manage attendance"
  ON training_attendance
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'ops_admin')
      AND (
        users.role = 'super_admin'
        OR users.branch_id = training_attendance.branch_id
      )
    )
  );

-- Guides can view their own attendance
CREATE POLICY "Guides can view own attendance"
  ON training_attendance
  FOR SELECT
  USING (auth.uid() = guide_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at
CREATE TRIGGER update_training_sessions_updated_at
  BEFORE UPDATE ON training_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_training_attendance_updated_at
  BEFORE UPDATE ON training_attendance
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE training_sessions IS 'Training sessions created by admin (SOP update, safety drill, etc.)';
COMMENT ON TABLE training_attendance IS 'Attendance records for training sessions';
COMMENT ON COLUMN training_attendance.attendance_status IS 'Status: present, absent, late, excused';
