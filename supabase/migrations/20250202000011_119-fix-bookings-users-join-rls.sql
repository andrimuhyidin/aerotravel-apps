-- Migration: 119-fix-bookings-users-join-rls.sql
-- Description: Fix RLS policy to allow joining bookings with users table
-- Created: 2025-12-25
-- Purpose: Fix "permission denied for table users" error when fetching recent bookings

BEGIN;

-- The issue is that when bookings table tries to join with users (for customer info),
-- the RLS policy on users table blocks the access.
-- We need to allow authenticated users to read basic user info when it's related to their bookings.

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Users can read own profile" ON users;

-- Create more permissive policy for reading user profiles
CREATE POLICY "Users can read profiles"
  ON users
  FOR SELECT
  USING (
    -- Users can read their own profile
    auth.uid() = id OR
    -- Admin/staff can read all (use correct enum values)
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role IN ('super_admin', 'ops_admin', 'finance_manager', 'marketing')
    ) OR
    -- Partners can read customer profiles if they have bookings together
    EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.customer_id = users.id
        AND b.mitra_id = auth.uid()
    ) OR
    -- Allow reading customer profiles for bookings created by current user
    EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.customer_id = users.id
        AND b.created_by = auth.uid()
    )
  );

-- Keep the update policy unchanged
DROP POLICY IF EXISTS "Users can update own profile" ON users;

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

COMMIT;

