-- Booking Modifications Schema
-- Track all changes made to bookings

-- Add cancellation fields to bookings if not exists
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES auth.users(id);

-- Booking modifications history
CREATE TABLE IF NOT EXISTS booking_modifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  modified_by UUID NOT NULL REFERENCES auth.users(id),
  modification_type TEXT NOT NULL, -- 'date_change', 'pax_change', 'package_change', 'customer_transfer', 'price_adjustment'
  old_value JSONB,
  new_value JSONB,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for booking modifications
CREATE INDEX IF NOT EXISTS idx_booking_modifications_booking_id ON booking_modifications(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_modifications_modified_by ON booking_modifications(modified_by);
CREATE INDEX IF NOT EXISTS idx_booking_modifications_type ON booking_modifications(modification_type);
CREATE INDEX IF NOT EXISTS idx_booking_modifications_created_at ON booking_modifications(created_at);

-- RLS for booking modifications
ALTER TABLE booking_modifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view booking modifications" ON booking_modifications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('super_admin', 'ops_admin', 'finance_manager')
    )
  );

CREATE POLICY "Admin can insert booking modifications" ON booking_modifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('super_admin', 'ops_admin', 'finance_manager')
    )
  );

COMMENT ON TABLE booking_modifications IS 'Audit trail for booking changes including date, pax, package modifications';

