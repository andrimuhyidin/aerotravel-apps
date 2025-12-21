-- Migration: 061-add-employee-fields.sql
-- Description: Add employee data fields to users table for enterprise HR features
-- Created: 2025-01-24
-- Reference: Guide Apps Comprehensive Improvement Plan

BEGIN;

-- Add employee_number (optional unique identifier)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS employee_number VARCHAR(50);

-- Create unique index for employee_number (only for non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_employee_number 
ON users(employee_number) 
WHERE employee_number IS NOT NULL;

-- Add hire_date (employment start date)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS hire_date DATE;

-- Add supervisor_id (reporting structure - self-referencing FK)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS supervisor_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Create index for supervisor_id for better query performance
CREATE INDEX IF NOT EXISTS idx_users_supervisor_id ON users(supervisor_id);

-- Add home_address (optional, different from address which might be work address)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS home_address TEXT;

-- Add comments for documentation
COMMENT ON COLUMN users.employee_number IS 'Nomor karyawan (unique identifier, optional)';
COMMENT ON COLUMN users.hire_date IS 'Tanggal mulai bekerja (employment start date)';
COMMENT ON COLUMN users.supervisor_id IS 'ID supervisor/atasan langsung (reporting structure)';
COMMENT ON COLUMN users.home_address IS 'Alamat rumah karyawan (optional, berbeda dari address yang mungkin alamat kerja)';

COMMIT;

