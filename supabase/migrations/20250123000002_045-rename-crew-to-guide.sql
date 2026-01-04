-- Migration: 045-rename-crew-to-guide.sql
-- Description: Rename crew tables to guide for consistency with existing terminology
-- Created: 2025-01-23
-- Reference: Standardize terminology to use 'guide' instead of 'crew'

BEGIN;

-- ============================================
-- RENAME TABLES
-- ============================================

-- Rename crew_profiles_public_internal to guide_profiles_public_internal
ALTER TABLE IF EXISTS crew_profiles_public_internal 
  RENAME TO guide_profiles_public_internal;

-- Rename crew_notes to guide_notes
ALTER TABLE IF EXISTS crew_notes 
  RENAME TO guide_notes;

-- Rename crew_audit_logs to guide_assignment_audit_logs
ALTER TABLE IF EXISTS crew_audit_logs 
  RENAME TO guide_assignment_audit_logs;

-- ============================================
-- UPDATE INDEXES
-- ============================================

-- Rename indexes for guide_profiles_public_internal
ALTER INDEX IF EXISTS idx_crew_profiles_branch_id 
  RENAME TO idx_guide_profiles_branch_id;
ALTER INDEX IF EXISTS idx_crew_profiles_availability 
  RENAME TO idx_guide_profiles_availability;
ALTER INDEX IF EXISTS idx_crew_profiles_active 
  RENAME TO idx_guide_profiles_active;

-- Rename indexes for guide_notes
ALTER INDEX IF EXISTS idx_crew_notes_trip_id 
  RENAME TO idx_guide_notes_trip_id;
ALTER INDEX IF EXISTS idx_crew_notes_created_by 
  RENAME TO idx_guide_notes_created_by;
ALTER INDEX IF EXISTS idx_crew_notes_parent 
  RENAME TO idx_guide_notes_parent;
ALTER INDEX IF EXISTS idx_crew_notes_created_at 
  RENAME TO idx_guide_notes_created_at;
ALTER INDEX IF EXISTS idx_crew_notes_branch_id 
  RENAME TO idx_guide_notes_branch_id;

-- Rename indexes for guide_assignment_audit_logs
ALTER INDEX IF EXISTS idx_crew_audit_trip_id 
  RENAME TO idx_guide_assignment_audit_trip_id;
ALTER INDEX IF EXISTS idx_crew_audit_guide_id 
  RENAME TO idx_guide_assignment_audit_guide_id;
ALTER INDEX IF EXISTS idx_crew_audit_action_type 
  RENAME TO idx_guide_assignment_audit_action_type;
ALTER INDEX IF EXISTS idx_crew_audit_performed_at 
  RENAME TO idx_guide_assignment_audit_performed_at;
ALTER INDEX IF EXISTS idx_crew_audit_branch_id 
  RENAME TO idx_guide_assignment_audit_branch_id;

-- ============================================
-- UPDATE FUNCTIONS
-- ============================================

-- Update sync_crew_profile_from_user function
CREATE OR REPLACE FUNCTION sync_guide_profile_from_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Only sync for guides
  IF NEW.role = 'guide' THEN
    INSERT INTO guide_profiles_public_internal (
      user_id,
      branch_id,
      display_name,
      photo_url,
      is_active
    )
    VALUES (
      NEW.id,
      NEW.branch_id,
      NEW.full_name,
      NEW.avatar_url,
      NEW.is_active
    )
    ON CONFLICT (user_id) DO UPDATE
    SET
      display_name = NEW.full_name,
      photo_url = NEW.avatar_url,
      branch_id = NEW.branch_id,
      is_active = NEW.is_active,
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update trigger
DROP TRIGGER IF EXISTS trigger_sync_crew_profile ON users;
CREATE TRIGGER trigger_sync_guide_profile
  AFTER INSERT OR UPDATE ON users
  FOR EACH ROW
  WHEN (NEW.role = 'guide')
  EXECUTE FUNCTION sync_guide_profile_from_user();

-- Update update_crew_profile_availability function
CREATE OR REPLACE FUNCTION update_guide_profile_availability()
RETURNS TRIGGER AS $$
BEGIN
  -- Update availability based on guide_status
  UPDATE guide_profiles_public_internal
  SET 
    current_availability = CASE
      WHEN NEW.current_status = 'standby' THEN 'available'
      WHEN NEW.current_status = 'on_trip' THEN 'on_trip'
      WHEN NEW.current_status = 'not_available' THEN 'not_available'
      ELSE 'unknown'
    END,
    last_status_update = NEW.updated_at,
    updated_at = NOW()
  WHERE user_id = NEW.guide_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update trigger
DROP TRIGGER IF EXISTS trigger_update_crew_availability ON guide_status;
CREATE TRIGGER trigger_update_guide_availability
  AFTER INSERT OR UPDATE ON guide_status
  FOR EACH ROW
  EXECUTE FUNCTION update_guide_profile_availability();

-- Update log_crew_audit function
CREATE OR REPLACE FUNCTION log_guide_assignment_audit(
  p_trip_id UUID,
  p_guide_id UUID,
  p_action_type VARCHAR,
  p_action_details JSONB DEFAULT NULL,
  p_performed_by UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
  v_branch_id UUID;
BEGIN
  -- Get branch_id from trip or guide
  SELECT COALESCE(
    (SELECT branch_id FROM trips WHERE id = p_trip_id),
    (SELECT branch_id FROM users WHERE id = p_guide_id)
  ) INTO v_branch_id;

  INSERT INTO guide_assignment_audit_logs (
    trip_id,
    guide_id,
    branch_id,
    action_type,
    action_details,
    performed_by,
    performed_at
  )
  VALUES (
    p_trip_id,
    p_guide_id,
    v_branch_id,
    p_action_type,
    p_action_details,
    p_performed_by,
    NOW()
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- UPDATE FOREIGN KEY REFERENCES
-- ============================================

-- Update parent_note_id foreign key in guide_notes
-- (PostgreSQL will automatically update FK when table is renamed)

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE guide_profiles_public_internal IS 'Public profile data for internal guide directory';
COMMENT ON TABLE guide_notes IS 'Internal guide notes for trip coordination';
COMMENT ON TABLE guide_assignment_audit_logs IS 'Audit log for guide assignment operations';

COMMIT;
