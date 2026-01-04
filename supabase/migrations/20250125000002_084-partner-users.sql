-- Migration: 084-partner-users.sql
-- Description: Create partner_users table for Team & Multi-User Management
-- Created: 2025-01-25
-- Reference: Partner Portal Phase 1 Implementation Plan

-- ============================================
-- PARTNER USERS TABLE (Sub-users/Team Members)
-- ============================================
CREATE TABLE IF NOT EXISTS partner_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- User Info (linked to auth.users)
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Profile
  name VARCHAR(200) NOT NULL,
  email VARCHAR(200) NOT NULL UNIQUE,
  phone VARCHAR(20),
  
  -- Role & Permissions
  role VARCHAR(50) NOT NULL, -- owner/finance/agent
  permissions JSONB DEFAULT '[]', -- granular permissions array
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  
  -- Audit
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_partner_users_partner_id ON partner_users(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_users_user_id ON partner_users(user_id);
CREATE INDEX IF NOT EXISTS idx_partner_users_email ON partner_users(email);
CREATE INDEX IF NOT EXISTS idx_partner_users_role ON partner_users(role);
CREATE INDEX IF NOT EXISTS idx_partner_users_deleted_at ON partner_users(deleted_at) WHERE deleted_at IS NULL;

-- ============================================
-- TRIGGERS
-- ============================================
CREATE TRIGGER update_partner_users_updated_at
  BEFORE UPDATE ON partner_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE partner_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners can view own team members"
  ON partner_users FOR SELECT
  USING (
    auth.uid() = partner_id OR 
    EXISTS (
      SELECT 1 FROM partner_users pu 
      WHERE pu.user_id = auth.uid() 
      AND pu.partner_id = partner_users.partner_id
      AND pu.is_active = true
      AND pu.deleted_at IS NULL
    )
  );

CREATE POLICY "Owners can manage team members"
  ON partner_users FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM partner_users pu 
      WHERE pu.user_id = auth.uid() 
      AND pu.partner_id = partner_users.partner_id
      AND pu.role = 'owner'
      AND pu.is_active = true
      AND pu.deleted_at IS NULL
    )
  );

-- Admins can view all
CREATE POLICY "Admins can view all partner users"
  ON partner_users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'ops_admin', 'marketing')
      AND users.is_active = true
    )
  );

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE partner_users IS 'Team/sub-user management for partners';
COMMENT ON COLUMN partner_users.role IS 'User role: owner/finance/agent';
COMMENT ON COLUMN partner_users.permissions IS 'JSONB array of granular permissions (bookings, commissions, customers, etc.)';
COMMENT ON COLUMN partner_users.user_id IS 'Optional link to auth.users if sub-user has separate auth account';

