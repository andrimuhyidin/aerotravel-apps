-- HR Attendance Schema
-- Track employee attendance

CREATE TABLE IF NOT EXISTS employee_attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES users(id),
  attendance_date DATE NOT NULL,
  check_in_time TIMESTAMPTZ,
  check_out_time TIMESTAMPTZ,
  status TEXT DEFAULT 'present', -- 'present', 'absent', 'late', 'leave', 'sick', 'half_day', 'remote'
  late_minutes INT DEFAULT 0,
  overtime_minutes INT DEFAULT 0,
  work_hours DECIMAL(4,2) DEFAULT 0,
  notes TEXT,
  location TEXT, -- 'office', 'field', 'remote', etc.
  check_in_location JSONB, -- { lat, lng, address }
  check_out_location JSONB,
  recorded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, attendance_date)
);

-- Indexes for attendance
CREATE INDEX IF NOT EXISTS idx_employee_attendance_employee_id ON employee_attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_attendance_date ON employee_attendance(attendance_date);
CREATE INDEX IF NOT EXISTS idx_employee_attendance_status ON employee_attendance(status);

-- Add constraint for status
ALTER TABLE employee_attendance ADD CONSTRAINT employee_attendance_status_check 
  CHECK (status IN ('present', 'absent', 'late', 'leave', 'sick', 'half_day', 'remote'));

-- RLS for attendance
ALTER TABLE employee_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage attendance" ON employee_attendance
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('super_admin', 'ops_admin')
    )
  );

CREATE POLICY "Employee can view own attendance" ON employee_attendance
  FOR SELECT
  TO authenticated
  USING (employee_id = auth.uid());

COMMENT ON TABLE employee_attendance IS 'Track daily employee attendance';

