-- Performance indexes for Public App
-- These indexes optimize common queries used in the public-facing pages

-- Enable pg_trgm extension for fuzzy search (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Package browsing indexes
-- Note: status is an enum, so we index on created_at for listing queries
CREATE INDEX IF NOT EXISTS idx_packages_created 
  ON packages(created_at DESC) 
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_packages_province 
  ON packages(province) 
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_packages_destination 
  ON packages(destination) 
  WHERE deleted_at IS NULL;

-- Full text search index for package names and destinations
-- Using standard B-tree indexes for ILIKE queries (works well for most cases)
CREATE INDEX IF NOT EXISTS idx_packages_name_lower 
  ON packages(lower(name)) 
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_packages_destination_lower 
  ON packages(lower(destination)) 
  WHERE deleted_at IS NULL;

-- Reviews indexes (note: some indexes may already exist from previous migrations)
CREATE INDEX IF NOT EXISTS idx_package_reviews_package_created 
  ON package_reviews(package_id, created_at DESC) 
  WHERE deleted_at IS NULL AND status = 'approved';

CREATE INDEX IF NOT EXISTS idx_package_reviews_overall_rating 
  ON package_reviews(package_id, overall_rating) 
  WHERE deleted_at IS NULL AND status = 'approved';

-- Split bill indexes
CREATE INDEX IF NOT EXISTS idx_split_bills_booking_id 
  ON split_bills(booking_id);

CREATE INDEX IF NOT EXISTS idx_split_bill_participants_bill_id 
  ON split_bill_participants(split_bill_id);

-- Travel circle indexes
CREATE INDEX IF NOT EXISTS idx_travel_circles_created 
  ON travel_circles(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_travel_circle_members_user_id 
  ON travel_circle_members(user_id);

CREATE INDEX IF NOT EXISTS idx_travel_circle_contributions_member_id 
  ON travel_circle_contributions(member_id, created_at DESC);

-- User notifications index
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_read 
  ON user_notifications(user_id, is_read, created_at DESC);

-- Trip photos index
CREATE INDEX IF NOT EXISTS idx_trip_photos_trip_id 
  ON trip_photos(trip_id, created_at DESC);

-- Bookings search optimization
CREATE INDEX IF NOT EXISTS idx_bookings_customer_name_lower 
  ON bookings(lower(customer_name));

CREATE INDEX IF NOT EXISTS idx_bookings_created 
  ON bookings(created_at DESC);

-- Comments (optional, can be added manually if needed)
-- idx_packages_created: Optimizes package listing page queries
-- idx_packages_name_lower: Enables case-insensitive search on package names

