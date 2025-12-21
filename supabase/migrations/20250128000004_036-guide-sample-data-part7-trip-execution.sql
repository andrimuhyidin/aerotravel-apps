-- Migration: 036-guide-sample-data-part7-trip-execution.sql
-- Description: Sample data for Part 7 - Trip Execution Data
-- Created: 2025-01-28
-- 
-- This migration creates sample data for:
-- - Attendance (check-in/out with photos)
-- - Safety checklists
-- - Equipment checklists
-- - Risk assessments
-- - Logistics handovers
-- - Manifest status updates
-- - Expenses
-- - GPS tracking
-- - Incidents
-- - SOS alerts
-- - Guest engagement
-- - Digital tips
-- - Waste logs

BEGIN;

DO $$
DECLARE
  sample_branch_id UUID;
  guide1_id UUID;
  guide2_id UUID;
  guide5_id UUID;
  admin_user_id UUID;
  
  -- Trip IDs (from Part 6)
  trip1_id UUID := '00000000-0000-0000-0000-000000000001'; -- Ongoing (today)
  trip2_id UUID := '00000000-0000-0000-0000-000000000002'; -- Tomorrow
  trip3_id UUID := '00000000-0000-0000-0000-000000000003'; -- Day after tomorrow
  trip7_id UUID := '00000000-0000-0000-0000-000000000007'; -- Completed (7 days ago)
  trip8_id UUID := '00000000-0000-0000-0000-000000000008'; -- Completed (6 days ago)
  trip9_id UUID := '00000000-0000-0000-0000-000000000009'; -- Completed (5 days ago)
  trip10_id UUID := '00000000-0000-0000-0000-00000000000a'; -- Completed (4 days ago)
  
  attendance1_id UUID;
  attendance2_id UUID;
  attendance3_id UUID;
  
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
  SELECT id INTO admin_user_id FROM users WHERE role IN ('super_admin', 'ops_admin') LIMIT 1;

  -- ============================================
  -- PART 7.1: ATTENDANCE
  -- ============================================
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guide_attendance') THEN
    -- Trip 1 (ongoing) - Check-in only
    INSERT INTO guide_attendance (guide_id, trip_id, branch_id, check_in_at, check_in_lat, check_in_lng, check_in_location, is_late, happiness_rating, description, created_at)
    VALUES
      (guide1_id, trip1_id, sample_branch_id, CURRENT_DATE + '06:55:00'::TIME, -5.450000, 105.266670, 'Dermaga Marina, Bandar Lampung', false, 5, 'Check-in tepat waktu, cuaca cerah', NOW() - INTERVAL '2 hours')
    ON CONFLICT DO NOTHING
    RETURNING id INTO attendance1_id;
    
    IF attendance1_id IS NULL THEN
      SELECT id INTO attendance1_id FROM guide_attendance WHERE guide_id = guide1_id AND trip_id = trip1_id LIMIT 1;
    END IF;
    
    INSERT INTO guide_attendance (guide_id, trip_id, branch_id, check_in_at, check_in_lat, check_in_lng, check_in_location, is_late, happiness_rating, description, created_at)
    VALUES
      (guide2_id, trip1_id, sample_branch_id, CURRENT_DATE + '06:58:00'::TIME, -5.450005, 105.266675, 'Dermaga Marina, Bandar Lampung', false, 4, 'Check-in on time', NOW() - INTERVAL '2 hours')
    ON CONFLICT DO NOTHING
    RETURNING id INTO attendance2_id;
    
    -- Trip 7 (completed) - Check-in and check-out
    INSERT INTO guide_attendance (guide_id, trip_id, branch_id, check_in_at, check_in_lat, check_in_lng, check_in_location, check_out_at, check_out_lat, check_out_lng, check_out_location, is_late, happiness_rating, description, created_at)
    VALUES
      (guide1_id, trip7_id, sample_branch_id, 
       CURRENT_DATE - INTERVAL '7 days' + '06:50:00'::TIME, -5.450000, 105.266670, 'Dermaga Marina',
       CURRENT_DATE - INTERVAL '7 days' + '17:15:00'::TIME, -5.450000, 105.266670, 'Dermaga Marina',
       false, 5, 'Trip lancar, semua penumpang senang', NOW() - INTERVAL '7 days')
    ON CONFLICT DO NOTHING
    RETURNING id INTO attendance3_id;
    
    -- Trip 9 (completed) - Late check-in
    INSERT INTO guide_attendance (guide_id, trip_id, branch_id, check_in_at, check_in_lat, check_in_lng, check_in_location, check_out_at, check_out_lat, check_out_lng, check_out_location, is_late, happiness_rating, description, created_at)
    VALUES
      (guide5_id, trip9_id, sample_branch_id,
       CURRENT_DATE - INTERVAL '5 days' + '08:10:00'::TIME, -5.450010, 105.266680, 'Dermaga Utama',
       CURRENT_DATE - INTERVAL '5 days' + '17:55:00'::TIME, -5.450010, 105.266680, 'Dermaga Utama',
       true, 4, 'Check-in telat 10 menit karena macet di jalan', NOW() - INTERVAL '5 days')
    ON CONFLICT DO NOTHING;
    
    -- Attendance Photos
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guide_attendance_photos') AND attendance1_id IS NOT NULL THEN
      INSERT INTO guide_attendance_photos (attendance_id, photo_url, photo_lat, photo_lng, captured_at, created_at)
      VALUES
        (attendance1_id, 'https://example.com/attendance/checkin_guide1_trip1.jpg', -5.450000, 105.266670, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours'),
        (attendance3_id, 'https://example.com/attendance/checkin_guide1_trip7.jpg', -5.450000, 105.266670, NOW() - INTERVAL '7 days' + INTERVAL '7 hours', NOW() - INTERVAL '7 days' + INTERVAL '7 hours'),
        (attendance3_id, 'https://example.com/attendance/checkout_guide1_trip7.jpg', -5.450000, 105.266670, NOW() - INTERVAL '7 days' + INTERVAL '17 hours', NOW() - INTERVAL '7 days' + INTERVAL '17 hours')
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  -- ============================================
  -- PART 7.2: SAFETY CHECKLISTS
  -- ============================================
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'safety_checklists') THEN
    INSERT INTO safety_checklists (guide_id, trip_id, branch_id, checked_items, completed_at, created_at)
    VALUES
      (guide1_id, trip1_id, sample_branch_id, 
       '["life_jacket_check", "first_aid_kit_check", "communication_device_check", "weather_check", "boat_condition_check"]'::jsonb,
       NOW() - INTERVAL '1 hour 30 minutes', NOW() - INTERVAL '1 hour 30 minutes'),
      (guide1_id, trip7_id, sample_branch_id,
       '["life_jacket_check", "first_aid_kit_check", "communication_device_check", "weather_check", "boat_condition_check"]'::jsonb,
       NOW() - INTERVAL '7 days' + INTERVAL '6 hours 30 minutes', NOW() - INTERVAL '7 days' + INTERVAL '6 hours 30 minutes'),
      (guide5_id, trip9_id, sample_branch_id,
       '["life_jacket_check", "first_aid_kit_check", "communication_device_check", "weather_check"]'::jsonb,
       NOW() - INTERVAL '5 days' + INTERVAL '7 hours 40 minutes', NOW() - INTERVAL '5 days' + INTERVAL '7 hours 40 minutes')
    ON CONFLICT DO NOTHING;
  END IF;

  -- ============================================
  -- PART 7.3: EQUIPMENT CHECKLISTS
  -- ============================================
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'equipment_checklists') THEN
    INSERT INTO guide_equipment_checklists (guide_id, trip_id, branch_id, equipment_items, latitude, longitude, location_captured_at, signature_data, signature_method, signature_timestamp, completed_at, created_at)
    VALUES
      (guide1_id, trip1_id, sample_branch_id,
       '[{"id": "snorkeling_gear", "name": "Alat Snorkeling", "checked": true, "quantity": 15, "condition": "good"}, {"id": "camera_underwater", "name": "Kamera Bawah Air", "checked": true, "quantity": 1, "condition": "excellent"}, {"id": "dry_bag", "name": "Tas Kering", "checked": true, "quantity": 5, "condition": "good"}]'::jsonb,
       -5.450000, 105.266670, NOW() - INTERVAL '1 hour 30 minutes',
       'data:image/png;base64,iVBORw0KGgoAAAANS', 'draw', NOW() - INTERVAL '1 hour 30 minutes',
       NOW() - INTERVAL '1 hour 30 minutes', NOW() - INTERVAL '1 hour 30 minutes'),
      (guide2_id, trip1_id, sample_branch_id,
       '[{"id": "cooler_box", "name": "Cooler Box", "checked": true, "quantity": 2, "condition": "good"}, {"id": "snorkeling_gear", "name": "Alat Snorkeling", "checked": true, "quantity": 15, "condition": "good"}]'::jsonb,
       -5.450005, 105.266675, NOW() - INTERVAL '1 hour 25 minutes',
       NULL, NULL, NULL,
       NOW() - INTERVAL '1 hour 25 minutes', NOW() - INTERVAL '1 hour 25 minutes'),
      (guide1_id, trip7_id, sample_branch_id,
       '[{"id": "snorkeling_gear", "name": "Alat Snorkeling", "checked": true, "quantity": 14, "condition": "good"}, {"id": "camera_underwater", "name": "Kamera Bawah Air", "checked": true, "quantity": 1, "condition": "good"}]'::jsonb,
       -5.450000, 105.266670, NOW() - INTERVAL '7 days' + INTERVAL '6 hours 30 minutes',
       'data:image/png;base64,iVBORw0KGgoAAAANS', 'draw', NOW() - INTERVAL '7 days' + INTERVAL '6 hours 30 minutes',
       NOW() - INTERVAL '7 days' + INTERVAL '6 hours 30 minutes', NOW() - INTERVAL '7 days' + INTERVAL '6 hours 30 minutes')
    ON CONFLICT DO NOTHING;
  END IF;

  -- ============================================
  -- PART 7.4: RISK ASSESSMENTS
  -- ============================================
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pre_trip_assessments') THEN
    INSERT INTO pre_trip_assessments (trip_id, guide_id, branch_id, wave_height, wind_speed, weather_condition, crew_ready, equipment_complete, latitude, longitude, notes, risk_score, risk_level, is_safe, created_at)
    VALUES
      (trip1_id, guide1_id, sample_branch_id, 0.5, 10, 'clear', true, true, -5.450000, 105.266670, 'Cuaca sangat baik, semua siap', 10, 'low', true, NOW() - INTERVAL '1 hour 30 minutes'),
      (trip2_id, guide1_id, sample_branch_id, 1.0, 15, 'cloudy', true, true, -5.450000, 105.266670, 'Prakiraan cuaca berawan, perlu waspada', 30, 'medium', true, NOW() - INTERVAL '20 hours'),
      (trip7_id, guide1_id, sample_branch_id, 0.3, 8, 'clear', true, true, -5.450000, 105.266670, 'Cuaca cerah, kondisi laut tenang', 5, 'low', true, NOW() - INTERVAL '7 days' + INTERVAL '6 hours 30 minutes'),
      (trip9_id, guide5_id, sample_branch_id, 2.0, 25, 'rainy', true, true, -5.450010, 105.266680, 'Cuaca buruk, trip hampir dibatalkan tapi penumpang tetap ingin berangkat', 75, 'high', false, NOW() - INTERVAL '5 days' + INTERVAL '7 hours 40 minutes')
    ON CONFLICT DO NOTHING;
  END IF;

  -- ============================================
  -- PART 7.5: LOGISTICS HANDOVERS
  -- ============================================
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'inventory_handovers') THEN
    INSERT INTO inventory_handovers (trip_id, branch_id, handover_type, from_user_id, to_user_id, items, from_signature_data, from_signature_method, from_signature_timestamp, to_signature_data, to_signature_method, to_signature_timestamp, verified_by_both, status, handover_photos, latitude, longitude, location_captured_at, notes, created_at)
    VALUES
      (trip1_id, sample_branch_id, 'outbound', admin_user_id, guide1_id,
       '[{"item_name": "Life Jacket", "quantity": 20, "unit": "piece", "condition": "good"}, {"item_name": "Cooler Box", "quantity": 2, "unit": "piece", "condition": "good"}, {"item_name": "First Aid Kit", "quantity": 1, "unit": "piece", "condition": "excellent"}]'::jsonb,
       'data:image/png;base64,sig1', 'draw', NOW() - INTERVAL '2 hours 30 minutes',
       'data:image/png;base64,sig2', 'draw', NOW() - INTERVAL '2 hours 20 minutes',
       true, 'completed',
       ARRAY['https://example.com/handover/outbound_trip1_1.jpg', 'https://example.com/handover/outbound_trip1_2.jpg'],
       -5.450000, 105.266670, NOW() - INTERVAL '2 hours 30 minutes',
       'Handover perlengkapan awal trip', NOW() - INTERVAL '2 hours 30 minutes'),
      (trip7_id, sample_branch_id, 'inbound', guide1_id, admin_user_id,
       '[{"item_name": "Life Jacket", "quantity": 20, "unit": "piece", "condition": "good"}, {"item_name": "Cooler Box", "quantity": 2, "unit": "piece", "condition": "good"}, {"item_name": "First Aid Kit", "quantity": 1, "unit": "piece", "condition": "excellent"}]'::jsonb,
       'data:image/png;base64,sig3', 'draw', NOW() - INTERVAL '7 days' + INTERVAL '17 hours 30 minutes',
       'data:image/png;base64,sig4', 'draw', NOW() - INTERVAL '7 days' + INTERVAL '17 hours 35 minutes',
       true, 'completed',
       ARRAY['https://example.com/handover/inbound_trip7_1.jpg'],
       -5.450000, 105.266670, NOW() - INTERVAL '7 days' + INTERVAL '17 hours 30 minutes',
       'Return perlengkapan setelah trip selesai', NOW() - INTERVAL '7 days' + INTERVAL '17 hours 30 minutes')
    ON CONFLICT DO NOTHING;
  END IF;

  -- ============================================
  -- PART 7.6: MANIFEST STATUS UPDATES
  -- ============================================
  
  -- Update booking_passengers boarding/return status
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'booking_passengers') THEN
    -- Note: booking_passengers table doesn't have boarding_status/return_status columns
    -- These would typically be tracked in trip_manifest or trip_passengers tables
    -- Skipping updates for now
  END IF;
  
  -- Trip Manifest Audit
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trip_manifest_audit') THEN
    DECLARE
      passenger_rec RECORD;
    BEGIN
      FOR passenger_rec IN
        SELECT bp.id as passenger_id, tb.trip_id
        FROM booking_passengers bp
        JOIN trip_bookings tb ON tb.booking_id = bp.booking_id
        WHERE tb.trip_id IN (trip1_id, trip7_id)
        LIMIT 20
      LOOP
        -- Note: boarding_status tracking depends on trip_manifest table structure
        -- Skipping for now as booking_passengers doesn't have this column
      END LOOP;
    END;
  END IF;

  -- ============================================
  -- PART 7.7: EXPENSES
  -- ============================================
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guide_expenses') THEN
    INSERT INTO guide_expenses (trip_id, guide_id, branch_id, category, description, amount, receipt_url, created_at)
    VALUES
      (trip1_id, guide1_id, sample_branch_id, 'fuel', 'BBM tambahan untuk rute panjang', 250000.00, 'https://example.com/receipts/receipt_fuel_trip1.jpg', NOW() - INTERVAL '1 hour'),
      (trip1_id, guide1_id, sample_branch_id, 'food', 'Snack untuk penumpang anak-anak', 75000.00, NULL, NOW() - INTERVAL '30 minutes'),
      (trip7_id, guide1_id, sample_branch_id, 'ticket', 'Tiket masuk tambahan 1 orang', 50000.00, 'https://example.com/receipts/receipt_ticket_trip7.jpg', NOW() - INTERVAL '7 days' + INTERVAL '12 hours'),
      (trip7_id, guide1_id, sample_branch_id, 'food', 'Makan siang untuk kru dan penumpang', 350000.00, 'https://example.com/receipts/receipt_food_trip7.jpg', NOW() - INTERVAL '7 days' + INTERVAL '13 hours'),
      (trip8_id, guide1_id, sample_branch_id, 'transport', 'Ojek ke dermaga (kendala mobil)', 50000.00, NULL, NOW() - INTERVAL '6 days' + INTERVAL '6 hours')
    ON CONFLICT DO NOTHING;
  END IF;

  -- ============================================
  -- PART 7.8: GPS TRACKING
  -- ============================================
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guide_tracking_positions') THEN
    -- Trip 1 (ongoing) - Recent tracking positions
    INSERT INTO guide_tracking_positions (trip_id, guide_id, latitude, longitude, timestamp, created_at)
    VALUES
      (trip1_id, guide1_id, -5.451000, 105.267000, NOW() - INTERVAL '1 hour 50 minutes', NOW() - INTERVAL '1 hour 50 minutes'),
      (trip1_id, guide1_id, -5.452000, 105.268000, NOW() - INTERVAL '1 hour 40 minutes', NOW() - INTERVAL '1 hour 40 minutes'),
      (trip1_id, guide1_id, -5.453000, 105.269000, NOW() - INTERVAL '1 hour 30 minutes', NOW() - INTERVAL '1 hour 30 minutes'),
      (trip1_id, guide1_id, -5.454000, 105.270000, NOW() - INTERVAL '1 hour 20 minutes', NOW() - INTERVAL '1 hour 20 minutes'),
      (trip1_id, guide1_id, -5.455000, 105.271000, NOW() - INTERVAL '1 hour 10 minutes', NOW() - INTERVAL '1 hour 10 minutes'),
      (trip1_id, guide1_id, -5.456000, 105.272000, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour')
    ON CONFLICT DO NOTHING;
    
    -- Trip 7 (completed) - Historical tracking
    INSERT INTO guide_tracking_positions (trip_id, guide_id, latitude, longitude, timestamp, created_at)
    VALUES
      (trip7_id, guide1_id, -5.451000, 105.267000, NOW() - INTERVAL '7 days' + INTERVAL '7 hours', NOW() - INTERVAL '7 days' + INTERVAL '7 hours'),
      (trip7_id, guide1_id, -5.455000, 105.271000, NOW() - INTERVAL '7 days' + INTERVAL '9 hours', NOW() - INTERVAL '7 days' + INTERVAL '9 hours'),
      (trip7_id, guide1_id, -5.460000, 105.275000, NOW() - INTERVAL '7 days' + INTERVAL '11 hours', NOW() - INTERVAL '7 days' + INTERVAL '11 hours'),
      (trip7_id, guide1_id, -5.450000, 105.266670, NOW() - INTERVAL '7 days' + INTERVAL '17 hours', NOW() - INTERVAL '7 days' + INTERVAL '17 hours')
    ON CONFLICT DO NOTHING;
  END IF;

  -- ============================================
  -- PART 7.9: INCIDENTS
  -- ============================================
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'incident_reports') THEN
    INSERT INTO incident_reports (trip_id, guide_id, branch_id, incident_type, chronology, severity, status, reported_at, photo_urls, signature_data, signature_method, signature_timestamp, notified_admin, notified_insurance, created_at)
    VALUES
      (trip9_id, guide5_id, sample_branch_id, 'medical_emergency',
       'Seorang penumpang mengalami mual dan pusing di tengah perjalanan. Diberikan P3K (obat mual) dan istirahat. Penumpang membaik setelah 30 menit. Trip dilanjutkan dengan normal.',
       'medium', 'resolved',
       NOW() - INTERVAL '5 days' + INTERVAL '12 hours',
       ARRAY['https://example.com/incidents/incident_trip9_1.jpg'],
       'data:image/png;base64,incident_sig1', 'draw',
       NOW() - INTERVAL '5 days' + INTERVAL '12 hours 10 minutes',
       true, true, NOW() - INTERVAL '5 days' + INTERVAL '12 hours')
    ON CONFLICT DO NOTHING;
  END IF;

  -- ============================================
  -- PART 7.10: SOS ALERTS
  -- ============================================
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sos_alerts') THEN
    -- No active SOS alerts in sample data (good scenario)
    -- But we can create a resolved one for historical data (only if trip exists)
    -- Check if trip9_id exists before inserting
    DECLARE
      trip_exists BOOLEAN;
    BEGIN
      SELECT EXISTS(SELECT 1 FROM trips WHERE id = trip9_id) INTO trip_exists;
      IF trip_exists THEN
        INSERT INTO sos_alerts (branch_id, guide_id, trip_id, latitude, longitude, accuracy_meters, message, status, resolved_at, resolved_by, resolution_notes, whatsapp_sent, push_sent, nearby_crew_notified, emergency_contacts_notified, created_at)
        VALUES
          (sample_branch_id, guide1_id, trip9_id, -5.455000, 105.270000, 10,
           'Bantuan diperlukan - penumpang mengalami pusing parah',
           'resolved', NOW() - INTERVAL '5 days' + INTERVAL '12 hours 30 minutes',
           admin_user_id, 'Penumpang sudah dibantu dengan P3K dan dipulangkan dengan selamat. Tidak ada cedera serius.',
           true, true, true, false,
           NOW() - INTERVAL '5 days' + INTERVAL '12 hours 20 minutes')
        ON CONFLICT DO NOTHING;
      END IF;
    END;
  END IF;

  -- ============================================
  -- PART 7.11: WASTE LOGS
  -- ============================================
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'waste_logs') THEN
    INSERT INTO waste_logs (trip_id, branch_id, waste_type, quantity, unit, disposal_method, logged_by, notes, created_at)
    VALUES
      (trip7_id, sample_branch_id, 'plastic', 5.5, 'kg', 'recycling', guide1_id, 'Sampah plastik dikumpulkan selama trip, dibawa kembali ke base untuk daur ulang', NOW() - INTERVAL '7 days' + INTERVAL '17 hours'),
      (trip7_id, sample_branch_id, 'organic', 2.0, 'kg', 'landfill', guide1_id, 'Sisa makanan dikubur di lokasi yang aman', NOW() - INTERVAL '7 days' + INTERVAL '13 hours'),
      (trip8_id, sample_branch_id, 'plastic', 8.0, 'kg', 'recycling', guide1_id, NULL, NOW() - INTERVAL '6 days' + INTERVAL '16 hours 30 minutes')
    ON CONFLICT DO NOTHING;
  END IF;

  -- ============================================
  -- PART 7.12: PASSENGER CONSENTS
  -- ============================================
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'passenger_consents') THEN
    DECLARE
      passenger_rec RECORD;
    BEGIN
      FOR passenger_rec IN
        SELECT bp.id as passenger_id, tb.trip_id
        FROM booking_passengers bp
        JOIN trip_bookings tb ON tb.booking_id = bp.booking_id
        WHERE tb.trip_id = trip1_id AND bp.passenger_type = 'adult'
        LIMIT 10
      LOOP
        INSERT INTO passenger_consents (trip_id, passenger_id, briefing_points_acknowledged, consent_status, signature_data, signature_method, signature_timestamp, created_at)
        VALUES
          (passenger_rec.trip_id, passenger_rec.passenger_id,
           '["safety_briefing", "rules_of_conduct", "emergency_procedures"]'::jsonb,
           'signed', 'data:image/png;base64,consent_sig_' || SUBSTRING(passenger_rec.passenger_id::text FROM 1 FOR 8),
           'draw', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours')
        ON CONFLICT DO NOTHING;
      END LOOP;
    END;
  END IF;
  
  RAISE NOTICE 'Part 7 completed: Trip execution data created';
  
END $$;

COMMIT;

