/**
 * Migration: Backfill Existing Data to Unified Systems
 * Description: Backfill existing bookings, payments ke app_events untuk audit trail
 * Created: 2025-02-02
 * 
 * NOTE: This is OPTIONAL - only run if you want historical data in events
 * For most cases, you only need new events going forward
 */

-- ============================================
-- BACKFILL: Existing Bookings to App Events
-- ============================================

-- Backfill booking.created events untuk bookings yang sudah ada (last 30 days)
INSERT INTO app_events (type, app, user_id, data, created_at)
SELECT 
  'booking.created' AS type,
  CASE 
    WHEN b.source = 'mitra' THEN 'partner'
    WHEN b.source = 'website' THEN 'customer'
    ELSE 'customer'
  END AS app,
  COALESCE(b.mitra_id, b.customer_id, b.created_by) AS user_id,
  jsonb_build_object(
    'bookingId', b.id,
    'bookingCode', b.booking_code,
    'packageId', b.package_id,
    'tripDate', b.trip_date,
    'totalAmount', b.total_amount
  ) AS data,
  b.created_at
FROM bookings b
WHERE b.deleted_at IS NULL
  AND b.created_at >= NOW() - INTERVAL '30 days' -- Only backfill recent bookings
  AND NOT EXISTS (
    SELECT 1 FROM app_events ae
    WHERE ae.type = 'booking.created'
      AND (ae.data->>'bookingId')::uuid = b.id
  )
ORDER BY b.created_at DESC
LIMIT 1000; -- Limit untuk avoid timeout

-- ============================================
-- BACKFILL: Existing Payments to App Events
-- ============================================

-- Backfill payment.received events untuk payments yang sudah paid (last 30 days)
INSERT INTO app_events (type, app, user_id, data, created_at)
SELECT 
  'payment.received' AS type,
  CASE 
    WHEN b.source = 'mitra' THEN 'partner'
    ELSE 'customer'
  END AS app,
  COALESCE(b.mitra_id, b.customer_id) AS user_id,
  jsonb_build_object(
    'bookingId', b.id,
    'bookingCode', b.booking_code,
    'amount', b.total_amount,
    'paymentId', p.id
  ) AS data,
  COALESCE(p.paid_at, p.updated_at, b.updated_at) AS created_at
FROM bookings b
LEFT JOIN payments p ON p.booking_id = b.id
WHERE b.deleted_at IS NULL
  AND b.status IN ('paid', 'confirmed')
  AND (p.status = 'paid' OR (b.status = 'paid' AND p.id IS NULL))
  AND COALESCE(p.paid_at, p.updated_at, b.updated_at) >= NOW() - INTERVAL '30 days'
  AND NOT EXISTS (
    SELECT 1 FROM app_events ae
    WHERE ae.type = 'payment.received'
      AND (ae.data->>'bookingId')::uuid = b.id
  )
ORDER BY COALESCE(p.paid_at, p.updated_at, b.updated_at) DESC
LIMIT 1000;

-- ============================================
-- BACKFILL: Booking Status Changes to App Events
-- ============================================

-- Backfill booking.status_changed events untuk bookings yang sudah paid/confirmed (last 30 days)
INSERT INTO app_events (type, app, user_id, data, created_at)
SELECT 
  'booking.status_changed' AS type,
  CASE 
    WHEN b.source = 'mitra' THEN 'partner'
    ELSE 'customer'
  END AS app,
  COALESCE(b.mitra_id, b.customer_id) AS user_id,
  jsonb_build_object(
    'bookingId', b.id,
    'bookingCode', b.booking_code,
    'oldStatus', 'pending_payment',
    'newStatus', b.status,
    'packageId', b.package_id
  ) AS data,
  COALESCE(b.updated_at, b.created_at) AS created_at
FROM bookings b
WHERE b.deleted_at IS NULL
  AND b.status IN ('paid', 'confirmed')
  AND b.updated_at >= NOW() - INTERVAL '30 days'
  AND NOT EXISTS (
    SELECT 1 FROM app_events ae
    WHERE ae.type = 'booking.status_changed'
      AND (ae.data->>'bookingId')::uuid = b.id
      AND (ae.data->>'newStatus')::text = b.status::text
  )
ORDER BY b.updated_at DESC
LIMIT 1000;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check how many events were backfilled
DO $$
DECLARE
  booking_events_count INTEGER;
  payment_events_count INTEGER;
  status_changed_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO booking_events_count
  FROM app_events
  WHERE type = 'booking.created';
  
  SELECT COUNT(*) INTO payment_events_count
  FROM app_events
  WHERE type = 'payment.received';
  
  SELECT COUNT(*) INTO status_changed_count
  FROM app_events
  WHERE type = 'booking.status_changed';
  
  RAISE NOTICE 'Backfill completed:';
  RAISE NOTICE '  - booking.created events: %', booking_events_count;
  RAISE NOTICE '  - payment.received events: %', payment_events_count;
  RAISE NOTICE '  - booking.status_changed events: %', status_changed_count;
END $$;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE app_events IS 'Event bus audit trail - backfilled with recent historical data (last 30 days)';

