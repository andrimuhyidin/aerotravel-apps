-- Migration: 093-booking-reminders.sql
-- Description: Create booking_reminders table for tracking sent reminders
-- Created: 2025-01-25
-- Reference: Partner Portal Booking & Order Management Enhancement Plan

-- ============================================
-- BOOKING REMINDERS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS booking_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  reminder_type VARCHAR(20) NOT NULL CHECK (reminder_type IN ('H-7', 'H-3', 'H-1')),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  sent_to_email VARCHAR(200),
  sent_to_phone VARCHAR(20),
  notification_method VARCHAR(20) CHECK (notification_method IN ('email', 'whatsapp', 'in_app', 'sms')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate reminders
  UNIQUE(booking_id, reminder_type)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_booking_reminders_booking_id ON booking_reminders(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_reminders_sent_at ON booking_reminders(sent_at);
CREATE INDEX IF NOT EXISTS idx_booking_reminders_reminder_type ON booking_reminders(reminder_type);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE booking_reminders ENABLE ROW LEVEL SECURITY;

-- Partners can view reminders for their own bookings
CREATE POLICY "Partners can view their booking reminders"
  ON booking_reminders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = booking_reminders.booking_id
        AND bookings.mitra_id = auth.uid()
    )
  );

-- System can insert reminders (via cron job with service role)
-- Note: Cron jobs typically use service role, so this policy may need adjustment
-- For now, we'll allow authenticated users (cron will use service role)
CREATE POLICY "System can insert booking reminders"
  ON booking_reminders FOR INSERT
  TO authenticated
  WITH CHECK (true); -- Service role will bypass RLS

-- Admins can view all reminders
CREATE POLICY "Admins can view all booking reminders"
  ON booking_reminders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('super_admin', 'ops_admin')
    )
  );

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE booking_reminders IS 'Tracks booking reminder notifications sent to partners (H-7, H-3, H-1 days before trip)';
COMMENT ON COLUMN booking_reminders.reminder_type IS 'Type of reminder: H-7 (7 days before), H-3 (3 days before), H-1 (1 day before)';
COMMENT ON COLUMN booking_reminders.notification_method IS 'Method used to send reminder: email, whatsapp, in_app, or sms';

