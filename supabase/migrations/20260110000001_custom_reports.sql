-- Custom Reports Schema
-- User-defined reports with saved configurations

CREATE TABLE IF NOT EXISTS custom_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_name TEXT NOT NULL,
  description TEXT,
  report_type TEXT NOT NULL, -- 'booking_analysis', 'revenue_report', 'customer_report', 'operations_report', 'custom_query'
  
  -- Report configuration
  data_source TEXT NOT NULL, -- 'bookings', 'users', 'payments', 'trips', etc.
  columns JSONB NOT NULL, -- Array of column definitions
  filters JSONB, -- Filter conditions
  grouping JSONB, -- Group by configuration
  sorting JSONB, -- Sort configuration
  aggregations JSONB, -- Sum, count, avg, etc.
  
  -- Visualization
  chart_type TEXT, -- 'table', 'bar', 'line', 'pie', 'area', 'scatter'
  chart_config JSONB, -- Chart-specific configuration
  
  -- Scheduling
  schedule_enabled BOOLEAN DEFAULT false,
  schedule_cron TEXT, -- Cron expression
  schedule_recipients TEXT[], -- Email addresses
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  
  -- Sharing
  is_public BOOLEAN DEFAULT false, -- Visible to all admins
  shared_with UUID[], -- Specific users
  
  -- Audit
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Saved report runs
CREATE TABLE IF NOT EXISTS report_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES custom_reports(id) ON DELETE CASCADE,
  run_type TEXT DEFAULT 'manual', -- 'manual', 'scheduled', 'api'
  status TEXT DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
  filters_used JSONB, -- Filters applied for this run
  result_count INT,
  result_file_url TEXT, -- S3/storage URL for large results
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  triggered_by UUID REFERENCES auth.users(id)
);

-- Report subscriptions
CREATE TABLE IF NOT EXISTS report_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES custom_reports(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  frequency TEXT NOT NULL DEFAULT 'weekly', -- 'daily', 'weekly', 'monthly'
  delivery_day INT, -- Day of week (0-6) or day of month (1-31)
  delivery_time TIME DEFAULT '09:00',
  format TEXT DEFAULT 'excel', -- 'excel', 'csv', 'pdf'
  is_active BOOLEAN DEFAULT true,
  last_sent_at TIMESTAMPTZ,
  next_send_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for custom reports
CREATE INDEX IF NOT EXISTS idx_custom_reports_created_by ON custom_reports(created_by);
CREATE INDEX IF NOT EXISTS idx_custom_reports_type ON custom_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_custom_reports_is_public ON custom_reports(is_public);
CREATE INDEX IF NOT EXISTS idx_report_runs_report_id ON report_runs(report_id);
CREATE INDEX IF NOT EXISTS idx_report_runs_status ON report_runs(status);
CREATE INDEX IF NOT EXISTS idx_report_subscriptions_user_id ON report_subscriptions(user_id);

-- RLS for custom reports
ALTER TABLE custom_reports ENABLE ROW LEVEL SECURITY;

-- Owners can manage their reports
CREATE POLICY "Users can manage own reports" ON custom_reports
  FOR ALL
  TO authenticated
  USING (created_by = auth.uid());

-- Users can view public reports
CREATE POLICY "Users can view public reports" ON custom_reports
  FOR SELECT
  TO authenticated
  USING (
    is_public = true 
    OR auth.uid() = ANY(shared_with)
    OR created_by = auth.uid()
  );

ALTER TABLE report_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view report runs" ON report_runs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM custom_reports cr
      WHERE cr.id = report_runs.report_id
      AND (cr.created_by = auth.uid() OR cr.is_public = true OR auth.uid() = ANY(cr.shared_with))
    )
  );

ALTER TABLE report_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own subscriptions" ON report_subscriptions
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

COMMENT ON TABLE custom_reports IS 'User-defined reports with saved configurations';
COMMENT ON TABLE report_runs IS 'Track report execution history';
COMMENT ON TABLE report_subscriptions IS 'User subscriptions to scheduled reports';

