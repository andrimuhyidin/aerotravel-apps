-- Migration: referral-tracking.sql
-- Description: Referral Tracking System (PRD 5.3.B - Member Get Member)
-- Created: 2026-01-02

BEGIN;

-- ============================================
-- REFERRAL TRACKING TABLE
-- Tracks who referred whom and their status
-- ============================================
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Referrer (user who shared the code)
  referrer_id UUID NOT NULL REFERENCES users(id),
  
  -- Referee (new user who used the code)
  referee_id UUID NOT NULL REFERENCES users(id),
  
  -- Referral code used
  referral_code VARCHAR(20) NOT NULL,
  
  -- Status tracking
  status VARCHAR(20) NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'completed', 'expired', 'cancelled')),
  
  -- Rewards configuration (PRD 5.3.B values)
  referee_discount INTEGER NOT NULL DEFAULT 50000,  -- Rp 50,000 discount for new user
  referrer_points INTEGER NOT NULL DEFAULT 10000,   -- 10,000 points after trip completion
  
  -- Tracking
  booking_id UUID REFERENCES bookings(id),
  completed_at TIMESTAMPTZ,
  
  -- Reward status
  referee_reward_claimed BOOLEAN DEFAULT false,  -- Discount applied to first booking
  referrer_reward_claimed BOOLEAN DEFAULT false, -- Points awarded after trip
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate referrals for same referee
  UNIQUE(referee_id)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referee_id ON referrals(referee_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referral_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_referrals_booking_id ON referrals(booking_id);

-- ============================================
-- TRIGGERS
-- ============================================
CREATE TRIGGER update_referrals_updated_at
  BEFORE UPDATE ON referrals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Users can read their own referrals (as referrer or referee)
CREATE POLICY "Users can read own referrals"
  ON referrals
  FOR SELECT
  USING (
    referrer_id = auth.uid() OR referee_id = auth.uid()
  );

-- Only system can insert/update referrals (via API)
CREATE POLICY "System can manage referrals"
  ON referrals
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'ops_admin')
    )
  );

-- ============================================
-- FUNCTION: Generate Referral Code
-- Creates a unique code in format AERO-XXXX
-- ============================================
CREATE OR REPLACE FUNCTION generate_referral_code(user_id UUID)
RETURNS VARCHAR AS $$
DECLARE
  base_name VARCHAR;
  code VARCHAR;
  counter INTEGER := 0;
BEGIN
  -- Get user's first name or use random string
  SELECT UPPER(SUBSTRING(COALESCE(full_name, 'USER') FROM 1 FOR 4))
  INTO base_name
  FROM users
  WHERE id = user_id;
  
  -- Generate unique code
  LOOP
    IF counter = 0 THEN
      code := 'AERO-' || base_name;
    ELSE
      code := 'AERO-' || base_name || counter::VARCHAR;
    END IF;
    
    -- Check if code exists
    IF NOT EXISTS (SELECT 1 FROM referral_codes WHERE referral_codes.code = code) THEN
      RETURN code;
    END IF;
    
    counter := counter + 1;
    
    -- Fallback to random code after 10 attempts
    IF counter > 10 THEN
      code := 'AERO-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
      IF NOT EXISTS (SELECT 1 FROM referral_codes WHERE referral_codes.code = code) THEN
        RETURN code;
      END IF;
    END IF;
    
    -- Safety exit
    IF counter > 100 THEN
      RETURN 'AERO-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT || NOW()::TEXT) FROM 1 FOR 8));
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Complete Referral
-- Called when referee's first trip is completed
-- Awards points to referrer
-- ============================================
CREATE OR REPLACE FUNCTION complete_referral(p_booking_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_referral RECORD;
  v_loyalty_id UUID;
  v_balance INTEGER;
BEGIN
  -- Find pending referral for this booking's user
  SELECT r.* INTO v_referral
  FROM referrals r
  JOIN bookings b ON b.created_by = r.referee_id
  WHERE b.id = p_booking_id
    AND r.status = 'pending'
    AND r.referrer_reward_claimed = false;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Get referrer's loyalty record
  SELECT id, balance INTO v_loyalty_id, v_balance
  FROM loyalty_points
  WHERE user_id = v_referral.referrer_id;
  
  -- Create loyalty record if not exists
  IF v_loyalty_id IS NULL THEN
    INSERT INTO loyalty_points (user_id, balance, lifetime_earned, lifetime_spent)
    VALUES (v_referral.referrer_id, 0, 0, 0)
    RETURNING id, balance INTO v_loyalty_id, v_balance;
  END IF;
  
  -- Award points to referrer
  INSERT INTO loyalty_transactions (
    loyalty_id,
    transaction_type,
    points,
    balance_before,
    balance_after,
    referral_code,
    description
  ) VALUES (
    v_loyalty_id,
    'earn_referral',
    v_referral.referrer_points,
    v_balance,
    v_balance + v_referral.referrer_points,
    v_referral.referral_code,
    'Bonus referral - Teman Anda telah menyelesaikan trip pertama'
  );
  
  -- Update referrer's balance
  UPDATE loyalty_points
  SET 
    balance = balance + v_referral.referrer_points,
    lifetime_earned = lifetime_earned + v_referral.referrer_points,
    updated_at = NOW()
  WHERE id = v_loyalty_id;
  
  -- Update referral status
  UPDATE referrals
  SET 
    status = 'completed',
    booking_id = p_booking_id,
    completed_at = NOW(),
    referrer_reward_claimed = true,
    updated_at = NOW()
  WHERE id = v_referral.id;
  
  -- Update referral code stats
  UPDATE referral_codes
  SET 
    total_bookings = total_bookings + 1,
    total_commission = total_commission + v_referral.referrer_points
  WHERE code = v_referral.referral_code;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;

