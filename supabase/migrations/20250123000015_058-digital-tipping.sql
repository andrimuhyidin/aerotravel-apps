-- Migration: 058-digital-tipping.sql
-- Description: Digital tipping with QRIS payment
-- Created: 2025-01-23

-- ============================================
-- TIPPING REQUESTS
-- ============================================
CREATE TABLE IF NOT EXISTS tipping_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  guide_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id),
  
  -- Tipping Info
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'IDR',
  message TEXT, -- Optional message from guest
  
  -- Payment Method
  payment_method VARCHAR(20) DEFAULT 'qris', -- 'qris', 'cash', 'other'
  
  -- QRIS Payment
  qris_payment_id VARCHAR(100), -- External payment ID (Midtrans/Xendit)
  qris_qr_code TEXT, -- QR code data/URL
  qris_expires_at TIMESTAMPTZ,
  
  -- Payment Status
  payment_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'paid', 'expired', 'cancelled', 'failed'
  paid_at TIMESTAMPTZ,
  
  -- Guest Info (optional, for tracking)
  guest_name VARCHAR(200),
  guest_phone VARCHAR(20),
  guest_email VARCHAR(200),
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_payment_method CHECK (payment_method IN ('qris', 'cash', 'other')),
  CONSTRAINT valid_payment_status CHECK (payment_status IN ('pending', 'paid', 'expired', 'cancelled', 'failed')),
  CONSTRAINT valid_amount CHECK (amount > 0)
);

-- ============================================
-- TIPPING TRANSACTIONS (Link to Wallet)
-- ============================================
CREATE TABLE IF NOT EXISTS tipping_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipping_request_id UUID NOT NULL REFERENCES tipping_requests(id) ON DELETE CASCADE,
  wallet_id UUID REFERENCES guide_wallets(id),
  
  -- Transaction Info
  amount DECIMAL(10, 2) NOT NULL,
  transaction_type VARCHAR(20) DEFAULT 'tipping', -- 'tipping', 'refund'
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processed', 'failed'
  processed_at TIMESTAMPTZ,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_transaction_type CHECK (transaction_type IN ('tipping', 'refund')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'processed', 'failed'))
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_tipping_requests_trip_id ON tipping_requests(trip_id);
CREATE INDEX IF NOT EXISTS idx_tipping_requests_guide_id ON tipping_requests(guide_id);
CREATE INDEX IF NOT EXISTS idx_tipping_requests_status ON tipping_requests(payment_status);
CREATE INDEX IF NOT EXISTS idx_tipping_requests_qris_payment_id ON tipping_requests(qris_payment_id);
CREATE INDEX IF NOT EXISTS idx_tipping_transactions_request_id ON tipping_transactions(tipping_request_id);
CREATE INDEX IF NOT EXISTS idx_tipping_transactions_wallet_id ON tipping_transactions(wallet_id);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE tipping_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipping_transactions ENABLE ROW LEVEL SECURITY;

-- Guides can view their own tipping requests
CREATE POLICY "Guides can view own tipping requests"
  ON tipping_requests
  FOR SELECT
  USING (auth.uid() = guide_id);

-- Anyone can create tipping request (public endpoint for guests)
CREATE POLICY "Anyone can create tipping request"
  ON tipping_requests
  FOR INSERT
  WITH CHECK (true);

-- Guides can update their own requests (status updates)
CREATE POLICY "Guides can update own requests"
  ON tipping_requests
  FOR UPDATE
  USING (auth.uid() = guide_id);

-- Guides can view their own transactions
CREATE POLICY "Guides can view own transactions"
  ON tipping_transactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tipping_requests
      WHERE tipping_requests.id = tipping_transactions.tipping_request_id
      AND tipping_requests.guide_id = auth.uid()
    )
  );

-- Admins can view all
CREATE POLICY "Admins can view all tipping"
  ON tipping_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'ops_admin')
      AND (
        users.role = 'super_admin'
        OR users.branch_id = tipping_requests.branch_id
      )
    )
  );

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to process tipping payment (link to wallet)
CREATE OR REPLACE FUNCTION process_tipping_payment(
  p_tipping_request_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_tipping_request RECORD;
  v_wallet_id UUID;
  v_transaction_id UUID;
BEGIN
  -- Get tipping request
  SELECT * INTO v_tipping_request
  FROM tipping_requests
  WHERE id = p_tipping_request_id
    AND payment_status = 'paid';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tipping request not found or not paid';
  END IF;
  
  -- Get or create wallet
  SELECT id INTO v_wallet_id
  FROM guide_wallets
  WHERE guide_id = v_tipping_request.guide_id;
  
  IF v_wallet_id IS NULL THEN
    -- Create wallet if doesn't exist
    INSERT INTO guide_wallets (guide_id, balance, created_at, updated_at)
    VALUES (v_tipping_request.guide_id, 0, NOW(), NOW())
    RETURNING id INTO v_wallet_id;
  END IF;
  
  -- Create wallet transaction
  INSERT INTO guide_wallet_transactions (
    wallet_id,
    transaction_type,
    amount,
    balance_before,
    balance_after,
    reference_type,
    reference_id,
    status,
    description,
    created_at
  )
  SELECT 
    v_wallet_id,
    'earning',
    v_tipping_request.amount,
    balance,
    balance + v_tipping_request.amount,
    'tipping',
    p_tipping_request_id,
    'approved',
    'Tipping dari trip ' || (SELECT trip_code FROM trips WHERE id = v_tipping_request.trip_id),
    NOW()
  FROM guide_wallets
  WHERE id = v_wallet_id
  RETURNING id INTO v_transaction_id;
  
  -- Create tipping transaction record
  INSERT INTO tipping_transactions (
    tipping_request_id,
    wallet_id,
    amount,
    transaction_type,
    status,
    processed_at,
    created_at
  ) VALUES (
    p_tipping_request_id,
    v_wallet_id,
    v_tipping_request.amount,
    'tipping',
    'processed',
    NOW(),
    NOW()
  );
  
  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at
CREATE TRIGGER update_tipping_requests_updated_at
  BEFORE UPDATE ON tipping_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-process payment when status changes to 'paid'
CREATE OR REPLACE FUNCTION auto_process_tipping_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- If payment status changed to 'paid', process payment
  IF NEW.payment_status = 'paid' AND OLD.payment_status != 'paid' THEN
    -- Check if already processed
    IF NOT EXISTS (
      SELECT 1 FROM tipping_transactions
      WHERE tipping_request_id = NEW.id
      AND status = 'processed'
    ) THEN
      PERFORM process_tipping_payment(NEW.id);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_process_tipping_payment_trigger
  AFTER UPDATE ON tipping_requests
  FOR EACH ROW
  WHEN (NEW.payment_status = 'paid' AND OLD.payment_status != 'paid')
  EXECUTE FUNCTION auto_process_tipping_payment();

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE tipping_requests IS 'Digital tipping requests from guests (QRIS payment)';
COMMENT ON TABLE tipping_transactions IS 'Tipping transactions linked to guide wallet';
COMMENT ON FUNCTION process_tipping_payment IS 'Process paid tipping request and add to guide wallet';
