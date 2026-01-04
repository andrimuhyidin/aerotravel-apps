-- Scheduled Notifications Schema
-- For scheduling future notifications

CREATE TABLE IF NOT EXISTS scheduled_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notification_type TEXT NOT NULL, -- 'reminder', 'follow_up', 'birthday', 'anniversary', 'custom'
  recipient_id UUID REFERENCES auth.users(id),
  recipient_role TEXT,
  recipient_filter JSONB, -- For targeting specific users based on criteria
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  delivery_method TEXT NOT NULL, -- 'in_app', 'email', 'push', 'sms', 'whatsapp'
  schedule_time TIMESTAMPTZ NOT NULL,
  repeat_pattern TEXT, -- 'once', 'daily', 'weekly', 'monthly'
  repeat_until TIMESTAMPTZ,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  run_count INT DEFAULT 0,
  max_runs INT,
  status TEXT DEFAULT 'pending', -- 'pending', 'active', 'paused', 'completed', 'cancelled'
  metadata JSONB, -- Additional data for notification
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for scheduled notifications
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_status ON scheduled_notifications(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_schedule_time ON scheduled_notifications(schedule_time);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_next_run_at ON scheduled_notifications(next_run_at);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_created_by ON scheduled_notifications(created_by);

-- Add constraint for status
ALTER TABLE scheduled_notifications ADD CONSTRAINT scheduled_notifications_status_check 
  CHECK (status IN ('pending', 'active', 'paused', 'completed', 'cancelled'));

-- Add constraint for repeat_pattern
ALTER TABLE scheduled_notifications ADD CONSTRAINT scheduled_notifications_repeat_check 
  CHECK (repeat_pattern IN ('once', 'daily', 'weekly', 'monthly', 'yearly'));

-- RLS for scheduled notifications
ALTER TABLE scheduled_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage scheduled notifications" ON scheduled_notifications
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('super_admin', 'ops_admin', 'marketing')
    )
  );

-- Email templates table (if not exists)
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL, -- 'booking_confirmation', 'payment_reminder', etc.
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  variables TEXT[], -- Available variables like '{{name}}', '{{booking_code}}'
  category TEXT DEFAULT 'transactional', -- 'transactional', 'marketing', 'notification'
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default email templates
INSERT INTO email_templates (key, name, subject, body_html, body_text, variables, category) VALUES
  ('booking_confirmation', 'Booking Confirmation', 'Konfirmasi Booking {{booking_code}}', 
   '<h1>Terima kasih, {{name}}!</h1><p>Booking Anda dengan kode <strong>{{booking_code}}</strong> telah dikonfirmasi.</p>',
   'Terima kasih, {{name}}! Booking Anda dengan kode {{booking_code}} telah dikonfirmasi.',
   ARRAY['name', 'booking_code', 'trip_date', 'package_name'],
   'transactional'),
  ('payment_reminder', 'Payment Reminder', 'Reminder: Pembayaran Booking {{booking_code}}',
   '<h1>Halo, {{name}}</h1><p>Mohon segera selesaikan pembayaran untuk booking {{booking_code}} sebelum {{due_date}}.</p>',
   'Halo, {{name}}. Mohon segera selesaikan pembayaran untuk booking {{booking_code}} sebelum {{due_date}}.',
   ARRAY['name', 'booking_code', 'due_date', 'amount'],
   'transactional'),
  ('refund_processed', 'Refund Processed', 'Refund Berhasil Diproses - {{booking_code}}',
   '<h1>Halo, {{name}}</h1><p>Refund untuk booking {{booking_code}} telah diproses. Jumlah: Rp {{refund_amount}}</p>',
   'Halo, {{name}}. Refund untuk booking {{booking_code}} telah diproses. Jumlah: Rp {{refund_amount}}',
   ARRAY['name', 'booking_code', 'refund_amount'],
   'transactional')
ON CONFLICT (key) DO NOTHING;

-- RLS for email templates
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active email templates" ON email_templates
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admin can manage email templates" ON email_templates
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role = 'super_admin'
    )
  );

COMMENT ON TABLE scheduled_notifications IS 'Scheduled future notifications with optional recurrence';
COMMENT ON TABLE email_templates IS 'Email templates with variable support';

