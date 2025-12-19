-- Migration: 040-guide-contracts.sql
-- Description: Guide contract management system
-- Created: 2025-01-21

-- ============================================
-- ENUM: Contract Status
-- ============================================
DO $$ BEGIN
  CREATE TYPE guide_contract_status AS ENUM (
    'draft',              -- Draft, belum dikirim
    'pending_signature',  -- Menunggu tanda tangan guide
    'pending_company',    -- Menunggu tanda tangan company
    'active',             -- Aktif dan berlaku
    'expired',            -- Sudah kadaluarsa
    'terminated',         -- Dihentikan sebelum waktunya
    'rejected'            -- Guide menolak kontrak
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- ENUM: Contract Type
-- ============================================
DO $$ BEGIN
  CREATE TYPE guide_contract_type AS ENUM (
    'per_trip',      -- Kontrak per trip (one-time)
    'monthly',       -- Kontrak bulanan
    'project',       -- Kontrak per project (multiple trips)
    'seasonal',      -- Kontrak musiman (3-6 bulan)
    'annual'         -- Kontrak tahunan
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- TABLE: guide_contracts
-- ============================================
CREATE TABLE IF NOT EXISTS guide_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id),
  
  -- Contract Details
  contract_number VARCHAR(50) UNIQUE,
  contract_type guide_contract_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Terms & Conditions
  start_date DATE NOT NULL,
  end_date DATE, -- NULL untuk per_trip
  fee_amount DECIMAL(14,2) NOT NULL,
  fee_type VARCHAR(20) NOT NULL DEFAULT 'fixed', -- 'fixed', 'per_trip', 'percentage'
  payment_terms TEXT, -- "Dibayar setelah trip selesai"
  terms_and_conditions JSONB DEFAULT '{}'::jsonb, -- Flexible terms storage
  
  -- Status & Signatures
  status guide_contract_status DEFAULT 'draft',
  guide_signed_at TIMESTAMPTZ,
  guide_signature_url TEXT, -- URL to signature image/PDF
  company_signed_at TIMESTAMPTZ,
  company_signature_url TEXT,
  signed_pdf_url TEXT, -- Final signed PDF
  
  -- Metadata
  created_by UUID REFERENCES users(id), -- Admin yang membuat
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- Auto-calculate from end_date
  
  -- Termination
  terminated_at TIMESTAMPTZ,
  termination_reason TEXT,
  terminated_by UUID REFERENCES users(id),
  
  -- Rejection
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Constraints
  CONSTRAINT valid_contract_dates CHECK (end_date IS NULL OR end_date >= start_date),
  CONSTRAINT valid_fee_amount CHECK (fee_amount > 0)
);

-- ============================================
-- TABLE: guide_contract_trips (for per_trip & project contracts)
-- ============================================
CREATE TABLE IF NOT EXISTS guide_contract_trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES guide_contracts(id) ON DELETE CASCADE,
  trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
  trip_code VARCHAR(50),
  trip_date DATE,
  fee_amount DECIMAL(14,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'cancelled'
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(contract_id, trip_id)
);

-- ============================================
-- TABLE: guide_contract_payments (link to wallet transactions)
-- ============================================
CREATE TABLE IF NOT EXISTS guide_contract_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES guide_contracts(id) ON DELETE CASCADE,
  wallet_transaction_id UUID REFERENCES guide_wallet_transactions(id),
  amount DECIMAL(14,2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_method VARCHAR(50), -- 'wallet', 'bank_transfer', 'cash'
  reference_number VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_guide_contracts_guide_id ON guide_contracts(guide_id);
CREATE INDEX IF NOT EXISTS idx_guide_contracts_status ON guide_contracts(status);
CREATE INDEX IF NOT EXISTS idx_guide_contracts_expires_at ON guide_contracts(expires_at) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_guide_contracts_branch_id ON guide_contracts(branch_id);
CREATE INDEX IF NOT EXISTS idx_guide_contracts_contract_number ON guide_contracts(contract_number);
CREATE INDEX IF NOT EXISTS idx_guide_contract_trips_contract_id ON guide_contract_trips(contract_id);
CREATE INDEX IF NOT EXISTS idx_guide_contract_trips_trip_id ON guide_contract_trips(trip_id);
CREATE INDEX IF NOT EXISTS idx_guide_contract_payments_contract_id ON guide_contract_payments(contract_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-generate contract number
CREATE OR REPLACE FUNCTION generate_contract_number()
RETURNS TRIGGER AS $$
DECLARE
  v_date_str VARCHAR(8);
  v_seq_num INTEGER;
BEGIN
  -- Format: CT-YYYYMMDD-XXX
  v_date_str := TO_CHAR(NOW(), 'YYYYMMDD');
  
  -- Get sequence number for today
  SELECT COALESCE(MAX(CAST(SUBSTRING(contract_number FROM '[0-9]+$') AS INTEGER)), 0) + 1
  INTO v_seq_num
  FROM guide_contracts
  WHERE contract_number LIKE 'CT-' || v_date_str || '-%';
  
  NEW.contract_number := 'CT-' || v_date_str || '-' || LPAD(v_seq_num::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generate_contract_number ON guide_contracts;
CREATE TRIGGER trigger_generate_contract_number
  BEFORE INSERT ON guide_contracts
  FOR EACH ROW
  WHEN (NEW.contract_number IS NULL)
  EXECUTE FUNCTION generate_contract_number();

-- Auto-calculate expires_at from end_date
CREATE OR REPLACE FUNCTION calculate_contract_expires_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.end_date IS NOT NULL THEN
    NEW.expires_at := (NEW.end_date + INTERVAL '1 day')::TIMESTAMPTZ;
  ELSIF NEW.contract_type = 'per_trip' THEN
    -- Per trip: expire 30 days after start_date if no end_date
    NEW.expires_at := (NEW.start_date + INTERVAL '30 days')::TIMESTAMPTZ;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calculate_expires_at ON guide_contracts;
CREATE TRIGGER trigger_calculate_expires_at
  BEFORE INSERT OR UPDATE ON guide_contracts
  FOR EACH ROW
  EXECUTE FUNCTION calculate_contract_expires_at();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_contract_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_contract_updated_at ON guide_contracts;
CREATE TRIGGER trigger_update_contract_updated_at
  BEFORE UPDATE ON guide_contracts
  FOR EACH ROW
  EXECUTE FUNCTION update_contract_updated_at();

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE guide_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE guide_contract_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE guide_contract_payments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "guide_contracts_own" ON guide_contracts;
DROP POLICY IF EXISTS "guide_contracts_sign" ON guide_contracts;
DROP POLICY IF EXISTS "guide_contracts_admin" ON guide_contracts;
DROP POLICY IF EXISTS "guide_contract_trips_own" ON guide_contract_trips;
DROP POLICY IF EXISTS "guide_contract_trips_admin" ON guide_contract_trips;
DROP POLICY IF EXISTS "guide_contract_payments_own" ON guide_contract_payments;
DROP POLICY IF EXISTS "guide_contract_payments_admin" ON guide_contract_payments;

-- Guide can view own contracts
CREATE POLICY "guide_contracts_own" ON guide_contracts
  FOR SELECT
  USING (guide_id = auth.uid());

-- Guide can sign own contracts
CREATE POLICY "guide_contracts_sign" ON guide_contracts
  FOR UPDATE
  USING (guide_id = auth.uid())
  WITH CHECK (
    guide_id = auth.uid() AND
    status IN ('pending_signature', 'pending_company')
  );

-- Admin/Ops can manage all contracts
CREATE POLICY "guide_contracts_admin" ON guide_contracts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'ops_admin', 'finance_manager')
    )
  );

-- Similar policies for contract_trips
CREATE POLICY "guide_contract_trips_own" ON guide_contract_trips
  FOR SELECT
  USING (
    contract_id IN (
      SELECT id FROM guide_contracts WHERE guide_id = auth.uid()
    )
  );

CREATE POLICY "guide_contract_trips_admin" ON guide_contract_trips
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'ops_admin', 'finance_manager')
    )
  );

-- Similar policies for contract_payments
CREATE POLICY "guide_contract_payments_own" ON guide_contract_payments
  FOR SELECT
  USING (
    contract_id IN (
      SELECT id FROM guide_contracts WHERE guide_id = auth.uid()
    )
  );

CREATE POLICY "guide_contract_payments_admin" ON guide_contract_payments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'ops_admin', 'finance_manager')
    )
  );
