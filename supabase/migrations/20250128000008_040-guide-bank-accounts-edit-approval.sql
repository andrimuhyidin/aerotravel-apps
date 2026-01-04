-- Migration: 040-guide-bank-accounts-edit-approval.sql
-- Description: Enable guide to edit approved bank accounts with admin approval workflow
-- Created: 2025-01-28

BEGIN;

-- ============================================
-- ADD COLUMNS FOR EDIT APPROVAL WORKFLOW
-- ============================================
ALTER TABLE guide_bank_accounts
  ADD COLUMN IF NOT EXISTS original_data JSONB, -- Backup data sebelum edit
  ADD COLUMN IF NOT EXISTS edit_requested_at TIMESTAMPTZ, -- Waktu request edit
  ADD COLUMN IF NOT EXISTS edit_requested_by UUID REFERENCES users(id); -- Guide yang request edit

-- Add comment for documentation
COMMENT ON COLUMN guide_bank_accounts.original_data IS 'Backup data rekening sebelum edit. Digunakan untuk restore jika edit ditolak admin.';
COMMENT ON COLUMN guide_bank_accounts.edit_requested_at IS 'Timestamp kapan guide request edit rekening yang sudah approved';
COMMENT ON COLUMN guide_bank_accounts.edit_requested_by IS 'Guide yang request edit. Untuk audit trail.';

-- ============================================
-- UPDATE STATUS CONSTRAINT (allow pending_edit)
-- ============================================
-- Note: Status sudah pakai VARCHAR(20), tidak perlu ubah constraint
-- Tapi pastikan aplikasi handle status 'pending_edit'

-- ============================================
-- UPDATE RLS POLICIES
-- ============================================

-- Guide can update approved bank accounts (will become pending_edit)
DROP POLICY IF EXISTS "guide_bank_accounts_update_approved" ON guide_bank_accounts;
CREATE POLICY "guide_bank_accounts_update_approved" ON guide_bank_accounts
  FOR UPDATE
  USING (
    guide_id = auth.uid() 
    AND status = 'approved' -- Bisa edit yang approved
  )
  WITH CHECK (
    guide_id = auth.uid() 
    AND status = 'pending_edit' -- Status harus jadi pending_edit setelah edit
    AND original_data IS NOT NULL -- Harus ada backup data lama
  );

-- Guide can update own pending_edit accounts (cancel edit request)
DROP POLICY IF EXISTS "guide_bank_accounts_update_pending_edit" ON guide_bank_accounts;
CREATE POLICY "guide_bank_accounts_update_pending_edit" ON guide_bank_accounts
  FOR UPDATE
  USING (
    guide_id = auth.uid() 
    AND status = 'pending_edit'
  )
  WITH CHECK (
    guide_id = auth.uid()
    -- Allow guide to cancel edit (restore to approved) atau update pending_edit
    AND (status = 'pending_edit' OR status = 'approved')
  );

-- Update existing delete policy: approved accounts cannot be deleted
DROP POLICY IF EXISTS "guide_bank_accounts_delete_own" ON guide_bank_accounts;
CREATE POLICY "guide_bank_accounts_delete_own" ON guide_bank_accounts
  FOR DELETE
  USING (
    guide_id = auth.uid() 
    AND (status = 'pending' OR status = 'rejected' OR status = 'pending_edit') 
    -- Approved accounts tidak bisa dihapus (hanya bisa di-nonaktifkan via edit)
  );

-- Admin can approve/reject pending_edit accounts
-- (Existing staff_approve policy should cover this, but let's make sure)
-- The existing policy already covers all UPDATE operations by staff

-- ============================================
-- FUNCTION: Restore original data on edit rejection
-- ============================================
CREATE OR REPLACE FUNCTION restore_bank_account_original_data()
RETURNS TRIGGER AS $$
BEGIN
  -- If status changed from pending_edit to approved and original_data exists
  -- This means admin rejected the edit and we restore original data
  IF OLD.status = 'pending_edit' 
     AND NEW.status = 'approved' 
     AND OLD.original_data IS NOT NULL
     AND NEW.rejection_reason IS NOT NULL THEN
    
    -- Restore from original_data
    NEW.bank_name := (OLD.original_data->>'bank_name')::VARCHAR(100);
    NEW.account_number := (OLD.original_data->>'account_number')::VARCHAR(50);
    NEW.account_holder_name := (OLD.original_data->>'account_holder_name')::VARCHAR(200);
    NEW.branch_name := (OLD.original_data->>'branch_name')::VARCHAR(200);
    NEW.branch_code := (OLD.original_data->>'branch_code')::VARCHAR(50);
    NEW.is_default := (OLD.original_data->>'is_default')::BOOLEAN;
    
    -- Clear edit request fields (keep original_data for audit)
    NEW.edit_requested_at := NULL;
    NEW.edit_requested_by := NULL;
  END IF;
  
  -- If status changed to approved and original_data should be cleared (edit approved)
  IF OLD.status = 'pending_edit' 
     AND NEW.status = 'approved' 
     AND NEW.rejection_reason IS NULL THEN
    
    -- Clear edit request fields and original_data (edit was approved)
    NEW.original_data := NULL;
    NEW.edit_requested_at := NULL;
    NEW.edit_requested_by := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-restore on edit rejection
DROP TRIGGER IF EXISTS trigger_restore_bank_account_original_data ON guide_bank_accounts;
CREATE TRIGGER trigger_restore_bank_account_original_data
  BEFORE UPDATE ON guide_bank_accounts
  FOR EACH ROW
  WHEN (OLD.status = 'pending_edit' AND NEW.status = 'approved')
  EXECUTE FUNCTION restore_bank_account_original_data();

COMMIT;

