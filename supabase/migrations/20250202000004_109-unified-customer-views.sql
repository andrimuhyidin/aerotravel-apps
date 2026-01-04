/**
 * Migration: Unified Customer Views
 * Description: Create database views dan functions untuk unified customer profiles
 * Created: 2025-02-02
 * Reference: Cross-App Data Integration Implementation Plan
 */

-- ============================================
-- UNIFIED CUSTOMER PROFILES VIEW
-- ============================================

CREATE OR REPLACE VIEW unified_customer_profiles AS
WITH customer_data AS (
  SELECT DISTINCT
    COALESCE(pc.id::text, b.customer_id::text) AS unified_id,
    COALESCE(pc.name, b.customer_name, 'Unknown') AS name,
    COALESCE(pc.email, b.customer_email) AS email,
    COALESCE(pc.phone, b.customer_phone) AS phone,
    CASE
      WHEN pc.id IS NOT NULL THEN 'partner'
      WHEN b.customer_id IS NOT NULL THEN 'customer'
      ELSE 'unknown'
    END AS source,
    pc.id AS partner_customer_id,
    b.customer_id
  FROM partner_customers pc
  FULL OUTER JOIN bookings b ON (
    (pc.email IS NOT NULL AND b.customer_email = pc.email)
    OR (pc.phone IS NOT NULL AND b.customer_phone = pc.phone)
    OR (pc.id::text = b.customer_id::text)
  )
  WHERE (pc.id IS NOT NULL OR b.customer_id IS NOT NULL)
)
SELECT 
  cd.unified_id,
  cd.name,
  cd.email,
  cd.phone,
  cd.source,
  cd.partner_customer_id,
  cd.customer_id,
  COUNT(DISTINCT b.id) AS total_bookings,
  COALESCE(SUM(b.total_amount), 0) AS total_spent,
  MAX(b.trip_date) AS last_trip_date,
  MIN(b.created_at) AS first_booking_date
FROM customer_data cd
LEFT JOIN bookings b ON (
  b.customer_id::text = cd.customer_id::text
  OR (cd.email IS NOT NULL AND b.customer_email = cd.email)
  OR (cd.phone IS NOT NULL AND b.customer_phone = cd.phone)
)
GROUP BY
  cd.unified_id,
  cd.name,
  cd.email,
  cd.phone,
  cd.source,
  cd.partner_customer_id,
  cd.customer_id;

-- ============================================
-- CUSTOMER MATCHING FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION match_customer_by_email_phone(
  p_email TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_name TEXT DEFAULT NULL
)
RETURNS TABLE (
  customer_id TEXT,
  source TEXT,
  name TEXT,
  email TEXT,
  phone TEXT,
  confidence TEXT,
  match_reason TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH email_matches AS (
    SELECT DISTINCT
      COALESCE(pc.id::text, b.customer_id::text) AS id,
      'partner' AS src,
      COALESCE(pc.name, b.customer_name) AS nm,
      COALESCE(pc.email, b.customer_email) AS em,
      COALESCE(pc.phone, b.customer_phone) AS ph,
      'high' AS conf,
      'Exact email match' AS reason
    FROM partner_customers pc
    FULL OUTER JOIN bookings b ON (
      pc.email = b.customer_email
      OR pc.id::text = b.customer_id::text
    )
    WHERE (p_email IS NOT NULL AND (pc.email = LOWER(TRIM(p_email)) OR b.customer_email = LOWER(TRIM(p_email))))
  ),
  phone_matches AS (
    SELECT DISTINCT
      COALESCE(pc.id::text, b.customer_id::text) AS id,
      'partner' AS src,
      COALESCE(pc.name, b.customer_name) AS nm,
      COALESCE(pc.email, b.customer_email) AS em,
      COALESCE(pc.phone, b.customer_phone) AS ph,
      'high' AS conf,
      'Exact phone match' AS reason
    FROM partner_customers pc
    FULL OUTER JOIN bookings b ON (
      REPLACE(REPLACE(COALESCE(pc.phone, ''), '-', ''), ' ', '') = REPLACE(REPLACE(COALESCE(b.customer_phone, ''), '-', ''), ' ', '')
      OR pc.id::text = b.customer_id::text
    )
    WHERE (p_phone IS NOT NULL AND (
      REPLACE(REPLACE(COALESCE(pc.phone, ''), '-', ''), ' ', '') LIKE '%' || REPLACE(REPLACE(p_phone, '-', ''), ' ', '') || '%'
      OR REPLACE(REPLACE(COALESCE(b.customer_phone, ''), '-', ''), ' ', '') LIKE '%' || REPLACE(REPLACE(p_phone, '-', ''), ' ', '') || '%'
    ))
  )
  SELECT * FROM email_matches
  UNION
  SELECT * FROM phone_matches
  WHERE id NOT IN (SELECT id FROM email_matches);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Indexes already exist on partner_customers and bookings tables
-- But we can add composite indexes for better matching performance

CREATE INDEX IF NOT EXISTS idx_bookings_customer_email 
  ON bookings(customer_email) WHERE customer_email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_customer_phone 
  ON bookings(customer_phone) WHERE customer_phone IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_partner_customers_email 
  ON partner_customers(email) WHERE email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_partner_customers_phone 
  ON partner_customers(phone) WHERE phone IS NOT NULL;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON VIEW unified_customer_profiles IS 'Unified view of customers across partner, customer, and corporate apps';
COMMENT ON FUNCTION match_customer_by_email_phone IS 'Match customers by email, phone, or name combination';

