-- Partner Custom Reports Table
-- For saving report templates

CREATE TABLE IF NOT EXISTS partner_custom_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  data_source VARCHAR(50) NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  
  -- Usage tracking
  last_run_at TIMESTAMPTZ,
  run_count INT DEFAULT 0,
  
  -- Scheduling (optional)
  schedule_cron VARCHAR(50),
  schedule_enabled BOOLEAN DEFAULT false,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_custom_reports_partner ON partner_custom_reports(partner_id);

-- RLS Policies
ALTER TABLE partner_custom_reports ENABLE ROW LEVEL SECURITY;

-- Partner can manage their own reports
CREATE POLICY custom_reports_partner_all ON partner_custom_reports
  FOR ALL
  TO authenticated
  USING (partner_id = auth.uid())
  WITH CHECK (partner_id = auth.uid());

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_custom_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER custom_reports_updated_at
  BEFORE UPDATE ON partner_custom_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_reports_updated_at();

