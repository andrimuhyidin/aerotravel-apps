-- Migration: 029-multi-role-system.sql
-- Description: Multi-Role System - Create user_roles and role_applications tables
-- Created: 2025-12-21
-- Reference: docs/MULTI_ROLE_SYSTEM_COMPLETE.md

BEGIN;

-- ============================================
-- USER ROLES TABLE
-- ============================================
-- Table untuk many-to-many user roles
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  status VARCHAR(20) DEFAULT 'active', -- active, pending, rejected, suspended
  is_primary BOOLEAN DEFAULT false, -- Primary role (untuk backward compatibility)
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id),
  suspended_at TIMESTAMPTZ,
  suspended_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Indexes untuk performa
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);
CREATE INDEX IF NOT EXISTS idx_user_roles_status ON user_roles(status);
CREATE INDEX IF NOT EXISTS idx_user_roles_lookup ON user_roles(user_id, role, status) 
  WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_user_roles_primary ON user_roles(user_id, is_primary) 
  WHERE is_primary = true AND status = 'active';

-- Updated_at trigger
CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROLE APPLICATIONS TABLE
-- ============================================
-- Table untuk role applications (tracking & audit)
CREATE TABLE IF NOT EXISTS role_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  requested_role user_role NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
  message TEXT, -- User's message/notes
  admin_notes TEXT, -- Admin's notes
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES users(id),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_role_applications_user_id ON role_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_role_applications_status ON role_applications(status);
CREATE INDEX IF NOT EXISTS idx_role_applications_role ON role_applications(requested_role);
CREATE INDEX IF NOT EXISTS idx_role_applications_user_status ON role_applications(user_id, status);

-- Updated_at trigger
CREATE TRIGGER update_role_applications_updated_at
  BEFORE UPDATE ON role_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- UPDATED HELPER FUNCTIONS
-- ============================================

-- Get active role (from primary role in user_roles, fallback to users.role)
CREATE OR REPLACE FUNCTION get_active_role()
RETURNS user_role AS $$
  -- Priority:
  -- 1. Primary role from user_roles (if exists)
  -- 2. Fallback to users.role (backward compatibility)
  SELECT COALESCE(
    (SELECT role FROM user_roles 
     WHERE user_id = auth.uid() 
       AND status = 'active' 
       AND is_primary = true
     LIMIT 1),
    (SELECT role FROM users WHERE id = auth.uid())
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Update get_user_role() to use active role with fallback
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT get_active_role();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Get primary role for user
CREATE OR REPLACE FUNCTION get_primary_role(p_user_id UUID)
RETURNS user_role AS $$
  SELECT role FROM user_roles 
  WHERE user_id = p_user_id 
    AND status = 'active' 
    AND is_primary = true
  LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Verify user has role
CREATE OR REPLACE FUNCTION user_has_role(p_user_id UUID, p_role user_role)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = p_user_id 
      AND role = p_role 
      AND status = 'active'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Get all active roles for user
CREATE OR REPLACE FUNCTION get_user_roles(p_user_id UUID)
RETURNS SETOF user_role AS $$
  SELECT role FROM user_roles 
  WHERE user_id = p_user_id 
    AND status = 'active'
  ORDER BY is_primary DESC, created_at ASC;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_applications ENABLE ROW LEVEL SECURITY;

-- User Roles Policies
-- Users can view their own roles
DROP POLICY IF EXISTS "user_roles_select_own" ON user_roles;
CREATE POLICY "user_roles_select_own" ON user_roles
  FOR SELECT USING (user_id = auth.uid());

-- Internal staff can view all roles in their branch
DROP POLICY IF EXISTS "user_roles_select_branch" ON user_roles;
CREATE POLICY "user_roles_select_branch" ON user_roles
  FOR SELECT USING (
    is_internal_staff() AND (
      EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = user_roles.user_id 
          AND (users.branch_id = get_user_branch_id() OR is_super_admin())
      )
    )
  );

-- Users can insert their own role applications (pending status only)
DROP POLICY IF EXISTS "user_roles_insert_own" ON user_roles;
CREATE POLICY "user_roles_insert_own" ON user_roles
  FOR INSERT WITH CHECK (
    user_id = auth.uid() 
    AND status = 'pending'
    AND is_primary = false
  );

-- Only admins can approve/update roles
DROP POLICY IF EXISTS "user_roles_update_admin" ON user_roles;
CREATE POLICY "user_roles_update_admin" ON user_roles
  FOR UPDATE USING (
    is_internal_staff() AND (
      EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = user_roles.user_id 
          AND (users.branch_id = get_user_branch_id() OR is_super_admin())
      )
    )
  );

-- Only super_admin can delete roles
DROP POLICY IF EXISTS "user_roles_delete_admin" ON user_roles;
CREATE POLICY "user_roles_delete_admin" ON user_roles
  FOR DELETE USING (is_super_admin());

-- Role Applications Policies
-- Users can view their own applications
DROP POLICY IF EXISTS "role_applications_select_own" ON role_applications;
CREATE POLICY "role_applications_select_own" ON role_applications
  FOR SELECT USING (user_id = auth.uid());

-- Internal staff can view all applications
DROP POLICY IF EXISTS "role_applications_select_admin" ON role_applications;
CREATE POLICY "role_applications_select_admin" ON role_applications
  FOR SELECT USING (is_internal_staff());

-- Users can insert their own applications
DROP POLICY IF EXISTS "role_applications_insert_own" ON role_applications;
CREATE POLICY "role_applications_insert_own" ON role_applications
  FOR INSERT WITH CHECK (user_id = auth.uid() AND status = 'pending');

-- Only admins can update applications (approve/reject)
DROP POLICY IF EXISTS "role_applications_update_admin" ON role_applications;
CREATE POLICY "role_applications_update_admin" ON role_applications
  FOR UPDATE USING (is_internal_staff());

-- Only super_admin can delete applications
DROP POLICY IF EXISTS "role_applications_delete_admin" ON role_applications;
CREATE POLICY "role_applications_delete_admin" ON role_applications
  FOR DELETE USING (is_super_admin());

COMMIT;

