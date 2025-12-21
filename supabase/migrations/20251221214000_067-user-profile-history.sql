-- Migration: 067-user-profile-history.sql
-- Description: Create user_profile_history table to track profile changes
-- Created: 2025-12-21
-- Reference: Guide Profile Edit Security & Compliance Improvements

BEGIN;

-- Create user_profile_history table
CREATE TABLE IF NOT EXISTS user_profile_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Change details
  field_name VARCHAR(100) NOT NULL,
  old_value TEXT,
  new_value TEXT,
  
  -- Metadata
  changed_by UUID REFERENCES users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes
  CONSTRAINT user_profile_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profile_history_user_id 
  ON user_profile_history(user_id);
  
CREATE INDEX IF NOT EXISTS idx_user_profile_history_changed_at 
  ON user_profile_history(changed_at DESC);
  
CREATE INDEX IF NOT EXISTS idx_user_profile_history_field_name 
  ON user_profile_history(field_name);

-- Add comment
COMMENT ON TABLE user_profile_history IS 'Tracks all changes to user profile fields for audit and compliance';
COMMENT ON COLUMN user_profile_history.field_name IS 'Name of the field that was changed (e.g., full_name, phone, nik)';
COMMENT ON COLUMN user_profile_history.old_value IS 'Previous value before change';
COMMENT ON COLUMN user_profile_history.new_value IS 'New value after change';
COMMENT ON COLUMN user_profile_history.changed_by IS 'User ID who made the change (can be the user themselves or admin)';

-- Create function to log profile changes
CREATE OR REPLACE FUNCTION log_user_profile_change()
RETURNS TRIGGER AS $$
DECLARE
  changed_user_id UUID;
BEGIN
  -- Get the user who made the change (from auth context or trigger)
  changed_user_id := COALESCE(
    (SELECT id FROM users WHERE id = auth.uid()),
    NEW.updated_by, -- If updated_by column exists
    NEW.id -- Fallback to the user themselves
  );

  -- Log changes for each field that was modified
  IF OLD.full_name IS DISTINCT FROM NEW.full_name THEN
    INSERT INTO user_profile_history (user_id, field_name, old_value, new_value, changed_by)
    VALUES (NEW.id, 'full_name', OLD.full_name::TEXT, NEW.full_name::TEXT, changed_user_id);
  END IF;

  IF OLD.phone IS DISTINCT FROM NEW.phone THEN
    INSERT INTO user_profile_history (user_id, field_name, old_value, new_value, changed_by)
    VALUES (NEW.id, 'phone', OLD.phone::TEXT, NEW.phone::TEXT, changed_user_id);
  END IF;

  IF OLD.nik IS DISTINCT FROM NEW.nik THEN
    INSERT INTO user_profile_history (user_id, field_name, old_value, new_value, changed_by)
    VALUES (NEW.id, 'nik', OLD.nik::TEXT, NEW.nik::TEXT, changed_user_id);
  END IF;

  IF OLD.address IS DISTINCT FROM NEW.address THEN
    INSERT INTO user_profile_history (user_id, field_name, old_value, new_value, changed_by)
    VALUES (NEW.id, 'address', OLD.address::TEXT, NEW.address::TEXT, changed_user_id);
  END IF;

  IF OLD.employee_number IS DISTINCT FROM NEW.employee_number THEN
    INSERT INTO user_profile_history (user_id, field_name, old_value, new_value, changed_by)
    VALUES (NEW.id, 'employee_number', OLD.employee_number::TEXT, NEW.employee_number::TEXT, changed_user_id);
  END IF;

  IF OLD.hire_date IS DISTINCT FROM NEW.hire_date THEN
    INSERT INTO user_profile_history (user_id, field_name, old_value, new_value, changed_by)
    VALUES (NEW.id, 'hire_date', OLD.hire_date::TEXT, NEW.hire_date::TEXT, changed_user_id);
  END IF;

  IF OLD.employment_status IS DISTINCT FROM NEW.employment_status THEN
    INSERT INTO user_profile_history (user_id, field_name, old_value, new_value, changed_by)
    VALUES (NEW.id, 'employment_status', OLD.employment_status::TEXT, NEW.employment_status::TEXT, changed_user_id);
  END IF;

  IF OLD.supervisor_id IS DISTINCT FROM NEW.supervisor_id THEN
    INSERT INTO user_profile_history (user_id, field_name, old_value, new_value, changed_by)
    VALUES (NEW.id, 'supervisor_id', OLD.supervisor_id::TEXT, NEW.supervisor_id::TEXT, changed_user_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-log changes
CREATE TRIGGER trigger_log_user_profile_changes
  AFTER UPDATE ON users
  FOR EACH ROW
  WHEN (
    OLD.full_name IS DISTINCT FROM NEW.full_name OR
    OLD.phone IS DISTINCT FROM NEW.phone OR
    OLD.nik IS DISTINCT FROM NEW.nik OR
    OLD.address IS DISTINCT FROM NEW.address OR
    OLD.employee_number IS DISTINCT FROM NEW.employee_number OR
    OLD.hire_date IS DISTINCT FROM NEW.hire_date OR
    OLD.employment_status IS DISTINCT FROM NEW.employment_status OR
    OLD.supervisor_id IS DISTINCT FROM NEW.supervisor_id
  )
  EXECUTE FUNCTION log_user_profile_change();

-- Enable RLS
ALTER TABLE user_profile_history ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own profile history
CREATE POLICY "user_profile_history_select_own" ON user_profile_history
  FOR SELECT
  USING (user_id = auth.uid());

-- RLS Policy: Admins can view all profile history
CREATE POLICY "user_profile_history_select_admin" ON user_profile_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'ops_admin', 'finance_manager')
    )
  );

COMMIT;

