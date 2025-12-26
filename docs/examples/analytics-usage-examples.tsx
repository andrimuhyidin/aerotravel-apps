/**
 * Example: Using Analytics Tracking in Package Pages
 * Add this to packages-client.tsx to track feature usage
 */

'use client';

import { useEffect } from 'react';
import { getFeatureTracker } from '@/lib/analytics/feature-tracker';
import { usePerformanceMonitoring } from '@/lib/analytics/performance-monitor';

export function PackagesClientWithAnalytics() {
  const tracker = getFeatureTracker();

  // Track performance metrics
  usePerformanceMonitoring('package_listing');

  useEffect(() => {
    // Track page view
    tracker.trackPageView('package_filter_sidebar');
  }, [tracker]);

  // Example: Track filter usage
  const handleFilterApply = (filterType: string, filterValue: unknown, resultCount: number) => {
    tracker.trackFilterUse(filterType, filterValue, resultCount);
  };

  // Example: Track search
  const handleSearch = (query: string, resultCount: number) => {
    tracker.trackSearch(query, resultCount);
  };

  // Example: Track modal open
  const handleQuickViewOpen = (packageId: string) => {
    tracker.trackModal('package_quick_view', 'open', 'package_quick_view');
    tracker.trackFeatureUse('package_quick_view', 'open', packageId);
  };

  // Return your component JSX
  return null;
}

/**
 * Example: Using A/B Testing
 * Test different UI variants
 */

import { useABTest } from '@/lib/analytics/ab-testing';

export function PackageCardWithABTest() {
  const { variant, isLoading, isVariant, trackConversion } = useABTest('package_card_layout');

  if (isLoading) {
    return <div>Loading...</div>;
  }

  // Track conversion when user clicks
  const handleBookingClick = () => {
    trackConversion('booking_initiated', 1);
  };

  // Render different variants
  if (isVariant('variant_a')) {
    return <div>Variant A: Enhanced Card</div>;
  }

  if (isVariant('variant_b')) {
    return <div>Variant B: Compact Card</div>;
  }

  // Default control
  return <div>Control: Standard Card</div>;
}

/**
 * Example: Using Availability Checker
 */

import { useState, useEffect } from 'react';
import { checkPackageAvailability } from '@/lib/availability/availability-service';

export function AvailabilityCheckerExample({ packageId }: { packageId: string }) {
  const [availability, setAvailability] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);

  const checkAvailability = async (date: Date) => {
    setLoading(true);
    try {
      const result = await checkPackageAvailability({
        packageId,
        date,
        paxCount: { adult: 2, child: 1 },
      });
      setAvailability(result);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={() => checkAvailability(new Date())}>
        Check Availability
      </button>
      {loading && <div>Checking...</div>}
      {/* Display availability result */}
    </div>
  );
}

/**
 * Example: Database Seeding for A/B Tests
 * Run this in Supabase SQL Editor to create sample experiments
 */

/*
-- Create sample A/B test experiment
INSERT INTO ab_test_experiments (
  experiment_key,
  experiment_name,
  description,
  variants,
  status,
  target_pages,
  start_date
) VALUES (
  'package_card_layout',
  'Package Card Layout Test',
  'Test different layouts for package cards to improve conversion',
  '[
    {"key": "control", "weight": 50},
    {"key": "variant_a", "weight": 25, "config": {"layout": "enhanced", "showBadges": true}},
    {"key": "variant_b", "weight": 25, "config": {"layout": "compact", "showBadges": false}}
  ]'::jsonb,
  'running',
  ARRAY['/partner/packages'],
  NOW()
);

-- Create sample feature flag
INSERT INTO feature_flags (
  flag_key,
  flag_name,
  description,
  is_enabled,
  rollout_percentage
) VALUES (
  'package_reviews_enabled',
  'Enable Package Reviews',
  'Show reviews and ratings on package detail pages',
  true,
  100
);
*/

/**
 * Example: Seeding Sample Reviews
 */

/*
-- Insert sample reviews (run in Supabase SQL Editor)
INSERT INTO package_reviews (
  package_id,
  reviewer_id,
  reviewer_name,
  reviewer_avatar,
  overall_rating,
  itinerary_rating,
  guide_rating,
  accommodation_rating,
  transport_rating,
  value_rating,
  review_title,
  review_text,
  trip_date,
  verified_purchase,
  status
)
SELECT
  p.id as package_id,
  u.id as reviewer_id,
  u.full_name as reviewer_name,
  u.avatar_url as reviewer_avatar,
  (FLOOR(RANDOM() * 2) + 4)::INTEGER as overall_rating,  -- 4-5 stars
  (FLOOR(RANDOM() * 2) + 4)::INTEGER as itinerary_rating,
  (FLOOR(RANDOM() * 2) + 4)::INTEGER as guide_rating,
  (FLOOR(RANDOM() * 2) + 4)::INTEGER as accommodation_rating,
  (FLOOR(RANDOM() * 2) + 4)::INTEGER as transport_rating,
  (FLOOR(RANDOM() * 2) + 4)::INTEGER as value_rating,
  'Trip yang sangat menyenangkan!' as review_title,
  'Pengalaman yang luar biasa. Tour guide sangat ramah dan profesional. Rekomendasi untuk liburan keluarga!' as review_text,
  NOW() - INTERVAL '30 days' as trip_date,
  true as verified_purchase,
  'approved' as status
FROM packages p
CROSS JOIN LATERAL (
  SELECT * FROM users WHERE role = 'customer' LIMIT 5
) u
WHERE p.status = 'published'
LIMIT 20;

-- Refresh materialized view
REFRESH MATERIALIZED VIEW CONCURRENTLY package_rating_stats;
*/

