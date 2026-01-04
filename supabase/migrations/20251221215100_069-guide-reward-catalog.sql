-- Migration: 069-guide-reward-catalog.sql
-- Description: Create reward catalog table for reward items
-- Created: 2025-12-21
-- Reference: Guide Reward System Comprehensive Implementation

BEGIN;

-- ============================================
-- REWARD CATALOG
-- ============================================

-- Create ENUM for reward types
DO $$ BEGIN
  CREATE TYPE reward_type AS ENUM (
    'cashback',
    'voucher',
    'merchandise',
    'benefit',
    'discount'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Guide Reward Catalog
CREATE TABLE IF NOT EXISTS guide_reward_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Info
  reward_type reward_type NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  points_cost INTEGER NOT NULL CHECK (points_cost > 0),
  
  -- Cashback Type
  cash_value DECIMAL(14,2), -- Cash equivalent (for cashback)
  
  -- Voucher Type
  voucher_code_template VARCHAR(100), -- Template for generating codes (e.g., 'GRAB-{CODE}')
  voucher_provider VARCHAR(50), -- e.g., 'grab', 'gojek', 'tokopedia', 'shopee'
  
  -- Merchandise Type
  merchandise_name VARCHAR(200),
  merchandise_sku VARCHAR(100),
  
  -- Benefit Type
  benefit_description TEXT,
  benefit_code VARCHAR(100), -- Internal code for benefit activation
  
  -- Discount Type
  discount_percentage INTEGER CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  discount_max_amount DECIMAL(14,2),
  discount_code_template VARCHAR(100),
  
  -- Availability
  stock_quantity INTEGER, -- null = unlimited
  available_from TIMESTAMPTZ DEFAULT NOW(),
  available_until TIMESTAMPTZ,
  
  -- Requirements
  min_level VARCHAR(20), -- Minimum guide level required (bronze, silver, gold, platinum, diamond)
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Media
  image_url TEXT,
  
  -- Terms
  terms_conditions TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_guide_reward_catalog_reward_type 
  ON guide_reward_catalog(reward_type);
  
CREATE INDEX IF NOT EXISTS idx_guide_reward_catalog_is_active 
  ON guide_reward_catalog(is_active) 
  WHERE is_active = true;
  
CREATE INDEX IF NOT EXISTS idx_guide_reward_catalog_points_cost 
  ON guide_reward_catalog(points_cost);
  
CREATE INDEX IF NOT EXISTS idx_guide_reward_catalog_available 
  ON guide_reward_catalog(available_from, available_until) 
  WHERE is_active = true;

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_guide_reward_catalog_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to check if reward is available
CREATE OR REPLACE FUNCTION is_reward_available(
  p_catalog_id UUID,
  p_guide_level VARCHAR(20) DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_reward RECORD;
  v_level_order INTEGER;
  v_min_level_order INTEGER;
BEGIN
  -- Get reward details
  SELECT * INTO v_reward
  FROM guide_reward_catalog
  WHERE id = p_catalog_id;
  
  -- Check if reward exists
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Check if active
  IF NOT v_reward.is_active THEN
    RETURN false;
  END IF;
  
  -- Check date availability
  IF NOW() < v_reward.available_from THEN
    RETURN false;
  END IF;
  
  IF v_reward.available_until IS NOT NULL AND NOW() > v_reward.available_until THEN
    RETURN false;
  END IF;
  
  -- Check stock
  IF v_reward.stock_quantity IS NOT NULL AND v_reward.stock_quantity <= 0 THEN
    RETURN false;
  END IF;
  
  -- Check level requirement
  IF v_reward.min_level IS NOT NULL AND p_guide_level IS NOT NULL THEN
    -- Level order: bronze=1, silver=2, gold=3, platinum=4, diamond=5
    v_min_level_order := CASE v_reward.min_level
      WHEN 'bronze' THEN 1
      WHEN 'silver' THEN 2
      WHEN 'gold' THEN 3
      WHEN 'platinum' THEN 4
      WHEN 'diamond' THEN 5
      ELSE 0
    END;
    
    v_level_order := CASE p_guide_level
      WHEN 'bronze' THEN 1
      WHEN 'silver' THEN 2
      WHEN 'gold' THEN 3
      WHEN 'platinum' THEN 4
      WHEN 'diamond' THEN 5
      ELSE 0
    END;
    
    IF v_level_order < v_min_level_order THEN
      RETURN false;
    END IF;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================
CREATE TRIGGER update_guide_reward_catalog_updated_at
  BEFORE UPDATE ON guide_reward_catalog
  FOR EACH ROW
  EXECUTE FUNCTION update_guide_reward_catalog_updated_at();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE guide_reward_catalog ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Everyone can view active rewards
CREATE POLICY "guide_reward_catalog_select_active" ON guide_reward_catalog
  FOR SELECT
  USING (is_active = true);

-- RLS Policy: Admins can view all rewards
CREATE POLICY "guide_reward_catalog_select_admin" ON guide_reward_catalog
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'ops_admin', 'finance_manager')
    )
  );

-- RLS Policy: Admins can manage rewards
CREATE POLICY "guide_reward_catalog_manage_admin" ON guide_reward_catalog
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'ops_admin', 'finance_manager')
    )
  );

-- ============================================
-- SEED DEFAULT REWARDS
-- ============================================

-- Cashback Rewards
INSERT INTO guide_reward_catalog (
  reward_type, title, description, points_cost, cash_value, is_active
) VALUES
  ('cashback', 'Cashback Rp 10,000', 'Tukar 10,000 poin menjadi Rp 10,000 cashback ke wallet', 10000, 10000, true),
  ('cashback', 'Cashback Rp 25,000', 'Tukar 25,000 poin menjadi Rp 25,000 cashback ke wallet', 25000, 25000, true),
  ('cashback', 'Cashback Rp 50,000', 'Tukar 50,000 poin menjadi Rp 50,000 cashback ke wallet', 50000, 50000, true),
  ('cashback', 'Cashback Rp 100,000', 'Tukar 100,000 poin menjadi Rp 100,000 cashback ke wallet', 100000, 100000, true)
ON CONFLICT DO NOTHING;

-- Voucher Rewards
INSERT INTO guide_reward_catalog (
  reward_type, title, description, points_cost, voucher_provider, voucher_code_template, is_active
) VALUES
  ('voucher', 'Grab Voucher Rp 20,000', 'Voucher Grab senilai Rp 20,000', 20000, 'grab', 'GRAB-{CODE}', true),
  ('voucher', 'Gojek Voucher Rp 20,000', 'Voucher Gojek senilai Rp 20,000', 20000, 'gojek', 'GOJEK-{CODE}', true),
  ('voucher', 'Tokopedia Voucher Rp 25,000', 'Voucher Tokopedia senilai Rp 25,000', 25000, 'tokopedia', 'TOKPED-{CODE}', true)
ON CONFLICT DO NOTHING;

-- Benefit Rewards (Level-based)
INSERT INTO guide_reward_catalog (
  reward_type, title, description, points_cost, benefit_description, benefit_code, min_level, is_active
) VALUES
  ('benefit', 'Priority Trip Assignment (1 Month)', 'Dapatkan prioritas penugasan trip selama 1 bulan', 50000, 'Priority trip assignment for 1 month', 'PRIORITY_1M', 'silver', true),
  ('benefit', 'Exclusive Training Access', 'Akses training eksklusif untuk guide', 75000, 'Access to exclusive training programs', 'TRAINING_EXCLUSIVE', 'gold', true),
  ('benefit', 'Mentor Program Access', 'Akses program mentor untuk guide baru', 100000, 'Access to mentor program', 'MENTOR_ACCESS', 'platinum', true)
ON CONFLICT DO NOTHING;

-- Discount Rewards
INSERT INTO guide_reward_catalog (
  reward_type, title, description, points_cost, discount_percentage, discount_max_amount, discount_code_template, is_active
) VALUES
  ('discount', 'Discount 10% Booking', 'Diskon 10% untuk booking trip berikutnya (maks Rp 50,000)', 15000, 10, 50000, 'DISC10-{CODE}', true),
  ('discount', 'Discount 15% Booking', 'Diskon 15% untuk booking trip berikutnya (maks Rp 100,000)', 25000, 15, 100000, 'DISC15-{CODE}', true)
ON CONFLICT DO NOTHING;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE guide_reward_catalog IS 'Catalog of rewards available for redemption';
COMMENT ON FUNCTION is_reward_available IS 'Check if a reward is available for a guide based on stock, date, and level requirements';

COMMIT;

