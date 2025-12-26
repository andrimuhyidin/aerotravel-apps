-- Migration: 117-booking-status-add-ongoing.sql
-- Description: Add 'ongoing' status to booking_status enum
-- Created: 2025-12-25
-- Purpose: Support ongoing/active bookings in partner dashboard

BEGIN;

-- Add 'ongoing' value to booking_status enum
-- This represents bookings that are currently in progress (trip started but not completed)
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'ongoing' AFTER 'confirmed';

-- Add comment for documentation
COMMENT ON TYPE booking_status IS 'Status pemesanan: draft, pending_payment, awaiting_full_payment, paid, confirmed, ongoing, cancelled, refunded, completed';

COMMIT;

