-- Migration: 101-partner-payment-terms.sql
-- Description: Add payment terms fields for partners
-- Created: 2025-12-24
-- Reference: Partner Portal Missing Features Implementation Plan

-- ============================================
-- ADD PAYMENT TERMS FIELDS TO USERS TABLE
-- ============================================

-- Payment terms fields (for Mitra/Partner)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS payment_terms_type VARCHAR(20) DEFAULT 'prepaid', -- 'prepaid' or 'postpaid'
ADD COLUMN IF NOT EXISTS payment_terms_days INTEGER DEFAULT 0, -- Days for postpaid (e.g., 30, 60)
ADD COLUMN IF NOT EXISTS auto_invoice BOOLEAN DEFAULT false, -- Auto-generate invoice on booking
ADD COLUMN IF NOT EXISTS invoice_due_days INTEGER DEFAULT 0; -- Days until payment due (for postpaid)

-- Add constraint for payment_terms_type
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_payment_terms_type'
  ) THEN
    ALTER TABLE users
    ADD CONSTRAINT check_payment_terms_type
    CHECK (payment_terms_type IS NULL OR payment_terms_type IN ('prepaid', 'postpaid'));
  END IF;
END $$;

-- Indexes for payment terms fields
CREATE INDEX IF NOT EXISTS idx_users_payment_terms_type ON users(payment_terms_type) WHERE payment_terms_type IS NOT NULL;

-- Comments
COMMENT ON COLUMN users.payment_terms_type IS 'Payment terms type: prepaid (immediate) or postpaid (with days)';
COMMENT ON COLUMN users.payment_terms_days IS 'Number of days for postpaid payment terms (e.g., 30, 60)';
COMMENT ON COLUMN users.auto_invoice IS 'Whether to auto-generate invoice when booking is created';
COMMENT ON COLUMN users.invoice_due_days IS 'Number of days until payment is due (calculated from booking date + payment_terms_days)';

