-- Migration: 095-package-popularity-view.sql
-- Description: Create view for package popularity tracking (booking count, revenue)
-- Created: 2025-01-25

-- ============================================
-- PACKAGE POPULARITY VIEW
-- ============================================
-- This view aggregates booking statistics per package
-- Used for sorting and displaying popular packages

CREATE OR REPLACE VIEW package_popularity AS
SELECT
  p.id as package_id,
  COUNT(DISTINCT b.id) as booking_count,
  COALESCE(SUM(CASE WHEN b.status IN ('paid', 'confirmed', 'completed') THEN b.total_amount ELSE 0 END), 0) as total_revenue,
  COALESCE(SUM(CASE WHEN b.status IN ('paid', 'confirmed', 'completed') THEN (b.total_amount - b.nta_total) ELSE 0 END), 0) as total_commission,
  MAX(b.created_at) as last_booking_date,
  -- Popularity score: booking_count * 10 + (revenue / 100000) + (days since last booking < 30 ? 5 : 0)
  (
    COUNT(DISTINCT b.id) * 10 +
    (COALESCE(SUM(CASE WHEN b.status IN ('paid', 'confirmed', 'completed') THEN b.total_amount ELSE 0 END), 0) / 100000) +
    CASE 
      WHEN MAX(b.created_at) > NOW() - INTERVAL '30 days' THEN 5
      ELSE 0
    END
  ) as popularity_score
FROM packages p
LEFT JOIN bookings b ON b.package_id = p.id
WHERE p.deleted_at IS NULL
  AND (b.deleted_at IS NULL OR b.deleted_at IS NULL)
GROUP BY p.id;

-- Index for better performance (if needed)
-- Note: Views don't have indexes, but underlying tables should have indexes on foreign keys

-- Grant access to authenticated users
GRANT SELECT ON package_popularity TO authenticated;

-- Add comment
COMMENT ON VIEW package_popularity IS 'Aggregated booking statistics and popularity scores for packages';

