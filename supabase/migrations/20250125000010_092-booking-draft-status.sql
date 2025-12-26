-- Migration: 092-booking-draft-status.sql
-- Description: Add draft status to bookings and draft tracking
-- Created: 2025-01-25
-- Reference: Partner Portal Booking & Order Management Enhancement Plan

-- ============================================
-- ADD DRAFT STATUS TO BOOKING_STATUS ENUM
-- ============================================

-- Note: PostgreSQL doesn't support IF NOT EXISTS for ALTER TYPE ADD VALUE
-- We'll use DO block to handle gracefully
DO $$ 
BEGIN
  -- Check if 'draft' value already exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'draft' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'booking_status')
  ) THEN
    ALTER TYPE booking_status ADD VALUE 'draft';
  END IF;
END $$;

-- ============================================
-- ADD DRAFT TRACKING COLUMN
-- ============================================

ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS draft_saved_at TIMESTAMPTZ;

-- ============================================
-- INDEXES FOR DRAFT BOOKINGS
-- ============================================

-- Index for draft bookings cleanup
CREATE INDEX IF NOT EXISTS idx_bookings_draft_cleanup 
ON bookings(draft_saved_at) 
WHERE status = 'draft' AND draft_saved_at IS NOT NULL;

-- Index for filtering draft bookings
CREATE INDEX IF NOT EXISTS idx_bookings_status_draft 
ON bookings(status) 
WHERE status = 'draft';

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON COLUMN bookings.draft_saved_at IS 'Timestamp when booking was saved as draft. Used for cleanup of old drafts.';

