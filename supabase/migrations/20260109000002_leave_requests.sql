-- Leave Requests Schema
-- Track employee leave/cuti requests

CREATE TABLE IF NOT EXISTS leave_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES users(id),
  leave_type TEXT NOT NULL, -- 'annual', 'sick', 'emergency', 'unpaid', 'maternity', 'paternity'
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_count INT NOT NULL,
  reason TEXT,
  attachment_url TEXT, -- For sick leave certificate, etc.
  
  -- Status tracking
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'cancelled'
  
  -- Approval workflow
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  
  -- For cancellation
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leave balances per employee per year
CREATE TABLE IF NOT EXISTS leave_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES users(id),
  year INT NOT NULL,
  leave_type TEXT NOT NULL,
  total_days INT NOT NULL DEFAULT 12,
  used_days INT NOT NULL DEFAULT 0,
  remaining_days INT NOT NULL DEFAULT 12,
  carried_over INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, year, leave_type)
);

-- Indexes for leave requests
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee_id ON leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_dates ON leave_requests(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_leave_balances_employee_id ON leave_balances(employee_id);

-- Add constraints
ALTER TABLE leave_requests ADD CONSTRAINT leave_requests_status_check 
  CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled'));

ALTER TABLE leave_requests ADD CONSTRAINT leave_requests_type_check 
  CHECK (leave_type IN ('annual', 'sick', 'emergency', 'unpaid', 'maternity', 'paternity'));

-- RLS for leave requests
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage leave requests" ON leave_requests
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('super_admin', 'ops_admin')
    )
  );

CREATE POLICY "Employee can manage own leave" ON leave_requests
  FOR ALL
  TO authenticated
  USING (employee_id = auth.uid());

ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage leave balances" ON leave_balances
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('super_admin', 'ops_admin')
    )
  );

CREATE POLICY "Employee can view own balance" ON leave_balances
  FOR SELECT
  TO authenticated
  USING (employee_id = auth.uid());

COMMENT ON TABLE leave_requests IS 'Employee leave/cuti requests';
COMMENT ON TABLE leave_balances IS 'Annual leave balance tracking per employee';

