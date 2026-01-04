/**
 * Migration: Guide App Performance Indexes
 * 
 * Adds database indexes to optimize guide dashboard queries
 * Based on performance optimization analysis
 * 
 * Migration: 081
 * Created: 2025-01-31
 */

-- ============================================================================
-- 1. Guide Status Queries Optimization
-- ============================================================================

-- Index for guide_status lookups (used in /api/guide/status)
CREATE INDEX IF NOT EXISTS idx_guide_status_guide_id 
ON guide_status(guide_id) 
WHERE guide_id IS NOT NULL;

-- Index for guide_status with branch_id (if column exists)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'guide_status' AND column_name = 'branch_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_guide_status_guide_id_branch 
    ON guide_status(guide_id, branch_id) 
    WHERE guide_id IS NOT NULL;
  END IF;
END $$;

-- Index for guide_availability queries (upcoming availability)
-- Note: Cannot use NOW() in index predicate, so we index all and filter in query
CREATE INDEX IF NOT EXISTS idx_guide_availability_guide_id_until 
ON guide_availability(guide_id, available_until);

-- Additional index for branch filtering in availability (if column exists)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'guide_availability' AND column_name = 'branch_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_guide_availability_branch_until 
    ON guide_availability(branch_id, available_until) 
    WHERE branch_id IS NOT NULL;
  END IF;
END $$;

-- ============================================================================
-- 2. Trip Queries Optimization
-- ============================================================================

-- Index for trip_crews lookups (multi-guide system)
-- Used in /api/guide/trips and /api/guide/dashboard
CREATE INDEX IF NOT EXISTS idx_trip_crews_guide_status 
ON trip_crews(guide_id, status) 
WHERE status IN ('assigned', 'confirmed');

-- Index for trip_crews with branch filtering (branch_id already indexed separately)
-- Note: Composite index dengan branch_id untuk better filtering
CREATE INDEX IF NOT EXISTS idx_trip_crews_guide_status_branch 
ON trip_crews(guide_id, status, branch_id) 
WHERE status IN ('assigned', 'confirmed') AND branch_id IS NOT NULL;

-- Index for trip_guides lookups (legacy single-guide system)
-- Used in /api/guide/trips and /api/guide/dashboard
CREATE INDEX IF NOT EXISTS idx_trip_guides_guide_status 
ON trip_guides(guide_id, assignment_status) 
WHERE assignment_status IN ('confirmed', 'pending_confirmation');

-- Index for trip_guides with branch filtering (if branch_id column exists)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'trip_guides' AND column_name = 'branch_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_trip_guides_guide_status_branch 
    ON trip_guides(guide_id, assignment_status, branch_id) 
    WHERE assignment_status IN ('confirmed', 'pending_confirmation') AND branch_id IS NOT NULL;
  END IF;
END $$;

-- Index for trips date queries (used for filtering by date and status)
-- Note: trips table uses trip_date, not date
CREATE INDEX IF NOT EXISTS idx_trips_trip_date_status 
ON trips(trip_date, status) 
WHERE trip_date IS NOT NULL;

-- Index for trips with branch filtering
CREATE INDEX IF NOT EXISTS idx_trips_branch_date_status 
ON trips(branch_id, trip_date, status) 
WHERE trip_date IS NOT NULL AND branch_id IS NOT NULL;

-- ============================================================================
-- 3. Stats Queries Optimization
-- ============================================================================

-- Index for completed trips count (used in /api/guide/stats)
-- Optimizes queries that count completed trips for a guide
CREATE INDEX IF NOT EXISTS idx_trip_guides_completed 
ON trip_guides(guide_id, check_in_at, check_out_at) 
WHERE check_in_at IS NOT NULL AND check_out_at IS NOT NULL;

-- Index for trip_bookings lookups (used in stats rating calculation)
CREATE INDEX IF NOT EXISTS idx_trip_bookings_trip_id 
ON trip_bookings(trip_id) 
WHERE trip_id IS NOT NULL;

-- Index for reviews with guide_rating (used in stats average rating)
CREATE INDEX IF NOT EXISTS idx_reviews_guide_rating 
ON reviews(booking_id, guide_rating) 
WHERE guide_rating IS NOT NULL;

-- Index for reviews by booking_id (used in stats calculation)
CREATE INDEX IF NOT EXISTS idx_reviews_booking_id 
ON reviews(booking_id) 
WHERE booking_id IS NOT NULL;

-- ============================================================================
-- 4. Notifications Queries Optimization
-- ============================================================================

-- Note: notifications table doesn't exist, using notification_logs instead
-- Index for notification_logs by user_id (used for user notifications)
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_created 
ON notification_logs(user_id, created_at) 
WHERE user_id IS NOT NULL;

-- Index for notification_logs by status and user
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_status 
ON notification_logs(user_id, status, created_at) 
WHERE user_id IS NOT NULL;

-- ============================================================================
-- 5. Additional Performance Indexes
-- ============================================================================

-- Index for trip_bookings by booking_id (used in stats)
CREATE INDEX IF NOT EXISTS idx_trip_bookings_booking_id 
ON trip_bookings(booking_id) 
WHERE booking_id IS NOT NULL;

-- Index for users table lookups (used in getCurrentUser)
CREATE INDEX IF NOT EXISTS idx_users_id_created_at 
ON users(id, created_at) 
WHERE id IS NOT NULL;

-- Index for guide_id_cards active lookups
CREATE INDEX IF NOT EXISTS idx_guide_id_cards_guide_active 
ON guide_id_cards(guide_id, status, created_at) 
WHERE status = 'active';

-- Index for certifications expiring queries
-- Note: guide_certifications uses expires_at, not expiry_date
-- Cannot use NOW() in index predicate, so index all and filter in query
CREATE INDEX IF NOT EXISTS idx_guide_certifications_expiry 
ON guide_certifications(guide_id, expires_at) 
WHERE expires_at IS NOT NULL;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON INDEX idx_guide_status_guide_id IS 
'Optimizes guide status lookups by guide_id';

COMMENT ON INDEX idx_guide_availability_guide_id_until IS 
'Optimizes upcoming availability queries';

COMMENT ON INDEX idx_trip_crews_guide_status IS 
'Optimizes trip_crews queries for assigned/confirmed trips';

COMMENT ON INDEX idx_trip_guides_guide_status IS 
'Optimizes trip_guides queries for confirmed/pending trips';

COMMENT ON INDEX idx_trips_trip_date_status IS 
'Optimizes trips queries filtered by trip_date and status';

COMMENT ON INDEX idx_trip_guides_completed IS 
'Optimizes completed trips count queries for stats';

COMMENT ON INDEX idx_reviews_guide_rating IS 
'Optimizes reviews queries for guide rating calculation';

COMMENT ON INDEX idx_notification_logs_user_created IS 
'Optimizes notification_logs queries by user and created_at';

