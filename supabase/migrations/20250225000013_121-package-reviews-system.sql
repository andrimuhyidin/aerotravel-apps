-- Migration: Add Package Reviews & Ratings System
-- Description: Create tables for package reviews, ratings, and helpful votes
-- Author: AI Assistant
-- Date: 2025-12-25

-- =====================================================
-- Table: package_reviews
-- =====================================================
CREATE TABLE IF NOT EXISTS public.package_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  reviewer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reviewer_name TEXT NOT NULL,
  reviewer_avatar TEXT,
  
  -- Ratings (1-5 stars)
  overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
  itinerary_rating INTEGER CHECK (itinerary_rating >= 1 AND itinerary_rating <= 5),
  guide_rating INTEGER CHECK (guide_rating >= 1 AND guide_rating <= 5),
  accommodation_rating INTEGER CHECK (accommodation_rating >= 1 AND accommodation_rating <= 5),
  transport_rating INTEGER CHECK (transport_rating >= 1 AND transport_rating <= 5),
  value_rating INTEGER CHECK (value_rating >= 1 AND value_rating <= 5),
  
  -- Review content
  review_text TEXT,
  review_title TEXT,
  photos TEXT[], -- Array of image URLs
  
  -- Trip metadata
  trip_date DATE,
  verified_purchase BOOLEAN DEFAULT FALSE,
  
  -- Engagement metrics
  helpful_count INTEGER DEFAULT 0,
  unhelpful_count INTEGER DEFAULT 0,
  reported_count INTEGER DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'hidden')),
  moderation_notes TEXT,
  moderated_by UUID REFERENCES public.users(id),
  moderated_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_package_reviews_package_id ON public.package_reviews(package_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_package_reviews_reviewer_id ON public.package_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_package_reviews_booking_id ON public.package_reviews(booking_id) WHERE booking_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_package_reviews_status ON public.package_reviews(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_package_reviews_overall_rating ON public.package_reviews(overall_rating) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_package_reviews_created_at ON public.package_reviews(created_at DESC) WHERE deleted_at IS NULL;

-- =====================================================
-- Table: review_helpful_votes
-- =====================================================
CREATE TABLE IF NOT EXISTS public.review_helpful_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES public.package_reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('helpful', 'unhelpful')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint: one vote per user per review
  UNIQUE(review_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_review_helpful_votes_review_id ON public.review_helpful_votes(review_id);
CREATE INDEX IF NOT EXISTS idx_review_helpful_votes_user_id ON public.review_helpful_votes(user_id);

-- =====================================================
-- Materialized View: package_rating_stats
-- =====================================================
DROP MATERIALIZED VIEW IF EXISTS public.package_rating_stats;
CREATE MATERIALIZED VIEW public.package_rating_stats AS
SELECT
  p.id as package_id,
  COUNT(pr.id) as total_reviews,
  ROUND(AVG(pr.overall_rating)::numeric, 2) as average_rating,
  ROUND(AVG(pr.itinerary_rating)::numeric, 2) as avg_itinerary_rating,
  ROUND(AVG(pr.guide_rating)::numeric, 2) as avg_guide_rating,
  ROUND(AVG(pr.accommodation_rating)::numeric, 2) as avg_accommodation_rating,
  ROUND(AVG(pr.transport_rating)::numeric, 2) as avg_transport_rating,
  ROUND(AVG(pr.value_rating)::numeric, 2) as avg_value_rating,
  
  -- Rating distribution
  COUNT(CASE WHEN pr.overall_rating = 5 THEN 1 END) as rating_5_count,
  COUNT(CASE WHEN pr.overall_rating = 4 THEN 1 END) as rating_4_count,
  COUNT(CASE WHEN pr.overall_rating = 3 THEN 1 END) as rating_3_count,
  COUNT(CASE WHEN pr.overall_rating = 2 THEN 1 END) as rating_2_count,
  COUNT(CASE WHEN pr.overall_rating = 1 THEN 1 END) as rating_1_count,
  
  -- Most recent review
  MAX(pr.created_at) as last_review_date,
  
  -- Verified reviews count
  COUNT(CASE WHEN pr.verified_purchase = TRUE THEN 1 END) as verified_reviews_count
FROM packages p
LEFT JOIN package_reviews pr ON p.id = pr.package_id 
  AND pr.status = 'approved' 
  AND pr.deleted_at IS NULL
WHERE p.deleted_at IS NULL
GROUP BY p.id;

-- Index for fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_package_rating_stats_package_id ON public.package_rating_stats(package_id);
CREATE INDEX IF NOT EXISTS idx_package_rating_stats_avg_rating ON public.package_rating_stats(average_rating DESC);

-- Grant permissions
GRANT SELECT ON public.package_rating_stats TO authenticated;
GRANT SELECT ON public.package_reviews TO authenticated;
GRANT SELECT ON public.review_helpful_votes TO authenticated;

-- =====================================================
-- Trigger: Auto-update updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_package_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_package_reviews_updated_at ON public.package_reviews;
CREATE TRIGGER trigger_update_package_reviews_updated_at
  BEFORE UPDATE ON public.package_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_package_reviews_updated_at();

-- =====================================================
-- Trigger: Update helpful count when vote changes
-- =====================================================
CREATE OR REPLACE FUNCTION update_review_helpful_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.vote_type = 'helpful' THEN
      UPDATE package_reviews SET helpful_count = helpful_count + 1 WHERE id = NEW.review_id;
    ELSIF NEW.vote_type = 'unhelpful' THEN
      UPDATE package_reviews SET unhelpful_count = unhelpful_count + 1 WHERE id = NEW.review_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.vote_type = 'helpful' AND NEW.vote_type = 'unhelpful' THEN
      UPDATE package_reviews SET helpful_count = helpful_count - 1, unhelpful_count = unhelpful_count + 1 WHERE id = NEW.review_id;
    ELSIF OLD.vote_type = 'unhelpful' AND NEW.vote_type = 'helpful' THEN
      UPDATE package_reviews SET helpful_count = helpful_count + 1, unhelpful_count = unhelpful_count - 1 WHERE id = NEW.review_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.vote_type = 'helpful' THEN
      UPDATE package_reviews SET helpful_count = helpful_count - 1 WHERE id = OLD.review_id;
    ELSIF OLD.vote_type = 'unhelpful' THEN
      UPDATE package_reviews SET unhelpful_count = unhelpful_count - 1 WHERE id = OLD.review_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_review_helpful_count ON public.review_helpful_votes;
CREATE TRIGGER trigger_update_review_helpful_count
  AFTER INSERT OR UPDATE OR DELETE ON public.review_helpful_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_review_helpful_count();

-- =====================================================
-- Trigger: Refresh materialized view on review changes
-- =====================================================
CREATE OR REPLACE FUNCTION refresh_package_rating_stats()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.package_rating_stats;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_refresh_rating_stats_insert ON public.package_reviews;
CREATE TRIGGER trigger_refresh_rating_stats_insert
  AFTER INSERT OR UPDATE OR DELETE ON public.package_reviews
  FOR EACH STATEMENT
  EXECUTE FUNCTION refresh_package_rating_stats();

-- =====================================================
-- RLS Policies
-- =====================================================

-- Enable RLS
ALTER TABLE public.package_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_helpful_votes ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read approved reviews
CREATE POLICY "Anyone can read approved reviews"
  ON public.package_reviews
  FOR SELECT
  USING (status = 'approved' AND deleted_at IS NULL);

-- Policy: Users can create reviews for their bookings
CREATE POLICY "Users can create reviews for their bookings"
  ON public.package_reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (
    reviewer_id = auth.uid() AND
    (booking_id IS NULL OR EXISTS (
      SELECT 1 FROM bookings 
      WHERE id = booking_id 
      AND customer_id = auth.uid()
      AND status IN ('completed', 'confirmed')
    ))
  );

-- Policy: Users can update their own pending reviews
CREATE POLICY "Users can update their own pending reviews"
  ON public.package_reviews
  FOR UPDATE
  TO authenticated
  USING (reviewer_id = auth.uid() AND status = 'pending')
  WITH CHECK (reviewer_id = auth.uid() AND status = 'pending');

-- Policy: Staff can moderate reviews
CREATE POLICY "Staff can moderate reviews"
  ON public.package_reviews
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'ops_admin', 'marketing')
    )
  );

-- Policy: Users can vote on reviews
CREATE POLICY "Users can manage their review votes"
  ON public.review_helpful_votes
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy: Anyone can read vote counts (aggregated in reviews table)
CREATE POLICY "Anyone can read vote counts"
  ON public.review_helpful_votes
  FOR SELECT
  USING (true);

-- =====================================================
-- Comments
-- =====================================================
COMMENT ON TABLE public.package_reviews IS 'Customer reviews and ratings for travel packages';
COMMENT ON TABLE public.review_helpful_votes IS 'Helpful/unhelpful votes on reviews by users';
COMMENT ON MATERIALIZED VIEW public.package_rating_stats IS 'Aggregated rating statistics per package (refreshed on review changes)';

COMMENT ON COLUMN public.package_reviews.verified_purchase IS 'True if review is from actual booking customer';
COMMENT ON COLUMN public.package_reviews.status IS 'Review moderation status: pending, approved, rejected, hidden';
COMMENT ON COLUMN public.package_reviews.helpful_count IS 'Number of users who found this review helpful';

