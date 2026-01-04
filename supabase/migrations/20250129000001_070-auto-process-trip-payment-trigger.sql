-- Migration: 070-auto-process-trip-payment-trigger.sql
-- Description: Auto-process payment when trip check_out_at is set
-- Created: 2025-01-29
-- 
-- This trigger automatically creates wallet transactions when a guide checks out from a trip.
-- It ensures all completed trips have corresponding payment transactions, preventing
-- inconsistencies between trip completion and earnings.

-- ============================================
-- FUNCTION: Auto-process trip payment
-- ============================================
CREATE OR REPLACE FUNCTION auto_process_trip_payment()
RETURNS TRIGGER AS $$
DECLARE
  v_wallet_id UUID;
  v_balance_before DECIMAL(14,2);
  v_balance_after DECIMAL(14,2);
  v_fee_amount DECIMAL(14,2);
  v_trip_code VARCHAR(20);
  v_master_contract_id UUID;
  v_transaction_id UUID;
BEGIN
  -- Only process if check_out_at is just set (was NULL, now NOT NULL)
  IF OLD.check_out_at IS NULL AND NEW.check_out_at IS NOT NULL THEN
    -- Validate fee_amount exists and is positive
    IF NEW.fee_amount IS NULL OR NEW.fee_amount <= 0 THEN
      -- Skip processing if no fee (log but don't fail)
      RAISE WARNING 'Trip % for guide % has no fee_amount, skipping payment processing', NEW.trip_id, NEW.guide_id;
      RETURN NEW;
    END IF;

    -- Check if payment already exists (prevent duplicates)
    SELECT gwt.id INTO v_transaction_id
    FROM guide_wallet_transactions gwt
    JOIN guide_wallets gw ON gw.id = gwt.wallet_id
    WHERE gw.guide_id = NEW.guide_id
      AND gwt.reference_type = 'trip'
      AND gwt.reference_id = NEW.trip_id
      AND gwt.transaction_type = 'earning'
    LIMIT 1;

    IF v_transaction_id IS NOT NULL THEN
      -- Payment already exists, skip processing
      RETURN NEW;
    END IF;

    -- Get trip code for description
    SELECT trip_code INTO v_trip_code
    FROM trips
    WHERE id = NEW.trip_id;

    -- Get or create wallet
    SELECT id, balance INTO v_wallet_id, v_balance_before
    FROM guide_wallets
    WHERE guide_id = NEW.guide_id;

    IF v_wallet_id IS NULL THEN
      -- Create wallet if doesn't exist
      INSERT INTO guide_wallets (guide_id, balance, created_at, updated_at)
      VALUES (NEW.guide_id, 0, NOW(), NOW())
      RETURNING id, balance INTO v_wallet_id, v_balance_before;
    END IF;

    -- Calculate new balance
    v_fee_amount := NEW.fee_amount;
    v_balance_after := v_balance_before + v_fee_amount;

    -- Create transaction with check_out_at as created_at (preserve timing for consistency)
    INSERT INTO guide_wallet_transactions (
      wallet_id,
      transaction_type,
      amount,
      balance_before,
      balance_after,
      reference_type,
      reference_id,
      description,
      status,
      created_at
    ) VALUES (
      v_wallet_id,
      'earning',
      v_fee_amount,
      v_balance_before,
      v_balance_after,
      'trip',
      NEW.trip_id,
      COALESCE('Pembayaran trip ' || v_trip_code, 'Pembayaran trip ' || NEW.trip_id),
      'completed',
      NEW.check_out_at  -- Use check_out_at as created_at for date consistency
    )
    RETURNING id INTO v_transaction_id;

    -- Link to master contract if exists (optional, for tracking)
    SELECT id INTO v_master_contract_id
    FROM guide_contracts
    WHERE guide_id = NEW.guide_id
      AND is_master_contract = true
      AND status = 'active'
      AND (end_date IS NULL OR end_date >= CURRENT_DATE)
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_master_contract_id IS NOT NULL THEN
      -- Link payment to master contract (don't fail if this fails)
      BEGIN
        INSERT INTO guide_contract_payments (
          contract_id,
          wallet_transaction_id,
          amount,
          payment_date,
          payment_method,
          notes
        ) VALUES (
          v_master_contract_id,
          v_transaction_id,
          v_fee_amount,
          DATE(NEW.check_out_at),
          'wallet',
          'Auto-processed payment for trip ' || COALESCE(v_trip_code, NEW.trip_id::TEXT)
        )
        ON CONFLICT DO NOTHING;  -- Prevent duplicate if trigger runs multiple times
      EXCEPTION
        WHEN OTHERS THEN
          -- Log but don't fail the transaction
          RAISE WARNING 'Failed to link payment to contract % for trip %: %', 
            v_master_contract_id, NEW.trip_id, SQLERRM;
      END;

      -- Update contract_trips status to completed (don't fail if this fails)
      BEGIN
        UPDATE guide_contract_trips
        SET status = 'completed',
            completed_at = NEW.check_out_at
        WHERE contract_id = v_master_contract_id
          AND trip_id = NEW.trip_id
          AND status != 'completed';
      EXCEPTION
        WHEN OTHERS THEN
          -- Log but don't fail the transaction
          RAISE WARNING 'Failed to update contract_trips status for contract % trip %: %', 
            v_master_contract_id, NEW.trip_id, SQLERRM;
      END;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGER: Auto-process payment on check-out
-- ============================================
DROP TRIGGER IF EXISTS trigger_auto_process_trip_payment ON trip_guides;

CREATE TRIGGER trigger_auto_process_trip_payment
  AFTER UPDATE ON trip_guides
  FOR EACH ROW
  WHEN (OLD.check_out_at IS NULL AND NEW.check_out_at IS NOT NULL)
  EXECUTE FUNCTION auto_process_trip_payment();

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON FUNCTION auto_process_trip_payment() IS 
  'Automatically creates wallet transaction when guide checks out from a trip. Ensures all completed trips have corresponding payment transactions.';

