-- Gift Vouchers Table
-- For partner gift voucher system

CREATE TABLE IF NOT EXISTS gift_vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES users(id),
  code VARCHAR(20) NOT NULL UNIQUE,
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'IDR',
  
  -- Recipient info
  recipient_name VARCHAR(255) NOT NULL,
  recipient_email VARCHAR(255),
  recipient_phone VARCHAR(20),
  
  -- Sender info
  sender_name VARCHAR(255) NOT NULL,
  message TEXT,
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'redeemed', 'expired')),
  
  -- Tracking
  expires_at TIMESTAMPTZ NOT NULL,
  redeemed_at TIMESTAMPTZ,
  redeemed_by UUID REFERENCES users(id),
  redeemed_booking_id UUID,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_gift_vouchers_partner ON gift_vouchers(partner_id);
CREATE INDEX IF NOT EXISTS idx_gift_vouchers_code ON gift_vouchers(code);
CREATE INDEX IF NOT EXISTS idx_gift_vouchers_status ON gift_vouchers(status);
CREATE INDEX IF NOT EXISTS idx_gift_vouchers_expires ON gift_vouchers(expires_at) WHERE status = 'active';

-- RLS Policies
ALTER TABLE gift_vouchers ENABLE ROW LEVEL SECURITY;

-- Partner can manage their own vouchers
CREATE POLICY gift_vouchers_partner_all ON gift_vouchers
  FOR ALL
  TO authenticated
  USING (partner_id = auth.uid())
  WITH CHECK (partner_id = auth.uid());

-- Public can view active vouchers by code (for redemption)
CREATE POLICY gift_vouchers_public_read ON gift_vouchers
  FOR SELECT
  TO authenticated
  USING (status = 'active');

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_gift_vouchers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER gift_vouchers_updated_at
  BEFORE UPDATE ON gift_vouchers
  FOR EACH ROW
  EXECUTE FUNCTION update_gift_vouchers_updated_at();

-- Function to check and expire vouchers (run via cron)
CREATE OR REPLACE FUNCTION expire_gift_vouchers()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE gift_vouchers
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'active' AND expires_at < NOW();
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

