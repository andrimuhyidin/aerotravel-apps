-- Partner Price Alerts Table
-- For tracking price alert subscriptions

CREATE TABLE IF NOT EXISTS partner_price_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES users(id),
  package_id UUID NOT NULL REFERENCES packages(id),
  target_price DECIMAL(12,2) NOT NULL,
  alert_type VARCHAR(20) NOT NULL DEFAULT 'below'
    CHECK (alert_type IN ('below', 'above')),
  is_active BOOLEAN DEFAULT true,
  triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_price_alerts_partner ON partner_price_alerts(partner_id);
CREATE INDEX IF NOT EXISTS idx_price_alerts_package ON partner_price_alerts(package_id);
CREATE INDEX IF NOT EXISTS idx_price_alerts_active ON partner_price_alerts(is_active) WHERE is_active = true;

-- RLS Policies
ALTER TABLE partner_price_alerts ENABLE ROW LEVEL SECURITY;

-- Partner can manage their own alerts
CREATE POLICY price_alerts_partner_all ON partner_price_alerts
  FOR ALL
  TO authenticated
  USING (partner_id = auth.uid())
  WITH CHECK (partner_id = auth.uid());

-- Prevent duplicate active alerts for same package
CREATE UNIQUE INDEX IF NOT EXISTS idx_price_alerts_unique_active 
  ON partner_price_alerts(partner_id, package_id) 
  WHERE is_active = true AND triggered_at IS NULL;

