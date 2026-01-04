-- Loyalty Adjustments Schema
-- Track manual loyalty point adjustments

-- Add loyalty columns to users table if not exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS loyalty_points INT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS loyalty_tier TEXT DEFAULT 'bronze';
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_bookings INT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_spent DECIMAL(15,2) DEFAULT 0;

-- Create loyalty adjustments table
CREATE TABLE IF NOT EXISTS loyalty_adjustments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES users(id),
  points_change INT NOT NULL, -- positive for add, negative for deduct
  reason TEXT NOT NULL,
  adjustment_type TEXT NOT NULL, -- 'manual', 'booking', 'referral', 'promo', 'expiry', 'redemption'
  reference_id UUID, -- optional reference to booking, promo, etc
  reference_type TEXT, -- 'booking', 'promo', 'campaign', etc
  adjusted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for loyalty adjustments
CREATE INDEX IF NOT EXISTS idx_loyalty_adjustments_customer_id ON loyalty_adjustments(customer_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_adjustments_type ON loyalty_adjustments(adjustment_type);
CREATE INDEX IF NOT EXISTS idx_loyalty_adjustments_created_at ON loyalty_adjustments(created_at);

-- Add constraint for adjustment_type
ALTER TABLE loyalty_adjustments ADD CONSTRAINT loyalty_adjustments_type_check 
  CHECK (adjustment_type IN ('manual', 'booking', 'referral', 'promo', 'expiry', 'redemption'));

-- RLS for loyalty adjustments
ALTER TABLE loyalty_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view loyalty adjustments" ON loyalty_adjustments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('super_admin', 'marketing', 'ops_admin')
    )
  );

CREATE POLICY "Admin can create loyalty adjustments" ON loyalty_adjustments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('super_admin', 'marketing')
    )
  );

-- Trigger to update user loyalty_points when adjustment is made
CREATE OR REPLACE FUNCTION update_user_loyalty_points()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users 
  SET loyalty_points = COALESCE(loyalty_points, 0) + NEW.points_change
  WHERE id = NEW.customer_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_loyalty_points ON loyalty_adjustments;
CREATE TRIGGER trigger_update_loyalty_points
  AFTER INSERT ON loyalty_adjustments
  FOR EACH ROW
  EXECUTE FUNCTION update_user_loyalty_points();

COMMENT ON TABLE loyalty_adjustments IS 'Track all loyalty point adjustments for customers';

