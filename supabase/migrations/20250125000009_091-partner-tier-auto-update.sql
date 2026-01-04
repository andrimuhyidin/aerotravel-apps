-- Migration: 091-partner-tier-auto-update.sql
-- Description: Create function and cron job for auto-updating partner tiers
-- Created: 2025-01-25
-- Reference: Partner Portal Onboarding & Profile Management Implementation Plan

-- ============================================
-- TIER CALCULATION FUNCTION
-- ============================================

-- Function to calculate partner tier based on bookings and revenue
CREATE OR REPLACE FUNCTION calculate_partner_tier(
  p_partner_id UUID
) RETURNS VARCHAR(20) AS $$
DECLARE
  v_booking_count INTEGER;
  v_total_revenue DECIMAL(14,2);
  v_tier VARCHAR(20);
BEGIN
  -- Get booking count and total revenue for the partner
  SELECT 
    COUNT(*)::INTEGER,
    COALESCE(SUM(total_price), 0)
  INTO v_booking_count, v_total_revenue
  FROM bookings
  WHERE 
    user_id = p_partner_id
    AND status IN ('confirmed', 'completed')
    AND deleted_at IS NULL;
  
  -- Calculate tier based on booking count and revenue
  -- Priority: Revenue > Booking Count
  IF v_total_revenue >= 100000000 THEN -- 100M+
    v_tier := 'platinum';
  ELSIF v_total_revenue >= 50000000 THEN -- 50M-100M
    v_tier := 'gold';
  ELSIF v_total_revenue >= 10000000 THEN -- 10M-50M
    v_tier := 'silver';
  ELSIF v_booking_count >= 100 THEN -- 100+ bookings
    v_tier := 'platinum';
  ELSIF v_booking_count >= 51 THEN -- 51-100 bookings
    v_tier := 'gold';
  ELSIF v_booking_count >= 11 THEN -- 11-50 bookings
    v_tier := 'silver';
  ELSE -- 0-10 bookings
    v_tier := 'bronze';
  END IF;
  
  RETURN v_tier;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- AUTO-UPDATE TIER FUNCTION
-- ============================================

-- Function to update tiers for all active partners
CREATE OR REPLACE FUNCTION update_partner_tiers()
RETURNS TABLE(
  partner_id UUID,
  old_tier VARCHAR(20),
  new_tier VARCHAR(20),
  updated BOOLEAN
) AS $$
DECLARE
  v_partner RECORD;
  v_calculated_tier VARCHAR(20);
  v_current_tier VARCHAR(20);
  v_auto_calculated BOOLEAN;
BEGIN
  -- Loop through all active partners (mitra role)
  FOR v_partner IN
    SELECT id, partner_tier, tier_auto_calculated
    FROM users
    WHERE role = 'mitra'
      AND is_active = true
      AND deleted_at IS NULL
  LOOP
    v_current_tier := COALESCE(v_partner.partner_tier, 'bronze');
    v_auto_calculated := COALESCE(v_partner.tier_auto_calculated, true);
    
    -- Only auto-update if tier is auto-calculated
    IF v_auto_calculated THEN
      -- Calculate new tier
      v_calculated_tier := calculate_partner_tier(v_partner.id);
      
      -- Update if tier changed
      IF v_calculated_tier != v_current_tier THEN
        UPDATE users
        SET 
          partner_tier = v_calculated_tier,
          tier_assigned_at = NOW(),
          tier_assigned_by = NULL, -- Auto-assigned
          tier_auto_calculated = true,
          updated_at = NOW()
        WHERE id = v_partner.id;
        
        -- Return update info
        partner_id := v_partner.id;
        old_tier := v_current_tier;
        new_tier := v_calculated_tier;
        updated := true;
        RETURN NEXT;
      ELSE
        -- No change
        partner_id := v_partner.id;
        old_tier := v_current_tier;
        new_tier := v_calculated_tier;
        updated := false;
        RETURN NEXT;
      END IF;
    ELSE
      -- Manual tier, skip
      partner_id := v_partner.id;
      old_tier := v_current_tier;
      new_tier := v_current_tier;
      updated := false;
      RETURN NEXT;
    END IF;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TIER HISTORY TABLE (Optional - for audit)
-- ============================================
CREATE TABLE IF NOT EXISTS partner_tier_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  old_tier VARCHAR(20),
  new_tier VARCHAR(20) NOT NULL,
  assigned_by UUID REFERENCES users(id), -- NULL if auto
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  reason TEXT, -- Reason for tier change
  is_auto_calculated BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_partner_tier_history_partner_id ON partner_tier_history(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_tier_history_assigned_at ON partner_tier_history(assigned_at DESC);

-- Trigger to log tier changes
CREATE OR REPLACE FUNCTION log_partner_tier_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if tier actually changed
  IF OLD.partner_tier IS DISTINCT FROM NEW.partner_tier THEN
    INSERT INTO partner_tier_history (
      partner_id,
      old_tier,
      new_tier,
      assigned_by,
      assigned_at,
      is_auto_calculated
    ) VALUES (
      NEW.id,
      OLD.partner_tier,
      NEW.partner_tier,
      NEW.tier_assigned_by,
      NEW.tier_assigned_at,
      NEW.tier_auto_calculated
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_log_partner_tier_change ON users;
CREATE TRIGGER trigger_log_partner_tier_change
  AFTER UPDATE OF partner_tier ON users
  FOR EACH ROW
  WHEN (OLD.partner_tier IS DISTINCT FROM NEW.partner_tier)
  EXECUTE FUNCTION log_partner_tier_change();

-- Comments
COMMENT ON FUNCTION calculate_partner_tier IS 'Calculate partner tier based on booking count and revenue';
COMMENT ON FUNCTION update_partner_tiers IS 'Update tiers for all active partners (auto-calculated only)';
COMMENT ON TABLE partner_tier_history IS 'Audit log of partner tier changes';

-- Note: Cron job setup should be done via:
-- 1. Supabase Dashboard: Database > Cron Jobs > New Cron Job
-- 2. Schedule: Daily at 2 AM (0 2 * * *)
-- 3. SQL: SELECT * FROM update_partner_tiers();
-- Or via Vercel Cron: /api/cron/partner-tiers

