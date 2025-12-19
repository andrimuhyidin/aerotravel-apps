-- Migration: 030-multi-role-data-migration.sql
-- Description: Migrate existing users.role data to user_roles table
-- Created: 2025-12-21
-- Reference: docs/MULTI_ROLE_SYSTEM_COMPLETE.md

BEGIN;

-- ============================================
-- DATA MIGRATION
-- ============================================
-- Migrate existing users.role to user_roles table
-- Set as primary role and active status

INSERT INTO user_roles (user_id, role, status, is_primary, applied_at, approved_at)
SELECT 
  id as user_id,
  role,
  'active' as status,
  true as is_primary,
  created_at as applied_at,
  created_at as approved_at
FROM users
WHERE role IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = users.id 
      AND user_roles.role = users.role
  )
ON CONFLICT (user_id, role) DO NOTHING;

-- ============================================
-- VERIFICATION
-- ============================================
-- Verify migration: count should match
DO $$
DECLARE
  users_count INTEGER;
  user_roles_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO users_count FROM users WHERE role IS NOT NULL;
  SELECT COUNT(*) INTO user_roles_count FROM user_roles WHERE is_primary = true;
  
  IF users_count != user_roles_count THEN
    RAISE WARNING 'Migration mismatch: users with role = %, user_roles primary = %', 
      users_count, user_roles_count;
  END IF;
END $$;

COMMIT;

