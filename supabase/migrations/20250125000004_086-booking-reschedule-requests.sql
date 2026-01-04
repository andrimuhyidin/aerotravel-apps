-- Migration: 086-booking-reschedule-requests.sql
-- Description: Add reschedule request functionality for bookings
-- Created: 2025-01-25
-- Reference: Partner Portal Phase 1 Implementation Plan

-- ============================================
-- BOOKING RESCHEDULE REQUESTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS booking_reschedule_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Request Info
  requested_trip_date DATE NOT NULL,
  reason TEXT,
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending/approved/rejected
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_booking_reschedule_requests_booking_id ON booking_reschedule_requests(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_reschedule_requests_partner_id ON booking_reschedule_requests(partner_id);
CREATE INDEX IF NOT EXISTS idx_booking_reschedule_requests_status ON booking_reschedule_requests(status);

-- ============================================
-- TRIGGERS
-- ============================================
CREATE TRIGGER update_booking_reschedule_requests_updated_at
  BEFORE UPDATE ON booking_reschedule_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE booking_reschedule_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners can view own reschedule requests"
  ON booking_reschedule_requests FOR SELECT
  USING (auth.uid() = partner_id);

CREATE POLICY "Partners can create own reschedule requests"
  ON booking_reschedule_requests FOR INSERT
  WITH CHECK (auth.uid() = partner_id);

-- Admins can view and update all requests
CREATE POLICY "Admins can view all reschedule requests"
  ON booking_reschedule_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'ops_admin', 'marketing')
      AND users.is_active = true
    )
  );

CREATE POLICY "Admins can update all reschedule requests"
  ON booking_reschedule_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'ops_admin', 'marketing')
      AND users.is_active = true
    )
  );

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE booking_reschedule_requests IS 'Reschedule requests for partner bookings';
COMMENT ON COLUMN booking_reschedule_requests.status IS 'Request status: pending/approved/rejected';

