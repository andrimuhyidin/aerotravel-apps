-- Bulk Actions Audit Trail
-- Track all bulk operations performed by admin users

CREATE TABLE IF NOT EXISTS bulk_action_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action_type TEXT NOT NULL, -- 'update_status', 'delete', 'activate', 'deactivate', etc.
  target_table TEXT NOT NULL, -- 'bookings', 'users', 'products', etc.
  affected_ids UUID[] NOT NULL,
  affected_count INT NOT NULL,
  successful_count INT NOT NULL,
  failed_count INT NOT NULL,
  payload JSONB, -- Additional action data
  performed_by UUID NOT NULL REFERENCES auth.users(id),
  performed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_bulk_action_logs_target_table ON bulk_action_logs(target_table);
CREATE INDEX IF NOT EXISTS idx_bulk_action_logs_performed_by ON bulk_action_logs(performed_by);
CREATE INDEX IF NOT EXISTS idx_bulk_action_logs_performed_at ON bulk_action_logs(performed_at);

-- RLS for bulk action logs
ALTER TABLE bulk_action_logs ENABLE ROW LEVEL SECURITY;

-- Only super_admin and ops_admin can view bulk action logs
CREATE POLICY "Admin can view bulk action logs" ON bulk_action_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('super_admin', 'ops_admin')
    )
  );

-- Allow admins to insert logs
CREATE POLICY "Admin can insert bulk action logs" ON bulk_action_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('super_admin', 'ops_admin', 'finance_manager')
    )
  );

COMMENT ON TABLE bulk_action_logs IS 'Audit trail for all bulk operations performed by admin users';

