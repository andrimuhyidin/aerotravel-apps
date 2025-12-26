-- Migration: 113-partner-credit-limit-tracking.sql
-- Description: Add credit limit tracking for partner wallets
-- Created: 2025-12-26

BEGIN;

-- ============================================
-- ADD CREDIT_USED COLUMN TO MITRA_WALLETS
-- ============================================
ALTER TABLE mitra_wallets
ADD COLUMN IF NOT EXISTS credit_used DECIMAL(14,2) DEFAULT 0 CHECK (credit_used >= 0);

-- Add comment
COMMENT ON COLUMN mitra_wallets.credit_used IS 'Amount of credit limit currently being used';

-- ============================================
-- CREDIT LIMIT HISTORY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS mitra_credit_limit_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES mitra_wallets(id) ON DELETE CASCADE,
  mitra_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Credit Limit Change
  old_limit DECIMAL(14,2) NOT NULL,
  new_limit DECIMAL(14,2) NOT NULL,
  change_amount DECIMAL(14,2) NOT NULL, -- new_limit - old_limit
  
  -- Reason & Approval
  reason TEXT,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  
  -- Audit
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_credit_limit_history_wallet_id ON mitra_credit_limit_history(wallet_id);
CREATE INDEX IF NOT EXISTS idx_credit_limit_history_mitra_id ON mitra_credit_limit_history(mitra_id);
CREATE INDEX IF NOT EXISTS idx_credit_limit_history_status ON mitra_credit_limit_history(status);
CREATE INDEX IF NOT EXISTS idx_credit_limit_history_created_at ON mitra_credit_limit_history(created_at DESC);

-- ============================================
-- CREDIT REPAYMENT TRANSACTIONS
-- ============================================
-- Add new transaction type for credit repayment
DO $$ 
BEGIN
  -- Check if 'credit_repayment' already exists in enum
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'credit_repayment' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'wallet_transaction_type')
  ) THEN
    ALTER TYPE wallet_transaction_type ADD VALUE 'credit_repayment';
  END IF;
END $$;

-- Add credit_used_before and credit_used_after to transactions for tracking
ALTER TABLE mitra_wallet_transactions
ADD COLUMN IF NOT EXISTS credit_used_before DECIMAL(14,2),
ADD COLUMN IF NOT EXISTS credit_used_after DECIMAL(14,2);

-- Comments
COMMENT ON COLUMN mitra_wallet_transactions.credit_used_before IS 'Credit used amount before this transaction';
COMMENT ON COLUMN mitra_wallet_transactions.credit_used_after IS 'Credit used amount after this transaction';

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update credit_used when using credit limit
CREATE OR REPLACE FUNCTION update_credit_used_on_debit()
RETURNS TRIGGER AS $$
DECLARE
  v_wallet_id UUID;
  v_credit_limit DECIMAL(14,2);
  v_balance DECIMAL(14,2);
  v_credit_used DECIMAL(14,2);
  v_amount DECIMAL(14,2);
  v_balance_after DECIMAL(14,2);
  v_credit_used_after DECIMAL(14,2);
BEGIN
  -- Only process booking_debit transactions
  IF NEW.transaction_type != 'booking_debit' THEN
    RETURN NEW;
  END IF;

  v_wallet_id := NEW.wallet_id;
  v_amount := ABS(NEW.amount); -- Make positive for calculation
  
  -- Get current wallet state
  SELECT balance, credit_limit, COALESCE(credit_used, 0)
  INTO v_balance, v_credit_limit, v_credit_used
  FROM mitra_wallets
  WHERE id = v_wallet_id;
  
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;
  
  -- Calculate how much to use from balance vs credit
  v_balance_after := GREATEST(0, v_balance - v_amount);
  v_credit_used_after := v_credit_used;
  
  -- If balance is not enough, use credit limit
  IF v_balance < v_amount THEN
    v_credit_used_after := v_credit_used + (v_amount - v_balance);
    
    -- Update credit_used in wallet
    UPDATE mitra_wallets
    SET credit_used = v_credit_used_after,
        updated_at = NOW()
    WHERE id = v_wallet_id;
  END IF;
  
  -- Store credit_used values in transaction
  NEW.credit_used_before := v_credit_used;
  NEW.credit_used_after := v_credit_used_after;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_credit_used_on_debit ON mitra_wallet_transactions;
CREATE TRIGGER trigger_update_credit_used_on_debit
  BEFORE INSERT ON mitra_wallet_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_credit_used_on_debit();

-- Function to perform wallet debit (with credit limit support)
CREATE OR REPLACE FUNCTION perform_wallet_debit(
  p_wallet_id UUID,
  p_booking_id UUID,
  p_amount_from_balance DECIMAL(14,2),
  p_amount_from_credit DECIMAL(14,2),
  p_new_balance DECIMAL(14,2),
  p_new_credit_used DECIMAL(14,2),
  p_description TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_transaction_id UUID;
  v_balance_before DECIMAL(14,2);
  v_credit_used_before DECIMAL(14,2);
BEGIN
  -- Get current wallet state
  SELECT balance, COALESCE(credit_used, 0)
  INTO v_balance_before, v_credit_used_before
  FROM mitra_wallets
  WHERE id = p_wallet_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wallet not found';
  END IF;
  
  -- Validate amounts
  IF p_amount_from_balance < 0 OR p_amount_from_credit < 0 THEN
    RAISE EXCEPTION 'Amounts cannot be negative';
  END IF;
  
  -- Create transaction
  INSERT INTO mitra_wallet_transactions (
    wallet_id,
    booking_id,
    transaction_type,
    amount,
    balance_before,
    balance_after,
    credit_used_before,
    credit_used_after,
    description
  ) VALUES (
    p_wallet_id,
    p_booking_id,
    'booking_debit',
    -(p_amount_from_balance + p_amount_from_credit),
    v_balance_before,
    p_new_balance,
    v_credit_used_before,
    p_new_credit_used,
    COALESCE(p_description, 'Pembayaran booking')
  ) RETURNING id INTO v_transaction_id;
  
  -- Update wallet
  UPDATE mitra_wallets
  SET balance = p_new_balance,
      credit_used = p_new_credit_used,
      updated_at = NOW()
  WHERE id = p_wallet_id;
  
  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process credit repayment
CREATE OR REPLACE FUNCTION process_credit_repayment(
  p_wallet_id UUID,
  p_amount DECIMAL(14,2),
  p_description TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_transaction_id UUID;
  v_balance_before DECIMAL(14,2);
  v_balance_after DECIMAL(14,2);
  v_credit_used_before DECIMAL(14,2);
  v_credit_used_after DECIMAL(14,2);
BEGIN
  -- Validate amount
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Repayment amount must be positive';
  END IF;
  
  -- Get current wallet state
  SELECT balance, COALESCE(credit_used, 0)
  INTO v_balance_before, v_credit_used_before
  FROM mitra_wallets
  WHERE id = p_wallet_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wallet not found';
  END IF;
  
  -- Validate credit_used
  IF v_credit_used_before <= 0 THEN
    RAISE EXCEPTION 'No credit to repay';
  END IF;
  
  -- Calculate repayment (can't repay more than used)
  v_credit_used_after := GREATEST(0, v_credit_used_before - p_amount);
  v_balance_after := v_balance_before + (v_credit_used_before - v_credit_used_after);
  
  -- Create transaction
  INSERT INTO mitra_wallet_transactions (
    wallet_id,
    transaction_type,
    amount,
    balance_before,
    balance_after,
    credit_used_before,
    credit_used_after,
    description
  ) VALUES (
    p_wallet_id,
    'credit_repayment',
    p_amount,
    v_balance_before,
    v_balance_after,
    v_credit_used_before,
    v_credit_used_after,
    COALESCE(p_description, 'Credit limit repayment')
  ) RETURNING id INTO v_transaction_id;
  
  -- Update wallet
  UPDATE mitra_wallets
  SET balance = v_balance_after,
      credit_used = v_credit_used_after,
      updated_at = NOW()
  WHERE id = p_wallet_id;
  
  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE mitra_credit_limit_history ENABLE ROW LEVEL SECURITY;

-- Partners can view their own credit limit history
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'mitra_credit_limit_history' 
    AND policyname = 'Partners can view own credit limit history'
  ) THEN
    CREATE POLICY "Partners can view own credit limit history"
      ON mitra_credit_limit_history
      FOR SELECT
      USING (
        mitra_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM users
          WHERE id = auth.uid()
          AND role IN ('super_admin', 'finance_manager')
        )
      );
  END IF;
END $$;

-- Only admins can insert credit limit history
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'mitra_credit_limit_history' 
    AND policyname = 'Admins can manage credit limit history'
  ) THEN
    CREATE POLICY "Admins can manage credit limit history"
      ON mitra_credit_limit_history
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM users
          WHERE id = auth.uid()
          AND role IN ('super_admin', 'finance_manager')
        )
      );
  END IF;
END $$;

COMMIT;

