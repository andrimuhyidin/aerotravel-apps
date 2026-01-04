-- Migration: 024-guide-wallet-comprehensive-sample.sql
-- Description: Comprehensive sample data for Guide Wallet features
-- Created: 2025-12-19

BEGIN;

DO $$
DECLARE
  sample_guide_id UUID;
  v_wallet_id UUID;
  trip1_id UUID := '00000000-0000-0000-0000-000000000001';
  trip2_id UUID := '00000000-0000-0000-0000-000000000002';
  trip3_id UUID := '00000000-0000-0000-0000-000000000003';
  trip4_id UUID := '00000000-0000-0000-0000-000000000004';
  current_balance DECIMAL(14,2) := 0;
  bal DECIMAL(14,2) := 0;
BEGIN
  -- Get guide user
  SELECT id INTO sample_guide_id FROM users WHERE role = 'guide' LIMIT 1;
  IF sample_guide_id IS NULL THEN
    RAISE NOTICE 'No guide found, skipping wallet sample data';
    RETURN;
  END IF;

  -- Get or create wallet
  SELECT id, balance INTO v_wallet_id, current_balance 
  FROM guide_wallets 
  WHERE guide_id = sample_guide_id;
  
  IF v_wallet_id IS NULL THEN
    INSERT INTO guide_wallets (guide_id, balance, updated_at)
    VALUES (sample_guide_id, 1250000, NOW())
    RETURNING id, balance INTO v_wallet_id, current_balance;
  END IF;

  -- ============================================
  -- WALLET TRANSACTIONS (Earnings)
  -- ============================================
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guide_wallet_transactions') THEN
    -- Delete existing transactions for clean sample
    DELETE FROM guide_wallet_transactions WHERE guide_wallet_transactions.wallet_id = v_wallet_id;
    
    -- Reset balance
    bal := 0;
    
    -- Trip 3 (completed 7 days ago)
    INSERT INTO guide_wallet_transactions (wallet_id, transaction_type, amount, balance_before, balance_after, reference_type, reference_id, status, description, created_at)
    VALUES (v_wallet_id, 'earning', 350000, bal, bal + 350000, 'trip', trip3_id, 'completed', 'Fee trip AT-PHW-2399', NOW() - INTERVAL '7 days');
    bal := bal + 350000;
    
    INSERT INTO guide_wallet_transactions (wallet_id, transaction_type, amount, balance_before, balance_after, reference_type, reference_id, status, description, created_at)
    VALUES (v_wallet_id, 'earning', 50000, bal, bal + 50000, 'trip', trip3_id, 'completed', 'Bonus rating 5.0', NOW() - INTERVAL '7 days');
    bal := bal + 50000;
    
    -- Trip 4 (completed 3 days ago)
    INSERT INTO guide_wallet_transactions (wallet_id, transaction_type, amount, balance_before, balance_after, reference_type, reference_id, status, description, created_at)
    VALUES (v_wallet_id, 'earning', 400000, bal, bal + 400000, 'trip', trip4_id, 'completed', 'Fee trip AT-PHW-2400', NOW() - INTERVAL '3 days');
    bal := bal + 400000;
    
    INSERT INTO guide_wallet_transactions (wallet_id, transaction_type, amount, balance_before, balance_after, reference_type, reference_id, status, description, created_at)
    VALUES (v_wallet_id, 'earning', 30000, bal, bal + 30000, 'trip', trip4_id, 'completed', 'Bonus on-time', NOW() - INTERVAL '3 days');
    bal := bal + 30000;
    
    -- Adjustment (bonus)
    INSERT INTO guide_wallet_transactions (wallet_id, transaction_type, amount, balance_before, balance_after, reference_type, reference_id, status, description, created_at)
    VALUES (v_wallet_id, 'adjustment', 100000, bal, bal + 100000, NULL, NULL, 'approved', 'Bonus bulanan Desember 2025', NOW() - INTERVAL '2 days');
    bal := bal + 100000;
    
    -- Withdraw approved (last week) - process before pending
    INSERT INTO guide_wallet_transactions (wallet_id, transaction_type, amount, balance_before, balance_after, reference_type, reference_id, status, description, created_at)
    VALUES (v_wallet_id, 'withdraw_request', 300000, bal, bal - 300000, NULL, NULL, 'approved', 'Tarik dana ke rekening', NOW() - INTERVAL '10 days');
    bal := bal - 300000;
    
    INSERT INTO guide_wallet_transactions (wallet_id, transaction_type, amount, balance_before, balance_after, reference_type, reference_id, status, description, created_at)
    VALUES (v_wallet_id, 'withdraw_approved', 300000, bal, bal, NULL, NULL, 'completed', 'Penarikan disetujui', NOW() - INTERVAL '9 days');
    
    -- More earnings (this month)
    INSERT INTO guide_wallet_transactions (wallet_id, transaction_type, amount, balance_before, balance_after, reference_type, reference_id, status, description, created_at)
    VALUES (v_wallet_id, 'earning', 300000, bal, bal + 300000, 'trip', trip1_id, 'completed', 'Fee trip AT-PHW-2401', NOW() - INTERVAL '2 hours');
    bal := bal + 300000;
    
    INSERT INTO guide_wallet_transactions (wallet_id, transaction_type, amount, balance_before, balance_after, reference_type, reference_id, status, description, created_at)
    VALUES (v_wallet_id, 'earning', 25000, bal, bal + 25000, 'trip', trip1_id, 'completed', 'Bonus pax > 10', NOW() - INTERVAL '2 hours');
    bal := bal + 25000;
    
    -- Recent adjustment
    INSERT INTO guide_wallet_transactions (wallet_id, transaction_type, amount, balance_before, balance_after, reference_type, reference_id, status, description, created_at)
    VALUES (v_wallet_id, 'adjustment', 50000, bal, bal + 50000, NULL, NULL, 'approved', 'Koreksi pembayaran', NOW() - INTERVAL '5 hours');
    bal := bal + 50000;
    
    -- Another earning
    INSERT INTO guide_wallet_transactions (wallet_id, transaction_type, amount, balance_before, balance_after, reference_type, reference_id, status, description, created_at)
    VALUES (v_wallet_id, 'earning', 200000, bal, bal + 200000, 'trip', trip2_id, 'pending', 'Fee trip AT-KRA-2402 (pending)', NOW() - INTERVAL '1 hour');
    bal := bal + 200000;
    
    -- Final balance update
    INSERT INTO guide_wallet_transactions (wallet_id, transaction_type, amount, balance_before, balance_after, reference_type, reference_id, status, description, created_at)
    VALUES (v_wallet_id, 'adjustment', 45000, bal, bal + 45000, NULL, NULL, 'approved', 'Bonus loyalitas', NOW() - INTERVAL '30 minutes');
    bal := bal + 45000;
    
    -- Withdraw request (pending) - doesn't affect balance
    INSERT INTO guide_wallet_transactions (wallet_id, transaction_type, amount, balance_before, balance_after, reference_type, reference_id, status, description, created_at)
    VALUES (v_wallet_id, 'withdraw_request', 500000, bal, bal, NULL, NULL, 'pending', 'Tarik dana ke rekening', NOW() - INTERVAL '1 day');
    
    -- Update wallet balance
    UPDATE guide_wallets SET balance = bal, updated_at = NOW() WHERE id = v_wallet_id;
  END IF;

  -- ============================================
  -- SAVINGS GOALS
  -- ============================================
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guide_savings_goals') THEN
    INSERT INTO guide_savings_goals (
      guide_id, name, target_amount, current_amount, auto_save_percent, auto_save_enabled, is_completed, created_at
    ) VALUES
      (sample_guide_id, 'Liburan ke Bali', 5000000, 2500000, 20, true, false, NOW() - INTERVAL '30 days'),
      (sample_guide_id, 'DP Motor', 3000000, 3000000, 0, false, true, NOW() - INTERVAL '60 days'),
      (sample_guide_id, 'Tabungan Darurat', 10000000, 500000, 10, true, false, NOW() - INTERVAL '15 days'),
      (sample_guide_id, 'Renovasi Rumah', 15000000, 0, 0, false, false, NOW() - INTERVAL '7 days')
    ON CONFLICT (guide_id, name) DO UPDATE SET
      current_amount = EXCLUDED.current_amount,
      is_completed = EXCLUDED.is_completed,
      updated_at = NOW();
  END IF;

  -- ============================================
  -- WALLET MILESTONES
  -- ============================================
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guide_wallet_milestones') THEN
    INSERT INTO guide_wallet_milestones (
      guide_id, milestone_type, milestone_name, milestone_description, achieved_at, achievement_data, created_at
    ) VALUES
      (
        sample_guide_id, 
        'first_million', 
        'First Million', 
        'Achieved balance milestone of Rp 1,000,000',
        NOW() - INTERVAL '20 days',
        jsonb_build_object('balance', 1250000, 'threshold', 1000000, 'trip_count', 5),
        NOW() - INTERVAL '20 days'
      ),
      (
        sample_guide_id,
        'perfect_month',
        'Perfect Month',
        'Completed all trips without penalties in December 2025',
        NOW() - INTERVAL '5 days',
        jsonb_build_object('month', '2025-12', 'trips_completed', 3, 'penalties', 0),
        NOW() - INTERVAL '5 days'
      )
    ON CONFLICT (guide_id, milestone_type) DO NOTHING;
  END IF;

  -- ============================================
  -- SALARY DEDUCTIONS (Penalties)
  -- ============================================
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'salary_deductions') THEN
    INSERT INTO salary_deductions (
      guide_id, trip_id, amount, deduction_type, reason, created_at
    ) VALUES
      (sample_guide_id, trip3_id, 50000, 'late_penalty', 'Terlambat check-in 15 menit', NOW() - INTERVAL '7 days'),
      (sample_guide_id, trip4_id, 25000, 'other', 'Kurang dokumentasi', NOW() - INTERVAL '3 days')
    ON CONFLICT DO NOTHING;
  END IF;

  -- ============================================
  -- TRIP EXPENSES (if table exists and has guide_id column)
  -- ============================================
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'trip_expenses'
    AND EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'trip_expenses' AND column_name = 'guide_id'
    )
  ) THEN
    INSERT INTO trip_expenses (
      trip_id, guide_id, category, description, amount, receipt_url, status, created_at
    ) VALUES
      (trip1_id, sample_guide_id, 'transport', 'Bensin motor', 50000, NULL, 'approved', NOW() - INTERVAL '2 hours'),
      (trip1_id, sample_guide_id, 'meal', 'Makan siang tim', 75000, NULL, 'approved', NOW() - INTERVAL '1 hour'),
      (trip3_id, sample_guide_id, 'transport', 'Ojek online', 30000, NULL, 'approved', NOW() - INTERVAL '7 days'),
      (trip4_id, sample_guide_id, 'other', 'Parkir', 10000, NULL, 'approved', NOW() - INTERVAL '3 days')
    ON CONFLICT DO NOTHING;
  END IF;

  RAISE NOTICE 'Wallet sample data created successfully';
END $$;

COMMIT;
