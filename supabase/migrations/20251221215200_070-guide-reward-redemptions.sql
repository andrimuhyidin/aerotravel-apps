-- Migration: 070-guide-reward-redemptions.sql
-- Description: Create reward redemptions table for tracking reward claims
-- Created: 2025-12-21
-- Reference: Guide Reward System Comprehensive Implementation

BEGIN;

-- ============================================
-- REWARD REDEMPTIONS
-- ============================================

-- Create ENUM for redemption status
DO $$ BEGIN
  CREATE TYPE redemption_status AS ENUM (
    'pending',
    'processing',
    'completed',
    'cancelled',
    'failed'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Guide Reward Redemptions
CREATE TABLE IF NOT EXISTS guide_reward_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  catalog_id UUID NOT NULL REFERENCES guide_reward_catalog(id) ON DELETE RESTRICT,
  
  -- Redemption Details
  points_used INTEGER NOT NULL CHECK (points_used > 0),
  status redemption_status NOT NULL DEFAULT 'pending',
  
  -- Reward Delivery
  voucher_code VARCHAR(100), -- Generated voucher code
  cashback_transaction_id UUID REFERENCES guide_wallet_transactions(id), -- FK if cashback
  
  -- Merchandise Delivery
  delivery_info JSONB, -- { address, phone, notes, tracking_number }
  
  -- Timestamps
  redeemed_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  
  -- Notes
  notes TEXT, -- Admin notes
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_guide_reward_redemptions_guide_id 
  ON guide_reward_redemptions(guide_id);
  
CREATE INDEX IF NOT EXISTS idx_guide_reward_redemptions_catalog_id 
  ON guide_reward_redemptions(catalog_id);
  
CREATE INDEX IF NOT EXISTS idx_guide_reward_redemptions_status 
  ON guide_reward_redemptions(status);
  
CREATE INDEX IF NOT EXISTS idx_guide_reward_redemptions_redeemed_at 
  ON guide_reward_redemptions(redeemed_at DESC);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_guide_reward_redemptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to generate voucher code
CREATE OR REPLACE FUNCTION generate_voucher_code(
  p_template VARCHAR(100)
)
RETURNS VARCHAR(100) AS $$
DECLARE
  v_code VARCHAR(100);
  v_random VARCHAR(10);
BEGIN
  -- Generate random alphanumeric code (8 characters)
  v_random := UPPER(
    SUBSTRING(
      MD5(RANDOM()::TEXT || NOW()::TEXT) 
      FROM 1 FOR 8
    )
  );
  
  -- Replace {CODE} in template
  v_code := REPLACE(p_template, '{CODE}', v_random);
  
  RETURN v_code;
END;
$$ LANGUAGE plpgsql;

-- Function to process redemption
CREATE OR REPLACE FUNCTION process_redemption(
  p_redemption_id UUID,
  p_status redemption_status,
  p_voucher_code VARCHAR(100) DEFAULT NULL,
  p_cashback_transaction_id UUID DEFAULT NULL,
  p_delivery_info JSONB DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_redemption RECORD;
  v_catalog RECORD;
BEGIN
  -- Get redemption details
  SELECT * INTO v_redemption
  FROM guide_reward_redemptions
  WHERE id = p_redemption_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Redemption not found';
  END IF;
  
  -- Get catalog details
  SELECT * INTO v_catalog
  FROM guide_reward_catalog
  WHERE id = v_redemption.catalog_id;
  
  -- Update redemption
  UPDATE guide_reward_redemptions
  SET
    status = p_status,
    voucher_code = COALESCE(p_voucher_code, voucher_code),
    cashback_transaction_id = COALESCE(p_cashback_transaction_id, cashback_transaction_id),
    delivery_info = COALESCE(p_delivery_info, delivery_info),
    notes = COALESCE(p_notes, notes),
    completed_at = CASE WHEN p_status = 'completed' THEN NOW() ELSE completed_at END,
    cancelled_at = CASE WHEN p_status = 'cancelled' THEN NOW() ELSE cancelled_at END,
    updated_at = NOW()
  WHERE id = p_redemption_id;
  
  -- If completed and merchandise, decrement stock
  IF p_status = 'completed' AND v_catalog.reward_type = 'merchandise' AND v_catalog.stock_quantity IS NOT NULL THEN
    UPDATE guide_reward_catalog
    SET stock_quantity = stock_quantity - 1
    WHERE id = v_catalog.id;
  END IF;
  
  -- If cancelled/failed and pending, refund points
  IF p_status IN ('cancelled', 'failed') AND v_redemption.status = 'pending' THEN
    -- Refund points
    PERFORM award_reward_points(
      v_redemption.guide_id,
      v_redemption.points_used,
      'refund'::reward_source_type,
      p_redemption_id,
      'Refund for cancelled redemption: ' || v_catalog.title,
      '{"redemption_id": "' || p_redemption_id || '"}'::jsonb
    );
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGERS
-- ============================================
CREATE TRIGGER update_guide_reward_redemptions_updated_at
  BEFORE UPDATE ON guide_reward_redemptions
  FOR EACH ROW
  EXECUTE FUNCTION update_guide_reward_redemptions_updated_at();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE guide_reward_redemptions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Guides can view their own redemptions
CREATE POLICY "guide_reward_redemptions_select_own" ON guide_reward_redemptions
  FOR SELECT
  USING (guide_id = auth.uid());

-- RLS Policy: Admins can view all redemptions
CREATE POLICY "guide_reward_redemptions_select_admin" ON guide_reward_redemptions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'ops_admin', 'finance_manager')
    )
  );

-- RLS Policy: Guides can create their own redemptions
CREATE POLICY "guide_reward_redemptions_insert_own" ON guide_reward_redemptions
  FOR INSERT
  WITH CHECK (guide_id = auth.uid());

-- RLS Policy: Admins can manage all redemptions
CREATE POLICY "guide_reward_redemptions_manage_admin" ON guide_reward_redemptions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'ops_admin', 'finance_manager')
    )
  );

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE guide_reward_redemptions IS 'History of reward redemptions by guides';
COMMENT ON FUNCTION generate_voucher_code IS 'Generate unique voucher code from template';
COMMENT ON FUNCTION process_redemption IS 'Process redemption status update and handle stock/refunds';

COMMIT;

