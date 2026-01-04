-- Refunds Schema
-- Track refund requests and processing

CREATE TABLE IF NOT EXISTS refunds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id),
  payment_id UUID REFERENCES payments(id),
  refund_amount DECIMAL(15,2) NOT NULL,
  original_amount DECIMAL(15,2) NOT NULL,
  refund_percentage DECIMAL(5,2) DEFAULT 100,
  refund_reason TEXT NOT NULL,
  cancellation_policy TEXT,
  
  -- Processing info
  processed_by UUID REFERENCES auth.users(id),
  refund_method TEXT, -- 'bank_transfer', 'wallet', 'original_payment', 'credit'
  refund_status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'processing', 'completed', 'failed', 'rejected'
  
  -- Bank transfer details
  bank_name TEXT,
  bank_account_number TEXT,
  bank_account_name TEXT,
  
  -- Approval workflow
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  approval_notes TEXT,
  
  -- Rejection
  rejected_by UUID REFERENCES auth.users(id),
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Completion
  completed_at TIMESTAMPTZ,
  transaction_reference TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for refunds
CREATE INDEX IF NOT EXISTS idx_refunds_booking_id ON refunds(booking_id);
CREATE INDEX IF NOT EXISTS idx_refunds_payment_id ON refunds(payment_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON refunds(refund_status);
CREATE INDEX IF NOT EXISTS idx_refunds_processed_by ON refunds(processed_by);
CREATE INDEX IF NOT EXISTS idx_refunds_created_at ON refunds(created_at);

-- Add constraint for refund_status
ALTER TABLE refunds ADD CONSTRAINT refunds_status_check 
  CHECK (refund_status IN ('pending', 'approved', 'processing', 'completed', 'failed', 'rejected'));

-- RLS for refunds
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;

-- Admin can view refunds
CREATE POLICY "Admin can view refunds" ON refunds
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('super_admin', 'finance_manager', 'ops_admin')
    )
  );

-- Admin can create refunds
CREATE POLICY "Admin can create refunds" ON refunds
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('super_admin', 'finance_manager', 'ops_admin')
    )
  );

-- Admin can update refunds
CREATE POLICY "Admin can update refunds" ON refunds
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('super_admin', 'finance_manager')
    )
  );

-- Cancellation policies
CREATE TABLE IF NOT EXISTS cancellation_policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  days_before_trip INT NOT NULL, -- Number of days before trip date
  refund_percentage DECIMAL(5,2) NOT NULL, -- Percentage of refund (0-100)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default cancellation policies
INSERT INTO cancellation_policies (name, description, days_before_trip, refund_percentage) VALUES
  ('Full Refund', 'Pembatalan lebih dari 30 hari sebelum trip', 30, 100.00),
  ('75% Refund', 'Pembatalan 14-29 hari sebelum trip', 14, 75.00),
  ('50% Refund', 'Pembatalan 7-13 hari sebelum trip', 7, 50.00),
  ('25% Refund', 'Pembatalan 3-6 hari sebelum trip', 3, 25.00),
  ('No Refund', 'Pembatalan kurang dari 3 hari sebelum trip', 0, 0.00)
ON CONFLICT DO NOTHING;

-- RLS for cancellation policies
ALTER TABLE cancellation_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active cancellation policies" ON cancellation_policies
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admin can manage cancellation policies" ON cancellation_policies
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role = 'super_admin'
    )
  );

COMMENT ON TABLE refunds IS 'Track refund requests and processing for cancelled bookings';
COMMENT ON TABLE cancellation_policies IS 'Define refund percentages based on days before trip';

