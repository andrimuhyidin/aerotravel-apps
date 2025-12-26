-- =====================================================
-- SAMPLE DATA SEEDING
-- For Analytics, A/B Testing, Reviews & Feedback
-- Generated: 2025-12-25
-- =====================================================

-- Execute this AFTER running the main migrations

-- =====================================================
-- 1. Sample A/B Test Experiments
-- =====================================================

INSERT INTO ab_test_experiments (
  experiment_key,
  experiment_name,
  description,
  variants,
  status,
  target_pages,
  start_date
) VALUES
  (
    'package_card_layout',
    'Package Card Layout Test',
    'Test different layouts for package cards to improve conversion rate',
    '[
      {"key": "control", "weight": 50, "config": {"layout": "standard", "showBadges": false}},
      {"key": "enhanced", "weight": 25, "config": {"layout": "enhanced", "showBadges": true, "showInstantConfirm": true}},
      {"key": "compact", "weight": 25, "config": {"layout": "compact", "showBadges": false, "emphasizePrice": true}}
    ]'::jsonb,
    'running',
    ARRAY['/partner/packages', '/partner/packages/[id]'],
    NOW()
  ),
  (
    'booking_widget_cta',
    'Booking Widget CTA Test',
    'Test different call-to-action button texts and colors',
    '[
      {"key": "control", "weight": 50, "config": {"ctaText": "Book Now", "ctaColor": "primary"}},
      {"key": "urgent", "weight": 50, "config": {"ctaText": "Book Now - Limited Slots!", "ctaColor": "red"}}
    ]'::jsonb,
    'running',
    ARRAY['/partner/packages/[id]'],
    NOW()
  ),
  (
    'filter_sidebar_position',
    'Filter Sidebar Position Test',
    'Test left vs right sidebar for package filters',
    '[
      {"key": "control", "weight": 50, "config": {"position": "left"}},
      {"key": "right_sidebar", "weight": 50, "config": {"position": "right"}}
    ]'::jsonb,
    'draft',
    ARRAY['/partner/packages'],
    NULL
  )
ON CONFLICT (experiment_key) DO NOTHING;

-- =====================================================
-- 2. Feature Flags
-- =====================================================

INSERT INTO feature_flags (
  flag_key,
  flag_name,
  description,
  is_enabled,
  rollout_percentage,
  target_roles
) VALUES
  (
    'package_reviews_enabled',
    'Enable Package Reviews',
    'Show reviews and ratings on package detail pages',
    true,
    100,
    ARRAY['mitra', 'customer']
  ),
  (
    'enhanced_filters',
    'Enhanced Package Filters',
    'Show advanced filtering options (price slider, date range, facilities)',
    true,
    100,
    ARRAY['mitra']
  ),
  (
    'quick_view_modal',
    'Quick View Modal',
    'Enable quick view modal for packages without leaving list page',
    true,
    100,
    ARRAY['mitra']
  ),
  (
    'availability_realtime',
    'Real-time Availability',
    'Check real-time package availability and remaining slots',
    true,
    50,
    ARRAY['mitra']
  ),
  (
    'feedback_widget',
    'Feedback Widget',
    'Floating feedback button on all pages',
    true,
    100,
    NULL
  ),
  (
    'performance_monitoring',
    'Performance Monitoring',
    'Track Core Web Vitals and performance metrics',
    true,
    100,
    NULL
  )
ON CONFLICT (flag_key) DO NOTHING;

-- =====================================================
-- 3. Sample Package Reviews
-- =====================================================

-- Insert reviews for existing packages (adjust package_id and reviewer_id as needed)
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
  COALESCE(u.full_name, 'Anonymous User') as reviewer_name,
  u.avatar_url as reviewer_avatar,
  (FLOOR(RANDOM() * 2) + 4)::INTEGER as overall_rating,  -- 4-5 stars
  (FLOOR(RANDOM() * 2) + 4)::INTEGER as itinerary_rating,
  (FLOOR(RANDOM() * 2) + 4)::INTEGER as guide_rating,
  (FLOOR(RANDOM() * 2) + 4)::INTEGER as accommodation_rating,
  (FLOOR(RANDOM() * 2) + 4)::INTEGER as transport_rating,
  (FLOOR(RANDOM() * 2) + 4)::INTEGER as value_rating,
  CASE (RANDOM() * 5)::INT
    WHEN 0 THEN 'Trip yang sangat menyenangkan!'
    WHEN 1 THEN 'Pengalaman yang luar biasa'
    WHEN 2 THEN 'Highly recommended!'
    WHEN 3 THEN 'Liburan keluarga yang sempurna'
    ELSE 'Amazing experience!'
  END as review_title,
  CASE (RANDOM() * 3)::INT
    WHEN 0 THEN 'Pengalaman yang luar biasa. Tour guide sangat ramah dan profesional. Destinasi yang dikunjungi sangat indah. Hotel dan transportasi juga nyaman. Sangat direkomendasikan untuk liburan keluarga!'
    WHEN 1 THEN 'Paket wisata yang sangat memuaskan. Itinerary terencana dengan baik, tidak terburu-buru. Guide lokal sangat membantu dan berpengetahuan. Makanan enak dan akomodasi bersih. Worth it!'
    ELSE 'Great value for money! Semua fasilitas sesuai dengan deskripsi. Koordinasi dari travel agent sangat baik. Anak-anak sangat senang. Pasti akan booking lagi untuk trip berikutnya.'
  END as review_text,
  NOW() - (RANDOM() * INTERVAL '90 days') as trip_date,
  true as verified_purchase,
  'approved' as status
FROM packages p
CROSS JOIN LATERAL (
  SELECT * FROM users 
  WHERE role IN ('customer', 'mitra') 
  AND deleted_at IS NULL
  ORDER BY RANDOM()
  LIMIT 1
) u
WHERE p.status = 'published'
  AND p.deleted_at IS NULL
LIMIT 25
ON CONFLICT DO NOTHING;

-- Add some helpful votes to reviews
INSERT INTO review_helpful_votes (review_id, user_id, vote_type)
SELECT
  pr.id as review_id,
  u.id as user_id,
  CASE WHEN RANDOM() > 0.2 THEN 'helpful' ELSE 'unhelpful' END as vote_type
FROM package_reviews pr
CROSS JOIN LATERAL (
  SELECT * FROM users
  WHERE deleted_at IS NULL
    AND id != pr.reviewer_id
  ORDER BY RANDOM()
  LIMIT 3
) u
ON CONFLICT (review_id, user_id) DO NOTHING;

-- Refresh materialized view
REFRESH MATERIALIZED VIEW CONCURRENTLY package_rating_stats;

-- =====================================================
-- 4. Sample Analytics Events (optional - for testing)
-- =====================================================

-- Insert some sample page view events
INSERT INTO feature_analytics_events (
  user_id,
  session_id,
  event_name,
  event_category,
  event_action,
  event_label,
  feature_name,
  page_url,
  page_title,
  device_type,
  browser,
  os,
  created_at
)
SELECT
  u.id as user_id,
  'session_' || gen_random_uuid()::text as session_id,
  'page_view' as event_name,
  'page_view' as event_category,
  'view' as event_action,
  '/partner/packages' as event_label,
  'package_filter_sidebar' as feature_name,
  '/id/partner/packages' as page_url,
  'Paket Wisata - Partner Portal' as page_title,
  CASE (RANDOM() * 3)::INT
    WHEN 0 THEN 'mobile'
    WHEN 1 THEN 'tablet'
    ELSE 'desktop'
  END as device_type,
  CASE (RANDOM() * 4)::INT
    WHEN 0 THEN 'Chrome'
    WHEN 1 THEN 'Safari'
    WHEN 2 THEN 'Firefox'
    ELSE 'Edge'
  END as browser,
  CASE (RANDOM() * 3)::INT
    WHEN 0 THEN 'Windows'
    WHEN 1 THEN 'macOS'
    ELSE 'Android'
  END as os,
  NOW() - (RANDOM() * INTERVAL '7 days') as created_at
FROM users u
WHERE u.role = 'mitra'
  AND u.deleted_at IS NULL
LIMIT 50;

-- =====================================================
-- 5. Sample Performance Metrics (optional)
-- =====================================================

INSERT INTO performance_metrics (
  page_url,
  page_type,
  lcp,
  fid,
  cls,
  ttfb,
  fcp,
  tti,
  page_load_time,
  connection_type,
  device_type,
  browser,
  session_id,
  created_at
)
SELECT
  '/id/partner/packages' as page_url,
  'package_listing' as page_type,
  (RANDOM() * 2 + 1.5)::NUMERIC(5,2) as lcp,  -- 1.5-3.5s
  (RANDOM() * 80 + 20)::NUMERIC(5,2) as fid,  -- 20-100ms
  (RANDOM() * 0.15)::NUMERIC(5,3) as cls,     -- 0-0.15
  (RANDOM() * 300 + 100)::NUMERIC(5,2) as ttfb, -- 100-400ms
  (RANDOM() * 1000 + 500)::NUMERIC(5,2) as fcp, -- 500-1500ms
  (RANDOM() * 2000 + 1000)::NUMERIC(5,2) as tti, -- 1000-3000ms
  (RANDOM() * 2000 + 1000)::INT as page_load_time,
  CASE (RANDOM() * 3)::INT
    WHEN 0 THEN '4g'
    WHEN 1 THEN 'wifi'
    ELSE '3g'
  END as connection_type,
  CASE (RANDOM() * 3)::INT
    WHEN 0 THEN 'mobile'
    WHEN 1 THEN 'tablet'
    ELSE 'desktop'
  END as device_type,
  CASE (RANDOM() * 2)::INT
    WHEN 0 THEN 'Chrome'
    ELSE 'Safari'
  END as browser,
  'perf_session_' || gen_random_uuid()::text as session_id,
  NOW() - (RANDOM() * INTERVAL '7 days') as created_at
FROM generate_series(1, 30);

-- =====================================================
-- Verification Queries
-- =====================================================

-- Check created records
DO $$
DECLARE
  experiments_count INT;
  flags_count INT;
  reviews_count INT;
  events_count INT;
  perf_count INT;
BEGIN
  SELECT COUNT(*) INTO experiments_count FROM ab_test_experiments;
  SELECT COUNT(*) INTO flags_count FROM feature_flags;
  SELECT COUNT(*) INTO reviews_count FROM package_reviews WHERE status = 'approved';
  SELECT COUNT(*) INTO events_count FROM feature_analytics_events;
  SELECT COUNT(*) INTO perf_count FROM performance_metrics;

  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '✅ Sample Data Seeded Successfully!';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Records Created:';
  RAISE NOTICE '   A/B Experiments: %', experiments_count;
  RAISE NOTICE '   Feature Flags: %', flags_count;
  RAISE NOTICE '   Package Reviews: %', reviews_count;
  RAISE NOTICE '   Analytics Events: %', events_count;
  RAISE NOTICE '   Performance Metrics: %', perf_count;
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Database is ready for testing!';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;

