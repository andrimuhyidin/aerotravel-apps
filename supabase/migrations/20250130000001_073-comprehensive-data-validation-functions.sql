-- Migration: 073-comprehensive-data-validation-functions.sql
-- Description: Comprehensive data validation functions for Guide Apps
-- Created: 2025-01-30
-- 
-- These functions validate data integrity, business rules, relationships,
-- data quality, and business logic for guide-related data.

-- ============================================
-- TYPE: Validation Result
-- ============================================
DO $$ BEGIN
  CREATE TYPE validation_severity AS ENUM ('critical', 'warning', 'info');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- FUNCTION: Validate Trip Data Integrity
-- ============================================
CREATE OR REPLACE FUNCTION validate_trip_data_integrity(p_trip_id UUID)
RETURNS TABLE(
  category TEXT,
  severity validation_severity,
  issue_type TEXT,
  description TEXT,
  affected_id UUID,
  details JSONB
) AS $$
DECLARE
  v_trip RECORD;
  v_guides_count INTEGER;
  v_guide RECORD;
  v_total_pax INTEGER;
  v_returned_count INTEGER;
  v_payment_count INTEGER;
BEGIN
  -- Get trip
  SELECT * INTO v_trip
  FROM trips
  WHERE id = p_trip_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT 
      'data_integrity'::TEXT,
      'critical'::validation_severity,
      'trip_not_found'::TEXT,
      'Trip not found'::TEXT,
      p_trip_id,
      '{}'::JSONB;
    RETURN;
  END IF;

  -- 1. Data Integrity: Trip must have at least 1 guide assigned
  SELECT COUNT(*) INTO v_guides_count
  FROM trip_guides
  WHERE trip_id = p_trip_id;

  IF v_guides_count = 0 THEN
    RETURN QUERY SELECT
      'relationships'::TEXT,
      'critical'::validation_severity,
      'no_guides_assigned'::TEXT,
      'Trip has no guides assigned'::TEXT,
      p_trip_id,
      jsonb_build_object('trip_code', v_trip.trip_code);
  END IF;

  -- 2. Data Integrity: Check foreign keys for trip_guides
  FOR v_guide IN
    SELECT tg.id, tg.guide_id, tg.trip_id
    FROM trip_guides tg
    WHERE tg.trip_id = p_trip_id
      AND NOT EXISTS (SELECT 1 FROM users WHERE id = tg.guide_id AND role = 'guide')
  LOOP
    RETURN QUERY SELECT
      'data_integrity'::TEXT,
      'critical'::validation_severity,
      'invalid_guide_reference'::TEXT,
      'Trip guide references invalid user or user is not a guide'::TEXT,
      v_guide.id,
      jsonb_build_object('guide_id', v_guide.guide_id, 'trip_id', v_guide.trip_id);
  END LOOP;

  -- 3. Business Rules: Completed trips must have documentation
  IF v_trip.status = 'completed' AND (v_trip.documentation_url IS NULL OR v_trip.documentation_url = '') THEN
    RETURN QUERY SELECT
      'business_rules'::TEXT,
      'critical'::validation_severity,
      'missing_documentation'::TEXT,
      'Completed trip missing documentation URL'::TEXT,
      p_trip_id,
      jsonb_build_object('trip_code', v_trip.trip_code, 'status', v_trip.status);
  END IF;

  -- 4. Business Rules: Completed trips must have all passengers returned
  IF v_trip.status = 'completed' THEN
    -- Get total passengers
    SELECT COALESCE(SUM(b.adult_pax + b.child_pax + b.infant_pax), 0) INTO v_total_pax
    FROM trip_bookings tb
    JOIN bookings b ON b.id = tb.booking_id
    WHERE tb.trip_id = p_trip_id;

    -- Get returned count
    SELECT COUNT(DISTINCT mc.passenger_id) INTO v_returned_count
    FROM manifest_checks mc
    JOIN booking_passengers bp ON bp.id = mc.passenger_id
    JOIN trip_bookings tb ON tb.booking_id = bp.booking_id
    WHERE tb.trip_id = p_trip_id
      AND mc.returned_at IS NOT NULL;

    IF v_total_pax > 0 AND v_returned_count < v_total_pax THEN
      RETURN QUERY SELECT
        'business_rules'::TEXT,
        'critical'::validation_severity,
        'passengers_not_returned'::TEXT,
        format('Not all passengers returned (%s/%s)', v_returned_count, v_total_pax)::TEXT,
        p_trip_id,
        jsonb_build_object('returned', v_returned_count, 'total', v_total_pax);
    END IF;
  END IF;

  -- 5. Payment Rules: Completed trips (with check_out_at) must have payment transaction
  FOR v_guide IN
    SELECT tg.id, tg.guide_id, tg.check_out_at
    FROM trip_guides tg
    WHERE tg.trip_id = p_trip_id
      AND tg.check_out_at IS NOT NULL
      AND tg.fee_amount > 0
      AND NOT EXISTS (
        SELECT 1
        FROM guide_wallet_transactions gwt
        JOIN guide_wallets gw ON gw.id = gwt.wallet_id
        WHERE gw.guide_id = tg.guide_id
          AND gwt.reference_type = 'trip'
          AND gwt.reference_id = p_trip_id
          AND gwt.transaction_type = 'earning'
      )
  LOOP
    RETURN QUERY SELECT
      'business_rules'::TEXT,
      'critical'::validation_severity,
      'missing_payment'::TEXT,
      'Guide checked out but payment transaction not found'::TEXT,
      v_guide.id,
      jsonb_build_object('guide_id', v_guide.guide_id, 'check_out_at', v_guide.check_out_at);
  END LOOP;

  -- 6. Date Consistency: check_in_at < check_out_at
  FOR v_guide IN
    SELECT id, guide_id, check_in_at, check_out_at
    FROM trip_guides
    WHERE trip_id = p_trip_id
      AND check_in_at IS NOT NULL
      AND check_out_at IS NOT NULL
      AND check_out_at < check_in_at
  LOOP
    RETURN QUERY SELECT
      'business_logic'::TEXT,
      'critical'::validation_severity,
      'invalid_date_order'::TEXT,
      'check_out_at is before check_in_at'::TEXT,
      v_guide.id,
      jsonb_build_object('check_in_at', v_guide.check_in_at, 'check_out_at', v_guide.check_out_at);
  END LOOP;

  -- 7. Date Consistency: check_out_at <= trip.completed_at (if trip completed)
  IF v_trip.status = 'completed' AND v_trip.completed_at IS NOT NULL THEN
    FOR v_guide IN
      SELECT id, guide_id, check_out_at
      FROM trip_guides
      WHERE trip_id = p_trip_id
        AND check_out_at IS NOT NULL
        AND check_out_at > v_trip.completed_at
    LOOP
      RETURN QUERY SELECT
        'business_logic'::TEXT,
        'warning'::validation_severity,
        'checkout_after_completion'::TEXT,
        'check_out_at is after trip completed_at'::TEXT,
        v_guide.id,
        jsonb_build_object('check_out_at', v_guide.check_out_at, 'completed_at', v_trip.completed_at);
    END LOOP;
  END IF;

  -- 8. Status Consistency: Trip status transitions
  -- Valid transitions: scheduled → confirmed → on_trip → completed
  -- This is more of a historical check, skip for now

  RETURN;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Validate Guide Data Integrity
-- ============================================
CREATE OR REPLACE FUNCTION validate_guide_data_integrity(p_guide_id UUID)
RETURNS TABLE(
  category TEXT,
  severity validation_severity,
  issue_type TEXT,
  description TEXT,
  affected_id UUID,
  details JSONB
) AS $$
DECLARE
  v_user RECORD;
  v_wallet RECORD;
  v_balance_calculated DECIMAL(14,2);
  v_active_contracts INTEGER;
  v_contract RECORD;
BEGIN
  -- Get user
  SELECT * INTO v_user
  FROM users
  WHERE id = p_guide_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT
      'data_integrity'::TEXT,
      'critical'::validation_severity,
      'guide_not_found'::TEXT,
      'Guide user not found'::TEXT,
      p_guide_id,
      '{}'::JSONB;
    RETURN;
  END IF;

  -- 1. Data Integrity: User must be a guide
  IF v_user.role != 'guide' THEN
    RETURN QUERY SELECT
      'data_integrity'::TEXT,
      'critical'::validation_severity,
      'invalid_role'::TEXT,
      'User is not a guide'::TEXT,
      p_guide_id,
      jsonb_build_object('role', v_user.role);
  END IF;

  -- 2. Data Quality: Guide should have wallet (will auto-create if missing, but check anyway)
  SELECT * INTO v_wallet
  FROM guide_wallets
  WHERE guide_id = p_guide_id;

  -- This is not critical as wallet is auto-created, just warning
  IF NOT FOUND THEN
    RETURN QUERY SELECT
      'data_quality'::TEXT,
      'warning'::validation_severity,
      'missing_wallet'::TEXT,
      'Guide does not have wallet (will be auto-created)'::TEXT,
      p_guide_id,
      '{}'::JSONB;
  ELSE
    -- 3. Payment Integrity: Wallet balance consistency
    v_balance_calculated := calculate_guide_wallet_balance(v_wallet.id);
    
    IF ABS(v_wallet.balance - v_balance_calculated) > 0.01 THEN
      RETURN QUERY SELECT
        'business_rules'::TEXT,
        'critical'::validation_severity,
        'balance_mismatch'::TEXT,
        format('Wallet balance mismatch: actual=%s, calculated=%s', v_wallet.balance, v_balance_calculated)::TEXT,
        v_wallet.id,
        jsonb_build_object('actual_balance', v_wallet.balance, 'calculated_balance', v_balance_calculated);
    END IF;

    -- 4. Payment Integrity: Wallet balance should not be negative
    IF v_wallet.balance < 0 THEN
      RETURN QUERY SELECT
        'business_rules'::TEXT,
        'critical'::validation_severity,
        'negative_balance'::TEXT,
        format('Wallet has negative balance: %s', v_wallet.balance)::TEXT,
        v_wallet.id,
        jsonb_build_object('balance', v_wallet.balance);
    END IF;
  END IF;

  -- 5. Contract Rules: Guide should not have overlapping active contracts
  SELECT COUNT(*) INTO v_active_contracts
  FROM guide_contracts
  WHERE guide_id = p_guide_id
    AND status = 'active'
    AND (end_date IS NULL OR end_date >= CURRENT_DATE);

  IF v_active_contracts > 1 THEN
    RETURN QUERY SELECT
      'business_rules'::TEXT,
      'warning'::validation_severity,
      'multiple_active_contracts'::TEXT,
      format('Guide has %s active contracts', v_active_contracts)::TEXT,
      p_guide_id,
      jsonb_build_object('active_contracts_count', v_active_contracts);
  END IF;

  -- 6. Contract Rules: Check contract trips consistency
  FOR v_contract IN
    SELECT gc.id, gc.contract_number
    FROM guide_contracts gc
    WHERE gc.guide_id = p_guide_id
      AND gc.is_master_contract = true
      AND gc.status = 'active'
  LOOP
    -- Check if contract trips link to valid trips
    IF EXISTS (
      SELECT 1
      FROM guide_contract_trips gct
      WHERE gct.contract_id = v_contract.id
        AND gct.trip_id IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM trips WHERE id = gct.trip_id)
    ) THEN
      RETURN QUERY SELECT
        'relationships'::TEXT,
        'critical'::validation_severity,
        'invalid_contract_trip'::TEXT,
        'Contract trip references invalid trip'::TEXT,
        v_contract.id,
        jsonb_build_object('contract_number', v_contract.contract_number);
    END IF;
  END LOOP;

  RETURN;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Validate Payment Integrity
-- ============================================
CREATE OR REPLACE FUNCTION validate_payment_integrity(p_wallet_id UUID)
RETURNS TABLE(
  category TEXT,
  severity validation_severity,
  issue_type TEXT,
  description TEXT,
  affected_id UUID,
  details JSONB
) AS $$
DECLARE
  v_wallet RECORD;
  v_balance_calculated DECIMAL(14,2);
  v_transaction RECORD;
  v_trip RECORD;
BEGIN
  -- Get wallet
  SELECT * INTO v_wallet
  FROM guide_wallets
  WHERE id = p_wallet_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT
      'data_integrity'::TEXT,
      'critical'::validation_severity,
      'wallet_not_found'::TEXT,
      'Wallet not found'::TEXT,
      p_wallet_id,
      '{}'::JSONB;
    RETURN;
  END IF;

  -- 1. Business Rules: Balance consistency
  v_balance_calculated := calculate_guide_wallet_balance(p_wallet_id);
  
  IF ABS(v_wallet.balance - v_balance_calculated) > 0.01 THEN
    RETURN QUERY SELECT
      'business_rules'::TEXT,
      'critical'::validation_severity,
      'balance_mismatch'::TEXT,
      format('Wallet balance mismatch: actual=%s, calculated=%s', v_wallet.balance, v_balance_calculated)::TEXT,
      p_wallet_id,
      jsonb_build_object('actual_balance', v_wallet.balance, 'calculated_balance', v_balance_calculated);
  END IF;

  -- 2. Business Rules: Balance should not be negative
  IF v_wallet.balance < 0 THEN
    RETURN QUERY SELECT
      'business_rules'::TEXT,
      'critical'::validation_severity,
      'negative_balance'::TEXT,
      format('Wallet has negative balance: %s', v_wallet.balance)::TEXT,
      p_wallet_id,
      jsonb_build_object('balance', v_wallet.balance);
  END IF;

  -- 3. Data Integrity: Validate transaction references
  FOR v_transaction IN
    SELECT gwt.id, gwt.reference_type, gwt.reference_id, gwt.transaction_type, gwt.amount
    FROM guide_wallet_transactions gwt
    WHERE gwt.wallet_id = p_wallet_id
      AND gwt.reference_type IS NOT NULL
      AND gwt.reference_id IS NOT NULL
  LOOP
    -- Validate trip reference
    IF v_transaction.reference_type = 'trip' THEN
      SELECT * INTO v_trip
      FROM trips
      WHERE id = v_transaction.reference_id;

      IF NOT FOUND THEN
        RETURN QUERY SELECT
          'data_integrity'::TEXT,
          'critical'::validation_severity,
          'invalid_trip_reference'::TEXT,
          'Transaction references invalid trip'::TEXT,
          v_transaction.id,
          jsonb_build_object('reference_id', v_transaction.reference_id, 'transaction_type', v_transaction.transaction_type);
      END IF;

      -- For earning transactions, check if trip was completed
      IF v_transaction.transaction_type = 'earning' THEN
        IF NOT EXISTS (
          SELECT 1
          FROM trip_guides
          WHERE trip_id = v_transaction.reference_id
            AND guide_id = v_wallet.guide_id
            AND check_out_at IS NOT NULL
        ) THEN
          RETURN QUERY SELECT
            'business_rules'::TEXT,
            'warning'::validation_severity,
            'payment_before_completion'::TEXT,
            'Earning transaction exists but trip not completed yet'::TEXT,
            v_transaction.id,
            jsonb_build_object('trip_id', v_transaction.reference_id);
        END IF;
      END IF;
    END IF;
  END LOOP;

  -- 4. Business Rules: Transaction amounts validation
  FOR v_transaction IN
    SELECT id, transaction_type, amount
    FROM guide_wallet_transactions
    WHERE wallet_id = p_wallet_id
      AND amount = 0
  LOOP
    RETURN QUERY SELECT
      'business_rules'::TEXT,
      'warning'::validation_severity,
      'zero_amount_transaction'::TEXT,
      'Transaction has zero amount'::TEXT,
      v_transaction.id,
      jsonb_build_object('transaction_type', v_transaction.transaction_type);
  END LOOP;

  RETURN;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Validate All Trips Integrity
-- ============================================
CREATE OR REPLACE FUNCTION validate_all_trips_integrity()
RETURNS TABLE(
  trip_id UUID,
  trip_code VARCHAR,
  issues_count INTEGER,
  critical_count INTEGER,
  warnings_count INTEGER,
  issues JSONB
) AS $$
DECLARE
  v_trip RECORD;
  v_issue RECORD;
  v_issues JSONB;
  v_critical_count INTEGER;
  v_warnings_count INTEGER;
BEGIN
  FOR v_trip IN
    SELECT t.id, t.trip_code
    FROM trips t
    ORDER BY t.created_at DESC
  LOOP
    v_issues := '[]'::JSONB;
    v_critical_count := 0;
    v_warnings_count := 0;

    -- Collect all issues for this trip
    FOR v_issue IN
      SELECT * FROM validate_trip_data_integrity(v_trip.id)
    LOOP
      v_issues := v_issues || jsonb_build_object(
        'category', v_issue.category,
        'severity', v_issue.severity,
        'type', v_issue.issue_type,
        'description', v_issue.description,
        'details', v_issue.details
      );

      IF v_issue.severity = 'critical' THEN
        v_critical_count := v_critical_count + 1;
      ELSIF v_issue.severity = 'warning' THEN
        v_warnings_count := v_warnings_count + 1;
      END IF;
    END LOOP;

    -- Only return trips with issues
    IF jsonb_array_length(v_issues) > 0 THEN
      RETURN QUERY SELECT
        v_trip.id,
        v_trip.trip_code,
        jsonb_array_length(v_issues),
        v_critical_count,
        v_warnings_count,
        v_issues;
    END IF;
  END LOOP;

  RETURN;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Validate All Guides Integrity
-- ============================================
CREATE OR REPLACE FUNCTION validate_all_guides_integrity()
RETURNS TABLE(
  guide_id UUID,
  guide_name VARCHAR,
  issues_count INTEGER,
  critical_count INTEGER,
  warnings_count INTEGER,
  issues JSONB
) AS $$
DECLARE
  v_guide RECORD;
  v_issue RECORD;
  v_issues JSONB;
  v_critical_count INTEGER;
  v_warnings_count INTEGER;
BEGIN
  FOR v_guide IN
    SELECT id, full_name
    FROM users
    WHERE role = 'guide'
    ORDER BY created_at DESC
  LOOP
    v_issues := '[]'::JSONB;
    v_critical_count := 0;
    v_warnings_count := 0;

    -- Collect all issues for this guide
    FOR v_issue IN
      SELECT * FROM validate_guide_data_integrity(v_guide.id)
    LOOP
      v_issues := v_issues || jsonb_build_object(
        'category', v_issue.category,
        'severity', v_issue.severity,
        'type', v_issue.issue_type,
        'description', v_issue.description,
        'details', v_issue.details
      );

      IF v_issue.severity = 'critical' THEN
        v_critical_count := v_critical_count + 1;
      ELSIF v_issue.severity = 'warning' THEN
        v_warnings_count := v_warnings_count + 1;
      END IF;
    END LOOP;

    -- Only return guides with issues
    IF jsonb_array_length(v_issues) > 0 THEN
      RETURN QUERY SELECT
        v_guide.id,
        v_guide.full_name,
        jsonb_array_length(v_issues),
        v_critical_count,
        v_warnings_count,
        v_issues;
    END IF;
  END LOOP;

  RETURN;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON FUNCTION validate_trip_data_integrity(UUID) IS 
  'Validate data integrity, business rules, and relationships for a specific trip. Returns validation issues.';

COMMENT ON FUNCTION validate_guide_data_integrity(UUID) IS 
  'Validate data integrity, business rules, and relationships for a specific guide. Returns validation issues.';

COMMENT ON FUNCTION validate_payment_integrity(UUID) IS 
  'Validate payment/wallet integrity for a specific wallet. Returns validation issues.';

COMMENT ON FUNCTION validate_all_trips_integrity() IS 
  'Validate all trips in the system. Returns trips with issues only.';

COMMENT ON FUNCTION validate_all_guides_integrity() IS 
  'Validate all guides in the system. Returns guides with issues only.';

