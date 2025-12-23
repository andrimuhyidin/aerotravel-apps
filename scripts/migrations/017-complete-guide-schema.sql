-- Migration: 017-complete-guide-schema.sql
-- Description: Complete missing tables for Guide Module (Wallet, Rewards, Certifications)
-- Created: 2025-12-22

-- ============================================
-- 1. GUIDE WALLET SYSTEM
-- ============================================

-- Guide Wallets
CREATE TABLE IF NOT EXISTS guide_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID NOT NULL REFERENCES users(id),
  balance DECIMAL(12, 2) DEFAULT 0,
  pending_balance DECIMAL(12, 2) DEFAULT 0,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(guide_id)
);

-- Guide Wallet Transactions
CREATE TABLE IF NOT EXISTS guide_wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES guide_wallets(id),
  
  -- Transaction Details
  amount DECIMAL(12, 2) NOT NULL,
  transaction_type TEXT NOT NULL, -- 'earning', 'withdrawal', 'adjustment', 'penalty', 'bonus'
  
  -- Reference
  reference_type TEXT, -- 'trip', 'bonus', 'penalty', 'payout'
  reference_id UUID,   -- ID of trip, bonus record, etc
  
  -- Meta
  description TEXT,
  status TEXT DEFAULT 'completed', -- 'pending', 'completed', 'failed'
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for Wallet
CREATE INDEX IF NOT EXISTS idx_guide_wallet_transactions_wallet_id ON guide_wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_guide_wallet_transactions_type ON guide_wallet_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_guide_wallet_transactions_created_at ON guide_wallet_transactions(created_at);


-- ============================================
-- 2. REWARD POINTS SYSTEM
-- ============================================

-- Reward Points Balance
CREATE TABLE IF NOT EXISTS guide_reward_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID NOT NULL REFERENCES users(id),
  
  -- Balance Info
  balance INTEGER DEFAULT 0,
  lifetime_earned INTEGER DEFAULT 0,
  lifetime_redeemed INTEGER DEFAULT 0,
  expired_points INTEGER DEFAULT 0,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(guide_id)
);

-- Reward Transactions History
CREATE TABLE IF NOT EXISTS guide_reward_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID NOT NULL REFERENCES users(id),
  
  -- Transaction Details
  points INTEGER NOT NULL,
  transaction_type TEXT NOT NULL, -- 'earn', 'redeem', 'expire', 'adjustment'
  
  -- Source
  source_type TEXT, -- 'challenge', 'trip', 'badge', 'referral'
  source_id UUID,
  
  -- Meta
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Expiry logic
  expires_at TIMESTAMPTZ,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for Rewards
CREATE INDEX IF NOT EXISTS idx_guide_reward_transactions_guide_id ON guide_reward_transactions(guide_id);
CREATE INDEX IF NOT EXISTS idx_guide_reward_transactions_type ON guide_reward_transactions(transaction_type);


-- ============================================
-- 3. CERTIFICATIONS TRACKER
-- ============================================

CREATE TABLE IF NOT EXISTS guide_certifications_tracker (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID NOT NULL REFERENCES users(id),
  
  -- Certification Details
  certification_type TEXT NOT NULL, -- 'license', 'language', 'skill', 'first_aid'
  certification_name TEXT NOT NULL,
  issuer TEXT,
  certification_number VARCHAR(100),
  
  -- Dates
  issue_date DATE,
  expiry_date DATE,
  
  -- Verification
  status TEXT DEFAULT 'pending', -- 'pending', 'verified', 'rejected', 'expired'
  document_url TEXT,
  verification_note TEXT,
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMPTZ,
  
  -- State
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for Certifications
CREATE INDEX IF NOT EXISTS idx_guide_certifications_guide_id ON guide_certifications_tracker(guide_id);
CREATE INDEX IF NOT EXISTS idx_guide_certifications_expiry ON guide_certifications_tracker(expiry_date);


-- ============================================
-- 4. SOCIAL & COMMUNITY (Basic)
-- ============================================

DROP TABLE IF EXISTS guide_social_posts CASCADE;
CREATE TABLE guide_social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID NOT NULL REFERENCES users(id),
  
  -- Content
  content TEXT,
  image_urls TEXT[],
  
  -- Engagement
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  
  -- Visibility
  is_public BOOLEAN DEFAULT true,
  branch_id UUID REFERENCES branches(id), -- Optional: specific to branch
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guide_social_posts_guide_id ON guide_social_posts(guide_id);


-- ============================================
-- 5. CHALLENGES & PROMOS (Ensure Existence)
-- ============================================

CREATE TABLE IF NOT EXISTS guide_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID NOT NULL REFERENCES users(id),
  
  -- Challenge Info
  challenge_type TEXT NOT NULL, -- 'trip_count', 'rating', 'earnings'
  title TEXT NOT NULL,
  description TEXT,
  
  -- Progress
  target_value INTEGER NOT NULL,
  current_value INTEGER DEFAULT 0,
  
  -- Timeline
  start_date DATE DEFAULT CURRENT_DATE,
  target_date DATE,
  
  -- Status
  status TEXT DEFAULT 'active', -- 'active', 'completed', 'expired', 'failed'
  
  -- Reward
  reward_points INTEGER DEFAULT 0,
  reward_description TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS guide_promos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID, -- Nullable for global promos
  
  -- Display Info
  type TEXT NOT NULL, -- 'promo', 'announcement', 'update'
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  link TEXT,
  
  -- Styling
  badge TEXT,
  gradient TEXT, -- e.g. 'from-blue-500 to-cyan-500'
  priority TEXT DEFAULT 'medium',
  
  -- Schedule
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================
-- 6. RPC FUNCTIONS
-- ============================================

-- Function: Award Points
CREATE OR REPLACE FUNCTION award_reward_points(
  p_guide_id UUID,
  p_points INTEGER,
  p_source_type TEXT,
  p_source_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_transaction_id UUID;
  v_expiry_date TIMESTAMPTZ;
BEGIN
  -- Set expiry to 1 year from now (default policy)
  v_expiry_date := NOW() + INTERVAL '1 year';
  
  -- Insert transaction
  INSERT INTO guide_reward_transactions (
    guide_id, points, transaction_type, source_type, source_id, description, metadata, expires_at
  ) VALUES (
    p_guide_id, p_points, 'earn', p_source_type, p_source_id, p_description, p_metadata, v_expiry_date
  ) RETURNING id INTO v_transaction_id;
  
  -- Update balance (Upsert)
  INSERT INTO guide_reward_points (guide_id, balance, lifetime_earned)
  VALUES (p_guide_id, p_points, p_points)
  ON CONFLICT (guide_id) DO UPDATE SET
    balance = guide_reward_points.balance + p_points,
    lifetime_earned = guide_reward_points.lifetime_earned + p_points,
    updated_at = NOW();
    
  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Redeem Points
CREATE OR REPLACE FUNCTION redeem_reward_points(
  p_guide_id UUID,
  p_points INTEGER,
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_transaction_id UUID;
  v_current_balance INTEGER;
BEGIN
  -- Check balance
  SELECT balance INTO v_current_balance FROM guide_reward_points WHERE guide_id = p_guide_id;
  
  IF v_current_balance IS NULL OR v_current_balance < p_points THEN
    RAISE EXCEPTION 'Insufficient points balance';
  END IF;
  
  -- Insert transaction (negative points for redemption logic if needed, but usually tracked as positive in redemption type)
  -- Here we follow schema: points is absolute value, type determines sign logic
  INSERT INTO guide_reward_transactions (
    guide_id, points, transaction_type, description, metadata
  ) VALUES (
    p_guide_id, p_points, 'redeem', p_description, p_metadata
  ) RETURNING id INTO v_transaction_id;
  
  -- Update balance
  UPDATE guide_reward_points SET
    balance = balance - p_points,
    lifetime_redeemed = lifetime_redeemed + p_points,
    updated_at = NOW()
  WHERE guide_id = p_guide_id;
    
  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Get Expiring Certifications
CREATE OR REPLACE FUNCTION get_expiring_certifications(days_ahead INT)
RETURNS TABLE (
  id UUID,
  guide_id UUID,
  certification_name TEXT,
  certification_type TEXT,
  expiry_date DATE,
  days_until_expiry INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.guide_id,
    c.certification_name,
    c.certification_type,
    c.expiry_date,
    (c.expiry_date - CURRENT_DATE)::INT
  FROM guide_certifications_tracker c
  WHERE c.expiry_date <= (CURRENT_DATE + (days_ahead || ' days')::INTERVAL)::DATE
  AND c.expiry_date >= CURRENT_DATE
  AND c.status = 'verified'
  AND c.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
DROP TRIGGER IF EXISTS update_guide_wallets_updated_at ON guide_wallets;
CREATE TRIGGER update_guide_wallets_updated_at BEFORE UPDATE ON guide_wallets FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_guide_reward_points_updated_at ON guide_reward_points;
CREATE TRIGGER update_guide_reward_points_updated_at BEFORE UPDATE ON guide_reward_points FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_guide_certifications_updated_at ON guide_certifications_tracker;
CREATE TRIGGER update_guide_certifications_updated_at BEFORE UPDATE ON guide_certifications_tracker FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_guide_challenges_updated_at ON guide_challenges;
CREATE TRIGGER update_guide_challenges_updated_at BEFORE UPDATE ON guide_challenges FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

