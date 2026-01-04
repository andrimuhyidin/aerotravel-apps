-- Migration: 054-training-sessions-attendance.sql
-- Description: Training Sessions & Attendance Marking
-- Created: 2025-01-23

-- ============================================
-- TRAINING SESSIONS (Admin creates)
-- ============================================
CREATE TABLE IF NOT EXISTS training_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES branches(id),
  
  -- Session Info
  session_name VARCHAR(200) NOT NULL,
  session_type VARCHAR(50) NOT NULL, -- 'sop', 'safety', 'drill', 'other'
  description TEXT,
  
  -- Schedule
  session_date DATE NOT NULL,
  session_time TIME,
  duration_minutes INTEGER,
  
  -- Location
  location VARCHAR(200),
  
  -- Status
  status VARCHAR(20) DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed', 'cancelled'
  
  -- Created by
  created_by UUID NOT NULL REFERENCES users(id),
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TRAINING ATTENDANCE
-- ============================================
DO $$ BEGIN
  CREATE TYPE attendance_status AS ENUM (
    'present',
    'absent',
    'late'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS training_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
  guide_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id),
  
  -- Attendance
  status attendance_status NOT NULL,
  checked_in_at TIMESTAMPTZ,
  checked_in_by UUID REFERENCES users(id), -- Admin who marked attendance
  
  -- Notes
  notes TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(session_id, guide_id)
);

-- ============================================
-- TRAINING CERTIFICATES (PDF)
-- ============================================
CREATE TABLE IF NOT EXISTS training_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
  guide_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id),
  
  -- Certificate Info
  certificate_number VARCHAR(100) UNIQUE,
  certificate_pdf_url TEXT, -- URL to generated PDF
  
  -- Quiz Results (if applicable)
  quiz_attempt_id UUID REFERENCES guide_training_quiz_attempts(id),
  quiz_score INTEGER,
  quiz_passed BOOLEAN DEFAULT false,
  
  -- Status
  is_issued BOOLEAN DEFAULT false,
  issued_at TIMESTAMPTZ,
  issued_by UUID REFERENCES users(id),
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(session_id, guide_id)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_training_sessions_branch_id ON training_sessions(branch_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_date ON training_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_training_sessions_status ON training_sessions(status);
CREATE INDEX IF NOT EXISTS idx_training_attendance_session_id ON training_attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_training_attendance_guide_id ON training_attendance(guide_id);
CREATE INDEX IF NOT EXISTS idx_training_certificates_session_id ON training_certificates(session_id);
CREATE INDEX IF NOT EXISTS idx_training_certificates_guide_id ON training_certificates(guide_id);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_certificates ENABLE ROW LEVEL SECURITY;

-- Admins can manage sessions
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

-- Guides can view own attendance
CREATE POLICY "Guides can view own attendance"
  ON training_attendance
  FOR SELECT
  USING (auth.uid() = guide_id);

-- Guides can view own certificates
CREATE POLICY "Guides can view own certificates"
  ON training_certificates
  FOR SELECT
  USING (auth.uid() = guide_id);

-- Admins can manage certificates
CREATE POLICY "Admins can manage certificates"
  ON training_certificates
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'ops_admin')
      AND (
        users.role = 'super_admin'
        OR users.branch_id = training_certificates.branch_id
      )
    )
  );

-- ============================================
-- TRIGGERS
-- ============================================
CREATE TRIGGER update_training_sessions_updated_at
  BEFORE UPDATE ON training_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_training_attendance_updated_at
  BEFORE UPDATE ON training_attendance
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_training_certificates_updated_at
  BEFORE UPDATE ON training_certificates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE training_sessions IS 'Training sessions created by admin (SOP update, safety drill, etc.)';
COMMENT ON TABLE training_attendance IS 'Attendance records for training sessions';
COMMENT ON TABLE training_certificates IS 'PDF certificates generated for training completion';
COMMENT ON COLUMN training_attendance.status IS 'Attendance status: present, absent, late';
