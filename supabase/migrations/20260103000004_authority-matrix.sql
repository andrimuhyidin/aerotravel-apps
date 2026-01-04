-- Migration: Authority Matrix
-- Purpose: Configurable approval workflows and permission matrix
-- Allows defining who can approve what actions

-- Create authority matrix table
CREATE TABLE IF NOT EXISTS authority_matrix (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  action_type VARCHAR(100) NOT NULL,
  action_name VARCHAR(200) NOT NULL,
  description TEXT,
  required_roles TEXT[] NOT NULL DEFAULT '{}',
  min_approvers INT DEFAULT 1,
  threshold_amount DECIMAL(15,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique action per branch
  UNIQUE(branch_id, action_type)
);

-- Create approval workflows table
CREATE TABLE IF NOT EXISTS approval_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  workflow_name VARCHAR(200) NOT NULL,
  trigger_action VARCHAR(100) NOT NULL,
  steps JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_authority_matrix_branch ON authority_matrix(branch_id);
CREATE INDEX idx_authority_matrix_action ON authority_matrix(action_type);
CREATE INDEX idx_approval_workflows_branch ON approval_workflows(branch_id);

-- Add comments
COMMENT ON TABLE authority_matrix IS 'Role-based permission matrix for actions';
COMMENT ON COLUMN authority_matrix.required_roles IS 'Array of roles that can perform this action';
COMMENT ON COLUMN authority_matrix.min_approvers IS 'Minimum number of approvers required';
COMMENT ON COLUMN authority_matrix.threshold_amount IS 'Amount threshold that triggers this rule';

-- RLS Policies
ALTER TABLE authority_matrix ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_workflows ENABLE ROW LEVEL SECURITY;

-- Admins can view authority matrix
CREATE POLICY "Admins can view authority matrix" ON authority_matrix
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('super_admin', 'ops_admin')
    )
  );

-- Only super_admin can manage
CREATE POLICY "Super admin can manage authority matrix" ON authority_matrix
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role = 'super_admin'
    )
  );

-- Same policies for workflows
CREATE POLICY "Admins can view workflows" ON approval_workflows
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('super_admin', 'ops_admin')
    )
  );

CREATE POLICY "Super admin can manage workflows" ON approval_workflows
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role = 'super_admin'
    )
  );

-- Create triggers for updated_at
CREATE TRIGGER trigger_update_authority_matrix_timestamp
  BEFORE UPDATE ON authority_matrix
  FOR EACH ROW
  EXECUTE FUNCTION update_seasons_timestamp();

CREATE TRIGGER trigger_update_approval_workflows_timestamp
  BEFORE UPDATE ON approval_workflows
  FOR EACH ROW
  EXECUTE FUNCTION update_seasons_timestamp();

-- Insert default authority matrix
INSERT INTO authority_matrix (branch_id, action_type, action_name, description, required_roles, min_approvers)
VALUES
  (NULL, 'booking_create', 'Buat Booking', 'Membuat booking baru', ARRAY['cs', 'ops_admin', 'super_admin'], 1),
  (NULL, 'booking_cancel', 'Batalkan Booking', 'Membatalkan booking', ARRAY['ops_admin', 'finance', 'super_admin'], 1),
  (NULL, 'discount_apply', 'Terapkan Diskon', 'Memberikan diskon hingga 10%', ARRAY['cs', 'ops_admin', 'super_admin'], 1),
  (NULL, 'discount_high', 'Diskon Tinggi', 'Memberikan diskon > 10%', ARRAY['ops_admin', 'finance', 'super_admin'], 1),
  (NULL, 'refund_request', 'Request Refund', 'Mengajukan refund', ARRAY['cs', 'ops_admin', 'super_admin'], 1),
  (NULL, 'refund_approve', 'Approve Refund', 'Menyetujui refund', ARRAY['finance', 'super_admin'], 1),
  (NULL, 'expense_claim', 'Klaim Expense', 'Mengajukan klaim expense', ARRAY['guide', 'ops_admin', 'super_admin'], 1),
  (NULL, 'expense_approve', 'Approve Expense', 'Menyetujui expense', ARRAY['finance', 'super_admin'], 1),
  (NULL, 'user_manage', 'Kelola User', 'Menambah/edit/hapus user', ARRAY['super_admin'], 1),
  (NULL, 'settings_manage', 'Kelola Settings', 'Mengubah pengaturan sistem', ARRAY['super_admin'], 1),
  (NULL, 'report_view', 'Lihat Report', 'Melihat laporan keuangan', ARRAY['finance', 'branch_admin', 'super_admin'], 1),
  (NULL, 'audit_view', 'Lihat Audit Log', 'Melihat audit log', ARRAY['super_admin'], 1)
ON CONFLICT (branch_id, action_type) DO NOTHING;

