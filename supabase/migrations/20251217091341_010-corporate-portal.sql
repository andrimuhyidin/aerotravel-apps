-- Migration: 010-corporate-portal.sql
-- Description: Corporate Portal B2B Enterprise (PRD 4.6)
-- Created: 2025-12-17

-- ============================================
-- CORPORATE CLIENTS
-- ============================================
CREATE TABLE IF NOT EXISTS corporate_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES branches(id),
  
  -- Company Info
  company_name VARCHAR(300) NOT NULL,
  company_address TEXT,
  company_phone VARCHAR(20),
  company_email VARCHAR(200),
  
  -- Tax Info (untuk Faktur Pajak)
  npwp VARCHAR(30),
  npwp_name VARCHAR(300),
  npwp_address TEXT,
  
  -- PIC (Person In Charge)
  pic_id UUID REFERENCES users(id), -- HRD yang login
  pic_name VARCHAR(200),
  pic_phone VARCHAR(20),
  pic_email VARCHAR(200),
  
  -- Contract
  contract_start DATE,
  contract_end DATE,
  contract_document_url TEXT,
  
  -- Credit
  credit_limit DECIMAL(14,2) DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- ============================================
-- CORPORATE DEPOSITS (Top-up Perusahaan)
-- ============================================
CREATE TABLE IF NOT EXISTS corporate_deposits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corporate_id UUID NOT NULL REFERENCES corporate_clients(id),
  
  -- Balance
  balance DECIMAL(14,2) NOT NULL DEFAULT 0,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$ BEGIN
  CREATE TYPE corporate_transaction_type AS ENUM (
    'topup',
    'employee_allocation',
    'booking_debit',
    'refund_credit',
    'adjustment'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- CORPORATE EMPLOYEES (Karyawan yang dapat jatah)
-- ============================================
CREATE TABLE IF NOT EXISTS corporate_employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corporate_id UUID NOT NULL REFERENCES corporate_clients(id),
  user_id UUID REFERENCES users(id), -- Link ke user jika sudah register
  
  -- Employee Info
  employee_id_number VARCHAR(50), -- NIP/NIK Karyawan
  full_name VARCHAR(200) NOT NULL,
  email VARCHAR(200) NOT NULL,
  phone VARCHAR(20),
  department VARCHAR(100),
  
  -- Allocation
  allocated_amount DECIMAL(12,2) DEFAULT 0, -- Jatah saldo
  used_amount DECIMAL(12,2) DEFAULT 0,
  remaining_amount DECIMAL(12,2) GENERATED ALWAYS AS (allocated_amount - used_amount) STORED,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  invitation_sent_at TIMESTAMPTZ,
  registered_at TIMESTAMPTZ,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(corporate_id, email)
);

-- ============================================
-- CORPORATE DEPOSIT TRANSACTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS corporate_deposit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deposit_id UUID NOT NULL REFERENCES corporate_deposits(id),
  
  -- Transaction
  transaction_type corporate_transaction_type NOT NULL,
  amount DECIMAL(14,2) NOT NULL,
  balance_before DECIMAL(14,2) NOT NULL,
  balance_after DECIMAL(14,2) NOT NULL,
  
  -- Reference
  employee_id UUID REFERENCES corporate_employees(id),
  booking_id UUID REFERENCES bookings(id),
  
  -- Notes
  description TEXT,
  
  -- Audit
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CORPORATE INVOICES (Faktur Pajak)
-- ============================================
DO $$ BEGIN
  CREATE TYPE invoice_status AS ENUM (
    'draft',
    'sent',
    'paid',
    'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS corporate_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corporate_id UUID NOT NULL REFERENCES corporate_clients(id),
  
  -- Invoice Info
  invoice_number VARCHAR(50) NOT NULL UNIQUE, -- INV-2025-0001
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  
  -- Amounts
  subtotal DECIMAL(14,2) NOT NULL,
  tax_amount DECIMAL(14,2) DEFAULT 0,
  total_amount DECIMAL(14,2) NOT NULL,
  
  -- Tax Invoice (Faktur Pajak)
  tax_invoice_number VARCHAR(50), -- Nomor Faktur Pajak
  tax_invoice_date DATE,
  
  -- Status
  status invoice_status NOT NULL DEFAULT 'draft',
  
  -- Payment
  paid_at TIMESTAMPTZ,
  paid_amount DECIMAL(14,2),
  payment_reference VARCHAR(100),
  
  -- Document
  pdf_url TEXT,
  
  -- Audit
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoice Line Items
CREATE TABLE IF NOT EXISTS corporate_invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES corporate_invoices(id) ON DELETE CASCADE,
  
  -- Item
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL,
  total_price DECIMAL(12,2) NOT NULL,
  
  -- Reference
  booking_id UUID REFERENCES bookings(id),
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CORPORATE USAGE REPORTS (Laporan per Departemen)
-- ============================================
CREATE OR REPLACE VIEW corporate_usage_by_department AS
SELECT 
  ce.corporate_id,
  cc.company_name,
  ce.department,
  COUNT(DISTINCT ce.id) AS employee_count,
  SUM(ce.allocated_amount) AS total_allocated,
  SUM(ce.used_amount) AS total_used,
  COUNT(DISTINCT b.id) AS booking_count
FROM corporate_employees ce
JOIN corporate_clients cc ON ce.corporate_id = cc.id
LEFT JOIN bookings b ON b.created_by = ce.user_id
WHERE ce.is_active = true
GROUP BY ce.corporate_id, cc.company_name, ce.department;

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_corporate_clients_branch_id ON corporate_clients(branch_id);
CREATE INDEX IF NOT EXISTS idx_corporate_deposits_corporate_id ON corporate_deposits(corporate_id);
CREATE INDEX IF NOT EXISTS idx_corporate_employees_corporate_id ON corporate_employees(corporate_id);
CREATE INDEX IF NOT EXISTS idx_corporate_employees_email ON corporate_employees(email);
CREATE INDEX IF NOT EXISTS idx_corporate_invoices_corporate_id ON corporate_invoices(corporate_id);
CREATE INDEX IF NOT EXISTS idx_corporate_invoice_items_invoice_id ON corporate_invoice_items(invoice_id);

-- ============================================
-- TRIGGERS
-- ============================================
CREATE TRIGGER update_corporate_clients_updated_at
  BEFORE UPDATE ON corporate_clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_corporate_deposits_updated_at
  BEFORE UPDATE ON corporate_deposits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_corporate_employees_updated_at
  BEFORE UPDATE ON corporate_employees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_corporate_invoices_updated_at
  BEFORE UPDATE ON corporate_invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
