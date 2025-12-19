-- Migration: 030-guide-itinerary-reviews-rls.sql
-- Description: RLS policies to allow guides to access package_itineraries and reviews for their assigned trips
-- Created: 2025-12-21
-- Fixes: Root cause of itinerary 500 error and ratings/reviews errors

-- ============================================
-- PACKAGE_ITINERARIES RLS POLICIES
-- ============================================
-- Check if table exists and enable RLS
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'package_itineraries') THEN
    -- Enable RLS if not already enabled
    ALTER TABLE package_itineraries ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policy if exists (to avoid conflicts)
    DROP POLICY IF EXISTS "package_itineraries_select_guide" ON package_itineraries;
    DROP POLICY IF EXISTS "package_itineraries_select_published" ON package_itineraries;
    DROP POLICY IF EXISTS "package_itineraries_select_internal" ON package_itineraries;
    DROP POLICY IF EXISTS "package_itineraries_select_all" ON package_itineraries;
    
    -- Guides can see itineraries for packages used in trips they're assigned to
    -- This is the KEY fix for itinerary 500 error
    CREATE POLICY "package_itineraries_select_guide" ON package_itineraries
      FOR SELECT
      USING (
        package_id IN (
          SELECT DISTINCT t.package_id
          FROM trips t
          JOIN trip_guides tg ON tg.trip_id = t.id
          WHERE tg.guide_id = auth.uid()
        )
      );
    
    -- Published packages visible to all (for public viewing)
    CREATE POLICY "package_itineraries_select_published" ON package_itineraries
      FOR SELECT
      USING (
        package_id IN (
          SELECT id FROM packages WHERE status = 'published' AND deleted_at IS NULL
        )
      );
    
    -- Internal staff can see all itineraries in their branch
    CREATE POLICY "package_itineraries_select_internal" ON package_itineraries
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM packages p
          JOIN users u ON u.id = auth.uid()
          WHERE p.id = package_itineraries.package_id
          AND (
            u.role IN ('super_admin', 'ops_admin', 'marketing', 'admin')
            AND (p.branch_id = u.branch_id OR u.role = 'super_admin')
          )
        )
      );
  ELSE
    -- If table doesn't exist, it might be using JSONB in packages table
    -- In that case, guides already have access via packages RLS policy
    RAISE NOTICE 'package_itineraries table does not exist - using JSONB itinerary in packages table';
  END IF;
END $$;

-- ============================================
-- REVIEWS RLS POLICIES (Additional for Guides)
-- ============================================
-- Guides can see reviews for bookings in trips they're assigned to
-- This is the KEY fix for ratings/reviews error
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviews') THEN
    -- Drop existing guide policy if exists
    DROP POLICY IF EXISTS "reviews_select_guide" ON reviews;
    
    -- Guides can see reviews for bookings in their assigned trips
    -- This allows guides to see reviews even if not published (for their own trips)
    CREATE POLICY "reviews_select_guide" ON reviews
      FOR SELECT
      USING (
        -- Review is published (public access)
        is_published = true
        OR
        -- OR guide is assigned to trip containing this booking (private access for guide)
        booking_id IN (
          SELECT tb.booking_id
          FROM trip_bookings tb
          JOIN trip_guides tg ON tg.trip_id = tb.trip_id
          WHERE tg.guide_id = auth.uid()
        )
      );
  END IF;
END $$;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
-- Index for package_itineraries lookup by package_id
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'package_itineraries') THEN
    CREATE INDEX IF NOT EXISTS idx_package_itineraries_package_id 
      ON package_itineraries(package_id);
  END IF;
END $$;

-- Index for reviews lookup by booking_id (if not exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviews') THEN
    CREATE INDEX IF NOT EXISTS idx_reviews_booking_id 
      ON reviews(booking_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_is_published 
      ON reviews(is_published) WHERE is_published = true;
  END IF;
END $$;
