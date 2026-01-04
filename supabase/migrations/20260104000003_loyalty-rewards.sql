/**
 * Loyalty Rewards Table
 * CMS for managing loyalty program rewards catalog
 */

CREATE TABLE IF NOT EXISTS loyalty_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(50), -- 'voucher', 'discount', 'merchandise', 'experience'
  points_cost INT NOT NULL,
  value_in_rupiah INT,
  image_url TEXT,
  stock INT, -- null = unlimited
  valid_until TIMESTAMPTZ,
  terms JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_rewards_category ON loyalty_rewards(category);
CREATE INDEX IF NOT EXISTS idx_rewards_active ON loyalty_rewards(is_active);
CREATE INDEX IF NOT EXISTS idx_rewards_display_order ON loyalty_rewards(display_order);

-- RLS Policies
ALTER TABLE loyalty_rewards ENABLE ROW LEVEL SECURITY;

-- Public can read active rewards
CREATE POLICY "Public can read active rewards"
  ON loyalty_rewards FOR SELECT
  USING (is_active = true);

-- Admins can manage rewards
CREATE POLICY "Admins can manage rewards"
  ON loyalty_rewards FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin'));

-- Comments
COMMENT ON TABLE loyalty_rewards IS 'CMS table for managing loyalty program rewards catalog';
COMMENT ON COLUMN loyalty_rewards.stock IS 'Stock quantity, NULL means unlimited';
COMMENT ON COLUMN loyalty_rewards.terms IS 'JSON array of terms and conditions for the reward';

