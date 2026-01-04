-- Migration: 071-backfill-missing-payments-cron.sql
-- Description: Function and cron job for backfilling missing trip payments
-- Created: 2025-01-29
-- 
-- This function processes payments for completed trips that don't have wallet transactions yet.
-- This is needed to fix historical data before the auto-process trigger was in place.

-- ============================================
-- ENABLE PG_CRON EXTENSION (if not exists)
-- ============================================
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================
-- FUNCTION: Process missing trip payments
-- ============================================
CREATE OR REPLACE FUNCTION process_missing_trip_payments()
RETURNS TABLE(
  processed_count INTEGER,
  trip_ids UUID[]
) AS $$
DECLARE
  v_trip_guide RECORD;
  v_wallet_id UUID;
  v_balance_before DECIMAL(14,2);
  v_balance_after DECIMAL(14,2);
  v_fee_amount DECIMAL(14,2);
  v_trip_code VARCHAR(20);
  v_transaction_id UUID;
  v_processed_count INTEGER := 0;
  v_trip_ids UUID[] := ARRAY[]::UUID[];
  v_master_contract_id UUID;
BEGIN
  -- Find completed trips without payment (check_out_at exists but no transaction)
  -- Only process trips completed > 1 hour ago to avoid race conditions with trigger
  FOR v_trip_guide IN
    SELECT 
      tg.id,
      tg.trip_id,
      tg.guide_id,
      tg.fee_amount,
      tg.check_out_at,
      t.trip_code,
      t.branch_id
    FROM trip_guides tg
    JOIN trips t ON t.id = tg.trip_id
    WHERE tg.check_out_at IS NOT NULL
      AND tg.fee_amount IS NOT NULL
      AND tg.fee_amount > 0
      AND tg.check_out_at < NOW() - INTERVAL '1 hour'  -- Only process trips completed > 1 hour ago
      AND NOT EXISTS (
        SELECT 1 
        FROM guide_wallet_transactions gwt
        JOIN guide_wallets gw ON gw.id = gwt.wallet_id
        WHERE gw.guide_id = tg.guide_id
          AND gwt.reference_type = 'trip'
          AND gwt.reference_id = tg.trip_id
          AND gwt.transaction_type = 'earning'
      )
    ORDER BY tg.check_out_at ASC
    LIMIT 100  -- Process batch of 100 trips per run
  LOOP
    BEGIN
      -- Get or create wallet
      SELECT id, balance INTO v_wallet_id, v_balance_before
      FROM guide_wallets
      WHERE guide_id = v_trip_guide.guide_id;

      IF v_wallet_id IS NULL THEN
        -- Create wallet if doesn't exist
        INSERT INTO guide_wallets (guide_id, balance, created_at, updated_at)
        VALUES (v_trip_guide.guide_id, 0, NOW(), NOW())
        RETURNING id, balance INTO v_wallet_id, v_balance_before;
      END IF;

      -- Calculate new balance
      v_fee_amount := v_trip_guide.fee_amount;
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
        v_trip_guide.trip_id,
        COALESCE('Pembayaran trip ' || v_trip_guide.trip_code, 'Pembayaran trip ' || v_trip_guide.trip_id::TEXT),
        'completed',
        v_trip_guide.check_out_at  -- Use check_out_at as created_at for date consistency
      )
      RETURNING id INTO v_transaction_id;

      -- Link to master contract if exists (optional, for tracking)
      SELECT id INTO v_master_contract_id
      FROM guide_contracts
      WHERE guide_id = v_trip_guide.guide_id
        AND is_master_contract = true
        AND status = 'active'
        AND (end_date IS NULL OR end_date >= DATE(v_trip_guide.check_out_at))
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
            DATE(v_trip_guide.check_out_at),
            'wallet',
            'Backfilled payment for trip ' || COALESCE(v_trip_guide.trip_code, v_trip_guide.trip_id::TEXT)
          )
          ON CONFLICT DO NOTHING;
        EXCEPTION
          WHEN OTHERS THEN
            -- Log but don't fail
            RAISE WARNING 'Failed to link backfilled payment to contract % for trip %: %', 
              v_master_contract_id, v_trip_guide.trip_id, SQLERRM;
        END;

        -- Update contract_trips status to completed (don't fail if this fails)
        BEGIN
          UPDATE guide_contract_trips
          SET status = 'completed',
              completed_at = v_trip_guide.check_out_at
          WHERE contract_id = v_master_contract_id
            AND trip_id = v_trip_guide.trip_id
            AND status != 'completed';
        EXCEPTION
          WHEN OTHERS THEN
            -- Log but don't fail
            RAISE WARNING 'Failed to update contract_trips status for contract % trip %: %', 
              v_master_contract_id, v_trip_guide.trip_id, SQLERRM;
        END;
      END IF;

      v_processed_count := v_processed_count + 1;
      v_trip_ids := array_append(v_trip_ids, v_trip_guide.trip_id);

    EXCEPTION
      WHEN OTHERS THEN
        -- Log error but continue processing other trips
        RAISE WARNING 'Failed to process payment for trip % (guide %): %', 
          v_trip_guide.trip_id, v_trip_guide.guide_id, SQLERRM;
    END;
  END LOOP;

  RETURN QUERY SELECT v_processed_count, v_trip_ids;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- CRON JOB SCHEDULE
-- ============================================
-- Schedule job to run every hour to process missing payments
-- Note: Uncomment and adjust when ready to use (requires pg_cron extension enabled)
/*
SELECT cron.schedule(
  'backfill-missing-trip-payments',
  '0 * * * *',  -- Every hour at minute 0
  $$SELECT process_missing_trip_payments();$$
);
*/

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON FUNCTION process_missing_trip_payments() IS 
  'Process payments for completed trips that don''t have wallet transactions yet. Processes up to 100 trips per run. Only processes trips completed > 1 hour ago to avoid race conditions with trigger.';

