-- Migration: 114-partner-reward-points.sql
-- Description: Create reward/loyalty system for partner agents
-- Created: 2025-12-26

BEGIN;

-- ============================================
-- PARTNER REWARD POINTS SYSTEM
-- ============================================

-- Create ENUM for reward source types
DO $$ BEGIN
  CREATE TYPE partner_reward_source_type AS ENUM (
    'earn_booking',
    'earn_referral',
    'earn_milestone',
    'earn_special',
    'manual'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create ENUM for reward transaction types
DO $$ BEGIN
  CREATE TYPE partner_reward_transaction_type AS ENUM (
    'earn',
    'redeem',
    'expire',
    'adjustment',
    'refund'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Partner Reward Points (Balance Table)
CREATE TABLE IF NOT EXISTS partner_reward_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Balance
  balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
  lifetime_earned INTEGER NOT NULL DEFAULT 0 CHECK (lifetime_earned >= 0),
  lifetime_redeemed INTEGER NOT NULL DEFAULT 0 CHECK (lifetime_redeemed >= 0),
  expired_points INTEGER NOT NULL DEFAULT 0 CHECK (expired_points >= 0),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(partner_id)
);

-- Partner Reward Transactions (History)
CREATE TABLE IF NOT EXISTS partner_reward_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Transaction
  transaction_type partner_reward_transaction_type NOT NULL,
  points INTEGER NOT NULL,
  source_type partner_reward_source_type,
  source_id UUID, -- booking_id, referral_id, milestone_id, etc.
  
  -- Balance tracking
  balance_before INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  
  -- Expiration
  expires_at TIMESTAMPTZ, -- 12 months from earn date
  
  -- Description
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partner Reward Milestones
CREATE TABLE IF NOT EXISTS partner_reward_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Milestone
  milestone_type VARCHAR(50) NOT NULL, -- 'bookings_100', 'bookings_1000', 'revenue_10m', etc.
  milestone_value INTEGER NOT NULL, -- 100, 1000, etc.
  points_awarded INTEGER NOT NULL,
  
  -- Achievement
  achieved_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  UNIQUE(partner_id, milestone_type)
);

-- Partner Referrals
CREATE TABLE IF NOT EXISTS partner_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Referral code used
  referral_code VARCHAR(50),
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'rewarded'
  
  -- Reward
  points_awarded INTEGER DEFAULT 0,
  awarded_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(referred_id) -- One referral per user
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_partner_reward_points_partner_id ON partner_reward_points(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_reward_transactions_partner_id ON partner_reward_transactions(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_reward_transactions_type ON partner_reward_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_partner_reward_transactions_source ON partner_reward_transactions(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_partner_reward_transactions_created_at ON partner_reward_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_partner_reward_milestones_partner_id ON partner_reward_milestones(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_referrals_referrer_id ON partner_referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_partner_referrals_referred_id ON partner_referrals(referred_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to award points to partner
CREATE OR REPLACE FUNCTION award_partner_points(
  p_partner_id UUID,
  p_points INTEGER,
  p_source_type partner_reward_source_type,
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
  INSERT INTO partner_reward_transactions (
    partner_id,
    transaction_type,
    points,
    source_type,
    source_id,
    description,
    expires_at,
    metadata
  ) VALUES (
    p_partner_id,
    'earn',
    p_points,
    p_source_type,
    p_source_id,
    p_description,
    v_expires_at,
    p_metadata
  ) RETURNING id INTO v_transaction_id;
  
  -- Update or insert balance
  INSERT INTO partner_reward_points (
    partner_id,
    balance,
    lifetime_earned
  ) VALUES (
    p_partner_id,
    p_points,
    p_points
  )
  ON CONFLICT (partner_id) DO UPDATE SET
    balance = partner_reward_points.balance + p_points,
    lifetime_earned = partner_reward_points.lifetime_earned + p_points,
    updated_at = NOW();
  
  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to redeem points
CREATE OR REPLACE FUNCTION redeem_partner_points(
  p_partner_id UUID,
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
  FROM partner_reward_points
  WHERE partner_id = p_partner_id;
  
  IF v_current_balance IS NULL THEN
    RAISE EXCEPTION 'Partner reward points not found';
  END IF;
  
  IF v_current_balance < p_points THEN
    RAISE EXCEPTION 'Insufficient points balance';
  END IF;
  
  -- Insert transaction
  INSERT INTO partner_reward_transactions (
    partner_id,
    transaction_type,
    points,
    balance_before,
    balance_after,
    description,
    metadata
  ) VALUES (
    p_partner_id,
    'redeem',
    -p_points,
    v_current_balance,
    v_current_balance - p_points,
    p_description,
    p_metadata
  ) RETURNING id INTO v_transaction_id;
  
  -- Update balance
  UPDATE partner_reward_points
  SET balance = balance - p_points,
      lifetime_redeemed = lifetime_redeemed + p_points,
      updated_at = NOW()
  WHERE partner_id = p_partner_id;
  
  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to expire points (for cron job)
CREATE OR REPLACE FUNCTION expire_partner_points()
RETURNS INTEGER AS $$
DECLARE
  v_expired_count INTEGER := 0;
  v_transaction RECORD;
BEGIN
  -- Find expired points that haven't been expired yet
  FOR v_transaction IN
    SELECT 
      t.id,
      t.partner_id,
      t.points,
      p.balance
    FROM partner_reward_transactions t
    JOIN partner_reward_points p ON p.partner_id = t.partner_id
    WHERE t.transaction_type = 'earn'
      AND t.expires_at < NOW()
      AND t.points > 0
      AND NOT EXISTS (
        SELECT 1 FROM partner_reward_transactions
        WHERE source_id = t.id
          AND transaction_type = 'expire'
      )
  LOOP
    -- Only expire if balance is sufficient
    IF v_transaction.balance >= v_transaction.points THEN
      -- Create expire transaction
      INSERT INTO partner_reward_transactions (
        partner_id,
        transaction_type,
        points,
        balance_before,
        balance_after,
        source_id,
        description
      ) VALUES (
        v_transaction.partner_id,
        'expire',
        -v_transaction.points,
        v_transaction.balance,
        v_transaction.balance - v_transaction.points,
        v_transaction.id,
        'Points expired after 12 months'
      );
      
      -- Update balance
      UPDATE partner_reward_points
      SET balance = balance - v_transaction.points,
          expired_points = expired_points + v_transaction.points,
          updated_at = NOW()
      WHERE partner_id = v_transaction.partner_id;
      
      v_expired_count := v_expired_count + 1;
    END IF;
  END LOOP;
  
  RETURN v_expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE partner_reward_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_reward_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_reward_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_referrals ENABLE ROW LEVEL SECURITY;

-- Partners can view their own reward points
CREATE POLICY "Partners can view own reward points"
  ON partner_reward_points
  FOR SELECT
  USING (partner_id = auth.uid());

-- Partners can view their own transactions
CREATE POLICY "Partners can view own transactions"
  ON partner_reward_transactions
  FOR SELECT
  USING (partner_id = auth.uid());

-- Partners can view their own milestones
CREATE POLICY "Partners can view own milestones"
  ON partner_reward_milestones
  FOR SELECT
  USING (partner_id = auth.uid());

-- Partners can view their own referrals
CREATE POLICY "Partners can view own referrals"
  ON partner_referrals
  FOR SELECT
  USING (referrer_id = auth.uid() OR referred_id = auth.uid());

-- Admins can view all
CREATE POLICY "Admins can view all reward points"
  ON partner_reward_points
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'finance_manager')
    )
  );

CREATE POLICY "Admins can view all transactions"
  ON partner_reward_transactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'finance_manager')
    )
  );

COMMIT;

