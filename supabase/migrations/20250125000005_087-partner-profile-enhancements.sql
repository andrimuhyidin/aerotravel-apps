-- Migration: 087-partner-profile-enhancements.sql
-- Description: Add partner-specific fields to users table
-- Created: 2025-01-25
-- Reference: Partner Portal Onboarding & Profile Management Implementation Plan

-- ============================================
-- ADD PARTNER-SPECIFIC FIELDS TO USERS TABLE
-- ============================================

-- SIUP fields
ALTER TABLE users
ADD COLUMN IF NOT EXISTS siup_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS siup_document_url TEXT;

-- Bank account fields (for Mitra/Partner)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS bank_account_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS bank_account_name VARCHAR(200);

-- Tier management fields
ALTER TABLE users
ADD COLUMN IF NOT EXISTS partner_tier VARCHAR(20) DEFAULT 'bronze',
ADD COLUMN IF NOT EXISTS tier_assigned_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS tier_assigned_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS tier_auto_calculated BOOLEAN DEFAULT true;

-- Add constraint for partner_tier
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_partner_tier'
  ) THEN
    ALTER TABLE users
    ADD CONSTRAINT check_partner_tier
    CHECK (partner_tier IS NULL OR partner_tier IN ('bronze', 'silver', 'gold', 'platinum'));
  END IF;
END $$;

-- Indexes for partner fields
CREATE INDEX IF NOT EXISTS idx_users_partner_tier ON users(partner_tier) WHERE partner_tier IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_tier_assigned_by ON users(tier_assigned_by) WHERE tier_assigned_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_siup_number ON users(siup_number) WHERE siup_number IS NOT NULL;

-- Comments
COMMENT ON COLUMN users.siup_number IS 'SIUP registration number for partner';
COMMENT ON COLUMN users.siup_document_url IS 'URL to SIUP document file in storage';
COMMENT ON COLUMN users.bank_name IS 'Bank name for partner payment account';
COMMENT ON COLUMN users.bank_account_number IS 'Bank account number for partner';
COMMENT ON COLUMN users.bank_account_name IS 'Bank account holder name for partner';
COMMENT ON COLUMN users.partner_tier IS 'Partner tier level: bronze, silver, gold, platinum';
COMMENT ON COLUMN users.tier_assigned_at IS 'When tier was assigned';
COMMENT ON COLUMN users.tier_assigned_by IS 'Admin user who assigned tier (null if auto-calculated)';
COMMENT ON COLUMN users.tier_auto_calculated IS 'Whether tier is auto-calculated or manually assigned';

