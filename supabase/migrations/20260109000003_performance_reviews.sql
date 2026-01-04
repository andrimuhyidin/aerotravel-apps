-- Performance Reviews Schema
-- Track employee performance evaluations

CREATE TABLE IF NOT EXISTS performance_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES users(id),
  review_period TEXT NOT NULL, -- 'Q1 2026', 'H1 2026', 'Annual 2026'
  review_type TEXT NOT NULL DEFAULT 'quarterly', -- 'quarterly', 'semi_annual', 'annual', 'probation'
  
  -- Reviewer info
  reviewer_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- Scores (1-5 scale)
  performance_score DECIMAL(3,2), -- Overall score
  communication_score DECIMAL(3,2),
  teamwork_score DECIMAL(3,2),
  initiative_score DECIMAL(3,2),
  reliability_score DECIMAL(3,2),
  
  -- Feedback
  strengths TEXT,
  areas_for_improvement TEXT,
  goals_for_next_period TEXT,
  achievements TEXT,
  reviewer_comments TEXT,
  
  -- Employee response
  employee_comments TEXT,
  employee_acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMPTZ,
  
  -- Status
  status TEXT DEFAULT 'draft', -- 'draft', 'submitted', 'acknowledged', 'finalized'
  
  review_date DATE NOT NULL,
  finalized_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance goals
CREATE TABLE IF NOT EXISTS performance_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES users(id),
  review_id UUID REFERENCES performance_reviews(id),
  goal_title TEXT NOT NULL,
  goal_description TEXT,
  target_metric TEXT,
  target_value TEXT,
  due_date DATE,
  progress INT DEFAULT 0, -- 0-100
  status TEXT DEFAULT 'in_progress', -- 'in_progress', 'completed', 'not_met', 'cancelled'
  completion_notes TEXT,
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance reviews
CREATE INDEX IF NOT EXISTS idx_performance_reviews_employee_id ON performance_reviews(employee_id);
CREATE INDEX IF NOT EXISTS idx_performance_reviews_reviewer_id ON performance_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_performance_reviews_period ON performance_reviews(review_period);
CREATE INDEX IF NOT EXISTS idx_performance_reviews_status ON performance_reviews(status);
CREATE INDEX IF NOT EXISTS idx_performance_goals_employee_id ON performance_goals(employee_id);
CREATE INDEX IF NOT EXISTS idx_performance_goals_review_id ON performance_goals(review_id);

-- Add constraints
ALTER TABLE performance_reviews ADD CONSTRAINT performance_reviews_status_check 
  CHECK (status IN ('draft', 'submitted', 'acknowledged', 'finalized'));

ALTER TABLE performance_goals ADD CONSTRAINT performance_goals_status_check 
  CHECK (status IN ('in_progress', 'completed', 'not_met', 'cancelled'));

-- RLS for performance reviews
ALTER TABLE performance_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage all reviews" ON performance_reviews
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role = 'super_admin'
    )
  );

CREATE POLICY "Manager can manage team reviews" ON performance_reviews
  FOR ALL
  TO authenticated
  USING (reviewer_id = auth.uid());

CREATE POLICY "Employee can view own reviews" ON performance_reviews
  FOR SELECT
  TO authenticated
  USING (employee_id = auth.uid());

ALTER TABLE performance_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage all goals" ON performance_goals
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('super_admin', 'ops_admin')
    )
  );

CREATE POLICY "Employee can view/update own goals" ON performance_goals
  FOR ALL
  TO authenticated
  USING (employee_id = auth.uid());

COMMENT ON TABLE performance_reviews IS 'Employee performance evaluations';
COMMENT ON TABLE performance_goals IS 'Individual performance goals and KPIs';

