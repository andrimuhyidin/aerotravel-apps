-- Migration: 068-guide-reward-points.sql
-- Description: Create reward points system tables for guide rewards
-- Created: 2025-12-21
-- Reference: Guide Reward System Comprehensive Implementation

BEGIN;

-- ============================================
-- REWARD POINTS SYSTEM
-- ============================================

-- Create ENUM for transaction types
DO $$ BEGIN
  CREATE TYPE reward_transaction_type AS ENUM (
    'earn',
    'redeem',
    'expire',
    'adjustment',
    'refund'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create ENUM for source types
DO $$ BEGIN
  CREATE TYPE reward_source_type AS ENUM (
    'challenge',
    'badge',
    'performance',
    'level_up',
    'milestone',
    'special',
    'manual'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Guide Reward Points (Balance Table)
CREATE TABLE IF NOT EXISTS guide_reward_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Balance
  balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
  lifetime_earned INTEGER NOT NULL DEFAULT 0 CHECK (lifetime_earned >= 0),
  lifetime_redeemed INTEGER NOT NULL DEFAULT 0 CHECK (lifetime_redeemed >= 0),
  expired_points INTEGER NOT NULL DEFAULT 0 CHECK (expired_points >= 0),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(guide_id)
);

-- Guide Reward Transactions (History)
CREATE TABLE IF NOT EXISTS guide_reward_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Transaction Details
  transaction_type reward_transaction_type NOT NULL,
  points INTEGER NOT NULL, -- Positive for earn, negative for redeem
  
  -- Source Information
  source_type reward_source_type NOT NULL,
  source_id UUID, -- Reference to source (challenge_id, badge_id, etc.)
  description TEXT,
  
  -- Expiration
  expires_at TIMESTAMPTZ, -- Points expiration date (12 months from earn)
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb, -- Additional data
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_guide_reward_points_guide_id 
  ON guide_reward_points(guide_id);
  
CREATE INDEX IF NOT EXISTS idx_guide_reward_transactions_guide_id 
  ON guide_reward_transactions(guide_id);
  
CREATE INDEX IF NOT EXISTS idx_guide_reward_transactions_created_at 
  ON guide_reward_transactions(created_at DESC);
  
CREATE INDEX IF NOT EXISTS idx_guide_reward_transactions_source 
  ON guide_reward_transactions(source_type, source_id);
  
CREATE INDEX IF NOT EXISTS idx_guide_reward_transactions_expires_at 
  ON guide_reward_transactions(expires_at) 
  WHERE expires_at IS NOT NULL;

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_guide_reward_points_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to award points
CREATE OR REPLACE FUNCTION award_reward_points(
  p_guide_id UUID,
  p_points INTEGER,
  p_source_type reward_source_type,
  p_source_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_transaction_id UUID;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Validate points
  IF p_points <= 0 THEN
    RAISE EXCEPTION 'Points must be positive';
  END IF;
  
  -- Calculate expiration (12 months from now)
  v_expires_at := NOW() + INTERVAL '12 months';
  
  -- Insert transaction
  INSERT INTO guide_reward_transactions (
    guide_id,
    transaction_type,
    points,
    source_type,
    source_id,
    description,
    expires_at,
    metadata
  ) VALUES (
    p_guide_id,
    'earn',
    p_points,
    p_source_type,
    p_source_id,
    p_description,
    v_expires_at,
    p_metadata
  ) RETURNING id INTO v_transaction_id;
  
  -- Update or insert balance
  INSERT INTO guide_reward_points (
    guide_id,
    balance,
    lifetime_earned
  ) VALUES (
    p_guide_id,
    p_points,
    p_points
  )
  ON CONFLICT (guide_id) DO UPDATE SET
    balance = guide_reward_points.balance + p_points,
    lifetime_earned = guide_reward_points.lifetime_earned + p_points,
    updated_at = NOW();
  
  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to redeem points
CREATE OR REPLACE FUNCTION redeem_reward_points(
  p_guide_id UUID,
  p_points INTEGER,
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_transaction_id UUID;
  v_current_balance INTEGER;
BEGIN
  -- Validate points
  IF p_points <= 0 THEN
    RAISE EXCEPTION 'Points must be positive';
  END IF;
  
  -- Get current balance
  SELECT balance INTO v_current_balance
  FROM guide_reward_points
  WHERE guide_id = p_guide_id;
  
  -- Check sufficient balance
  IF v_current_balance IS NULL OR v_current_balance < p_points THEN
    RAISE EXCEPTION 'Insufficient points balance';
  END IF;
  
  -- Insert transaction (negative points)
  INSERT INTO guide_reward_transactions (
    guide_id,
    transaction_type,
    points,
    source_type,
    source_id,
    description,
    metadata
  ) VALUES (
    p_guide_id,
    'redeem',
    -p_points,
    'manual',
    NULL,
    p_description,
    p_metadata
  ) RETURNING id INTO v_transaction_id;
  
  -- Update balance
  UPDATE guide_reward_points
  SET
    balance = balance - p_points,
    lifetime_redeemed = lifetime_redeemed + p_points,
    updated_at = NOW()
  WHERE guide_id = p_guide_id;
  
  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGERS
-- ============================================
CREATE TRIGGER update_guide_reward_points_updated_at
  BEFORE UPDATE ON guide_reward_points
  FOR EACH ROW
  EXECUTE FUNCTION update_guide_reward_points_updated_at();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE guide_reward_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE guide_reward_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Guides can view their own points
CREATE POLICY "guide_reward_points_select_own" ON guide_reward_points
  FOR SELECT
  USING (guide_id = auth.uid());

-- RLS Policy: Admins can view all points
CREATE POLICY "guide_reward_points_select_admin" ON guide_reward_points
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'ops_admin', 'finance_manager')
    )
  );

-- RLS Policy: Guides can view their own transactions
CREATE POLICY "guide_reward_transactions_select_own" ON guide_reward_transactions
  FOR SELECT
  USING (guide_id = auth.uid());

-- RLS Policy: Admins can view all transactions
CREATE POLICY "guide_reward_transactions_select_admin" ON guide_reward_transactions
  FOR SELECT
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
COMMENT ON TABLE guide_reward_points IS 'Reward points balance for each guide';
COMMENT ON TABLE guide_reward_transactions IS 'History of all reward points transactions';
COMMENT ON FUNCTION award_reward_points IS 'Award points to a guide (earn)';
COMMENT ON FUNCTION redeem_reward_points IS 'Redeem points from a guide (deduct)';

COMMIT;

