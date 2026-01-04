-- Migration: 048-fix-trip-crews-rls-recursion.sql
-- Description: Fix infinite recursion in trip_crews RLS policy
-- Created: 2025-01-23

BEGIN;

-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "trip_crews_guide_view_assigned" ON trip_crews;

-- Recreate the policy without the recursive EXISTS clause
-- Guides can see their own assignments and other crew members in the same trip
-- But we avoid recursion by only checking guide_id directly, not via EXISTS subquery
CREATE POLICY "trip_crews_guide_view_assigned" ON trip_crews
  FOR SELECT
  USING (
    -- Direct assignment check (no recursion)
    guide_id = auth.uid()
    OR
    -- Check if user is assigned to the same trip via trip_guides (existing system)
    -- This avoids recursion because trip_guides doesn't reference trip_crews
    EXISTS (
      SELECT 1 FROM trip_guides
      WHERE trip_guides.trip_id = trip_crews.trip_id
      AND trip_guides.guide_id = auth.uid()
      AND trip_guides.assignment_status IN ('confirmed', 'pending_confirmation')
    )
    OR
    -- Ops/admin can see all
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('ops_admin', 'super_admin')
    )
  );

COMMIT;
