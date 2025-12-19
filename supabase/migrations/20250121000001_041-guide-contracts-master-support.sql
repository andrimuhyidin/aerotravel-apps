-- Migration: 041-guide-contracts-master-support.sql
-- Description: Add master contract support for annual freelancer model
-- Created: 2025-01-21

-- ============================================
-- ADD MASTER CONTRACT SUPPORT
-- ============================================

-- Add master contract flags
ALTER TABLE guide_contracts 
ADD COLUMN IF NOT EXISTS is_master_contract BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS auto_cover_trips BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS renewal_date DATE,
ADD COLUMN IF NOT EXISTS previous_contract_id UUID REFERENCES guide_contracts(id);

-- Make fee_amount optional (fee is in trip_guides, not contract)
-- Keep for backward compatibility but make it nullable
ALTER TABLE guide_contracts 
ALTER COLUMN fee_amount DROP NOT NULL;

-- Update constraint to allow NULL fee_amount for master contracts
ALTER TABLE guide_contracts 
DROP CONSTRAINT IF EXISTS valid_fee_amount;

ALTER TABLE guide_contracts 
ADD CONSTRAINT valid_fee_amount 
CHECK (fee_amount IS NULL OR fee_amount > 0);

-- Add index for master contract lookup (performance)
CREATE INDEX IF NOT EXISTS idx_guide_contracts_master 
ON guide_contracts(guide_id, is_master_contract, status) 
WHERE is_master_contract = true AND status = 'active';

-- Add index for renewal tracking
CREATE INDEX IF NOT EXISTS idx_guide_contracts_renewal 
ON guide_contracts(renewal_date) 
WHERE is_master_contract = true AND status = 'active';

-- Add index for contract history (previous_contract_id)
CREATE INDEX IF NOT EXISTS idx_guide_contracts_previous 
ON guide_contracts(previous_contract_id) 
WHERE previous_contract_id IS NOT NULL;

-- ============================================
-- UPDATE EXISTING CONTRACTS (Optional)
-- ============================================

-- Mark existing annual contracts as master contracts
-- (Only if they are active and annual type)
UPDATE guide_contracts 
SET is_master_contract = true, 
    auto_cover_trips = true,
    renewal_date = end_date
WHERE contract_type = 'annual' 
  AND status = 'active'
  AND end_date IS NOT NULL;

-- ============================================
-- FUNCTION: Auto-link trip to master contract
-- ============================================

CREATE OR REPLACE FUNCTION auto_link_trip_to_master_contract()
RETURNS TRIGGER AS $$
DECLARE
  v_master_contract_id UUID;
BEGIN
  -- Find active master contract for this guide
  SELECT id INTO v_master_contract_id
  FROM guide_contracts
  WHERE guide_id = NEW.guide_id
    AND is_master_contract = true
    AND status = 'active'
    AND (end_date IS NULL OR end_date >= CURRENT_DATE)
  ORDER BY created_at DESC
  LIMIT 1;

  -- Auto-link trip to master contract if found
  IF v_master_contract_id IS NOT NULL THEN
    INSERT INTO guide_contract_trips (
      contract_id,
      trip_id,
      trip_code,
      trip_date,
      fee_amount,
      status
    )
    SELECT 
      v_master_contract_id,
      NEW.trip_id,
      t.trip_code,
      t.trip_date,
      NEW.fee_amount,
      'pending'
    FROM trips t
    WHERE t.id = NEW.trip_id
    ON CONFLICT (contract_id, trip_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-link trip when assigned
CREATE TRIGGER trigger_auto_link_trip_to_master_contract
  AFTER INSERT ON trip_guides
  FOR EACH ROW
  WHEN (NEW.fee_amount IS NOT NULL)
  EXECUTE FUNCTION auto_link_trip_to_master_contract();

-- ============================================
-- FUNCTION: Check contract renewal
-- ============================================

CREATE OR REPLACE FUNCTION check_contract_renewal()
RETURNS TABLE (
  contract_id UUID,
  guide_id UUID,
  contract_number VARCHAR,
  renewal_date DATE,
  days_until_renewal INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    gc.id,
    gc.guide_id,
    gc.contract_number,
    gc.renewal_date,
    (gc.renewal_date - CURRENT_DATE)::INTEGER AS days_until_renewal
  FROM guide_contracts gc
  WHERE gc.is_master_contract = true
    AND gc.status = 'active'
    AND gc.renewal_date IS NOT NULL
    AND gc.renewal_date <= CURRENT_DATE + INTERVAL '30 days'
    AND gc.renewal_date >= CURRENT_DATE
  ORDER BY gc.renewal_date ASC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON COLUMN guide_contracts.is_master_contract IS 'True if this is a master contract (annual) that covers all trips';
COMMENT ON COLUMN guide_contracts.auto_cover_trips IS 'True if trips should be auto-linked to this contract';
COMMENT ON COLUMN guide_contracts.renewal_date IS 'Date when contract should be renewed (typically end_date)';
COMMENT ON COLUMN guide_contracts.previous_contract_id IS 'Link to previous contract for renewal history';
COMMENT ON COLUMN guide_contracts.fee_amount IS 'Optional: Fee in contract. For master contracts, fee is in trip_guides.fee_amount';
