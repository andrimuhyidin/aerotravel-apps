-- Migration: 062-add-employment-status.sql
-- Description: Add employment_status column to users table for quick reference
-- Created: 2025-12-21
-- Reference: Complete Guide Profile Edit Implementation Plan

BEGIN;

-- Add employment_status column
ALTER TABLE users
ADD COLUMN IF NOT EXISTS employment_status VARCHAR(50);

-- Add comment for documentation
COMMENT ON COLUMN users.employment_status IS 'Employment status: active, inactive, on_leave, terminated';

-- Add index for filtering
CREATE INDEX IF NOT EXISTS idx_users_employment_status 
ON users(employment_status) 
WHERE employment_status IS NOT NULL;

COMMIT;

