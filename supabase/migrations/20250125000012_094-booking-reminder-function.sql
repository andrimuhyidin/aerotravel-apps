-- Migration: 094-booking-reminder-function.sql
-- Description: Create PostgreSQL function to get bookings needing reminders
-- Created: 2025-01-25
-- Reference: Partner Portal Booking & Order Management Enhancement Plan

-- ============================================
-- FUNCTION: GET BOOKINGS NEEDING REMINDERS
-- ============================================

CREATE OR REPLACE FUNCTION get_bookings_needing_reminders()
RETURNS TABLE (
  booking_id UUID,
  booking_code VARCHAR,
  trip_date DATE,
  days_until_trip INTEGER,
  reminder_type VARCHAR,
  customer_email VARCHAR,
  customer_phone VARCHAR,
  partner_email VARCHAR,
  partner_id UUID,
  package_name VARCHAR,
  adult_pax INTEGER,
  child_pax INTEGER,
  infant_pax INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id AS booking_id,
    b.booking_code,
    b.trip_date,
    (b.trip_date - CURRENT_DATE)::INTEGER AS days_until_trip,
    CASE
      WHEN (b.trip_date - CURRENT_DATE) = 7 THEN 'H-7'
      WHEN (b.trip_date - CURRENT_DATE) = 3 THEN 'H-3'
      WHEN (b.trip_date - CURRENT_DATE) = 1 THEN 'H-1'
    END AS reminder_type,
    b.customer_email,
    b.customer_phone,
    u.email AS partner_email,
    u.id AS partner_id,
    p.name AS package_name,
    b.adult_pax,
    b.child_pax,
    b.infant_pax
  FROM bookings b
  JOIN users u ON b.mitra_id = u.id
  LEFT JOIN packages p ON b.package_id = p.id
  WHERE b.status IN ('confirmed', 'pending_payment')
    AND b.trip_date >= CURRENT_DATE
    AND (b.trip_date - CURRENT_DATE) IN (7, 3, 1)
    AND NOT EXISTS (
      SELECT 1 FROM booking_reminders br
      WHERE br.booking_id = b.id
        AND br.reminder_type = CASE
          WHEN (b.trip_date - CURRENT_DATE) = 7 THEN 'H-7'
          WHEN (b.trip_date - CURRENT_DATE) = 3 THEN 'H-3'
          WHEN (b.trip_date - CURRENT_DATE) = 1 THEN 'H-1'
        END
    )
    AND b.deleted_at IS NULL
    AND b.mitra_id IS NOT NULL; -- Only partner bookings
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON FUNCTION get_bookings_needing_reminders IS 'Returns bookings that need reminder notifications (H-7, H-3, H-1 days before trip). Excludes bookings that already have reminders sent.';

