-- Migration: 037-guide-sample-data-part8-posttrip.sql
-- Description: Sample data for Part 8 - Post-Trip Data
-- Created: 2025-01-28
-- 
-- This migration creates sample data for:
-- - Reviews & ratings (20-30)
-- - Feedback
-- - Wallet transactions
-- - Performance metrics
-- - Insurance manifests
-- - Challenges
-- - Social posts
-- - Leaderboard
-- - Broadcasts
-- - Notifications

BEGIN;

DO $$
DECLARE
  sample_branch_id UUID;
  guide1_id UUID;
  guide2_id UUID;
  guide5_id UUID;
  admin_user_id UUID;
  
  -- Trip IDs
  trip7_id UUID := '00000000-0000-0000-0000-000000000007'; -- Completed (7 days ago)
  trip8_id UUID := '00000000-0000-0000-0000-000000000008'; -- Completed (6 days ago)
  trip9_id UUID := '00000000-0000-0000-0000-000000000009'; -- Completed (5 days ago)
  trip10_id UUID := '00000000-0000-0000-0000-00000000000a'; -- Completed (4 days ago)
  trip11_id UUID := '00000000-0000-0000-0000-00000000000b'; -- Completed (18 days ago)
  trip12_id UUID := '00000000-0000-0000-0000-00000000000c'; -- Completed (13 days ago)
  trip13_id UUID := '00000000-0000-0000-0000-00000000000d'; -- Completed (11 days ago)
  
  wallet1_id UUID;
  wallet5_id UUID;
  
  booking_counter INTEGER;
  
BEGIN
  -- Get branch and guides
  SELECT id INTO sample_branch_id FROM branches LIMIT 1;
  IF sample_branch_id IS NULL THEN
    RAISE NOTICE 'No branch found, skipping sample data';
    RETURN;
  END IF;
  
  SELECT id INTO guide1_id FROM users WHERE role = 'guide' LIMIT 1;
  IF guide1_id IS NULL THEN
    RAISE NOTICE 'No guide users found, skipping sample data';
    RETURN;
  END IF;
  
  -- Get different guides for variety (or use same if only one exists)
  SELECT id INTO guide2_id FROM users WHERE role = 'guide' ORDER BY id OFFSET 1 LIMIT 1;
  IF guide2_id IS NULL THEN
    guide2_id := guide1_id;
  END IF;
  
  SELECT id INTO guide5_id FROM users WHERE role = 'guide' ORDER BY id OFFSET 2 LIMIT 1;
  IF guide5_id IS NULL THEN
    guide5_id := guide1_id;
  END IF;
  SELECT id INTO admin_user_id FROM users WHERE role IN ('super_admin', 'ops_admin') LIMIT 1;
  
  -- Get wallet IDs
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guide_wallets') THEN
    SELECT id INTO wallet1_id FROM guide_wallets WHERE guide_id = guide1_id;
    SELECT id INTO wallet5_id FROM guide_wallets WHERE guide_id = guide5_id;
  END IF;

  -- ============================================
  -- PART 8.1: REVIEWS & RATINGS
  -- ============================================
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviews') THEN
    -- Get bookings for completed trips
    DECLARE
      booking_rec RECORD;
      review_counter INTEGER := 1;
    BEGIN
      FOR booking_rec IN
        SELECT b.id as booking_id, b.customer_name, b.customer_email, t.id as trip_id, t.trip_date
        FROM bookings b
        JOIN trip_bookings tb ON tb.booking_id = b.id
        JOIN trips t ON t.id = tb.trip_id
        WHERE t.status = 'completed'
        AND t.trip_date <= CURRENT_DATE - INTERVAL '1 day'
        LIMIT 25
      LOOP
        -- Create reviews with various ratings
        INSERT INTO reviews (booking_id, reviewer_name, overall_rating, guide_rating, review_text, created_at)
        VALUES
          (booking_rec.booking_id,
           booking_rec.customer_name,
           CASE (review_counter % 5)
             WHEN 0 THEN 5
             WHEN 1 THEN 4
             WHEN 2 THEN 5
             WHEN 3 THEN 4
             ELSE 5
           END,
           CASE (review_counter % 5)
             WHEN 0 THEN 5
             WHEN 1 THEN 4
             WHEN 2 THEN 5
             WHEN 3 THEN 4
             ELSE 5
           END,
           CASE (review_counter % 5)
             WHEN 0 THEN 'Guide sangat ramah dan profesional! Briefing jelas, foto-fotonya bagus banget! Trip menyenangkan, pasti akan repeat order lagi. Terima kasih banyak!'
             WHEN 1 THEN 'Trip menyenangkan, cuma sedikit delay di keberangkatan. Overall guide bagus, sabar menjawab pertanyaan. Recommended!'
             WHEN 2 THEN 'Pelayanan excellent! Guide sangat membantu dan sabar menghadapi penumpang. Lokasi snorkeling bagus, air jernih sekali. Recommended banget!'
             WHEN 3 THEN 'Guide oke, cuma agak kurang interaktif. Tapi overall trip bagus, makanan enak, lokasi menarik.'
             ELSE 'Best guide ever! Sangat detail menjelaskan, foto-foto mantap, sampai-sampai saya pesan trip lagi bulan depan. Keep up the good work!'
           END,
           booking_rec.trip_date + INTERVAL '1 day' + (review_counter * INTERVAL '2 hours')
          )
        ON CONFLICT DO NOTHING;
        review_counter := review_counter + 1;
      END LOOP;
    END;
  END IF;

  -- ============================================
  -- PART 8.2: WALLET TRANSACTIONS
  -- ============================================
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guide_wallet_transactions') AND wallet1_id IS NOT NULL THEN
    -- Trip payments for completed trips
    INSERT INTO guide_wallet_transactions (wallet_id, transaction_type, amount, balance_before, balance_after, description, reference_id, reference_type, status, created_at)
    SELECT wallet1_id, 'earning', tg.fee_amount,
           COALESCE((SELECT balance FROM guide_wallets WHERE id = wallet1_id), 0),
           COALESCE((SELECT balance FROM guide_wallets WHERE id = wallet1_id), 0) + tg.fee_amount,
           'Pembayaran trip ' || t.trip_code, t.id, 'trip', 'completed',
           t.trip_date + INTERVAL '1 day'
    FROM trip_guides tg
    JOIN trips t ON t.id = tg.trip_id
    WHERE tg.guide_id = guide1_id
    AND t.status = 'completed'
    AND t.trip_date <= CURRENT_DATE - INTERVAL '1 day'
    LIMIT 10
    ON CONFLICT DO NOTHING;
    
    -- Guide 5 wallet transactions
    IF wallet5_id IS NOT NULL THEN
      INSERT INTO guide_wallet_transactions (wallet_id, transaction_type, amount, balance_before, balance_after, description, reference_id, reference_type, status, created_at)
      SELECT wallet5_id, 'earning', tg.fee_amount,
             COALESCE((SELECT balance FROM guide_wallets WHERE id = wallet5_id), 0),
             COALESCE((SELECT balance FROM guide_wallets WHERE id = wallet5_id), 0) + tg.fee_amount,
             'Pembayaran trip ' || t.trip_code, t.id, 'trip', 'completed',
             t.trip_date + INTERVAL '1 day'
      FROM trip_guides tg
      JOIN trips t ON t.id = tg.trip_id
      WHERE tg.guide_id = guide5_id
      AND t.status = 'completed'
      AND t.trip_date <= CURRENT_DATE - INTERVAL '1 day'
      LIMIT 5
      ON CONFLICT DO NOTHING;
    END IF;
    
    -- Withdrawal transactions
    INSERT INTO guide_wallet_transactions (wallet_id, transaction_type, amount, balance_before, balance_after, description, reference_id, reference_type, status, created_at)
    VALUES
      (wallet1_id, 'withdraw_request', 1000000.00, 
       COALESCE((SELECT balance FROM guide_wallets WHERE id = wallet1_id), 5000000),
       COALESCE((SELECT balance FROM guide_wallets WHERE id = wallet1_id), 5000000) - 1000000,
       'Penarikan saldo ke rekening bank', gen_random_uuid(), 'withdrawal', 'approved',
       CURRENT_DATE - INTERVAL '3 days'),
      (wallet1_id, 'withdraw_request', 500000.00,
       COALESCE((SELECT balance FROM guide_wallets WHERE id = wallet1_id), 4000000),
       COALESCE((SELECT balance FROM guide_wallets WHERE id = wallet1_id), 4000000) - 500000,
       'Penarikan saldo ke rekening bank', gen_random_uuid(), 'withdrawal', 'approved',
       CURRENT_DATE - INTERVAL '10 days')
    ON CONFLICT DO NOTHING;
    
    -- Bonus transactions
    INSERT INTO guide_wallet_transactions (wallet_id, transaction_type, amount, balance_before, balance_after, description, reference_id, reference_type, status, created_at)
    VALUES
      (wallet1_id, 'adjustment', 200000.00,
       COALESCE((SELECT balance FROM guide_wallets WHERE id = wallet1_id), 4000000),
       COALESCE((SELECT balance FROM guide_wallets WHERE id = wallet1_id), 4000000) + 200000,
       'Bonus trip terbaik bulan Januari 2025', gen_random_uuid(), 'bonus', 'completed',
       CURRENT_DATE - INTERVAL '5 days')
    ON CONFLICT DO NOTHING;
  END IF;

  -- ============================================
  -- PART 8.3: PERFORMANCE METRICS
  -- ============================================
  
  -- Note: Performance metrics might be calculated or stored in a separate table
  -- This section can be extended based on actual schema

  -- ============================================
  -- PART 8.4: INSURANCE MANIFESTS
  -- ============================================
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'insurance_manifests') THEN
    INSERT INTO insurance_manifests (trip_id, branch_id, trip_date, insurance_company_id, passenger_count, manifest_data, file_url, file_format, status, sent_at, created_at)
    SELECT t.id, sample_branch_id, t.trip_date,
           (SELECT id FROM insurance_companies WHERE branch_id = sample_branch_id AND is_active = true LIMIT 1),
           COALESCE(t.total_pax, 0),
           '[]'::jsonb, -- Empty manifest_data for sample
           'https://example.com/manifests/manifest_' || t.trip_code || '.csv',
           'csv',
           'sent', t.trip_date + INTERVAL '1 day', t.trip_date + INTERVAL '1 day'
    FROM trips t
    WHERE t.status = 'completed'
    AND t.trip_date <= CURRENT_DATE - INTERVAL '1 day'
    LIMIT 5
    ON CONFLICT DO NOTHING;
  END IF;

  -- ============================================
  -- PART 8.5: CHALLENGES
  -- ============================================
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guide_challenges') THEN
    -- Active challenges for guides (using 'active' status to match API expectations)
    INSERT INTO guide_challenges (guide_id, challenge_type, title, description, target_value, current_value, target_date, reward_description, status, start_date, created_at)
    VALUES
      (guide1_id, 'trip_count', 'Complete 10 Trips', 'Selesaikan 10 trip dalam bulan ini', 10, 7, CURRENT_DATE + INTERVAL '3 days', 'Bonus Rp 500.000', 'active', CURRENT_DATE - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
      (guide1_id, 'rating', 'Maintain 4.5+ Rating', 'Pertahankan rating di atas 4.5', 4.5, 4.8, CURRENT_DATE + INTERVAL '10 days', 'Bonus Rp 300.000', 'active', CURRENT_DATE - INTERVAL '15 days', NOW() - INTERVAL '15 days'),
      (guide1_id, 'earnings', 'Earn Rp 5.000.000', 'Kumpulkan pendapatan Rp 5.000.000', 5000000, 3500000, CURRENT_DATE + INTERVAL '15 days', 'Bonus Rp 1.000.000', 'active', CURRENT_DATE - INTERVAL '20 days', NOW() - INTERVAL '20 days'),
      (guide5_id, 'trip_count', 'Complete 5 Trips', 'Selesaikan 5 trip dalam bulan ini', 5, 3, CURRENT_DATE + INTERVAL '7 days', 'Bonus Rp 250.000', 'active', CURRENT_DATE - INTERVAL '8 days', NOW() - INTERVAL '8 days'),
      (guide5_id, 'rating', 'Get First 5-Star Review', 'Dapatkan review bintang 5 pertama', 1, 0, CURRENT_DATE + INTERVAL '14 days', 'Bonus Rp 100.000', 'active', CURRENT_DATE - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
      (guide2_id, 'trip_count', 'Complete 8 Trips', 'Selesaikan 8 trip dalam bulan ini', 8, 4, CURRENT_DATE + INTERVAL '10 days', 'Bonus Rp 400.000', 'active', CURRENT_DATE - INTERVAL '12 days', NOW() - INTERVAL '12 days'),
      (guide2_id, 'rating', 'Maintain 4.0+ Rating', 'Pertahankan rating minimal 4.0', 4.0, 4.2, CURRENT_DATE + INTERVAL '20 days', 'Bonus Rp 200.000', 'active', CURRENT_DATE - INTERVAL '18 days', NOW() - INTERVAL '18 days')
    ON CONFLICT DO NOTHING;
    
    -- Completed challenges
    INSERT INTO guide_challenges (guide_id, challenge_type, title, description, target_value, current_value, target_date, reward_description, status, start_date, completed_at, created_at)
    VALUES
      (guide1_id, 'trip_count', 'Complete 20 Trips', 'Selesaikan 20 trip dalam bulan Desember', 20, 22, CURRENT_DATE - INTERVAL '5 days', 'Bonus Rp 1.000.000', 'completed', CURRENT_DATE - INTERVAL '35 days', CURRENT_DATE - INTERVAL '2 days', NOW() - INTERVAL '35 days'),
      (guide1_id, 'rating', 'Maintain 5.0 Rating', 'Pertahankan rating sempurna', 5.0, 5.0, CURRENT_DATE - INTERVAL '10 days', 'Bonus Rp 500.000', 'completed', CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE - INTERVAL '10 days', NOW() - INTERVAL '30 days'),
      (guide1_id, 'earnings', 'Earn Rp 3.000.000', 'Kumpulkan pendapatan Rp 3.000.000 di bulan Desember', 3000000, 3200000, CURRENT_DATE - INTERVAL '8 days', 'Bonus Rp 600.000', 'completed', CURRENT_DATE - INTERVAL '28 days', CURRENT_DATE - INTERVAL '8 days', NOW() - INTERVAL '28 days'),
      (guide5_id, 'trip_count', 'Complete 3 Trips', 'Selesaikan 3 trip pertama', 3, 3, CURRENT_DATE - INTERVAL '15 days', 'Bonus Rp 150.000', 'completed', CURRENT_DATE - INTERVAL '25 days', CURRENT_DATE - INTERVAL '15 days', NOW() - INTERVAL '25 days')
    ON CONFLICT DO NOTHING;
  END IF;

  -- ============================================
  -- PART 8.6: SOCIAL POSTS
  -- ============================================
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guide_social_posts') THEN
    INSERT INTO guide_social_posts (guide_id, trip_id, caption, photos, likes_count, comments_count, is_public, created_at)
    VALUES
      (guide1_id, trip7_id, 
       'Amazing trip ke Pulau Pahawang hari ini! 🌊🐠 #PahawangIsland #Snorkeling #Travel', 
       ARRAY['https://example.com/social/insta_trip7_1.jpg', 'https://example.com/social/insta_trip7_2.jpg'],
       145, 12, true, NOW() - INTERVAL '6 days'),
      (guide1_id, trip8_id,
       'Another beautiful day at sea! 😍 #SunsetCruise #Nature',
       ARRAY['https://example.com/social/insta_trip8_1.jpg'],
       89, 5, true, NOW() - INTERVAL '5 days'),
      (guide5_id, trip9_id,
       'Trip yang menyenangkan dengan customer yang ramah! Terima kasih sudah percaya dengan kami.',
       ARRAY['https://example.com/social/fb_trip9_1.jpg'],
       67, 3, true, NOW() - INTERVAL '4 days')
    ON CONFLICT DO NOTHING;
  END IF;

  -- ============================================
  -- PART 8.7: BROADCASTS
  -- ============================================
  -- Note: Broadcasts moved to Part 9 (ops_broadcasts table) untuk consistency dengan schema
  -- Section ini dihapus karena menggunakan table name yang salah

  -- ============================================
  -- PART 8.8: NOTIFICATIONS
  -- ============================================
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guide_notifications') THEN
    INSERT INTO guide_notifications (guide_id, branch_id, title, message, type, reference_id, reference_type, is_read, created_at)
    VALUES
      (guide1_id, sample_branch_id, 'Trip Assigned', 'Anda ditugaskan untuk trip TRP-20250129-001 tanggal ' || TO_CHAR(CURRENT_DATE + INTERVAL '1 day', 'DD MMM YYYY'), 
       'trip_assignment', '00000000-0000-0000-0000-000000000002', 'trip', false, NOW() - INTERVAL '1 day'),
      (guide1_id, sample_branch_id, 'Review Received', 'Anda mendapat review 5 bintang dari Andi Pratama', 
       'review', gen_random_uuid()::text, 'review', false, NOW() - INTERVAL '6 days'),
      (guide1_id, sample_branch_id, 'Payment Received', 'Pembayaran trip TRP-20250121-001 telah masuk ke wallet Anda (Rp 350.000)', 
       'payment', gen_random_uuid()::text, 'wallet_transaction', true, NOW() - INTERVAL '6 days'),
      (guide5_id, sample_branch_id, 'Challenge Update', 'Progress challenge "Complete 5 Trips": 3/5 trip', 
       'challenge', gen_random_uuid()::text, 'challenge', false, NOW() - INTERVAL '2 days'),
      (guide1_id, sample_branch_id, 'Broadcast', 'Ada pembaruan SOP Keamanan. Silakan cek di menu Learning Hub.', 
       'broadcast', gen_random_uuid()::text, 'broadcast', false, NOW() - INTERVAL '2 days')
    ON CONFLICT DO NOTHING;
  END IF;
  
  RAISE NOTICE 'Part 8 completed: Post-trip data created';
  
END $$;

COMMIT;

