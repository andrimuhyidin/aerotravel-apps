-- Migration: 089-partner-role-applications.sql
-- Description: Enhance role_applications table for partner-specific data
-- Created: 2025-01-25
-- Reference: Partner Portal Onboarding & Profile Management Implementation Plan

-- ============================================
-- ENHANCE ROLE APPLICATIONS FOR PARTNER
-- ============================================

-- Note: role_applications table already exists in migration 20251221000000_029-multi-role-system.sql
-- Existing columns: id, user_id, requested_role, status, message, admin_notes, reviewed_at, reviewed_by, rejection_reason

-- Add company_data JSONB column (if not exists)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'role_applications' AND column_name = 'company_data'
  ) THEN
    ALTER TABLE role_applications
    ADD COLUMN company_data JSONB DEFAULT '{}';
  END IF;
END $$;

-- Add legal_documents JSONB column (if not exists)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'role_applications' AND column_name = 'legal_documents'
  ) THEN
    ALTER TABLE role_applications
    ADD COLUMN legal_documents JSONB DEFAULT '[]';
  END IF;
END $$;

-- Add application_status column (if not exists) - enhance existing status usage
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'role_applications' AND column_name = 'application_status'
  ) THEN
    ALTER TABLE role_applications
    ADD COLUMN application_status VARCHAR(50) DEFAULT 'pending_review';
  END IF;
END $$;

-- Indexes for new columns
CREATE INDEX IF NOT EXISTS idx_role_applications_company_data ON role_applications USING GIN(company_data) WHERE company_data IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_role_applications_legal_documents ON role_applications USING GIN(legal_documents) WHERE legal_documents IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_role_applications_application_status ON role_applications(application_status);

-- Comments
COMMENT ON COLUMN role_applications.company_data IS 'Company information for partner applications (name, address, NPWP, SIUP, bank account)';
COMMENT ON COLUMN role_applications.legal_documents IS 'Array of document IDs from partner_legal_documents table';
COMMENT ON COLUMN role_applications.application_status IS 'Detailed application status: pending_review, in_review, approved, rejected';

