-- Migration: 075-data-fix-functions.sql
-- Description: Optional functions for auto-fixing common data issues
-- Created: 2025-01-30
-- 
-- WARNING: These functions modify data. They should only be used after careful review
-- and approval. Always backup data before running fix functions.

-- ============================================
-- FUNCTION: Fix Orphaned Trip Guides
-- ============================================
-- Removes trip_guides records where trip_id or guide_id no longer exists
CREATE OR REPLACE FUNCTION fix_orphaned_trip_guides()
RETURNS TABLE(
  removed_count INTEGER,
  removed_ids UUID[]
) AS $$
DECLARE
  v_removed_ids UUID[] := ARRAY[]::UUID[];
  v_trip_guide RECORD;
  v_count INTEGER := 0;
BEGIN
  -- Find and remove orphaned trip_guides
  FOR v_trip_guide IN
    SELECT tg.id, tg.trip_id, tg.guide_id
    FROM trip_guides tg
    WHERE NOT EXISTS (SELECT 1 FROM trips WHERE id = tg.trip_id)
       OR NOT EXISTS (SELECT 1 FROM users WHERE id = tg.guide_id AND role = 'guide')
  LOOP
    DELETE FROM trip_guides WHERE id = v_trip_guide.id;
    v_removed_ids := array_append(v_removed_ids, v_trip_guide.id);
    v_count := v_count + 1;
  END LOOP;

  RETURN QUERY SELECT v_count, v_removed_ids;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Fix Missing Wallets
-- ============================================
-- Creates missing wallets for guides that don't have one
CREATE OR REPLACE FUNCTION fix_missing_wallets()
RETURNS TABLE(
  created_count INTEGER,
  created_wallet_ids UUID[]
) AS $$
DECLARE
  v_created_ids UUID[] := ARRAY[]::UUID[];
  v_wallet_id UUID;
  v_guide RECORD;
  v_count INTEGER := 0;
BEGIN
  -- Find guides without wallets
  FOR v_guide IN
    SELECT u.id
    FROM users u
    WHERE u.role = 'guide'
      AND NOT EXISTS (SELECT 1 FROM guide_wallets WHERE guide_id = u.id)
  LOOP
    INSERT INTO guide_wallets (guide_id, balance)
    VALUES (v_guide.id, 0)
    RETURNING id INTO v_wallet_id;

    v_created_ids := array_append(v_created_ids, v_wallet_id);
    v_count := v_count + 1;
  END LOOP;

  RETURN QUERY SELECT v_count, v_created_ids;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Fix Balance Mismatches
-- ============================================
-- Recalculates and fixes wallet balances that don't match calculated balance
CREATE OR REPLACE FUNCTION fix_balance_mismatches()
RETURNS TABLE(
  fixed_count INTEGER,
  fixed_wallet_ids UUID[]
) AS $$
DECLARE
  v_fixed_ids UUID[] := ARRAY[]::UUID[];
  v_wallet RECORD;
  v_calculated_balance DECIMAL(14,2);
  v_count INTEGER := 0;
BEGIN
  -- Find wallets with balance mismatches
  FOR v_wallet IN
    SELECT gw.id, gw.guide_id, gw.balance
    FROM guide_wallets gw
    WHERE ABS(gw.balance - calculate_guide_wallet_balance(gw.id)) > 0.01
  LOOP
    v_calculated_balance := calculate_guide_wallet_balance(v_wallet.id);

    -- Update wallet balance
    UPDATE guide_wallets
    SET balance = v_calculated_balance,
        updated_at = NOW()
    WHERE id = v_wallet.id;

    v_fixed_ids := array_append(v_fixed_ids, v_wallet.id);
    v_count := v_count + 1;
  END LOOP;

  RETURN QUERY SELECT v_count, v_fixed_ids;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Fix Date Inconsistencies
-- ============================================
-- Updates transaction created_at to match check_out_at for trip payments
-- Only fixes transactions where difference is > 24 hours
CREATE OR REPLACE FUNCTION fix_date_inconsistencies()
RETURNS TABLE(
  fixed_count INTEGER,
  fixed_transaction_ids UUID[]
) AS $$
DECLARE
  v_fixed_ids UUID[] := ARRAY[]::UUID[];
  v_transaction RECORD;
  v_check_out_at TIMESTAMPTZ;
  v_count INTEGER := 0;
BEGIN
  -- Find transactions with date inconsistencies
  FOR v_transaction IN
    SELECT 
      gwt.id,
      gwt.reference_id,
      gwt.created_at,
      gwt.wallet_id
    FROM guide_wallet_transactions gwt
    JOIN guide_wallets gw ON gw.id = gwt.wallet_id
    WHERE gwt.reference_type = 'trip'
      AND gwt.transaction_type = 'earning'
      AND gwt.reference_id IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM trip_guides tg
        WHERE tg.trip_id = gwt.reference_id
          AND tg.guide_id = gw.guide_id
          AND tg.check_out_at IS NOT NULL
          AND ABS(EXTRACT(EPOCH FROM (gwt.created_at - tg.check_out_at))) > 86400 -- > 24 hours
      )
  LOOP
    -- Get check_out_at for this trip
    SELECT tg.check_out_at INTO v_check_out_at
    FROM trip_guides tg
    JOIN guide_wallets gw ON gw.guide_id = tg.guide_id
    WHERE tg.trip_id = v_transaction.reference_id
      AND gw.id = v_transaction.wallet_id
      AND tg.check_out_at IS NOT NULL
    LIMIT 1;

    IF v_check_out_at IS NOT NULL THEN
      -- Update transaction created_at
      UPDATE guide_wallet_transactions
      SET created_at = v_check_out_at
      WHERE id = v_transaction.id;

      v_fixed_ids := array_append(v_fixed_ids, v_transaction.id);
      v_count := v_count + 1;
    END IF;
  END LOOP;

  RETURN QUERY SELECT v_count, v_fixed_ids;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Fix Negative Wallet Balances
-- ============================================
-- Resets negative wallet balances to 0 (with warning)
-- Should be investigated before running
CREATE OR REPLACE FUNCTION fix_negative_balances()
RETURNS TABLE(
  fixed_count INTEGER,
  fixed_wallet_ids UUID[]
) AS $$
DECLARE
  v_fixed_ids UUID[] := ARRAY[]::UUID[];
  v_wallet RECORD;
  v_count INTEGER := 0;
BEGIN
  -- Find wallets with negative balances
  FOR v_wallet IN
    SELECT id, guide_id, balance
    FROM guide_wallets
    WHERE balance < 0
  LOOP
    -- Reset to 0 (should be investigated first)
    UPDATE guide_wallets
    SET balance = 0,
        updated_at = NOW()
    WHERE id = v_wallet.id;

    v_fixed_ids := array_append(v_fixed_ids, v_wallet.id);
    v_count := v_count + 1;

    -- Log warning
    RAISE WARNING 'Reset negative balance for wallet % (guide: %). Original balance: %', 
      v_wallet.id, v_wallet.guide_id, v_wallet.balance;
  END LOOP;

  RETURN QUERY SELECT v_count, v_fixed_ids;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Fix Missing Payment Transactions (Dry Run)
-- ============================================
-- This is just a check - actual fix should use process_missing_trip_payments
-- which is already implemented in migration 071-backfill-missing-payments-cron.sql
-- This function returns count of missing payments for review
CREATE OR REPLACE FUNCTION check_missing_payments_count()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM trip_guides tg
  WHERE tg.check_out_at IS NOT NULL
    AND tg.fee_amount > 0
    AND NOT EXISTS (
      SELECT 1 FROM guide_wallet_transactions gwt
      JOIN guide_wallets gw ON gw.id = gwt.wallet_id
      WHERE gw.guide_id = tg.guide_id
        AND gwt.reference_type = 'trip'
        AND gwt.reference_id = tg.trip_id
        AND gwt.transaction_type = 'earning'
    )
    AND tg.check_out_at < NOW() - INTERVAL '1 hour';

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON FUNCTION fix_orphaned_trip_guides() IS 
  'WARNING: Removes orphaned trip_guides records. Review before execution.';

COMMENT ON FUNCTION fix_missing_wallets() IS 
  'Creates missing wallets for guides. Safe to run.';

COMMENT ON FUNCTION fix_balance_mismatches() IS 
  'WARNING: Recalculates wallet balances. Review mismatches before execution.';

COMMENT ON FUNCTION fix_date_inconsistencies() IS 
  'WARNING: Updates transaction dates to match check_out_at. Review before execution.';

COMMENT ON FUNCTION fix_negative_balances() IS 
  'WARNING: Resets negative balances to 0. Investigate cause before execution.';

COMMENT ON FUNCTION check_missing_payments_count() IS 
  'Returns count of trips missing payment transactions. Use process_missing_trip_payments() to fix.';

