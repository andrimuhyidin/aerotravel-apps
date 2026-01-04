-- Migration: 116-users-partner-profile-enhancements.sql
-- Description: Add missing columns to users table for complete partner profile
-- Created: 2025-12-25
-- Purpose: Ensure users table has all necessary fields for partner profile management

BEGIN;

-- Add missing columns for complete partner profile
-- These columns are referenced in partner profile service but were missing

-- Personal/Company Information
ALTER TABLE users
ADD COLUMN IF NOT EXISTS full_name TEXT;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS email TEXT;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS city TEXT;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS province TEXT;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS postal_code TEXT;

-- Verification & Status
ALTER TABLE users
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- Branding & Assets
ALTER TABLE users
ADD COLUMN IF NOT EXISTS logo_url TEXT;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Gamification & Loyalty
ALTER TABLE users
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;

-- Multi-tenant support
ALTER TABLE users
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id);

-- Add indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_branch_id ON users(branch_id);
CREATE INDEX IF NOT EXISTS idx_users_is_verified ON users(is_verified);
CREATE INDEX IF NOT EXISTS idx_users_city ON users(city);
CREATE INDEX IF NOT EXISTS idx_users_province ON users(province);

-- Add comments for documentation
COMMENT ON COLUMN users.full_name IS 'Nama lengkap user (untuk semua role)';
COMMENT ON COLUMN users.email IS 'Email user (duplicate dari auth.users untuk query performance)';
COMMENT ON COLUMN users.city IS 'Kota domisili/operasional';
COMMENT ON COLUMN users.province IS 'Provinsi domisili/operasional';
COMMENT ON COLUMN users.postal_code IS 'Kode pos';
COMMENT ON COLUMN users.is_verified IS 'Status verifikasi akun (untuk partner: KYC approved)';
COMMENT ON COLUMN users.logo_url IS 'URL logo perusahaan (khusus partner)';
COMMENT ON COLUMN users.avatar_url IS 'URL foto profil user';
COMMENT ON COLUMN users.points IS 'Loyalty points untuk gamification';
COMMENT ON COLUMN users.branch_id IS 'Cabang tempat user beroperasi (multi-tenant)';

-- Create trigger to sync email from auth.users to public.users
CREATE OR REPLACE FUNCTION sync_user_email()
RETURNS TRIGGER AS $$
BEGIN
  -- When a new user is created in auth.users, sync email to public.users
  INSERT INTO public.users (id, email, created_at, updated_at)
  VALUES (NEW.id, NEW.email, NOW(), NOW())
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created_sync_email ON auth.users;

CREATE TRIGGER on_auth_user_created_sync_email
  AFTER INSERT OR UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_email();

-- Backfill email for existing users from auth.users
UPDATE public.users u
SET email = au.email,
    updated_at = NOW()
FROM auth.users au
WHERE u.id = au.id
  AND (u.email IS NULL OR u.email = '');

-- Update RLS policies to allow users to read their own email
DROP POLICY IF EXISTS "Users can read own profile" ON users;

CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  USING (
    auth.uid() = id OR
    -- Admin/staff can read all
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'staff')
    )
  );

-- Allow users to update their own profile (including email from UI if needed)
DROP POLICY IF EXISTS "Users can update own profile" ON users;

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

COMMIT;

