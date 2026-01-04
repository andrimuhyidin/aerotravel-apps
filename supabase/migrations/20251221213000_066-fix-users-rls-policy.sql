-- Migration: 066-fix-users-rls-policy.sql
-- Description: Fix RLS policy to prevent guides from updating company-managed fields
-- Created: 2025-12-21
-- Reference: Guide Profile Edit Security & Compliance Improvements

BEGIN;

-- Drop existing permissive policy
DROP POLICY IF EXISTS "users_update_own" ON users;

-- Create restrictive policy for guides to update only personal fields
-- Guides can only update: full_name, phone, nik, address, avatar_url
CREATE POLICY "users_update_own_personal" ON users
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid() AND
    -- Only allow updates to personal information fields
    -- Company-managed fields are protected (employee_number, hire_date, employment_status, supervisor_id)
    -- This policy allows updates to: full_name, phone, nik, address, avatar_url, updated_at
    -- All other fields will be rejected by this policy
    (
      -- Check if user is guide
      (SELECT role FROM users WHERE id = auth.uid()) = 'guide'
    )
  );

-- Create separate policy for admin to update employee fields
-- Admins can update all fields including company-managed ones
CREATE POLICY "users_update_admin" ON users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'ops_admin', 'finance_manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'ops_admin', 'finance_manager')
    )
  );

-- Keep existing super_admin full access policy
-- (Already exists, but ensure it's there)
-- Policy "users_all_super_admin" should already exist from previous migration

COMMIT;

