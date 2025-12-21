-- Migration: 038-guide-sample-data-part9-additional-features.sql
-- Description: Additional sample data for Guide App features
-- Created: 2025-01-28
-- 
-- This migration adds sample data for:
-- - Fixed confirmation deadlines (using calculate_confirmation_deadline function)
-- - Ops broadcasts (corrected table name)
-- - Guest engagement leaderboard
-- - Guide promos
-- - Trip chat messages

BEGIN;

DO $$
DECLARE
  sample_branch_id UUID;
  guide1_id UUID;
  admin_user_id UUID;
  
  -- Trip IDs
  trip1_id UUID := '00000000-0000-0000-0000-000000000001'; -- Ongoing (today)
  trip2_id UUID := '00000000-0000-0000-0000-000000000002'; -- Upcoming (tomorrow)
  trip4_id UUID := '00000000-0000-0000-0000-000000000004'; -- Upcoming (3 days)
  trip5_id UUID := '00000000-0000-0000-0000-000000000005'; -- Upcoming (7 days)
  trip7_id UUID := '00000000-0000-0000-0000-000000000007'; -- Completed
  
  passenger1_id UUID;
  passenger2_id UUID;
  passenger3_id UUID;
  
  func_exists BOOLEAN;
  
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
  
  SELECT id INTO admin_user_id FROM users WHERE role IN ('super_admin', 'ops_admin') LIMIT 1;
  IF admin_user_id IS NULL THEN
    admin_user_id := guide1_id; -- Fallback
  END IF;

  -- ============================================
  -- PART 9.1: FIX CONFIRMATION DEADLINES
  -- ============================================
  
  -- Update confirmation_deadline untuk trip yang pending_confirmation
  -- Menggunakan fungsi calculate_confirmation_deadline yang menghitung H-1 jam 22:00 WIB
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trip_guides') THEN
    -- Check if function exists
    SELECT EXISTS (
      SELECT 1 FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE p.proname = 'calculate_confirmation_deadline'
      AND n.nspname = 'public'
    ) INTO func_exists;
    
    IF func_exists THEN
      -- Update trip4 (trip_date = CURRENT_DATE + 3 days, deadline = H-1 jam 22:00 = CURRENT_DATE + 2 days 22:00)
      UPDATE trip_guides
      SET confirmation_deadline = calculate_confirmation_deadline((CURRENT_DATE + INTERVAL '3 days')::DATE)
      WHERE trip_id = trip4_id 
      AND assignment_status = 'pending_confirmation';
      
      -- Update trip5 (trip_date = CURRENT_DATE + 7 days, deadline = H-1 jam 22:00 = CURRENT_DATE + 6 days 22:00)
      UPDATE trip_guides
      SET confirmation_deadline = calculate_confirmation_deadline((CURRENT_DATE + INTERVAL '7 days')::DATE)
      WHERE trip_id = trip5_id 
      AND assignment_status = 'pending_confirmation';
    ELSE
      -- Fallback: manual calculation jika fungsi belum ada
      -- Trip4: trip_date = CURRENT_DATE + 3 days, deadline = H-1 (CURRENT_DATE + 2 days) jam 22:00 WIB
      UPDATE trip_guides
      SET confirmation_deadline = (CURRENT_DATE + INTERVAL '2 days' + INTERVAL '22 hours')::TIMESTAMPTZ AT TIME ZONE 'Asia/Jakarta'
      WHERE trip_id = trip4_id 
      AND assignment_status = 'pending_confirmation';
      
      -- Trip5: trip_date = CURRENT_DATE + 7 days, deadline = H-1 (CURRENT_DATE + 6 days) jam 22:00 WIB
      UPDATE trip_guides
      SET confirmation_deadline = (CURRENT_DATE + INTERVAL '6 days' + INTERVAL '22 hours')::TIMESTAMPTZ AT TIME ZONE 'Asia/Jakarta'
      WHERE trip_id = trip5_id 
      AND assignment_status = 'pending_confirmation';
    END IF;
  END IF;

  -- ============================================
  -- PART 9.2: OPS BROADCASTS (Corrected)
  -- ============================================
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ops_broadcasts') THEN
    INSERT INTO ops_broadcasts (branch_id, broadcast_type, title, message, is_urgent, target_guides, is_active, expires_at, created_by, created_at)
    VALUES
      (sample_branch_id, 'sop_change', 'Pembaruan SOP Keamanan', 
       'Perhatian semua guide: Ada pembaruan SOP keamanan mulai efektif 1 Februari 2025. Silakan cek di menu Learning Hub. Perubahan utama: Protokol darurat untuk trip ke pulau terpencil, penggunaan life jacket wajib untuk semua penumpang.',
       true, NULL, true, CURRENT_DATE + INTERVAL '7 days', admin_user_id, NOW() - INTERVAL '2 days'),
      (sample_branch_id, 'general_announcement', 'Bonus Trip Terbaik',
       'Selamat untuk Guide Budi Santoso yang mendapatkan bonus Trip Terbaik bulan Januari 2025! 🎉 Mari kita tingkatkan pelayanan untuk mendapatkan bonus serupa bulan depan.',
       false, NULL, true, CURRENT_DATE + INTERVAL '5 days', admin_user_id, NOW() - INTERVAL '5 days'),
      (sample_branch_id, 'dock_info', 'Maintenance Kapal',
       'Informasi: Kapal Cepat 01 akan maintenance pada 3-4 Februari 2025. Harap sesuaikan jadwal trip. Kapal akan kembali beroperasi normal pada 5 Februari 2025.',
       true, NULL, true, CURRENT_DATE + INTERVAL '3 days', admin_user_id, NOW() - INTERVAL '1 day'),
      (sample_branch_id, 'weather_info', 'Peringatan Cuaca',
       'Perhatian: Prediksi cuaca buruk pada 2-3 Februari 2025. Berpotensi hujan deras dan ombak tinggi. Guide harap waspada dan selalu cek kondisi cuaca sebelum berangkat.',
       true, NULL, true, CURRENT_DATE + INTERVAL '1 day', admin_user_id, NOW() - INTERVAL '6 hours'),
      (sample_branch_id, 'general_announcement', 'Reminder: Checklist Pre-Trip',
       'Jangan lupa lengkapi checklist pre-trip sebelum keberangkatan. Cek di aplikasi guide: Safety Checklist, Equipment Checklist, dan Risk Assessment harus diselesaikan minimal 2 jam sebelum departure.',
       false, NULL, true, NULL, admin_user_id, NOW() - INTERVAL '3 hours')
    ON CONFLICT DO NOTHING;
  END IF;

  -- ============================================
  -- PART 9.3: TRIP CHAT MESSAGES
  -- ============================================
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trip_chat_messages') THEN
    -- Chat messages untuk ongoing trip (trip1)
    INSERT INTO trip_chat_messages (trip_id, sender_id, sender_role, message_text, template_type, created_at)
    VALUES
      (trip1_id, guide1_id, 'guide', 'Ops, cuaca mulai mendung. Apakah tetap lanjut?', 'custom', NOW() - INTERVAL '2 hours'),
      (trip1_id, admin_user_id, 'ops', 'Cek kondisi terlebih dahulu. Jika hujan deras, bisa kembali ke dermaga. Tetap utamakan keselamatan penumpang.', 'custom', NOW() - INTERVAL '1 hour 50 minutes'),
      (trip1_id, guide1_id, 'guide', 'Oke, saya cek dulu. Beritahu jika perlu cancel.', 'custom', NOW() - INTERVAL '1 hour 45 minutes'),
      
      -- Chat messages untuk upcoming trip (trip2)
      (trip2_id, admin_user_id, 'ops', 'Trip besok sudah confirm 18 pax. Pastikan semua equipment ready.', 'custom', NOW() - INTERVAL '1 day'),
      (trip2_id, guide1_id, 'guide', 'Roger, semua equipment sudah dicek dan siap. Meeting point sama seperti biasa?', 'custom', NOW() - INTERVAL '23 hours'),
      (trip2_id, admin_user_id, 'ops', 'Ya, meeting point Marina Bay jam 06:30. Jangan lupa safety briefing sebelum berangkat.', 'custom', NOW() - INTERVAL '22 hours'),
      
      -- Chat messages untuk completed trip (trip7) - contoh delay
      (trip7_id, guide1_id, 'guide', 'Ops, ada delay karena cuaca buruk di pagi hari. Perkiraan delay 30 menit dari jadwal.', 'delay_guest', (CURRENT_DATE - INTERVAL '7 days')::date + INTERVAL '7 hours'),
      (trip7_id, admin_user_id, 'ops', 'Terima kasih info. Tolong informasikan ke semua penumpang dan minta maaf atas ketidaknyamanannya.', 'custom', (CURRENT_DATE - INTERVAL '7 days')::date + INTERVAL '7 hours 5 minutes'),
      (trip7_id, guide1_id, 'guide', 'Sudah diinformasikan. Semua penumpang memahami dan sabar menunggu. Sekarang kondisi cuaca sudah membaik.', 'custom', (CURRENT_DATE - INTERVAL '7 days')::date + INTERVAL '7 hours 20 minutes'),
      
      -- Chat messages - boat equipment issue
      (trip4_id, guide1_id, 'guide', 'Ops, ada masalah dengan peralatan snorkeling. Beberapa masker ada yang retak. Butuh penggantian segera.', 'boat_equipment_issue', NOW() - INTERVAL '2 days'),
      (trip4_id, admin_user_id, 'ops', 'Terima kasih laporan. Kami akan kirimkan peralatan pengganti hari ini. Pastikan semua dicek ulang sebelum trip berangkat.', 'custom', NOW() - INTERVAL '1 day 23 hours')
    ON CONFLICT DO NOTHING;
  END IF;

  -- ============================================
  -- PART 9.4: GUEST ENGAGEMENT LEADERBOARD
  -- ============================================
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guest_engagement_leaderboard') THEN
    -- Get passenger IDs from completed trips
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'booking_passengers') THEN
      SELECT id INTO passenger1_id FROM booking_passengers 
      WHERE EXISTS (
        SELECT 1 FROM bookings b 
        JOIN trip_bookings tb ON tb.booking_id = b.id 
        JOIN trips t ON t.id = tb.trip_id 
        WHERE b.id = booking_passengers.booking_id AND t.id = trip7_id
      )
      ORDER BY id LIMIT 1;
      
      SELECT id INTO passenger2_id FROM booking_passengers 
      WHERE EXISTS (
        SELECT 1 FROM bookings b 
        JOIN trip_bookings tb ON tb.booking_id = b.id 
        JOIN trips t ON t.id = tb.trip_id 
        WHERE b.id = booking_passengers.booking_id AND t.id = trip7_id
      )
      ORDER BY id OFFSET 1 LIMIT 1;
      
      SELECT id INTO passenger3_id FROM booking_passengers 
      WHERE EXISTS (
        SELECT 1 FROM bookings b 
        JOIN trip_bookings tb ON tb.booking_id = b.id 
        JOIN trips t ON t.id = tb.trip_id 
        WHERE b.id = booking_passengers.booking_id AND t.id = trip7_id
      )
      ORDER BY id OFFSET 2 LIMIT 1;
      
      -- Leaderboard untuk trip7 (completed)
      IF passenger1_id IS NOT NULL AND passenger2_id IS NOT NULL AND passenger3_id IS NOT NULL THEN
        INSERT INTO guest_engagement_leaderboard (trip_id, passenger_id, branch_id, total_points, quiz_points, photo_challenge_points, game_points, rank, updated_at)
        VALUES
          (trip7_id, passenger1_id, sample_branch_id, 450, 150, 200, 100, 1, (CURRENT_DATE - INTERVAL '7 days')::date + INTERVAL '16 hours'),
          (trip7_id, passenger2_id, sample_branch_id, 380, 120, 180, 80, 2, (CURRENT_DATE - INTERVAL '7 days')::date + INTERVAL '16 hours'),
          (trip7_id, passenger3_id, sample_branch_id, 320, 100, 150, 70, 3, (CURRENT_DATE - INTERVAL '7 days')::date + INTERVAL '16 hours')
        ON CONFLICT (trip_id, passenger_id) DO UPDATE SET
          total_points = EXCLUDED.total_points,
          quiz_points = EXCLUDED.quiz_points,
          photo_challenge_points = EXCLUDED.photo_challenge_points,
          game_points = EXCLUDED.game_points,
          rank = EXCLUDED.rank;
      END IF;
    END IF;
  END IF;

  -- ============================================
  -- PART 9.5: GUIDE PROMOS
  -- ============================================
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guide_promos') THEN
    INSERT INTO guide_promos (branch_id, type, title, subtitle, description, link, badge, gradient, priority, start_date, end_date, is_active, created_at)
    VALUES
      (sample_branch_id, 'update', 'Trip Insights Baru!', 'Lihat Performa Anda', 
       'Dashboard insights baru sudah tersedia! Cek statistik trip, rating, dan earnings Anda sekarang.',
       '/guide/insights', 'NEW', 'from-blue-500 to-purple-600', 'high', CURRENT_DATE - INTERVAL '3 days', CURRENT_DATE + INTERVAL '7 days', true, NOW() - INTERVAL '3 days'),
      
      (sample_branch_id, 'promo', 'Challenge Bulan Ini', 'Complete 10 Trips', 
       'Selesaikan 10 trip bulan ini dan dapatkan bonus Rp 500.000! Ayo tingkatkan performa Anda.',
       '/guide/challenges', 'HOT', 'from-orange-500 to-red-600', 'high', CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE + INTERVAL '20 days', true, NOW() - INTERVAL '10 days'),
      
      (NULL, 'update', 'Update Aplikasi v2.1', 'Fitur Baru Tersedia', 
       'Aplikasi Guide App versi 2.1 sudah tersedia dengan fitur baru: Real-time GPS tracking, Auto-sync offline data, dan Enhanced trip chat.',
       '/guide/settings', 'INFO', 'from-green-500 to-teal-600', 'medium', CURRENT_DATE - INTERVAL '5 days', NULL, true, NOW() - INTERVAL '5 days'),
      
      (sample_branch_id, 'promo', 'Bonus Trip Terbaik', 'Dapatkan Bonus Ekstra', 
       'Guide dengan rating tertinggi bulan ini akan mendapatkan bonus ekstra Rp 1.000.000! Pertahankan kualitas pelayanan Anda.',
       '/guide/leaderboard', 'PROMO', 'from-yellow-500 to-orange-600', 'medium', CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE + INTERVAL '15 days', true, NOW() - INTERVAL '15 days'),
      
      (sample_branch_id, 'announcement', 'Training Wajib', 'SOP Keamanan Update', 
       'Jangan lupa ikuti training SOP Keamanan terbaru di Learning Hub. Training wajib untuk semua guide aktif.',
       '/guide/training', NULL, 'from-indigo-500 to-blue-600', 'low', CURRENT_DATE - INTERVAL '2 days', CURRENT_DATE + INTERVAL '10 days', true, NOW() - INTERVAL '2 days')
    ON CONFLICT DO NOTHING;
  END IF;

  RAISE NOTICE 'Part 9 completed: Additional features data created';
  
END $$;

COMMIT;

