-- Migration: 035-guide-sample-data-part6-trips-bookings.sql
-- Description: Sample data for Part 6 - Trips & Bookings Data
-- Created: 2025-01-28
-- 
-- This migration creates sample data for:
-- - 15-20 trips with various statuses
-- - 20-30 bookings
-- - 200-300 passengers
-- - Trip assignments (lead/support guides)
-- - Multi-guide crew assignments

BEGIN;

DO $$
DECLARE
  sample_branch_id UUID;
  guide1_id UUID; -- Veteran Lead Guide
  guide2_id UUID; -- New Support Guide
  guide5_id UUID; -- Experienced Guide
  
  package1_id UUID;
  package2_id UUID;
  package3_id UUID;
  
  asset1_id UUID;
  
  -- Trip IDs (predefined for consistency)
  trip1_id UUID := '00000000-0000-0000-0000-000000000001';
  trip2_id UUID := '00000000-0000-0000-0000-000000000002';
  trip3_id UUID := '00000000-0000-0000-0000-000000000003';
  trip4_id UUID := '00000000-0000-0000-0000-000000000004';
  trip5_id UUID := '00000000-0000-0000-0000-000000000005';
  trip6_id UUID := '00000000-0000-0000-0000-000000000006';
  trip7_id UUID := '00000000-0000-0000-0000-000000000007';
  trip8_id UUID := '00000000-0000-0000-0000-000000000008';
  trip9_id UUID := '00000000-0000-0000-0000-000000000009';
  trip10_id UUID := '00000000-0000-0000-0000-00000000000a';
  trip11_id UUID := '00000000-0000-0000-0000-00000000000b';
  trip12_id UUID := '00000000-0000-0000-0000-00000000000c';
  trip13_id UUID := '00000000-0000-0000-0000-00000000000d';
  trip14_id UUID := '00000000-0000-0000-0000-00000000000e';
  trip15_id UUID := '00000000-0000-0000-0000-00000000000f';
  
  -- Booking IDs
  booking_counter INTEGER := 1;
  
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
  
  guide2_id := guide1_id;
  guide5_id := guide1_id;
  
  -- Get packages
  SELECT id INTO package1_id FROM packages WHERE branch_id = sample_branch_id LIMIT 1;
  IF package1_id IS NULL THEN
    RAISE NOTICE 'No packages found, skipping trip data';
    RETURN;
  END IF;
  
  SELECT id INTO package2_id FROM packages WHERE branch_id = sample_branch_id OFFSET 1 LIMIT 1;
  SELECT id INTO package3_id FROM packages WHERE branch_id = sample_branch_id OFFSET 2 LIMIT 1;
  IF package2_id IS NULL THEN package2_id := package1_id; END IF;
  IF package3_id IS NULL THEN package3_id := package1_id; END IF;
  
  -- Get asset
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'assets') THEN
    SELECT id INTO asset1_id FROM assets WHERE branch_id = sample_branch_id AND asset_type = 'boat' LIMIT 1;
    IF asset1_id IS NULL THEN
      -- Try to get any asset as fallback
      SELECT id INTO asset1_id FROM assets WHERE branch_id = sample_branch_id LIMIT 1;
    END IF;
  END IF;

  -- ============================================
  -- PART 6.2: TRIPS (15-20 trips)
  -- ============================================
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trips') THEN
    INSERT INTO trips (id, branch_id, trip_code, trip_date, package_id, primary_asset_id, total_pax, status, departure_time, actual_departure_time, return_time, actual_return_time, notes, created_by)
    VALUES
      -- Ongoing trip (today)
      (trip1_id, sample_branch_id, 'TRP-20250128-001', CURRENT_DATE, package1_id, asset1_id, 15, 'on_trip', '07:00:00', '07:05:00', '17:00:00', NULL, NULL, NULL),
      
      -- Upcoming trips (this week)
      (trip2_id, sample_branch_id, 'TRP-20250129-001', CURRENT_DATE + INTERVAL '1 day', package1_id, asset1_id, 18, 'scheduled', '07:00:00', NULL, '17:00:00', NULL, NULL, NULL),
      (trip3_id, sample_branch_id, 'TRP-20250130-001', CURRENT_DATE + INTERVAL '2 days', package2_id, asset1_id, 20, 'scheduled', '06:30:00', NULL, '16:30:00', NULL, NULL, NULL),
      (trip4_id, sample_branch_id, 'TRP-20250131-001', CURRENT_DATE + INTERVAL '3 days', package1_id, asset1_id, 12, 'scheduled', '08:00:00', NULL, '18:00:00', NULL, NULL, NULL),
      
      -- Upcoming trips (next week)
      (trip5_id, sample_branch_id, 'TRP-20250204-001', CURRENT_DATE + INTERVAL '7 days', package3_id, asset1_id, 22, 'scheduled', '06:00:00', NULL, '16:00:00', NULL, NULL, NULL),
      (trip6_id, sample_branch_id, 'TRP-20250205-001', CURRENT_DATE + INTERVAL '8 days', package1_id, asset1_id, 16, 'scheduled', '07:30:00', NULL, '17:30:00', NULL, NULL, NULL),
      
      -- Completed trips (past week)
      (trip7_id, sample_branch_id, 'TRP-20250121-001', CURRENT_DATE - INTERVAL '7 days', package1_id, asset1_id, 14, 'completed', '07:00:00', '07:02:00', '17:00:00', '17:15:00', 'Trip berjalan lancar', NULL),
      (trip8_id, sample_branch_id, 'TRP-20250122-001', CURRENT_DATE - INTERVAL '6 days', package2_id, asset1_id, 19, 'completed', '06:30:00', '06:35:00', '16:30:00', '16:45:00', NULL, NULL),
      (trip9_id, sample_branch_id, 'TRP-20250123-001', CURRENT_DATE - INTERVAL '5 days', package1_id, asset1_id, 11, 'completed', '08:00:00', '08:10:00', '18:00:00', '17:55:00', 'Sedikit delay karena cuaca', NULL),
      (trip10_id, sample_branch_id, 'TRP-20250124-001', CURRENT_DATE - INTERVAL '4 days', package3_id, asset1_id, 17, 'completed', '07:00:00', '07:00:00', '17:00:00', '17:10:00', NULL, NULL),
      
      -- Completed trips (past month)
      (trip11_id, sample_branch_id, 'TRP-20250110-001', CURRENT_DATE - INTERVAL '18 days', package1_id, asset1_id, 13, 'completed', '07:00:00', '07:05:00', '17:00:00', '17:20:00', NULL, NULL),
      (trip12_id, sample_branch_id, 'TRP-20250115-001', CURRENT_DATE - INTERVAL '13 days', package2_id, asset1_id, 21, 'completed', '06:30:00', '06:28:00', '16:30:00', '16:35:00', NULL, NULL),
      (trip13_id, sample_branch_id, 'TRP-20250117-001', CURRENT_DATE - INTERVAL '11 days', package1_id, asset1_id, 15, 'completed', '08:00:00', '08:00:00', '18:00:00', '18:05:00', NULL, NULL),
      
      -- Cancelled trip
      (trip14_id, sample_branch_id, 'TRP-20250125-001', CURRENT_DATE - INTERVAL '3 days', package1_id, asset1_id, 10, 'cancelled', '07:00:00', NULL, '17:00:00', NULL, 'Dibatalkan karena cuaca buruk', NULL),
      
      -- Scheduled (next month)
      (trip15_id, sample_branch_id, 'TRP-20250210-001', CURRENT_DATE + INTERVAL '13 days', package2_id, asset1_id, 20, 'scheduled', '07:00:00', NULL, '17:00:00', NULL, NULL, NULL)
    ON CONFLICT (id) DO UPDATE SET
      status = EXCLUDED.status,
      total_pax = EXCLUDED.total_pax;
  END IF;

  -- ============================================
  -- PART 6.3: TRIP ASSIGNMENTS
  -- ============================================
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trip_guides') THEN
    -- Insert trip guides (only using guide1_id to avoid duplicate conflicts since all guide IDs are same)
    INSERT INTO trip_guides (trip_id, guide_id, guide_role, fee_amount, assignment_status, assigned_at, confirmation_deadline, confirmed_at)
    VALUES
      -- Ongoing trip
      (trip1_id, guide1_id, 'lead', 350000, 'confirmed', NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
      
      -- Upcoming confirmed trips
      (trip2_id, guide1_id, 'lead', 400000, 'confirmed', NOW() - INTERVAL '2 days', NOW() + INTERVAL '12 hours', NOW() - INTERVAL '1 day'),
      (trip3_id, guide1_id, 'lead', 450000, 'confirmed', NOW() - INTERVAL '3 days', NOW() + INTERVAL '1 day', NOW() - INTERVAL '2 days'),
      
      -- Scheduled (pending confirmation) - deadline akan di-update di Part 9 dengan fungsi calculate_confirmation_deadline
      -- Menggunakan manual calculation H-1 jam 22:00 WIB (sementara, akan di-update di Part 9)
      (trip4_id, guide1_id, 'lead', 300000, 'pending_confirmation', NOW() - INTERVAL '1 day', 
       (CURRENT_DATE + INTERVAL '2 days' + INTERVAL '22 hours')::TIMESTAMPTZ AT TIME ZONE 'Asia/Jakarta', NULL),
      (trip5_id, guide1_id, 'lead', 420000, 'pending_confirmation', NOW() - INTERVAL '2 days', 
       (CURRENT_DATE + INTERVAL '6 days' + INTERVAL '22 hours')::TIMESTAMPTZ AT TIME ZONE 'Asia/Jakarta', NULL),
      
      -- Completed trips
      (trip7_id, guide1_id, 'lead', 350000, 'confirmed', NOW() - INTERVAL '10 days', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days'),
      (trip8_id, guide1_id, 'lead', 400000, 'confirmed', NOW() - INTERVAL '9 days', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'),
      (trip9_id, guide1_id, 'lead', 300000, 'confirmed', NOW() - INTERVAL '8 days', NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days'),
      (trip10_id, guide1_id, 'lead', 380000, 'confirmed', NOW() - INTERVAL '7 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
      (trip11_id, guide1_id, 'lead', 350000, 'confirmed', NOW() - INTERVAL '21 days', NOW() - INTERVAL '19 days', NOW() - INTERVAL '19 days'),
      (trip12_id, guide1_id, 'lead', 450000, 'confirmed', NOW() - INTERVAL '16 days', NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days'),
      (trip13_id, guide1_id, 'lead', 320000, 'confirmed', NOW() - INTERVAL '14 days', NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days'),
      
      -- Cancelled trip
      (trip14_id, guide1_id, 'lead', 300000, 'confirmed', NOW() - INTERVAL '6 days', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days')
    ON CONFLICT (trip_id, guide_id) DO UPDATE SET
      assignment_status = EXCLUDED.assignment_status,
      fee_amount = EXCLUDED.fee_amount;
  END IF;
  
  -- Trip Crews (multi-guide assignments) - Note: using trip_guides instead if trip_crews doesn't exist
  -- Skipped for now as trip_guides already handles multi-guide assignments

  -- ============================================
  -- PART 6.1: BOOKINGS & PASSENGERS
  -- ============================================
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bookings') THEN
    -- Generate bookings for trips
    -- For simplicity, creating bookings for completed and confirmed trips
    
    -- Bookings for trip7 (completed)
    INSERT INTO bookings (id, branch_id, package_id, booking_code, booking_date, trip_date, source, customer_name, customer_email, customer_phone, adult_pax, child_pax, infant_pax, price_per_adult, price_per_child, subtotal, total_amount, status, created_at)
    VALUES
      (gen_random_uuid(), sample_branch_id, package1_id, 'BK-' || LPAD(booking_counter::text, 6, '0'), CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE - INTERVAL '7 days', 'website'::booking_source, 'Ahmad Fauzi', 'ahmad@example.com', '081234567001', 2, 1, 0, 500000, 250000, 1250000, 1250000, 'completed', NOW() - INTERVAL '10 days'),
      (gen_random_uuid(), sample_branch_id, package1_id, 'BK-' || LPAD((booking_counter+1)::text, 6, '0'), CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE - INTERVAL '7 days', 'website'::booking_source, 'Siti Nurhaliza', 'siti@example.com', '081234567002', 3, 0, 0, 500000, 250000, 1500000, 1500000, 'completed', NOW() - INTERVAL '10 days'),
      (gen_random_uuid(), sample_branch_id, package1_id, 'BK-' || LPAD((booking_counter+2)::text, 6, '0'), CURRENT_DATE - INTERVAL '9 days', CURRENT_DATE - INTERVAL '7 days', 'whatsapp'::booking_source, 'Budi Santoso', 'budi@example.com', '081234567003', 1, 2, 1, 500000, 250000, 1000000, 1000000, 'completed', NOW() - INTERVAL '9 days')
    ON CONFLICT DO NOTHING;
    booking_counter := booking_counter + 3;
    
    -- Bookings for trip8 (completed)
    INSERT INTO bookings (id, branch_id, package_id, booking_code, booking_date, trip_date, source, customer_name, customer_email, customer_phone, adult_pax, child_pax, infant_pax, price_per_adult, price_per_child, subtotal, total_amount, status, created_at)
    SELECT 
      gen_random_uuid(), sample_branch_id, package2_id, 'BK-' || LPAD((booking_counter + row_number() OVER ())::text, 6, '0'), 
      CURRENT_DATE - INTERVAL '9 days', CURRENT_DATE - INTERVAL '6 days', 
      (CASE (row_number() OVER ()) % 3 WHEN 0 THEN 'website' WHEN 1 THEN 'whatsapp' ELSE 'admin' END)::booking_source,
      'Customer ' || (row_number() OVER ()), 'customer' || (row_number() OVER ()) || '@example.com', '081234567' || LPAD((100 + row_number() OVER ())::text, 3, '0'),
      2, 1, 0, 450000, 225000, 1125000, 1125000, 'completed', NOW() - INTERVAL '9 days'
    FROM generate_series(1, 5)
    ON CONFLICT DO NOTHING;
    booking_counter := booking_counter + 5;
    
    -- Bookings for trip2 (upcoming)
    INSERT INTO bookings (id, branch_id, package_id, booking_code, booking_date, trip_date, source, customer_name, customer_email, customer_phone, adult_pax, child_pax, infant_pax, price_per_adult, price_per_child, subtotal, total_amount, status, created_at)
    SELECT 
      gen_random_uuid(), sample_branch_id, package1_id, 'BK-' || LPAD((booking_counter + row_number() OVER ())::text, 6, '0'), 
      CURRENT_DATE - INTERVAL '2 days', CURRENT_DATE + INTERVAL '1 day',
      'website'::booking_source,
      'Guest ' || (row_number() OVER ()), 'guest' || (row_number() OVER ()) || '@example.com', '081234568' || LPAD((row_number() OVER ())::text, 3, '0'),
      2, 0, 0, 500000, 250000, 1000000, 1000000, 'confirmed', NOW() - INTERVAL '2 days'
    FROM generate_series(1, 6)
    ON CONFLICT DO NOTHING;
    booking_counter := booking_counter + 6;
    
    -- Link bookings to trips
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trip_bookings') THEN
      -- Link bookings to trips (simplified - using trip7, trip8, trip2)
      DECLARE
        booking_id_var UUID;
      BEGIN
        FOR booking_id_var IN 
          SELECT id FROM bookings WHERE branch_id = sample_branch_id AND trip_date = CURRENT_DATE - INTERVAL '7 days' LIMIT 10
        LOOP
          INSERT INTO trip_bookings (trip_id, booking_id, created_at)
          VALUES (trip7_id, booking_id_var, NOW() - INTERVAL '7 days')
          ON CONFLICT DO NOTHING;
        END LOOP;
        
        FOR booking_id_var IN 
          SELECT id FROM bookings WHERE branch_id = sample_branch_id AND trip_date = CURRENT_DATE - INTERVAL '6 days' LIMIT 10
        LOOP
          INSERT INTO trip_bookings (trip_id, booking_id, created_at)
          VALUES (trip8_id, booking_id_var, NOW() - INTERVAL '6 days')
          ON CONFLICT DO NOTHING;
        END LOOP;
        
        FOR booking_id_var IN 
          SELECT id FROM bookings WHERE branch_id = sample_branch_id AND trip_date = CURRENT_DATE + INTERVAL '1 day' LIMIT 15
        LOOP
          INSERT INTO trip_bookings (trip_id, booking_id, created_at)
          VALUES (trip2_id, booking_id_var, NOW() - INTERVAL '1 day')
          ON CONFLICT DO NOTHING;
        END LOOP;
      END;
    END IF;
  END IF;
  
  -- Booking Passengers (from bookings)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'booking_passengers') THEN
    -- Generate passengers for bookings
    DECLARE
      booking_rec RECORD;
      passenger_counter INTEGER;
      adult_count INTEGER;
      child_count INTEGER;
      infant_count INTEGER;
    BEGIN
      FOR booking_rec IN 
        SELECT id, adult_pax, child_pax, infant_pax, trip_date FROM bookings WHERE branch_id = sample_branch_id LIMIT 30
      LOOP
        passenger_counter := 1;
        adult_count := COALESCE(booking_rec.adult_pax, 0);
        child_count := COALESCE(booking_rec.child_pax, 0);
        infant_count := COALESCE(booking_rec.infant_pax, 0);
        
        -- Insert adult passengers
        FOR i IN 1..adult_count LOOP
          INSERT INTO booking_passengers (booking_id, full_name, phone, email, passenger_type, date_of_birth, id_type, id_number, dietary_requirements, health_conditions, emergency_name, emergency_phone)
          VALUES (
            booking_rec.id,
            'Passenger ' || passenger_counter || ' - Booking ' || SUBSTRING(booking_rec.id::text FROM 1 FOR 8),
            '081234569' || LPAD(passenger_counter::text, 3, '0'),
            'passenger' || passenger_counter || '@example.com',
            'adult',
            CURRENT_DATE - INTERVAL '1 year' * (25 + (passenger_counter % 40)),
            'ktp'::id_type,
            '3201' || LPAD((1000000 + passenger_counter)::text, 10, '0'),
            CASE WHEN passenger_counter % 5 = 0 THEN 'Vegetarian' ELSE NULL END,
            CASE WHEN passenger_counter % 7 = 0 THEN 'Alergi udang dan kacang' ELSE NULL END,
            'Emergency Contact ' || passenger_counter,
            '081234570' || LPAD(passenger_counter::text, 3, '0')
          )
          ON CONFLICT DO NOTHING;
          passenger_counter := passenger_counter + 1;
        END LOOP;
        
        -- Insert child passengers
        FOR i IN 1..child_count LOOP
          INSERT INTO booking_passengers (booking_id, full_name, phone, email, passenger_type, date_of_birth, dietary_requirements, health_conditions)
          VALUES (
            booking_rec.id,
            'Child ' || passenger_counter || ' - Booking ' || SUBSTRING(booking_rec.id::text FROM 1 FOR 8),
            NULL,
            NULL,
            'child',
            CURRENT_DATE - INTERVAL '1 year' * (5 + (passenger_counter % 12)),
            CASE WHEN passenger_counter % 3 = 0 THEN 'Tidak suka makanan pedas' ELSE NULL END,
            CASE WHEN passenger_counter % 4 = 0 THEN 'Alergi susu' ELSE NULL END
          )
          ON CONFLICT DO NOTHING;
          passenger_counter := passenger_counter + 1;
        END LOOP;
        
        -- Insert infant passengers
        FOR i IN 1..infant_count LOOP
          INSERT INTO booking_passengers (booking_id, full_name, phone, email, passenger_type, date_of_birth, dietary_requirements, health_conditions)
          VALUES (
            booking_rec.id,
            'Infant ' || passenger_counter,
            NULL,
            NULL,
            'infant',
            CURRENT_DATE - INTERVAL '1 month' * (passenger_counter % 2 + 1),
            'Perlu makanan khusus bayi',
            'Bayi, perlu perhatian khusus'
          )
          ON CONFLICT DO NOTHING;
          passenger_counter := passenger_counter + 1;
        END LOOP;
      END LOOP;
    END;
  END IF;
  
  RAISE NOTICE 'Part 6 completed: Trips & Bookings data created';
  
END $$;

COMMIT;

