-- Invoices Schema
-- Track invoices for bookings, trips, and corporate clients

-- Add manual payment fields
ALTER TABLE payments ADD COLUMN IF NOT EXISTS is_manual BOOLEAN DEFAULT false;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS manual_entry_by UUID REFERENCES auth.users(id);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS account_number TEXT;

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number TEXT UNIQUE NOT NULL,
  booking_id UUID REFERENCES bookings(id),
  trip_id UUID,
  customer_id UUID REFERENCES users(id),
  corporate_id UUID,
  
  -- Invoice type
  invoice_type TEXT NOT NULL DEFAULT 'booking', -- 'booking', 'corporate', 'partner', 'manual'
  
  -- Amounts
  subtotal DECIMAL(15,2) NOT NULL,
  tax_rate DECIMAL(5,2) DEFAULT 11.00, -- PPN 11%
  tax_amount DECIMAL(15,2) DEFAULT 0,
  discount_amount DECIMAL(15,2) DEFAULT 0,
  discount_reason TEXT,
  total_amount DECIMAL(15,2) NOT NULL,
  
  -- Payment terms
  due_date DATE,
  payment_terms TEXT DEFAULT 'NET 7', -- NET 7, NET 14, NET 30, IMMEDIATE
  
  -- Status tracking
  status TEXT DEFAULT 'draft', -- 'draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled', 'void'
  paid_amount DECIMAL(15,2) DEFAULT 0,
  paid_at TIMESTAMPTZ,
  
  -- PDF
  pdf_url TEXT,
  
  -- Notes
  notes TEXT,
  internal_notes TEXT,
  
  -- Audit
  generated_by UUID REFERENCES auth.users(id),
  sent_at TIMESTAMPTZ,
  sent_to TEXT,
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES auth.users(id),
  cancellation_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoice line items
CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(15,2) NOT NULL,
  discount DECIMAL(15,2) DEFAULT 0,
  subtotal DECIMAL(15,2) NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for invoices
CREATE INDEX IF NOT EXISTS idx_invoices_booking_id ON invoices(booking_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);

-- Add constraint for status
ALTER TABLE invoices ADD CONSTRAINT invoices_status_check 
  CHECK (status IN ('draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled', 'void'));

-- Generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
DECLARE
  year_month TEXT;
  sequence_num INT;
  new_invoice_number TEXT;
BEGIN
  year_month := TO_CHAR(NOW(), 'YYMM');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 8 FOR 4) AS INT)), 0) + 1
  INTO sequence_num
  FROM invoices
  WHERE invoice_number LIKE 'INV' || year_month || '%';
  
  new_invoice_number := 'INV' || year_month || LPAD(sequence_num::TEXT, 4, '0');
  NEW.invoice_number := new_invoice_number;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-generating invoice number
DROP TRIGGER IF EXISTS trigger_generate_invoice_number ON invoices;
CREATE TRIGGER trigger_generate_invoice_number
  BEFORE INSERT ON invoices
  FOR EACH ROW
  WHEN (NEW.invoice_number IS NULL OR NEW.invoice_number = '')
  EXECUTE FUNCTION generate_invoice_number();

-- RLS for invoices
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage invoices" ON invoices
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('super_admin', 'finance_manager')
    )
  );

CREATE POLICY "Ops can view invoices" ON invoices
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('ops_admin')
    )
  );

-- Customer can view their own invoices
CREATE POLICY "Customer can view own invoices" ON invoices
  FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid());

ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage invoice items" ON invoice_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM invoices i
      JOIN users u ON u.id = auth.uid()
      WHERE i.id = invoice_items.invoice_id
      AND u.role IN ('super_admin', 'finance_manager')
    )
  );

COMMENT ON TABLE invoices IS 'Track invoices for bookings, trips, and corporate clients';
COMMENT ON TABLE invoice_items IS 'Line items for each invoice';

