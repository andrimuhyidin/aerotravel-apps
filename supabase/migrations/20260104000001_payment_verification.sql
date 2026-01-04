-- Payment Verification Schema Enhancement
-- Adds columns for manual payment verification workflow

-- Add verification columns to payments table
ALTER TABLE payments ADD COLUMN IF NOT EXISTS proof_url TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES auth.users(id);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS verification_notes TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS more_info_requested BOOLEAN DEFAULT false;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS more_info_reason TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS more_info_requested_at TIMESTAMPTZ;

-- Create index for faster queries on verification_status
CREATE INDEX IF NOT EXISTS idx_payments_verification_status ON payments(verification_status);
CREATE INDEX IF NOT EXISTS idx_payments_verified_by ON payments(verified_by);

-- Add constraint for verification_status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'payments_verification_status_check'
  ) THEN
    ALTER TABLE payments ADD CONSTRAINT payments_verification_status_check 
      CHECK (verification_status IN ('pending', 'verified', 'rejected', 'more_info_needed'));
  END IF;
END $$;

-- RLS Policies for payment verification
-- Allow admins to view all payments
CREATE POLICY IF NOT EXISTS "Admin can view all payments" ON payments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('super_admin', 'finance_manager', 'ops_admin')
    )
  );

-- Allow admins to update payment verification
CREATE POLICY IF NOT EXISTS "Admin can verify payments" ON payments
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('super_admin', 'finance_manager')
    )
  );

-- Create payment verification audit log
CREATE TABLE IF NOT EXISTS payment_verification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'verified', 'rejected', 'more_info_requested'
  previous_status TEXT,
  new_status TEXT NOT NULL,
  notes TEXT,
  rejection_reason TEXT,
  performed_by UUID NOT NULL REFERENCES auth.users(id),
  performed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for payment verification logs
CREATE INDEX IF NOT EXISTS idx_payment_verification_logs_payment_id ON payment_verification_logs(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_verification_logs_performed_by ON payment_verification_logs(performed_by);

-- RLS for verification logs
ALTER TABLE payment_verification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view verification logs" ON payment_verification_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('super_admin', 'finance_manager', 'ops_admin')
    )
  );

CREATE POLICY "Admin can insert verification logs" ON payment_verification_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('super_admin', 'finance_manager')
    )
  );

COMMENT ON TABLE payment_verification_logs IS 'Audit trail for payment verification actions';

