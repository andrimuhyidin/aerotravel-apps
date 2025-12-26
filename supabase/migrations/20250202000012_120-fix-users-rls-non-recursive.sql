-- Migration: 120-fix-users-rls-non-recursive.sql
-- Description: Re-enable RLS on users table with non-recursive policies
-- Created: 2025-12-25
-- Purpose: Fix infinite recursion issue in RLS policies

BEGIN;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can read profiles" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "users_all_super_admin" ON users;
DROP POLICY IF EXISTS "users_select_branch" ON users;
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;

-- Create simple, non-recursive policies

-- 1. SELECT Policy: Users can read their own profile + public profiles
CREATE POLICY "users_select_own_or_public"
  ON users
  FOR SELECT
  USING (
    -- User can read their own profile
    id = auth.uid()
    OR
    -- Anyone can read basic info of users with role 'customer', 'mitra', 'guide'
    -- (needed for bookings, trips display)
    role IN ('customer', 'mitra', 'guide')
  );

-- 2. UPDATE Policy: Users can only update their own profile
CREATE POLICY "users_update_own_only"
  ON users
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- 3. INSERT Policy: Service role only (handled by auth trigger)
-- No explicit INSERT policy needed, handled by auth.users trigger

-- 4. DELETE Policy: Soft delete only by user themselves
CREATE POLICY "users_delete_own_soft"
  ON users
  FOR UPDATE
  USING (
    id = auth.uid() 
    AND deleted_at IS NULL
  )
  WITH CHECK (
    id = auth.uid()
  );

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Update helper functions to use simpler logic without recursion
-- These functions now use direct auth metadata instead of querying users table

CREATE OR REPLACE FUNCTION public.is_internal_staff()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
BEGIN
  -- Get role from JWT metadata instead of querying users table
  -- This avoids RLS recursion
  v_role := COALESCE(
    (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()),
    ''
  );
  
  RETURN v_role IN ('super_admin', 'investor', 'finance_manager', 'marketing', 'ops_admin');
END;
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
BEGIN
  v_role := COALESCE(
    (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()),
    ''
  );
  
  RETURN v_role = 'super_admin';
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_branch_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_branch_id uuid;
BEGIN
  -- Get branch_id from JWT metadata
  v_branch_id := (
    SELECT (raw_user_meta_data->>'branch_id')::uuid 
    FROM auth.users 
    WHERE id = auth.uid()
  );
  
  RETURN v_branch_id;
END;
$$;

COMMIT;

