-- Migration: Travel Circle / Arisan
-- Description: Group savings feature untuk travel bookings
-- Created: 2025-01-31
-- Reference: BRD 10 - Travel Circle / Arisan

-- ============================================
-- TRAVEL CIRCLES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS travel_circles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Target & Timeline
  target_amount DECIMAL(12,2) NOT NULL,
  target_date DATE NOT NULL,
  
  -- Package Info (optional - bisa booking package tertentu atau flexible)
  package_id UUID REFERENCES packages(id),
  preferred_destination VARCHAR(255),
  
  -- Status
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed', 'cancelled'
  
  -- Progress Tracking
  current_amount DECIMAL(12,2) DEFAULT 0,
  contribution_count INTEGER DEFAULT 0,
  
  -- Creator
  created_by UUID NOT NULL REFERENCES users(id),
  branch_id UUID REFERENCES branches(id),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT valid_target_amount CHECK (target_amount > 0),
  CONSTRAINT valid_target_date CHECK (target_date >= CURRENT_DATE),
  CONSTRAINT valid_current_amount CHECK (current_amount >= 0 AND current_amount <= target_amount)
);

-- ============================================
-- TRAVEL CIRCLE MEMBERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS travel_circle_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id UUID NOT NULL REFERENCES travel_circles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  
  -- Member Info
  member_name VARCHAR(255) NOT NULL,
  member_email VARCHAR(255),
  member_phone VARCHAR(20),
  
  -- Contribution Target
  target_contribution DECIMAL(12,2) NOT NULL, -- Individual target
  current_contribution DECIMAL(12,2) DEFAULT 0,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'active', 'completed', 'left'
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_target_contribution CHECK (target_contribution > 0),
  CONSTRAINT valid_current_contribution CHECK (current_contribution >= 0),
  CONSTRAINT unique_circle_member UNIQUE (circle_id, user_id)
);

-- ============================================
-- TRAVEL CIRCLE CONTRIBUTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS travel_circle_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id UUID NOT NULL REFERENCES travel_circles(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES travel_circle_members(id) ON DELETE CASCADE,
  
  -- Contribution Details
  amount DECIMAL(12,2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL, -- 'wallet', 'transfer', 'midtrans'
  payment_reference VARCHAR(255), -- Transaction ID, invoice number, etc.
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'confirmed', 'failed', 'refunded'
  
  -- Wallet Integration
  wallet_transaction_id UUID, -- Reference to mitra_wallet_transactions if paid via wallet
  
  -- Metadata
  contributed_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_amount CHECK (amount > 0)
);

-- ============================================
-- TRAVEL CIRCLE BOOKINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS travel_circle_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id UUID NOT NULL REFERENCES travel_circles(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES bookings(id),
  
  -- Auto-booking trigger
  auto_booked BOOLEAN DEFAULT false,
  booked_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_circle_booking UNIQUE (circle_id, booking_id)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_travel_circles_created_by ON travel_circles(created_by);
CREATE INDEX IF NOT EXISTS idx_travel_circles_status ON travel_circles(status);
CREATE INDEX IF NOT EXISTS idx_travel_circles_target_date ON travel_circles(target_date);
CREATE INDEX IF NOT EXISTS idx_travel_circle_members_circle_id ON travel_circle_members(circle_id);
CREATE INDEX IF NOT EXISTS idx_travel_circle_members_user_id ON travel_circle_members(user_id);
CREATE INDEX IF NOT EXISTS idx_travel_circle_contributions_circle_id ON travel_circle_contributions(circle_id);
CREATE INDEX IF NOT EXISTS idx_travel_circle_contributions_member_id ON travel_circle_contributions(member_id);
CREATE INDEX IF NOT EXISTS idx_travel_circle_contributions_status ON travel_circle_contributions(status);
CREATE INDEX IF NOT EXISTS idx_travel_circle_bookings_circle_id ON travel_circle_bookings(circle_id);
CREATE INDEX IF NOT EXISTS idx_travel_circle_bookings_booking_id ON travel_circle_bookings(booking_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function: Update circle progress
CREATE OR REPLACE FUNCTION update_travel_circle_progress(p_circle_id UUID)
RETURNS void AS $$
DECLARE
  v_total_contributions DECIMAL(12,2);
  v_contribution_count INTEGER;
  v_target_amount DECIMAL(12,2);
BEGIN
  -- Calculate total confirmed contributions
  SELECT 
    COALESCE(SUM(amount), 0),
    COUNT(*)
  INTO v_total_contributions, v_contribution_count
  FROM travel_circle_contributions
  WHERE circle_id = p_circle_id
    AND status = 'confirmed';

  -- Get target amount
  SELECT target_amount INTO v_target_amount
  FROM travel_circles
  WHERE id = p_circle_id;

  -- Update circle progress
  UPDATE travel_circles
  SET 
    current_amount = v_total_contributions,
    contribution_count = v_contribution_count,
    updated_at = NOW()
  WHERE id = p_circle_id;

  -- Auto-complete jika target tercapai
  IF v_total_contributions >= v_target_amount AND v_target_amount > 0 THEN
    UPDATE travel_circles
    SET 
      status = 'completed',
      completed_at = NOW(),
      updated_at = NOW()
    WHERE id = p_circle_id
      AND status = 'active';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function: Update member contribution
CREATE OR REPLACE FUNCTION update_member_contribution(p_member_id UUID)
RETURNS void AS $$
DECLARE
  v_total_contribution DECIMAL(12,2);
  v_target_contribution DECIMAL(12,2);
BEGIN
  -- Calculate total confirmed contributions for member
  SELECT COALESCE(SUM(amount), 0)
  INTO v_total_contribution
  FROM travel_circle_contributions
  WHERE member_id = p_member_id
    AND status = 'confirmed';

  -- Get target
  SELECT target_contribution INTO v_target_contribution
  FROM travel_circle_members
  WHERE id = p_member_id;

  -- Update member contribution
  UPDATE travel_circle_members
  SET 
    current_contribution = v_total_contribution,
    status = CASE
      WHEN v_total_contribution >= v_target_contribution THEN 'completed'
      WHEN v_total_contribution > 0 THEN 'active'
      ELSE 'pending'
    END,
    updated_at = NOW()
  WHERE id = p_member_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger: Update circle progress when contribution is confirmed
CREATE OR REPLACE FUNCTION trigger_update_circle_progress()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
    PERFORM update_travel_circle_progress(NEW.circle_id);
    PERFORM update_member_contribution(NEW.member_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER travel_circle_contribution_confirmed
  AFTER INSERT OR UPDATE ON travel_circle_contributions
  FOR EACH ROW
  WHEN (NEW.status = 'confirmed')
  EXECUTE FUNCTION trigger_update_circle_progress();

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE travel_circles IS 'Travel Circle / Arisan groups untuk group savings';
COMMENT ON TABLE travel_circle_members IS 'Members dalam travel circle';
COMMENT ON TABLE travel_circle_contributions IS 'Contributions dari members';
COMMENT ON TABLE travel_circle_bookings IS 'Bookings yang dibuat dari travel circle';
COMMENT ON FUNCTION update_travel_circle_progress IS 'Update circle progress dan auto-complete jika target tercapai';
COMMENT ON FUNCTION update_member_contribution IS 'Update member contribution status';

