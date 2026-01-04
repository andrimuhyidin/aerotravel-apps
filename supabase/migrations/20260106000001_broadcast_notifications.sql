-- Broadcast Notifications Schema
-- For sending mass notifications to users

CREATE TABLE IF NOT EXISTS broadcast_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  sent_by UUID NOT NULL REFERENCES auth.users(id),
  target_roles TEXT[], -- ['customer', 'guide', 'mitra', etc]
  target_branches UUID[], -- specific branches or NULL for all
  delivery_method TEXT[], -- ['in_app', 'email', 'push', 'sms', 'whatsapp']
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  recipient_count INT DEFAULT 0,
  success_count INT DEFAULT 0,
  failed_count INT DEFAULT 0,
  status TEXT DEFAULT 'draft', -- 'draft', 'scheduled', 'sending', 'completed', 'failed', 'cancelled'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for broadcast notifications
CREATE INDEX IF NOT EXISTS idx_broadcast_notifications_status ON broadcast_notifications(status);
CREATE INDEX IF NOT EXISTS idx_broadcast_notifications_sent_by ON broadcast_notifications(sent_by);
CREATE INDEX IF NOT EXISTS idx_broadcast_notifications_scheduled_for ON broadcast_notifications(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_broadcast_notifications_created_at ON broadcast_notifications(created_at);

-- Add constraint for status
ALTER TABLE broadcast_notifications ADD CONSTRAINT broadcast_notifications_status_check 
  CHECK (status IN ('draft', 'scheduled', 'sending', 'completed', 'failed', 'cancelled'));

-- RLS for broadcast notifications
ALTER TABLE broadcast_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view broadcast notifications" ON broadcast_notifications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('super_admin', 'ops_admin', 'marketing')
    )
  );

CREATE POLICY "Admin can create broadcast notifications" ON broadcast_notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('super_admin', 'ops_admin', 'marketing')
    )
  );

CREATE POLICY "Admin can update broadcast notifications" ON broadcast_notifications
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('super_admin', 'ops_admin', 'marketing')
    )
  );

-- Broadcast delivery log
CREATE TABLE IF NOT EXISTS broadcast_delivery_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  broadcast_id UUID NOT NULL REFERENCES broadcast_notifications(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id),
  delivery_method TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed', 'bounced'
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for delivery logs
CREATE INDEX IF NOT EXISTS idx_broadcast_delivery_logs_broadcast_id ON broadcast_delivery_logs(broadcast_id);
CREATE INDEX IF NOT EXISTS idx_broadcast_delivery_logs_recipient_id ON broadcast_delivery_logs(recipient_id);
CREATE INDEX IF NOT EXISTS idx_broadcast_delivery_logs_status ON broadcast_delivery_logs(status);

COMMENT ON TABLE broadcast_notifications IS 'Mass notifications sent to multiple users';
COMMENT ON TABLE broadcast_delivery_logs IS 'Track individual delivery status for each broadcast recipient';

