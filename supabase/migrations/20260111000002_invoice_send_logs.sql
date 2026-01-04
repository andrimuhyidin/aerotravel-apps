-- Invoice Send Logs Schema
-- Track invoice sending history

CREATE TABLE IF NOT EXISTS invoice_send_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  send_method TEXT NOT NULL, -- 'email', 'whatsapp', 'both'
  recipient_email TEXT,
  recipient_phone TEXT,
  email_sent BOOLEAN DEFAULT false,
  whatsapp_sent BOOLEAN DEFAULT false,
  pdf_url TEXT,
  error_message TEXT,
  sent_by UUID NOT NULL REFERENCES auth.users(id),
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_invoice_send_logs_invoice_id ON invoice_send_logs(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_send_logs_sent_by ON invoice_send_logs(sent_by);
CREATE INDEX IF NOT EXISTS idx_invoice_send_logs_sent_at ON invoice_send_logs(sent_at);

-- RLS
ALTER TABLE invoice_send_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view invoice send logs" ON invoice_send_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('super_admin', 'finance_manager', 'ops_admin')
    )
  );

CREATE POLICY "Admin can insert invoice send logs" ON invoice_send_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('super_admin', 'finance_manager')
    )
  );

COMMENT ON TABLE invoice_send_logs IS 'Track all invoice sending attempts';

