-- Migration: 046-update-rls-policies-guide-names.sql
-- Description: Update RLS policies to use new table names (guide_* instead of crew_*)
-- Created: 2025-01-23
-- Reference: After renaming tables in migration 045

BEGIN;

-- ============================================
-- DROP OLD POLICIES (if they exist)
-- ============================================

-- Drop old crew_profiles policies
DROP POLICY IF EXISTS "crew_profiles_guide_view" ON guide_profiles_public_internal;
DROP POLICY IF EXISTS "crew_profiles_guide_update_own" ON guide_profiles_public_internal;
DROP POLICY IF EXISTS "crew_profiles_ops_update" ON guide_profiles_public_internal;
DROP POLICY IF EXISTS "crew_profiles_branch_isolation" ON guide_profiles_public_internal;

-- Drop old crew_notes policies
DROP POLICY IF EXISTS "crew_notes_crew_view" ON guide_notes;
DROP POLICY IF EXISTS "crew_notes_crew_create" ON guide_notes;
DROP POLICY IF EXISTS "crew_notes_crew_update_own" ON guide_notes;
DROP POLICY IF EXISTS "crew_notes_ops_update" ON guide_notes;
DROP POLICY IF EXISTS "crew_notes_branch_isolation" ON guide_notes;

-- Drop old crew_audit_logs policies
DROP POLICY IF EXISTS "crew_audit_ops_view" ON guide_assignment_audit_logs;
DROP POLICY IF EXISTS "crew_audit_guide_view_own" ON guide_assignment_audit_logs;
DROP POLICY IF EXISTS "crew_audit_branch_isolation" ON guide_assignment_audit_logs;

-- ============================================
-- CREATE NEW POLICIES WITH CORRECT NAMES
-- ============================================

-- guide_profiles_public_internal policies
-- All guides can view other guides' public profiles (internal directory)
CREATE POLICY "guide_profiles_guide_view" ON guide_profiles_public_internal
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
CREATE POLICY "guide_profiles_guide_update_own" ON guide_profiles_public_internal
  FOR UPDATE
  USING (user_id = auth.uid());

-- Ops/Admin can update all profiles
CREATE POLICY "guide_profiles_ops_update" ON guide_profiles_public_internal
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('ops_admin', 'super_admin')
    )
  );

-- Branch isolation
CREATE POLICY "guide_profiles_branch_isolation" ON guide_profiles_public_internal
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

-- guide_notes policies
-- Guide team members can view notes for their assigned trips
CREATE POLICY "guide_notes_team_view" ON guide_notes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM trip_crews
      WHERE trip_id = guide_notes.trip_id
      AND guide_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM trip_guides
      WHERE trip_id = guide_notes.trip_id
      AND guide_id = auth.uid()
      AND assignment_status IN ('confirmed', 'pending_confirmation')
    ) OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('ops_admin', 'super_admin')
    )
  );

-- Guide team members can create notes for their assigned trips
CREATE POLICY "guide_notes_team_create" ON guide_notes
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trip_crews
      WHERE trip_id = guide_notes.trip_id
      AND guide_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM trip_guides
      WHERE trip_id = guide_notes.trip_id
      AND guide_id = auth.uid()
      AND assignment_status IN ('confirmed', 'pending_confirmation')
    ) OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('ops_admin', 'super_admin')
    )
  );

-- Guide team members can update their own notes
CREATE POLICY "guide_notes_team_update_own" ON guide_notes
  FOR UPDATE
  USING (created_by = auth.uid());

-- Ops/Admin can update all notes
CREATE POLICY "guide_notes_ops_update" ON guide_notes
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('ops_admin', 'super_admin')
    )
  );

-- Branch isolation
CREATE POLICY "guide_notes_branch_isolation" ON guide_notes
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

-- guide_assignment_audit_logs policies
-- Ops/Admin can view all audit logs
CREATE POLICY "guide_assignment_audit_ops_view" ON guide_assignment_audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('ops_admin', 'super_admin')
    )
  );

-- Guides can view their own audit logs
CREATE POLICY "guide_assignment_audit_guide_view_own" ON guide_assignment_audit_logs
  FOR SELECT
  USING (guide_id = auth.uid());

-- Branch isolation
CREATE POLICY "guide_assignment_audit_branch_isolation" ON guide_assignment_audit_logs
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

COMMIT;
