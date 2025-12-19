-- Migration: 042-guide-contract-sanctions-resign.sql
-- Description: Guide contract sanctions, warnings, and self-service resign
-- Created: 2025-01-22

-- ============================================
-- ENUM: Sanction Type
-- ============================================
DO $$ BEGIN
  CREATE TYPE guide_sanction_type AS ENUM (
    'warning',           -- Peringatan
    'suspension',        -- Suspensi sementara
    'fine',              -- Denda
    'demotion',          -- Penurunan level
    'termination'        -- Penghentian kontrak
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- ENUM: Sanction Severity
-- ============================================
DO $$ BEGIN
  CREATE TYPE guide_sanction_severity AS ENUM (
    'low',               -- Ringan
    'medium',            -- Sedang
    'high',              -- Berat
    'critical'           -- Sangat berat
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- ENUM: Resign Status
-- ============================================
DO $$ BEGIN
  CREATE TYPE guide_resign_status AS ENUM (
    'pending',           -- Menunggu persetujuan
    'approved',          -- Disetujui
    'rejected',          -- Ditolak
    'withdrawn'          -- Ditarik kembali
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- TABLE: guide_contract_sanctions
-- ============================================
CREATE TABLE IF NOT EXISTS guide_contract_sanctions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES guide_contracts(id) ON DELETE CASCADE,
  guide_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id),
  
  -- Sanction Details
  sanction_type guide_sanction_type NOT NULL,
  severity guide_sanction_severity NOT NULL DEFAULT 'medium',
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  violation_date DATE NOT NULL,
  
  -- Action Details
  action_taken TEXT, -- Tindakan yang diambil
  fine_amount DECIMAL(14,2), -- Jika type = 'fine'
  suspension_start_date DATE, -- Jika type = 'suspension'
  suspension_end_date DATE,
  
  -- Status
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'resolved', 'cancelled'
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id),
  resolution_notes TEXT,
  
  -- Metadata
  issued_by UUID NOT NULL REFERENCES users(id), -- Admin yang memberikan sanksi
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_suspension_dates CHECK (
    suspension_start_date IS NULL OR 
    suspension_end_date IS NULL OR 
    suspension_end_date >= suspension_start_date
  ),
  CONSTRAINT valid_fine_amount CHECK (
    fine_amount IS NULL OR fine_amount >= 0
  )
);

-- ============================================
-- TABLE: guide_contract_resignations
-- ============================================
CREATE TABLE IF NOT EXISTS guide_contract_resignations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES guide_contracts(id) ON DELETE CASCADE,
  guide_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id),
  
  -- Resignation Details
  status guide_resign_status DEFAULT 'pending',
  reason TEXT NOT NULL, -- Alasan resign
  effective_date DATE NOT NULL, -- Tanggal efektif resign
  notice_period_days INTEGER DEFAULT 14, -- Masa pemberitahuan (hari)
  
  -- Admin Response
  reviewed_by UUID REFERENCES users(id), -- Admin yang review
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  rejection_reason TEXT, -- Jika ditolak
  
  -- Metadata
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  withdrawn_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_effective_date CHECK (effective_date >= CURRENT_DATE),
  CONSTRAINT valid_notice_period CHECK (notice_period_days >= 0)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_guide_contract_sanctions_contract_id ON guide_contract_sanctions(contract_id);
CREATE INDEX IF NOT EXISTS idx_guide_contract_sanctions_guide_id ON guide_contract_sanctions(guide_id);
CREATE INDEX IF NOT EXISTS idx_guide_contract_sanctions_status ON guide_contract_sanctions(status);
CREATE INDEX IF NOT EXISTS idx_guide_contract_sanctions_type ON guide_contract_sanctions(sanction_type);
CREATE INDEX IF NOT EXISTS idx_guide_contract_sanctions_issued_at ON guide_contract_sanctions(issued_at);

CREATE INDEX IF NOT EXISTS idx_guide_contract_resignations_contract_id ON guide_contract_resignations(contract_id);
CREATE INDEX IF NOT EXISTS idx_guide_contract_resignations_guide_id ON guide_contract_resignations(guide_id);
CREATE INDEX IF NOT EXISTS idx_guide_contract_resignations_status ON guide_contract_resignations(status);
CREATE INDEX IF NOT EXISTS idx_guide_contract_resignations_submitted_at ON guide_contract_resignations(submitted_at);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-terminate contract if critical sanction
CREATE OR REPLACE FUNCTION auto_terminate_on_critical_sanction()
RETURNS TRIGGER AS $$
BEGIN
  -- If sanction type is 'termination' and status is 'active', terminate contract
  IF NEW.sanction_type = 'termination' AND NEW.status = 'active' THEN
    UPDATE guide_contracts
    SET 
      status = 'terminated',
      terminated_at = NOW(),
      termination_reason = NEW.description,
      terminated_by = NEW.issued_by
    WHERE id = NEW.contract_id
      AND status = 'active';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_terminate_on_critical_sanction
  AFTER INSERT ON guide_contract_sanctions
  FOR EACH ROW
  EXECUTE FUNCTION auto_terminate_on_critical_sanction();

-- Auto-terminate contract when resignation approved
CREATE OR REPLACE FUNCTION auto_terminate_on_resignation_approved()
RETURNS TRIGGER AS $$
BEGIN
  -- If resignation is approved, terminate contract
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    UPDATE guide_contracts
    SET 
      status = 'terminated',
      terminated_at = NEW.reviewed_at,
      termination_reason = 'Resignation: ' || NEW.reason,
      terminated_by = NEW.reviewed_by
    WHERE id = NEW.contract_id
      AND status = 'active';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_terminate_on_resignation_approved
  AFTER UPDATE ON guide_contract_resignations
  FOR EACH ROW
  EXECUTE FUNCTION auto_terminate_on_resignation_approved();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_sanction_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_sanction_updated_at
  BEFORE UPDATE ON guide_contract_sanctions
  FOR EACH ROW
  EXECUTE FUNCTION update_sanction_updated_at();

CREATE TRIGGER trigger_update_resignation_updated_at
  BEFORE UPDATE ON guide_contract_resignations
  FOR EACH ROW
  EXECUTE FUNCTION update_sanction_updated_at();

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE guide_contract_sanctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE guide_contract_resignations ENABLE ROW LEVEL SECURITY;

-- Guide can view own sanctions
CREATE POLICY "guide_sanctions_own" ON guide_contract_sanctions
  FOR SELECT
  USING (guide_id = auth.uid());

-- Guide can view own resignations
CREATE POLICY "guide_resignations_own" ON guide_contract_resignations
  FOR ALL
  USING (guide_id = auth.uid())
  WITH CHECK (guide_id = auth.uid());

-- Admin can manage all sanctions
CREATE POLICY "guide_sanctions_admin" ON guide_contract_sanctions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'ops_admin', 'finance_manager')
    )
  );

-- Admin can manage all resignations
CREATE POLICY "guide_resignations_admin" ON guide_contract_resignations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'ops_admin', 'finance_manager')
    )
  );
