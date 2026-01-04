-- Migration: 042-users-add-address.sql
-- Description: Add address column to users table for guide profiles
-- Created: 2025-01-22

BEGIN;

-- Add address column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS address TEXT;

-- Add comment for documentation
COMMENT ON COLUMN users.address IS 'Alamat lengkap user (guide/customer)';

COMMIT;
