-- Migration: 044-multi-guide-crew-directory.sql
-- Description: Multi-Guide Operations & Crew Directory
-- Created: 2025-01-23
-- Reference: PRD Multi-Guide Operations & Crew Directory

BEGIN;

-- ============================================
-- UPDATE guide_role ENUM (if needed)
-- ============================================
-- Note: guide_role enum already exists with 'lead', 'assistant', 'driver', 'photographer'
-- We'll use 'lead' for Lead Guide and 'assistant' for Support Guide
-- If we need explicit 'support', we can add it, but 'assistant' works for now

-- ============================================
-- TRIP CREWS TABLE
-- ============================================
-- Enhanced version of trip_guides with explicit crew role management
-- This table tracks crew assignments with role (LEAD/SUPPORT) and status
CREATE TABLE IF NOT EXISTS trip_crews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  guide_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id),
  
  -- Crew Role
  role VARCHAR(20) NOT NULL DEFAULT 'support', -- 'lead' or 'support'
  -- Note: We use VARCHAR instead of enum to allow flexibility
  -- 'lead' = Lead Guide (TL), 'support' = Support Guide
  
  -- Assignment Info
  status VARCHAR(50) NOT NULL DEFAULT 'assigned', -- 'assigned', 'confirmed', 'cancelled'
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES users(id), -- Admin Ops who assigned
  confirmed_at TIMESTAMPTZ, -- When guide confirmed assignment
  
  -- Notes
  assignment_notes TEXT, -- Notes from admin about this assignment
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_crew_role CHECK (role IN ('lead', 'support')),
  CONSTRAINT valid_crew_status CHECK (status IN ('assigned', 'confirmed', 'cancelled', 'rejected')),
  UNIQUE(trip_id, guide_id) -- One guide can only be assigned once per trip
);

-- ============================================
-- CREW PROFILES PUBLIC INTERNAL TABLE
-- ============================================
-- Public profile data for internal crew directory
-- This is a view-like table that exposes safe profile data to other guides
CREATE TABLE IF NOT EXISTS crew_profiles_public_internal (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id),
  
  -- Display Info (safe to expose)
  display_name VARCHAR(200) NOT NULL,
  photo_url TEXT,
  
  -- Skills & Badges (JSONB for flexibility)
  badges JSONB DEFAULT '[]'::jsonb, -- Array of badge objects: [{"name": "First Aid", "level": "certified"}, ...]
  skills JSONB DEFAULT '[]'::jsonb, -- Array of skill objects: [{"name": "English", "level": 4}, ...]
  
  -- Availability Status (computed from guide_status)
  -- This will be updated via trigger or application logic
  current_availability VARCHAR(50) DEFAULT 'unknown', -- 'available', 'on_duty', 'on_trip', 'not_available', 'unknown'
  last_status_update TIMESTAMPTZ,
  
  -- Contact (masked for security)
  -- Phone number is NOT stored here - use contact action API instead
  contact_enabled BOOLEAN DEFAULT true, -- Whether guide allows contact
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_availability CHECK (current_availability IN ('available', 'on_duty', 'on_trip', 'not_available', 'unknown'))
);

-- ============================================
-- CREW NOTES TABLE
-- ============================================
-- Internal crew notes for trip coordination
-- Lightweight messaging for crew coordination (not full chat)
CREATE TABLE IF NOT EXISTS crew_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id),
  
  -- Note Content
  message TEXT NOT NULL,
  note_type VARCHAR(50) DEFAULT 'general', -- 'general', 'task', 'safety', 'coordination'
  
  -- Optional: Reply/Thread support (simple)
  parent_note_id UUID REFERENCES crew_notes(id) ON DELETE CASCADE,
  
  -- Visibility
  is_internal BOOLEAN DEFAULT true, -- Internal only (not visible to customers)
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_note_type CHECK (note_type IN ('general', 'task', 'safety', 'coordination'))
);

-- ============================================
-- CREW AUDIT LOG TABLE
-- ============================================
-- Audit log for crew operations (assignment, role changes, unmask actions)
CREATE TABLE IF NOT EXISTS crew_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
  guide_id UUID REFERENCES users(id) ON DELETE SET NULL,
  branch_id UUID REFERENCES branches(id),
  
  -- Action Info
  action_type VARCHAR(50) NOT NULL, -- 'assign', 'unassign', 'role_change', 'unmask_access', 'contact_action'
  action_details JSONB, -- Additional details about the action
  
  -- Actor
  performed_by UUID REFERENCES users(id),
  performed_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- IP & User Agent (for security)
  ip_address INET,
  user_agent TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_trip_crews_trip_id ON trip_crews(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_crews_guide_id ON trip_crews(guide_id);
CREATE INDEX IF NOT EXISTS idx_trip_crews_role ON trip_crews(role);
CREATE INDEX IF NOT EXISTS idx_trip_crews_status ON trip_crews(status);
CREATE INDEX IF NOT EXISTS idx_trip_crews_branch_id ON trip_crews(branch_id);

CREATE INDEX IF NOT EXISTS idx_crew_profiles_branch_id ON crew_profiles_public_internal(branch_id);
CREATE INDEX IF NOT EXISTS idx_crew_profiles_availability ON crew_profiles_public_internal(current_availability);
CREATE INDEX IF NOT EXISTS idx_crew_profiles_active ON crew_profiles_public_internal(is_active);

CREATE INDEX IF NOT EXISTS idx_crew_notes_trip_id ON crew_notes(trip_id);
CREATE INDEX IF NOT EXISTS idx_crew_notes_created_by ON crew_notes(created_by);
CREATE INDEX IF NOT EXISTS idx_crew_notes_parent ON crew_notes(parent_note_id);
CREATE INDEX IF NOT EXISTS idx_crew_notes_created_at ON crew_notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crew_notes_branch_id ON crew_notes(branch_id);

CREATE INDEX IF NOT EXISTS idx_crew_audit_trip_id ON crew_audit_logs(trip_id);
CREATE INDEX IF NOT EXISTS idx_crew_audit_guide_id ON crew_audit_logs(guide_id);
CREATE INDEX IF NOT EXISTS idx_crew_audit_action_type ON crew_audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_crew_audit_performed_at ON crew_audit_logs(performed_at DESC);
CREATE INDEX IF NOT EXISTS idx_crew_audit_branch_id ON crew_audit_logs(branch_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update crew_profiles_public_internal from guide_status
CREATE OR REPLACE FUNCTION update_crew_profile_availability()
RETURNS TRIGGER AS $$
BEGIN
  -- Update availability based on guide_status
  UPDATE crew_profiles_public_internal
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

-- Trigger to auto-update crew profile availability
CREATE TRIGGER trigger_update_crew_availability
  AFTER INSERT OR UPDATE ON guide_status
  FOR EACH ROW
  EXECUTE FUNCTION update_crew_profile_availability();

-- Function to sync crew_profiles_public_internal from users table
CREATE OR REPLACE FUNCTION sync_crew_profile_from_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Only sync for guides
  IF NEW.role = 'guide' THEN
    INSERT INTO crew_profiles_public_internal (
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

-- Trigger to auto-create crew profile when guide is created/updated
CREATE TRIGGER trigger_sync_crew_profile
  AFTER INSERT OR UPDATE ON users
  FOR EACH ROW
  WHEN (NEW.role = 'guide')
  EXECUTE FUNCTION sync_crew_profile_from_user();

-- Function to log crew audit actions
CREATE OR REPLACE FUNCTION log_crew_audit(
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
  
  INSERT INTO crew_audit_logs (
    trip_id,
    guide_id,
    branch_id,
    action_type,
    action_details,
    performed_by
  )
  VALUES (
    p_trip_id,
    p_guide_id,
    v_branch_id,
    p_action_type,
    p_action_details,
    COALESCE(p_performed_by, auth.uid())
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE trip_crews ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_profiles_public_internal ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_audit_logs ENABLE ROW LEVEL SECURITY;

-- trip_crews policies
-- Guides can see crews for their assigned trips
CREATE POLICY "trip_crews_guide_view_assigned" ON trip_crews
  FOR SELECT
  USING (
    guide_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM trip_crews tc2
      WHERE tc2.trip_id = trip_crews.trip_id
      AND tc2.guide_id = auth.uid()
    )
  );

-- Ops/Admin can manage all crew assignments
CREATE POLICY "trip_crews_ops_manage" ON trip_crews
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('ops_admin', 'super_admin')
    )
  );

-- Branch isolation for ops
CREATE POLICY "trip_crews_branch_isolation" ON trip_crews
  FOR ALL
  USING (
    branch_id IS NULL OR
    branch_id = (SELECT branch_id FROM users WHERE id = auth.uid()) OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'super_admin'
    )
  );

-- crew_profiles_public_internal policies
-- All guides can view other guides' public profiles (internal directory)
CREATE POLICY "crew_profiles_guide_view" ON crew_profiles_public_internal
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'guide'
    ) OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('ops_admin', 'super_admin')
    )
  );

-- Guides can update their own profile
CREATE POLICY "crew_profiles_guide_update_own" ON crew_profiles_public_internal
  FOR UPDATE
  USING (user_id = auth.uid());

-- Ops/Admin can update all profiles
CREATE POLICY "crew_profiles_ops_update" ON crew_profiles_public_internal
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('ops_admin', 'super_admin')
    )
  );

-- Branch isolation
CREATE POLICY "crew_profiles_branch_isolation" ON crew_profiles_public_internal
  FOR ALL
  USING (
    branch_id IS NULL OR
    branch_id = (SELECT branch_id FROM users WHERE id = auth.uid()) OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'super_admin'
    )
  );

-- crew_notes policies
-- Crew members can view notes for their assigned trips
CREATE POLICY "crew_notes_crew_view" ON crew_notes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM trip_crews
      WHERE trip_id = crew_notes.trip_id
      AND guide_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('ops_admin', 'super_admin')
    )
  );

-- Crew members can create notes for their assigned trips
CREATE POLICY "crew_notes_crew_create" ON crew_notes
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trip_crews
      WHERE trip_id = crew_notes.trip_id
      AND guide_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('ops_admin', 'super_admin')
    )
  );

-- Crew members can update their own notes
CREATE POLICY "crew_notes_crew_update_own" ON crew_notes
  FOR UPDATE
  USING (created_by = auth.uid());

-- Ops/Admin can update all notes
CREATE POLICY "crew_notes_ops_update" ON crew_notes
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('ops_admin', 'super_admin')
    )
  );

-- Branch isolation
CREATE POLICY "crew_notes_branch_isolation" ON crew_notes
  FOR ALL
  USING (
    branch_id IS NULL OR
    branch_id = (SELECT branch_id FROM users WHERE id = auth.uid()) OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'super_admin'
    )
  );

-- crew_audit_logs policies
-- Ops/Admin can view all audit logs
CREATE POLICY "crew_audit_ops_view" ON crew_audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('ops_admin', 'super_admin')
    )
  );

-- Guides can view their own audit logs
CREATE POLICY "crew_audit_guide_view_own" ON crew_audit_logs
  FOR SELECT
  USING (guide_id = auth.uid());

-- Branch isolation
CREATE POLICY "crew_audit_branch_isolation" ON crew_audit_logs
  FOR ALL
  USING (
    branch_id IS NULL OR
    branch_id = (SELECT branch_id FROM users WHERE id = auth.uid()) OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'super_admin'
    )
  );

-- ============================================
-- INITIAL DATA SYNC
-- ============================================
-- Sync existing guides to crew_profiles_public_internal
INSERT INTO crew_profiles_public_internal (
  user_id,
  branch_id,
  display_name,
  photo_url,
  is_active
)
SELECT 
  id,
  branch_id,
  full_name,
  avatar_url,
  is_active
FROM users
WHERE role = 'guide'
ON CONFLICT (user_id) DO UPDATE
SET
  display_name = EXCLUDED.display_name,
  photo_url = EXCLUDED.photo_url,
  branch_id = EXCLUDED.branch_id,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

COMMIT;
