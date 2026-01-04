-- Migration: 20260103100000_corporate-booking-approvals.sql
-- Description: Corporate Booking Approval Workflow
-- Purpose: Enable approval process for corporate employee bookings
-- Created: 2026-01-03

-- ============================================
-- CORPORATE APPROVAL STATUS ENUM
-- ============================================
DO $$ BEGIN
  CREATE TYPE corporate_approval_status AS ENUM (
    'pending',
    'approved',
    'rejected',
    'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- CORPORATE BOOKING APPROVALS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS corporate_booking_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corporate_id UUID NOT NULL REFERENCES corporate_clients(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES corporate_employees(id) ON DELETE CASCADE,
  
  -- Approval Info
  status corporate_approval_status NOT NULL DEFAULT 'pending',
  requested_amount DECIMAL(14,2) NOT NULL,
  approved_amount DECIMAL(14,2),
  
  -- Approver
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Notes
  request_notes TEXT,
  approver_notes TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_booking_approval UNIQUE(booking_id)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_corp_approvals_corporate ON corporate_booking_approvals(corporate_id);
CREATE INDEX IF NOT EXISTS idx_corp_approvals_status ON corporate_booking_approvals(status);
CREATE INDEX IF NOT EXISTS idx_corp_approvals_employee ON corporate_booking_approvals(employee_id);
CREATE INDEX IF NOT EXISTS idx_corp_approvals_booking ON corporate_booking_approvals(booking_id);
CREATE INDEX IF NOT EXISTS idx_corp_approvals_created ON corporate_booking_approvals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_corp_approvals_pending ON corporate_booking_approvals(corporate_id, status) 
  WHERE status = 'pending';

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE corporate_booking_approvals ENABLE ROW LEVEL SECURITY;

-- Corporate users can view their own company's approvals
CREATE POLICY "Corporate users can view their approvals" ON corporate_booking_approvals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM corporate_clients cc
      WHERE cc.id = corporate_booking_approvals.corporate_id
      AND (
        cc.pic_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM corporate_employees ce 
          WHERE ce.corporate_id = cc.id 
          AND ce.user_id = auth.uid()
          AND ce.is_active = true
        )
      )
    )
  );

-- PIC can manage approvals (approve/reject)
CREATE POLICY "PIC can manage approvals" ON corporate_booking_approvals
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM corporate_clients cc
      WHERE cc.id = corporate_booking_approvals.corporate_id
      AND cc.pic_id = auth.uid()
    )
  );

-- Employees can create their own approval requests
CREATE POLICY "Employees can create approval requests" ON corporate_booking_approvals
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM corporate_employees ce
      WHERE ce.id = corporate_booking_approvals.employee_id
      AND ce.user_id = auth.uid()
      AND ce.is_active = true
    )
  );

-- Super admins can view all
CREATE POLICY "Super admins can view all approvals" ON corporate_booking_approvals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'super_admin'
    )
  );

-- ============================================
-- TRIGGERS
-- ============================================
CREATE TRIGGER update_corporate_booking_approvals_updated_at
  BEFORE UPDATE ON corporate_booking_approvals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to get pending approval count for a corporate
CREATE OR REPLACE FUNCTION get_pending_approval_count(p_corporate_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM corporate_booking_approvals
    WHERE corporate_id = p_corporate_id
    AND status = 'pending'
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to check if booking requires approval
CREATE OR REPLACE FUNCTION booking_requires_approval(
  p_employee_id UUID,
  p_amount DECIMAL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_employee RECORD;
BEGIN
  SELECT * INTO v_employee
  FROM corporate_employees
  WHERE id = p_employee_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Check if amount exceeds remaining budget
  IF p_amount > (v_employee.allocated_amount - v_employee.used_amount) THEN
    RETURN true;
  END IF;
  
  -- Always require approval for now (can add threshold logic later)
  RETURN true;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to process approved booking
CREATE OR REPLACE FUNCTION process_approved_booking(p_approval_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_approval RECORD;
BEGIN
  SELECT * INTO v_approval
  FROM corporate_booking_approvals
  WHERE id = p_approval_id
  AND status = 'approved';
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Update employee used amount
  UPDATE corporate_employees
  SET used_amount = used_amount + COALESCE(v_approval.approved_amount, v_approval.requested_amount),
      updated_at = NOW()
  WHERE id = v_approval.employee_id;
  
  -- Update booking status to confirmed
  UPDATE bookings
  SET status = 'confirmed',
      updated_at = NOW()
  WHERE id = v_approval.booking_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE corporate_booking_approvals IS 'Approval workflow for corporate employee bookings';
COMMENT ON COLUMN corporate_booking_approvals.requested_amount IS 'Amount requested by employee for the booking';
COMMENT ON COLUMN corporate_booking_approvals.approved_amount IS 'Amount approved by PIC (may differ from requested)';
COMMENT ON COLUMN corporate_booking_approvals.rejection_reason IS 'Reason for rejection if status is rejected';

