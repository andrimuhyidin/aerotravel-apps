-- Migration: 006-finance.sql
-- Description: Financial modules - expense requests, payroll, refunds
-- Created: 2025-12-17

-- ============================================
-- EXPENSE REQUESTS (Authority Matrix from PRD 4.1)
-- ============================================
DO $$ BEGIN
  CREATE TYPE expense_request_status AS ENUM (
    'draft',
    'pending_manager',    -- Rp 500k - 5jt
    'pending_director',   -- > Rp 5jt
    'approved',
    'rejected',
    'paid',
    'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS expense_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES branches(id),
  
  -- Request Info
  request_code VARCHAR(20) NOT NULL UNIQUE, -- EXP-20251217-001
  
  -- Category
  category expense_category NOT NULL,
  description TEXT NOT NULL,
  
  -- Amount
  amount DECIMAL(12,2) NOT NULL,
  
  -- Vendor (optional)
  vendor_id UUID REFERENCES vendors(id),
  vendor_name VARCHAR(200),
  
  -- Trip (optional)
  trip_id UUID REFERENCES trips(id),
  
  -- Status
  status expense_request_status NOT NULL DEFAULT 'draft',
  
  -- Approval Chain (from PRD 4.1 Authority Matrix)
  -- < 500k: Auto approved
  -- 500k - 5jt: Manager approval
  -- > 5jt: Director approval
  approval_level INTEGER DEFAULT 0, -- 0: auto, 1: manager, 2: director
  
  -- Approvals
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  approval_notes TEXT,
  
  rejected_by UUID REFERENCES users(id),
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Payment
  paid_by UUID REFERENCES users(id),
  paid_at TIMESTAMPTZ,
  payment_proof_url TEXT,
  
  -- Audit
  requested_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SALARY PAYMENTS (Payroll from PRD 4.5)
-- ============================================
DO $$ BEGIN
  CREATE TYPE salary_payment_status AS ENUM (
    'pending',
    'documentation_required',  -- Waiting for docs
    'ready',                   -- Ready to pay
    'paid',
    'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS salary_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES branches(id),
  
  -- Period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Guide
  guide_id UUID NOT NULL REFERENCES users(id),
  
  -- Amounts
  base_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  bonus_amount DECIMAL(12,2) DEFAULT 0,
  deduction_amount DECIMAL(12,2) DEFAULT 0,
  net_amount DECIMAL(12,2) NOT NULL,
  
  -- Status
  status salary_payment_status NOT NULL DEFAULT 'pending',
  
  -- Gatekeeper Check (from PRD 4.5)
  all_docs_uploaded BOOLEAN DEFAULT false,
  
  -- Payment
  paid_by UUID REFERENCES users(id),
  paid_at TIMESTAMPTZ,
  payment_method VARCHAR(50),
  payment_reference VARCHAR(100),
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SALARY DEDUCTIONS (Auto-Fine from PRD 4.1)
-- ============================================
DO $$ BEGIN
  CREATE TYPE deduction_type AS ENUM (
    'late_penalty',       -- Telat check-in
    'no_documentation',   -- Tidak upload foto
    'damage',             -- Kerusakan aset
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS salary_deductions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salary_payment_id UUID REFERENCES salary_payments(id),
  guide_id UUID NOT NULL REFERENCES users(id),
  trip_id UUID REFERENCES trips(id),
  
  -- Deduction Info
  deduction_type deduction_type NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  reason TEXT NOT NULL,
  
  -- Auto-generated flag
  is_auto BOOLEAN DEFAULT false,
  
  -- Audit
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- REFUNDS (Auto-Calculator from PRD 4.5)
-- ============================================
DO $$ BEGIN
  CREATE TYPE refund_status AS ENUM (
    'pending',
    'approved',
    'processing',
    'completed',
    'rejected'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id),
  payment_id UUID REFERENCES payments(id),
  
  -- Refund Calculation (from PRD 4.5)
  original_amount DECIMAL(12,2) NOT NULL,
  refund_percent DECIMAL(5,2) NOT NULL, -- Based on cancellation policy
  admin_fee DECIMAL(12,2) DEFAULT 0,
  refund_amount DECIMAL(12,2) NOT NULL,
  
  -- Policy Applied
  days_before_trip INTEGER NOT NULL,
  policy_applied TEXT, -- "H > 30: 100%", "H 14-30: 50%", etc
  
  -- Status
  status refund_status NOT NULL DEFAULT 'pending',
  
  -- Destination
  refund_to VARCHAR(20) DEFAULT 'wallet', -- 'wallet' or 'bank'
  bank_name VARCHAR(50),
  bank_account_number VARCHAR(30),
  bank_account_name VARCHAR(100),
  
  -- Override (Super Admin only)
  is_override BOOLEAN DEFAULT false,
  override_by UUID REFERENCES users(id),
  override_reason TEXT,
  
  -- Processing
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Xendit Disbursement
  disbursement_id VARCHAR(100),
  
  -- Audit
  requested_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SHADOW P&L VIEW (from PRD 4.5)
-- ============================================
CREATE OR REPLACE VIEW trip_profit_loss AS
SELECT 
  t.id AS trip_id,
  t.trip_code,
  t.trip_date,
  t.branch_id,
  p.name AS package_name,
  
  -- Revenue
  COALESCE(SUM(b.total_amount), 0) AS gross_revenue,
  COALESCE(SUM(pay.fee_amount), 0) AS payment_fees,
  COALESCE(SUM(b.total_amount), 0) - COALESCE(SUM(pay.fee_amount), 0) AS net_revenue,
  
  -- Internal Cost (Asset Rental)
  COALESCE(a.rental_price_per_trip, 0) AS internal_asset_cost,
  
  -- External Costs
  COALESCE(SUM(te.total_amount), 0) AS external_costs,
  
  -- Guide Fees
  COALESCE(SUM(tg.fee_amount), 0) AS guide_fees,
  
  -- Profit Calculation
  COALESCE(SUM(b.total_amount), 0) 
    - COALESCE(SUM(pay.fee_amount), 0) 
    - COALESCE(a.rental_price_per_trip, 0)
    - COALESCE(SUM(te.total_amount), 0)
    - COALESCE(SUM(tg.fee_amount), 0) AS net_profit
    
FROM trips t
LEFT JOIN packages p ON t.package_id = p.id
LEFT JOIN assets a ON t.primary_asset_id = a.id
LEFT JOIN trip_bookings tb ON t.id = tb.trip_id
LEFT JOIN bookings b ON tb.booking_id = b.id
LEFT JOIN payments pay ON b.id = pay.booking_id AND pay.status = 'paid'
LEFT JOIN trip_expenses te ON t.id = te.trip_id
LEFT JOIN trip_guides tg ON t.id = tg.trip_id
GROUP BY t.id, t.trip_code, t.trip_date, t.branch_id, p.name, a.rental_price_per_trip;

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_expense_requests_branch_id ON expense_requests(branch_id);
CREATE INDEX IF NOT EXISTS idx_expense_requests_status ON expense_requests(status);
CREATE INDEX IF NOT EXISTS idx_expense_requests_requested_by ON expense_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_salary_payments_branch_id ON salary_payments(branch_id);
CREATE INDEX IF NOT EXISTS idx_salary_payments_guide_id ON salary_payments(guide_id);
CREATE INDEX IF NOT EXISTS idx_salary_payments_status ON salary_payments(status);
CREATE INDEX IF NOT EXISTS idx_salary_deductions_guide_id ON salary_deductions(guide_id);
CREATE INDEX IF NOT EXISTS idx_salary_deductions_trip_id ON salary_deductions(trip_id);
CREATE INDEX IF NOT EXISTS idx_refunds_booking_id ON refunds(booking_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON refunds(status);

-- ============================================
-- TRIGGERS
-- ============================================
CREATE TRIGGER update_expense_requests_updated_at
  BEFORE UPDATE ON expense_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_salary_payments_updated_at
  BEFORE UPDATE ON salary_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_refunds_updated_at
  BEFORE UPDATE ON refunds
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNCTION: Calculate Refund Amount
-- ============================================
CREATE OR REPLACE FUNCTION calculate_refund(
  p_booking_id UUID,
  p_cancel_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  original_amount DECIMAL,
  days_before_trip INTEGER,
  refund_percent DECIMAL,
  admin_fee DECIMAL,
  refund_amount DECIMAL,
  policy_applied TEXT
) AS $$
DECLARE
  v_booking RECORD;
  v_days INTEGER;
  v_percent DECIMAL;
  v_policy TEXT;
  v_admin_fee DECIMAL := 50000; -- Rp 50.000 admin fee
BEGIN
  -- Get booking
  SELECT b.trip_date, b.total_amount
  INTO v_booking
  FROM bookings b
  WHERE b.id = p_booking_id;
  
  -- Calculate days before trip
  v_days := v_booking.trip_date - p_cancel_date;
  
  -- Apply refund policy (from PRD 4.5)
  IF v_days > 30 THEN
    v_percent := 100;
    v_policy := 'H > 30: Refund 100%';
  ELSIF v_days >= 14 THEN
    v_percent := 50;
    v_policy := 'H 14-30: Refund 50%';
  ELSIF v_days >= 7 THEN
    v_percent := 25;
    v_policy := 'H 7-14: Refund 25%';
  ELSE
    v_percent := 0;
    v_policy := 'H < 7: No Refund';
  END IF;
  
  RETURN QUERY SELECT
    v_booking.total_amount,
    v_days,
    v_percent,
    v_admin_fee,
    GREATEST((v_booking.total_amount * v_percent / 100) - v_admin_fee, 0),
    v_policy;
END;
$$ LANGUAGE plpgsql;
