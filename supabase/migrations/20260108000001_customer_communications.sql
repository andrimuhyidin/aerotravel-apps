-- Customer Communications Schema
-- Track all communications with customers

CREATE TABLE IF NOT EXISTS customer_communications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  communication_type TEXT NOT NULL, -- 'email', 'call', 'whatsapp', 'note', 'meeting', 'sms'
  direction TEXT, -- 'inbound', 'outbound', NULL for notes
  subject TEXT,
  content TEXT,
  outcome TEXT, -- 'answered', 'no_answer', 'voicemail', 'callback_requested', etc.
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_date DATE,
  follow_up_notes TEXT,
  
  -- Related records
  booking_id UUID REFERENCES bookings(id),
  
  -- Metadata
  attachments JSONB, -- Array of attachment URLs
  metadata JSONB, -- Additional data (call duration, email thread ID, etc.)
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for customer communications
CREATE INDEX IF NOT EXISTS idx_customer_communications_customer_id ON customer_communications(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_communications_type ON customer_communications(communication_type);
CREATE INDEX IF NOT EXISTS idx_customer_communications_created_at ON customer_communications(created_at);
CREATE INDEX IF NOT EXISTS idx_customer_communications_follow_up ON customer_communications(follow_up_required, follow_up_date);

-- Add constraint for communication_type
ALTER TABLE customer_communications ADD CONSTRAINT customer_communications_type_check 
  CHECK (communication_type IN ('email', 'call', 'whatsapp', 'note', 'meeting', 'sms'));

-- RLS for customer communications
ALTER TABLE customer_communications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage customer communications" ON customer_communications
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('super_admin', 'ops_admin', 'marketing')
    )
  );

-- Loyalty points adjustments table
CREATE TABLE IF NOT EXISTS loyalty_points_adjustments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  points INT NOT NULL, -- Positive for add, negative for deduct
  adjustment_type TEXT NOT NULL, -- 'manual_add', 'manual_deduct', 'booking_reward', 'redemption', 'expiry', 'correction'
  reason TEXT NOT NULL,
  reference_id UUID, -- booking_id, order_id, etc.
  reference_type TEXT, -- 'booking', 'order', 'promotion'
  balance_before INT NOT NULL,
  balance_after INT NOT NULL,
  expiry_date DATE, -- For points that expire
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for loyalty adjustments
CREATE INDEX IF NOT EXISTS idx_loyalty_points_adjustments_customer_id ON loyalty_points_adjustments(customer_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_points_adjustments_created_at ON loyalty_points_adjustments(created_at);

-- RLS for loyalty adjustments
ALTER TABLE loyalty_points_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage loyalty points" ON loyalty_points_adjustments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('super_admin', 'finance_manager', 'marketing')
    )
  );

CREATE POLICY "Customer can view own points" ON loyalty_points_adjustments
  FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid());

COMMENT ON TABLE customer_communications IS 'Track all communications with customers';
COMMENT ON TABLE loyalty_points_adjustments IS 'Track loyalty points transactions';

