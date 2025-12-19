-- Migration: 029-guide-bank-accounts.sql
-- Description: Bank account management untuk guide dengan approval system
-- Created: 2025-12-20

-- ============================================
-- BANK ACCOUNTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS guide_bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Bank Account Info
  bank_name VARCHAR(100) NOT NULL, -- e.g., "Bank BCA", "Bank Mandiri"
  account_number VARCHAR(50) NOT NULL,
  account_holder_name VARCHAR(200) NOT NULL, -- Nama pemilik rekening
  
  -- Branch Info (optional)
  branch_name VARCHAR(200), -- Nama cabang bank
  branch_code VARCHAR(50), -- Kode cabang
  
  -- Status & Approval
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  rejection_reason TEXT, -- Alasan jika ditolak
  
  -- Approval Info
  approved_by UUID REFERENCES users(id), -- Admin yang approve
  approved_at TIMESTAMPTZ,
  rejected_by UUID REFERENCES users(id), -- Admin yang reject
  rejected_at TIMESTAMPTZ,
  
  -- Verification (optional, untuk verifikasi tambahan)
  verification_notes TEXT, -- Catatan verifikasi dari admin
  
  -- Default Account (hanya satu yang bisa default per guide)
  is_default BOOLEAN DEFAULT false,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(guide_id, account_number) -- Satu guide tidak bisa punya account number yang sama
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_guide_bank_accounts_guide_id ON guide_bank_accounts(guide_id);
CREATE INDEX IF NOT EXISTS idx_guide_bank_accounts_status ON guide_bank_accounts(status);
CREATE INDEX IF NOT EXISTS idx_guide_bank_accounts_approved ON guide_bank_accounts(approved_by);

-- ============================================
-- UPDATE WALLET TRANSACTIONS
-- ============================================
-- Add bank_account_id reference to wallet transactions
ALTER TABLE guide_wallet_transactions
  ADD COLUMN IF NOT EXISTS bank_account_id UUID REFERENCES guide_bank_accounts(id);

CREATE INDEX IF NOT EXISTS idx_guide_wallet_transactions_bank_account_id 
  ON guide_wallet_transactions(bank_account_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE guide_bank_accounts ENABLE ROW LEVEL SECURITY;

-- Guide can see own bank accounts
DROP POLICY IF EXISTS "guide_bank_accounts_own" ON guide_bank_accounts;
CREATE POLICY "guide_bank_accounts_own" ON guide_bank_accounts
  FOR SELECT
  USING (guide_id = auth.uid());

-- Guide can insert own bank accounts (pending status)
DROP POLICY IF EXISTS "guide_bank_accounts_insert_own" ON guide_bank_accounts;
CREATE POLICY "guide_bank_accounts_insert_own" ON guide_bank_accounts
  FOR INSERT
  WITH CHECK (
    guide_id = auth.uid() 
    AND status = 'pending' -- Guide hanya bisa create dengan status pending
  );

-- Guide can update own pending bank accounts (hanya bisa edit yang pending)
DROP POLICY IF EXISTS "guide_bank_accounts_update_own_pending" ON guide_bank_accounts;
CREATE POLICY "guide_bank_accounts_update_own_pending" ON guide_bank_accounts
  FOR UPDATE
  USING (
    guide_id = auth.uid() 
    AND status = 'pending' -- Hanya bisa update yang masih pending
  )
  WITH CHECK (
    guide_id = auth.uid() 
    AND status = 'pending' -- Tidak bisa ubah status sendiri
  );

-- Guide can delete own pending/rejected bank accounts
DROP POLICY IF EXISTS "guide_bank_accounts_delete_own" ON guide_bank_accounts;
CREATE POLICY "guide_bank_accounts_delete_own" ON guide_bank_accounts
  FOR DELETE
  USING (
    guide_id = auth.uid() 
    AND (status = 'pending' OR status = 'rejected') -- Hanya bisa delete pending/rejected
  );

-- Internal staff (finance/ops) can see all bank accounts
DROP POLICY IF EXISTS "guide_bank_accounts_staff_view" ON guide_bank_accounts;
CREATE POLICY "guide_bank_accounts_staff_view" ON guide_bank_accounts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('super_admin', 'finance_manager', 'ops_admin')
    )
  );

-- Internal staff can approve/reject bank accounts
DROP POLICY IF EXISTS "guide_bank_accounts_staff_approve" ON guide_bank_accounts;
CREATE POLICY "guide_bank_accounts_staff_approve" ON guide_bank_accounts
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('super_admin', 'finance_manager', 'ops_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('super_admin', 'finance_manager', 'ops_admin')
    )
  );

-- ============================================
-- FUNCTION: Ensure only one default account per guide
-- ============================================
CREATE OR REPLACE FUNCTION ensure_single_default_bank_account()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting this account as default, unset others
  IF NEW.is_default = true THEN
    UPDATE guide_bank_accounts
    SET is_default = false
    WHERE guide_id = NEW.guide_id
      AND id != NEW.id
      AND status = 'approved'; -- Hanya unset yang approved
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGER: Auto-unset other defaults
-- ============================================
DROP TRIGGER IF EXISTS trigger_ensure_single_default_bank_account ON guide_bank_accounts;
CREATE TRIGGER trigger_ensure_single_default_bank_account
  BEFORE INSERT OR UPDATE ON guide_bank_accounts
  FOR EACH ROW
  WHEN (NEW.is_default = true)
  EXECUTE FUNCTION ensure_single_default_bank_account();

-- ============================================
-- FUNCTION: Auto-update updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_guide_bank_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGER: Auto-update updated_at
-- ============================================
DROP TRIGGER IF EXISTS trigger_update_guide_bank_accounts_updated_at ON guide_bank_accounts;
CREATE TRIGGER trigger_update_guide_bank_accounts_updated_at
  BEFORE UPDATE ON guide_bank_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_guide_bank_accounts_updated_at();
