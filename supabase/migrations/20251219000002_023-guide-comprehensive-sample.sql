-- Migration: 023-guide-comprehensive-sample.sql
-- Description: Comprehensive sample data for all Guide App features
-- Created: 2025-12-19

BEGIN;

DO $$
DECLARE
  sample_branch_id UUID;
  sample_guide_id UUID;
  sample_admin_id UUID;
  sample_package_id UUID;
  trip1_id UUID := '00000000-0000-0000-0000-000000000001';
  trip2_id UUID := '00000000-0000-0000-0000-000000000002';
  trip3_id UUID := '00000000-0000-0000-0000-000000000003';
  trip4_id UUID := '00000000-0000-0000-0000-000000000004';
  trip5_id UUID := '00000000-0000-0000-0000-000000000005';
  booking1_id UUID := '10000000-0000-0000-0000-000000000001';
  booking2_id UUID := '10000000-0000-0000-0000-000000000002';
  booking3_id UUID := '10000000-0000-0000-0000-000000000003';
BEGIN
  -- Get first branch
  SELECT id INTO sample_branch_id FROM branches LIMIT 1;
  IF sample_branch_id IS NULL THEN
    RAISE NOTICE 'No branch found, skipping sample data';
    RETURN;
  END IF;

  -- Get guide user
  SELECT id INTO sample_guide_id FROM users WHERE role = 'guide' LIMIT 1;
  IF sample_guide_id IS NULL THEN
    RAISE NOTICE 'No guide found, skipping sample data';
    RETURN;
  END IF;

  -- Get admin user
  SELECT id INTO sample_admin_id FROM users WHERE role IN ('super_admin', 'ops_admin') LIMIT 1;

  -- Get package or create dummy
  SELECT id INTO sample_package_id FROM packages WHERE branch_id = sample_branch_id LIMIT 1;
  
  IF sample_package_id IS NULL AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'packages') THEN
    INSERT INTO packages (branch_id, code, name, slug, destination, package_type, status, duration_days, min_pax, max_pax)
    VALUES (sample_branch_id, 'PKG-DEMO-001', 'Demo Package', 'demo-package', 'Demo Destination', 'open_trip', 'published', 1, 1, 20)
    ON CONFLICT DO NOTHING
    RETURNING id INTO sample_package_id;
  END IF;

  -- ============================================
  -- TRIPS (Multiple statuses)
  -- ============================================
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trips') AND sample_package_id IS NOT NULL THEN
    INSERT INTO trips (id, branch_id, trip_code, trip_date, package_id, total_pax, status, departure_time, created_at)
    VALUES
      (trip1_id, sample_branch_id, 'AT-PHW-2401', CURRENT_DATE, sample_package_id, 12, 'on_trip', '07:00:00', NOW() - INTERVAL '2 hours'),
      (trip2_id, sample_branch_id, 'AT-KRA-2402', CURRENT_DATE + INTERVAL '1 day', sample_package_id, 18, 'scheduled', '05:30:00', NOW() - INTERVAL '1 day'),
      (trip3_id, sample_branch_id, 'AT-PHW-2399', CURRENT_DATE - INTERVAL '7 days', sample_package_id, 10, 'completed', '07:30:00', NOW() - INTERVAL '8 days'),
      (trip4_id, sample_branch_id, 'AT-PHW-2400', CURRENT_DATE - INTERVAL '3 days', sample_package_id, 15, 'completed', '08:00:00', NOW() - INTERVAL '4 days'),
      (trip5_id, sample_branch_id, 'AT-KLN-2403', CURRENT_DATE + INTERVAL '3 days', sample_package_id, 20, 'scheduled', '06:00:00', NOW() - INTERVAL '2 days')
    ON CONFLICT (id) DO UPDATE SET
      status = EXCLUDED.status,
      total_pax = EXCLUDED.total_pax;
  END IF;

  -- ============================================
  -- TRIP_GUIDES (Assignments)
  -- ============================================
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trip_guides') THEN
    INSERT INTO trip_guides (trip_id, guide_id, guide_role, fee_amount, check_in_at, check_in_lat, check_in_lng, check_in_location, check_out_at, check_out_lat, check_out_lng, is_late, created_at)
    VALUES
      (trip1_id, sample_guide_id, 'lead', 300000, NOW() - INTERVAL '2 hours', -5.450000, 105.266670, 'Dermaga Marina, Bandar Lampung', NULL, NULL, NULL, false, NOW() - INTERVAL '2 days'),
      (trip2_id, sample_guide_id, 'lead', 350000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, NOW() - INTERVAL '1 day'),
      (trip3_id, sample_guide_id, 'lead', 350000, NOW() - INTERVAL '7 days' + INTERVAL '6 hours', -5.450000, 105.266670, 'Dermaga Marina, Bandar Lampung', NOW() - INTERVAL '7 days' + INTERVAL '18 hours', -5.450000, 105.266670, false, NOW() - INTERVAL '8 days'),
      (trip4_id, sample_guide_id, 'lead', 400000, NOW() - INTERVAL '3 days' + INTERVAL '7 hours', -5.450000, 105.266670, 'Dermaga Marina, Bandar Lampung', NOW() - INTERVAL '3 days' + INTERVAL '17 hours', -5.450000, 105.266670, false, NOW() - INTERVAL '4 days'),
      (trip5_id, sample_guide_id, 'lead', 400000, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, NOW() - INTERVAL '2 days')
    ON CONFLICT (trip_id, guide_id) DO UPDATE SET
      check_in_at = EXCLUDED.check_in_at,
      check_out_at = EXCLUDED.check_out_at;
  END IF;

  -- ============================================
  -- TRIP_MANIFEST (Passengers)
  -- ============================================
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trip_manifest') THEN
    INSERT INTO trip_manifest (trip_id, full_name, phone, passenger_type, status, created_at)
    VALUES
      -- Trip 1 (ongoing)
      (trip1_id, 'Ahmad Fadli', '081234567890', 'adult', 'boarded', NOW() - INTERVAL '1 day'),
      (trip1_id, 'Siti Rahayu', '081234567891', 'adult', 'boarded', NOW() - INTERVAL '1 day'),
      (trip1_id, 'Dewi Lestari', '081234567892', 'child', 'boarded', NOW() - INTERVAL '1 day'),
      (trip1_id, 'Budi Hartono', '081234567893', 'adult', 'pending', NOW() - INTERVAL '1 day'),
      
      -- Trip 3 (completed)
      (trip3_id, 'Andi Pratama', '081234567894', 'adult', 'returned', NOW() - INTERVAL '8 days'),
      (trip3_id, 'Lina Kartika', '081234567895', 'adult', 'returned', NOW() - INTERVAL '8 days'),
      (trip3_id, 'Rudi Santoso', '081234567896', 'adult', 'returned', NOW() - INTERVAL '8 days'),
      
      -- Trip 4 (completed)
      (trip4_id, 'Maya Sari', '081234567897', 'adult', 'returned', NOW() - INTERVAL '4 days'),
      (trip4_id, 'Bambang Wijaya', '081234567898', 'adult', 'returned', NOW() - INTERVAL '4 days')
    ON CONFLICT DO NOTHING;
  END IF;

  -- ============================================
  -- BOOKINGS (for reviews)
  -- ============================================
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bookings') AND sample_package_id IS NOT NULL THEN
    INSERT INTO bookings (id, branch_id, package_id, booking_code, booking_date, trip_date, source, customer_name, customer_email, customer_phone, adult_pax, child_pax, infant_pax, price_per_adult, price_per_child, subtotal, total_amount, status, created_at)
    VALUES
      (booking1_id, sample_branch_id, sample_package_id, 'BK-001', CURRENT_DATE - INTERVAL '8 days', CURRENT_DATE - INTERVAL '7 days', 'website', 'Andi Pratama', 'andi@example.com', '081234567894', 1, 0, 0, 500000, 250000, 500000, 500000, 'completed', NOW() - INTERVAL '8 days'),
      (booking2_id, sample_branch_id, sample_package_id, 'BK-002', CURRENT_DATE - INTERVAL '8 days', CURRENT_DATE - INTERVAL '7 days', 'website', 'Lina Kartika', 'lina@example.com', '081234567895', 1, 0, 0, 450000, 225000, 450000, 450000, 'completed', NOW() - INTERVAL '8 days'),
      (booking3_id, sample_branch_id, sample_package_id, 'BK-003', CURRENT_DATE - INTERVAL '4 days', CURRENT_DATE - INTERVAL '3 days', 'website', 'Maya Sari', 'maya@example.com', '081234567897', 2, 0, 0, 300000, 150000, 600000, 600000, 'completed', NOW() - INTERVAL '4 days')
    ON CONFLICT (id) DO NOTHING;

    -- Trip bookings
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trip_bookings') THEN
      INSERT INTO trip_bookings (trip_id, booking_id, created_at)
      VALUES
        (trip3_id, booking1_id, NOW() - INTERVAL '8 days'),
        (trip3_id, booking2_id, NOW() - INTERVAL '8 days'),
        (trip4_id, booking3_id, NOW() - INTERVAL '4 days')
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  -- ============================================
  -- REVIEWS & RATINGS
  -- ============================================
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviews') THEN
    INSERT INTO reviews (booking_id, guide_rating, overall_rating, review_text, reviewer_name, created_at)
    VALUES
      (booking1_id, 5, 5, 'Guide sangat ramah dan profesional! Briefing jelas, foto-fotonya bagus banget!', 'Andi Pratama', NOW() - INTERVAL '7 days'),
      (booking2_id, 4, 4, 'Trip menyenangkan, cuma sedikit delay di keberangkatan. Overall guide bagus!', 'Lina Kartika', NOW() - INTERVAL '7 days'),
      (booking3_id, 5, 5, 'Pelayanan excellent! Guide sangat membantu dan sabar. Recommended!', 'Maya Sari', NOW() - INTERVAL '3 days')
    ON CONFLICT DO NOTHING;
  END IF;

  -- ============================================
  -- GUIDE_STATUS
  -- ============================================
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guide_status') THEN
    INSERT INTO guide_status (guide_id, current_status, updated_at)
    VALUES (sample_guide_id, 'on_trip', NOW() - INTERVAL '2 hours')
    ON CONFLICT (guide_id) DO UPDATE SET
      current_status = 'on_trip',
      updated_at = NOW() - INTERVAL '2 hours';
  END IF;

  -- ============================================
  -- BROADCASTS
  -- ============================================
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'broadcasts') THEN
    INSERT INTO broadcasts (branch_id, title, content, priority, is_active, created_by, created_at)
    VALUES
      (sample_branch_id, 'Penting: Update SOP Keamanan', 'Mohon semua guide membaca SOP keamanan terbaru di dashboard. Ada perubahan protokol untuk trip ke pulau terpencil.', 'high', true, COALESCE(sample_admin_id, sample_guide_id), NOW() - INTERVAL '2 days'),
      (sample_branch_id, 'Info: Libur Nasional', 'Tanggal 25 Desember libur nasional, tidak ada trip. Semua guide libur.', 'medium', true, COALESCE(sample_admin_id, sample_guide_id), NOW() - INTERVAL '1 day'),
      (sample_branch_id, 'Reminder: Checklist Pre-Trip', 'Jangan lupa lengkapi checklist pre-trip sebelum keberangkatan. Cek di aplikasi guide.', 'low', true, COALESCE(sample_admin_id, sample_guide_id), NOW() - INTERVAL '3 hours')
    ON CONFLICT DO NOTHING;
  END IF;

  -- ============================================
  -- ATTENDANCE (GPS Check-in/out)
  -- ============================================
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guide_attendance') THEN
    INSERT INTO guide_attendance (guide_id, trip_id, check_in_at, check_in_lat, check_in_lng, check_in_location, check_out_at, check_out_lat, check_out_lng, check_out_location, is_late, created_at)
    VALUES
      (sample_guide_id, trip1_id, NOW() - INTERVAL '2 hours', -5.450000, 105.266670, 'Dermaga Marina, Bandar Lampung', NULL, NULL, NULL, NULL, false, NOW() - INTERVAL '2 hours'),
      (sample_guide_id, trip3_id, NOW() - INTERVAL '7 days' + INTERVAL '6 hours', -5.450000, 105.266670, 'Dermaga Marina, Bandar Lampung', NOW() - INTERVAL '7 days' + INTERVAL '18 hours', -5.450000, 105.266670, 'Dermaga Marina, Bandar Lampung', false, NOW() - INTERVAL '7 days' + INTERVAL '6 hours'),
      (sample_guide_id, trip4_id, NOW() - INTERVAL '3 days' + INTERVAL '7 hours', -5.450000, 105.266670, 'Dermaga Marina, Bandar Lampung', NOW() - INTERVAL '3 days' + INTERVAL '17 hours', -5.450000, 105.266670, 'Dermaga Marina, Bandar Lampung', false, NOW() - INTERVAL '3 days' + INTERVAL '7 hours')
    ON CONFLICT DO NOTHING;
  END IF;

  -- ============================================
  -- WALLET TRANSACTIONS
  -- ============================================
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guide_wallets') THEN
    INSERT INTO guide_wallets (guide_id, balance, updated_at)
    VALUES (sample_guide_id, 1250000, NOW())
    ON CONFLICT (guide_id) DO UPDATE SET
      balance = 1250000;

    -- Wallet transactions - skip if table structure differs
    -- IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guide_wallet_transactions') THEN
    --   INSERT INTO guide_wallet_transactions ...
    -- END IF;
  END IF;

  -- ============================================
  -- EXPENSES
  -- ============================================
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guide_expenses') THEN
    INSERT INTO guide_expenses (trip_id, guide_id, category, description, amount, receipt_url, created_at)
    VALUES
      (trip1_id, sample_guide_id, 'tiket', 'Penambahan tiket masuk 2 pax walk-in', 100000, NULL, NOW() - INTERVAL '1 hour'),
      (trip3_id, sample_guide_id, 'makanan', 'Snack untuk tamu', 75000, NULL, NOW() - INTERVAL '7 days' + INTERVAL '12 hours'),
      (trip4_id, sample_guide_id, 'transport', 'Bensin tambahan', 50000, NULL, NOW() - INTERVAL '3 days' + INTERVAL '10 hours')
    ON CONFLICT DO NOTHING;
  END IF;

  -- ============================================
  -- INCIDENTS
  -- ============================================
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'incidents') THEN
    INSERT INTO incidents (trip_id, guide_id, incident_type, description, severity, status, reported_at, created_at)
    VALUES
      (trip3_id, sample_guide_id, 'delay', 'Delay keberangkatan 30 menit karena cuaca buruk', 'low', 'resolved', NOW() - INTERVAL '7 days' + INTERVAL '6 hours', NOW() - INTERVAL '7 days' + INTERVAL '6 hours')
    ON CONFLICT DO NOTHING;
  END IF;

  -- ============================================
  -- SALARY DEDUCTIONS (Penalties)
  -- ============================================
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'salary_deductions') THEN
    INSERT INTO salary_deductions (guide_id, trip_id, deduction_type, amount, reason, created_at)
    VALUES
      (sample_guide_id, trip3_id, 'late_penalty', 25000, 'late_checkin', NOW() - INTERVAL '7 days')
    ON CONFLICT DO NOTHING;
  END IF;

  RAISE NOTICE 'Comprehensive sample data inserted successfully';
END $$;

COMMIT;

