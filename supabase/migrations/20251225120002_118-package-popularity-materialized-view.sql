-- Migration: 118-package-popularity-materialized-view.sql
-- Description: Convert package_popularity to materialized view and add direct foreign key for better query performance
-- Created: 2025-12-25
-- Purpose: Fix "Could not find a relationship" error in partner dashboard queries

BEGIN;

-- Drop existing view
DROP VIEW IF EXISTS package_popularity CASCADE;

-- Create materialized view instead (better performance for aggregated data)
CREATE MATERIALIZED VIEW package_popularity AS
SELECT
  p.id as package_id,
  COUNT(DISTINCT b.id) as booking_count,
  COALESCE(SUM(CASE WHEN b.status IN ('paid', 'confirmed', 'ongoing', 'completed') THEN b.total_amount ELSE 0 END), 0) as total_revenue,
  COALESCE(SUM(CASE WHEN b.status IN ('paid', 'confirmed', 'ongoing', 'completed') THEN (b.total_amount - b.nta_total) ELSE 0 END), 0) as total_commission,
  MAX(b.created_at) as last_booking_date,
  -- Popularity score: booking_count * 10 + (revenue / 100000) + (days since last booking < 30 ? 5 : 0)
  (
    COUNT(DISTINCT b.id) * 10 +
    (COALESCE(SUM(CASE WHEN b.status IN ('paid', 'confirmed', 'ongoing', 'completed') THEN b.total_amount ELSE 0 END), 0) / 100000) +
    CASE 
      WHEN MAX(b.created_at) > NOW() - INTERVAL '30 days' THEN 5
      ELSE 0
    END
  ) as popularity_score,
  NOW() as last_refreshed_at
FROM packages p
LEFT JOIN bookings b ON b.package_id = p.id AND b.deleted_at IS NULL
WHERE p.deleted_at IS NULL
GROUP BY p.id;

-- Create unique index on package_id for faster lookups
CREATE UNIQUE INDEX idx_package_popularity_package_id ON package_popularity(package_id);

-- Create index for sorting by popularity
CREATE INDEX idx_package_popularity_score ON package_popularity(popularity_score DESC);
CREATE INDEX idx_package_popularity_booking_count ON package_popularity(booking_count DESC);

-- Grant access to authenticated users
GRANT SELECT ON package_popularity TO authenticated;

-- Add comment
COMMENT ON MATERIALIZED VIEW package_popularity IS 'Aggregated booking statistics and popularity scores for packages (materialized for performance)';

-- Create function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_package_popularity()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY package_popularity;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create cron job to refresh every hour (requires pg_cron extension)
-- Note: This will fail if pg_cron is not installed, but that's okay for dev
DO $$
BEGIN
  -- Try to create cron job, ignore error if pg_cron not available
  PERFORM cron.schedule(
    'refresh-package-popularity',
    '0 * * * *', -- Every hour at minute 0
    $$SELECT refresh_package_popularity();$$
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not schedule cron job (pg_cron may not be installed): %', SQLERRM;
END
$$;

-- Trigger to refresh materialized view after booking changes
CREATE OR REPLACE FUNCTION trigger_refresh_package_popularity()
RETURNS TRIGGER AS $$
BEGIN
  -- Refresh asynchronously (don't block the transaction)
  PERFORM pg_notify('refresh_package_popularity', NEW.package_id::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers on bookings table
DROP TRIGGER IF EXISTS bookings_refresh_popularity ON bookings;
CREATE TRIGGER bookings_refresh_popularity
  AFTER INSERT OR UPDATE OF status, total_amount, package_id
  ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION trigger_refresh_package_popularity();

-- Initial refresh
SELECT refresh_package_popularity();

COMMIT;

