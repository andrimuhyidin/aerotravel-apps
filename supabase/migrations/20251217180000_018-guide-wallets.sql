-- Migration: 018-guide-wallets.sql
-- Description: Guide wallets & transactions for commission payouts

DO $$ BEGIN
  CREATE TYPE guide_wallet_transaction_type AS ENUM (
    'earning',
    'withdraw_request',
    'withdraw_approved',
    'withdraw_rejected',
    'adjustment'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS guide_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID NOT NULL REFERENCES users(id) UNIQUE,
  balance DECIMAL(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS guide_wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES guide_wallets(id),
  transaction_type guide_wallet_transaction_type NOT NULL,
  amount DECIMAL(14,2) NOT NULL,
  balance_before DECIMAL(14,2) NOT NULL,
  balance_after DECIMAL(14,2) NOT NULL,
  reference_type VARCHAR(50),
  reference_id UUID,
  status VARCHAR(20), -- for withdraw_* types: pending/approved/rejected
  description TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guide_wallets_guide_id ON guide_wallets(guide_id);
CREATE INDEX IF NOT EXISTS idx_guide_wallet_transactions_wallet_id ON guide_wallet_transactions(wallet_id);

ALTER TABLE guide_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE guide_wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Guide can see own wallet
CREATE POLICY "guide_wallets_own" ON guide_wallets
  FOR SELECT
  USING (
    guide_id = auth.uid()
  );

CREATE POLICY "guide_wallet_transactions_own" ON guide_wallet_transactions
  FOR SELECT
  USING (
    wallet_id IN (
      SELECT id FROM guide_wallets WHERE guide_id = auth.uid()
    )
  );

-- Internal staff (finance/ops) can see all
CREATE POLICY "guide_wallets_staff" ON guide_wallets
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'finance_manager', 'ops_admin')
    )
  );

CREATE POLICY "guide_wallet_transactions_staff" ON guide_wallet_transactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'finance_manager', 'ops_admin')
    )
  );
