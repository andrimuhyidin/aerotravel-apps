-- Migration: 055-payment-split.sql
-- Description: Payment split calculation & tracking for multi-guide trips
-- Created: 2025-01-23

-- ============================================
-- ADD PAYMENT SPLIT COLUMNS TO TRIP_CREWS
-- ============================================

-- Add payment split columns
ALTER TABLE trip_crews
  ADD COLUMN IF NOT EXISTS fee_amount DECIMAL(10, 2), -- Individual fee for this guide
  ADD COLUMN IF NOT EXISTS split_percentage DECIMAL(5, 2), -- Percentage of total (e.g., 60.00 for 60%)
  ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'paid', 'cancelled'
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payment_notes TEXT;

-- Add constraint for payment status
ALTER TABLE trip_crews
  DROP CONSTRAINT IF EXISTS valid_payment_status;

ALTER TABLE trip_crews
  ADD CONSTRAINT valid_payment_status CHECK (
    payment_status IN ('pending', 'paid', 'cancelled')
  );

-- Add constraint for split percentage (0-100)
ALTER TABLE trip_crews
  DROP CONSTRAINT IF EXISTS valid_split_percentage;

ALTER TABLE trip_crews
  ADD CONSTRAINT valid_split_percentage CHECK (
    split_percentage IS NULL OR (split_percentage >= 0 AND split_percentage <= 100)
  );

-- ============================================
-- FUNCTION: Calculate Payment Split
-- ============================================
CREATE OR REPLACE FUNCTION calculate_payment_split(
  trip_uuid UUID,
  total_fee DECIMAL
)
RETURNS TABLE (
  guide_id UUID,
  role VARCHAR,
  fee_amount DECIMAL,
  split_percentage DECIMAL
) AS $$
DECLARE
  lead_guide_count INTEGER;
  support_guide_count INTEGER;
  lead_split DECIMAL := 60.0; -- 60% for lead
  support_split DECIMAL := 40.0; -- 40% for support
BEGIN
  -- Count guides by role
  SELECT 
    COUNT(*) FILTER (WHERE role = 'lead'),
    COUNT(*) FILTER (WHERE role = 'support')
  INTO lead_guide_count, support_guide_count
  FROM trip_crews
  WHERE trip_id = trip_uuid
    AND status IN ('assigned', 'confirmed');
  
  -- Calculate split per guide
  RETURN QUERY
  SELECT 
    tc.guide_id,
    tc.role,
    CASE 
      WHEN tc.role = 'lead' THEN (total_fee * lead_split / 100.0) / NULLIF(lead_guide_count, 0)
      WHEN tc.role = 'support' THEN (total_fee * support_split / 100.0) / NULLIF(support_guide_count, 0)
      ELSE 0
    END AS fee_amount,
    CASE 
      WHEN tc.role = 'lead' THEN lead_split / NULLIF(lead_guide_count, 0)
      WHEN tc.role = 'support' THEN support_split / NULLIF(support_guide_count, 0)
      ELSE 0
    END AS split_percentage
  FROM trip_crews tc
  WHERE tc.trip_id = trip_uuid
    AND tc.status IN ('assigned', 'confirmed');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Auto-calculate split on assignment
-- ============================================
CREATE OR REPLACE FUNCTION auto_calculate_payment_split()
RETURNS TRIGGER AS $$
DECLARE
  trip_total_fee DECIMAL;
  calculated_split RECORD;
BEGIN
  -- Get trip total fee (from trip_guides or trips table)
  SELECT COALESCE(
    (SELECT SUM(fee_amount) FROM trip_guides WHERE trip_id = NEW.trip_id),
    0
  ) INTO trip_total_fee;
  
  -- If no fee in trip_guides, try to get from trips or calculate from package
  IF trip_total_fee = 0 THEN
    -- You might want to get from trips.total_fee or calculate from package
    -- For now, we'll skip auto-calculation if no fee available
    RETURN NEW;
  END IF;
  
  -- Calculate split for this guide
  SELECT * INTO calculated_split
  FROM calculate_payment_split(NEW.trip_id, trip_total_fee)
  WHERE guide_id = NEW.guide_id;
  
  -- Update fee_amount and split_percentage if calculated
  IF calculated_split.fee_amount IS NOT NULL THEN
    NEW.fee_amount := calculated_split.fee_amount;
    NEW.split_percentage := calculated_split.split_percentage;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGER: Auto-calculate on insert/update
-- ============================================
DROP TRIGGER IF EXISTS auto_calculate_payment_split_trigger ON trip_crews;

CREATE TRIGGER auto_calculate_payment_split_trigger
  BEFORE INSERT OR UPDATE ON trip_crews
  FOR EACH ROW
  WHEN (NEW.fee_amount IS NULL OR NEW.split_percentage IS NULL)
  EXECUTE FUNCTION auto_calculate_payment_split();

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_trip_crews_payment_status ON trip_crews(payment_status);
CREATE INDEX IF NOT EXISTS idx_trip_crews_fee_amount ON trip_crews(fee_amount);

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON COLUMN trip_crews.fee_amount IS 'Individual fee amount for this guide (calculated from split)';
COMMENT ON COLUMN trip_crews.split_percentage IS 'Percentage of total fee (e.g., 60.00 for 60%)';
COMMENT ON COLUMN trip_crews.payment_status IS 'Payment status: pending, paid, cancelled';
COMMENT ON FUNCTION calculate_payment_split IS 'Calculate payment split: 60% lead, 40% support (divided by count)';
