-- Migration: 072-wallet-balance-consistency-check.sql
-- Description: Functions for wallet balance consistency checking and fixing
-- Created: 2025-01-29
-- 
-- These functions help detect and fix wallet balance inconsistencies
-- by comparing actual balance with calculated balance from transactions.

-- ============================================
-- FUNCTION: Check wallet balance consistency
-- ============================================
CREATE OR REPLACE FUNCTION check_wallet_balance_consistency()
RETURNS TABLE(
  wallet_id UUID,
  guide_id UUID,
  expected_balance DECIMAL(14,2),
  actual_balance DECIMAL(14,2),
  difference DECIMAL(14,2)
) AS $$
BEGIN
  RETURN QUERY
  WITH calculated_balances AS (
    SELECT 
      gw.id AS wallet_id,
      gw.guide_id,
      calculate_guide_wallet_balance(gw.id) AS expected_balance,
      gw.balance AS actual_balance,
      calculate_guide_wallet_balance(gw.id) - gw.balance AS difference
    FROM guide_wallets gw
  )
  SELECT 
    cb.wallet_id,
    cb.guide_id,
    cb.expected_balance,
    cb.actual_balance,
    cb.difference
  FROM calculated_balances cb
  WHERE ABS(cb.difference) > 0.01  -- Allow for rounding differences (0.01)
  ORDER BY ABS(cb.difference) DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Fix wallet balance for specific wallet
-- ============================================
CREATE OR REPLACE FUNCTION fix_wallet_balance(p_wallet_id UUID)
RETURNS TABLE(
  wallet_id UUID,
  old_balance DECIMAL(14,2),
  new_balance DECIMAL(14,2),
  fixed BOOLEAN
) AS $$
DECLARE
  v_old_balance DECIMAL(14,2);
  v_new_balance DECIMAL(14,2);
BEGIN
  -- Get current balance
  SELECT balance INTO v_old_balance
  FROM guide_wallets
  WHERE id = p_wallet_id;

  IF v_old_balance IS NULL THEN
    -- Wallet doesn't exist
    RETURN QUERY SELECT p_wallet_id, 0::DECIMAL(14,2), 0::DECIMAL(14,2), false;
    RETURN;
  END IF;

  -- Calculate correct balance from transactions
  v_new_balance := calculate_guide_wallet_balance(p_wallet_id);

  -- Update wallet balance if different
  IF ABS(v_old_balance - v_new_balance) > 0.01 THEN
    UPDATE guide_wallets
    SET balance = v_new_balance,
        updated_at = NOW()
    WHERE id = p_wallet_id;

    wallet_id := p_wallet_id;
    old_balance := v_old_balance;
    new_balance := v_new_balance;
    fixed := true;
    RETURN NEXT;
  ELSE
    -- Balance is already correct (within rounding tolerance)
    wallet_id := p_wallet_id;
    old_balance := v_old_balance;
    new_balance := v_new_balance;
    fixed := false;
    RETURN NEXT;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Fix all wallet balances
-- ============================================
CREATE OR REPLACE FUNCTION fix_all_wallet_balances()
RETURNS TABLE(
  wallet_id UUID,
  old_balance DECIMAL(14,2),
  new_balance DECIMAL(14,2),
  fixed BOOLEAN
) AS $$
DECLARE
  v_wallet RECORD;
  v_result RECORD;
BEGIN
  -- Get all wallets with balance inconsistencies
  FOR v_wallet IN
    SELECT w.id, w.guide_id
    FROM check_wallet_balance_consistency() w
  LOOP
    -- Fix each wallet
    FOR v_result IN
      SELECT * FROM fix_wallet_balance(v_wallet.wallet_id)
    LOOP
      RETURN NEXT v_result;
    END LOOP;
  END LOOP;

  RETURN;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON FUNCTION check_wallet_balance_consistency() IS 
  'Check all wallets for balance inconsistencies. Returns wallets where calculated balance differs from actual balance.';

COMMENT ON FUNCTION fix_wallet_balance(UUID) IS 
  'Fix balance for a specific wallet by recalculating from transactions and updating wallet balance.';

COMMENT ON FUNCTION fix_all_wallet_balances() IS 
  'Fix all wallets with balance inconsistencies by recalculating from transactions.';

