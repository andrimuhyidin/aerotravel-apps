-- Migration: 079-partner-withdrawals.sql
-- Description: Add withdrawal system for partner wallets
-- Created: 2025-02-01
-- Reference: Partner Portal Complete Implementation Plan - Phase 4

BEGIN;

-- ============================================
-- UPDATE WALLET TRANSACTION TYPE ENUM
-- ============================================

-- Add new withdrawal transaction types to existing enum
DO $$ BEGIN
  -- Try to add new values if they don't exist
  ALTER TYPE wallet_transaction_type ADD VALUE IF NOT EXISTS 'withdraw_request';
  ALTER TYPE wallet_transaction_type ADD VALUE IF NOT EXISTS 'withdraw_approved';
  ALTER TYPE wallet_transaction_type ADD VALUE IF NOT EXISTS 'withdraw_rejected';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- MITRA WITHDRAWAL REQUESTS TABLE
-- ============================================

DO $$ BEGIN
  CREATE TYPE withdrawal_status AS ENUM (
    'pending',
    'approved',
    'rejected',
    'processed',
    'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS mitra_withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mitra_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Withdrawal Details
  amount DECIMAL(14,2) NOT NULL CHECK (amount > 0),
  currency VARCHAR(3) DEFAULT 'IDR',
  
  -- Bank Account Info
  bank_name VARCHAR(100) NOT NULL,
  account_number VARCHAR(50) NOT NULL,
  account_name VARCHAR(200) NOT NULL,
  
  -- Status & Processing
  status withdrawal_status NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  
  -- Processing Info
  processed_by UUID REFERENCES users(id), -- Admin who approved/rejected
  processed_at TIMESTAMPTZ,
  
  -- Wallet Transaction Reference (created when approved)
  wallet_transaction_id UUID REFERENCES mitra_wallet_transactions(id),
  
  -- Notes
  notes TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_mitra_withdrawal_requests_mitra_id 
  ON mitra_withdrawal_requests(mitra_id);

CREATE INDEX IF NOT EXISTS idx_mitra_withdrawal_requests_status 
  ON mitra_withdrawal_requests(status);

CREATE INDEX IF NOT EXISTS idx_mitra_withdrawal_requests_created_at 
  ON mitra_withdrawal_requests(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_mitra_withdrawal_requests_processed_by 
  ON mitra_withdrawal_requests(processed_by);

-- ============================================
-- UPDATE TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION update_mitra_withdrawal_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_mitra_withdrawal_requests_updated_at
  BEFORE UPDATE ON mitra_withdrawal_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_mitra_withdrawal_requests_updated_at();

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE mitra_withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- Partners can view their own withdrawal requests
CREATE POLICY "Partners can view own withdrawal requests"
  ON mitra_withdrawal_requests
  FOR SELECT
  USING (auth.uid() = mitra_id);

-- Partners can insert their own withdrawal requests
CREATE POLICY "Partners can insert own withdrawal requests"
  ON mitra_withdrawal_requests
  FOR INSERT
  WITH CHECK (auth.uid() = mitra_id);

-- Partners can cancel their own pending requests
CREATE POLICY "Partners can cancel own pending requests"
  ON mitra_withdrawal_requests
  FOR UPDATE
  USING (
    auth.uid() = mitra_id 
    AND status = 'pending'
  )
  WITH CHECK (
    auth.uid() = mitra_id
    AND (NEW.status = 'cancelled' OR NEW.status = 'pending')
  );

-- Admins (finance, super_admin) can view all withdrawal requests
CREATE POLICY "Admins can view all withdrawal requests"
  ON mitra_withdrawal_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('super_admin', 'finance_manager')
    )
  );

-- Admins can approve/reject withdrawal requests
CREATE POLICY "Admins can process withdrawal requests"
  ON mitra_withdrawal_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('super_admin', 'finance_manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('super_admin', 'finance_manager')
    )
  );

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE mitra_withdrawal_requests IS 'Withdrawal requests from partner wallets';
COMMENT ON COLUMN mitra_withdrawal_requests.amount IS 'Withdrawal amount (must be positive)';
COMMENT ON COLUMN mitra_withdrawal_requests.status IS 'Status: pending, approved, rejected, processed, cancelled';
COMMENT ON COLUMN mitra_withdrawal_requests.processed_by IS 'Admin user ID who approved/rejected the request';
COMMENT ON COLUMN mitra_withdrawal_requests.wallet_transaction_id IS 'Reference to wallet transaction created when approved';

COMMIT;

