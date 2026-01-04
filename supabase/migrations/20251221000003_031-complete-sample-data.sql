-- Migration: 031-complete-sample-data.sql
-- Description: Complete sample data for Guide App - Itinerary JSONB, Ops Broadcasts, Reviews
-- Created: 2025-12-21
-- Fixes: Missing itinerary JSONB data, ops_broadcasts data

BEGIN;

DO $$
DECLARE
  sample_branch_id UUID;
  sample_guide_id UUID;
  sample_admin_id UUID;
  sample_package_id UUID;
  pahawang_package_id UUID;
  kiluan_package_id UUID;
  trip1_id UUID := '00000000-0000-0000-0000-000000000001';
  trip2_id UUID := '00000000-0000-0000-0000-000000000002';
  trip3_id UUID := '00000000-0000-0000-0000-000000000003';
  trip4_id UUID := '00000000-0000-0000-0000-000000000004';
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

  -- ============================================
  -- UPDATE PACKAGES WITH ITINERARY JSONB
  -- ============================================
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'packages') THEN
    -- Get existing packages
    SELECT id INTO pahawang_package_id FROM packages 
    WHERE (name ILIKE '%pahawang%' OR slug ILIKE '%pahawang%') 
    AND branch_id = sample_branch_id 
    LIMIT 1;
    
    SELECT id INTO kiluan_package_id FROM packages 
    WHERE (name ILIKE '%kiluan%' OR slug ILIKE '%kiluan%') 
    AND branch_id = sample_branch_id 
    LIMIT 1;
    
    SELECT id INTO sample_package_id FROM packages 
    WHERE branch_id = sample_branch_id 
    LIMIT 1;

    -- Update Pahawang package with itinerary JSONB (2D1N)
    IF pahawang_package_id IS NOT NULL THEN
      UPDATE packages
      SET itinerary = '[
        {
          "day": 1,
          "dayNumber": 1,
          "title": "Berangkat & Snorkeling",
          "activities": [
            {"time": "07:00", "label": "Berkumpul di meeting point Bandar Lampung"},
            {"time": "08:00", "label": "Berangkat menuju Dermaga Ketapang"},
            {"time": "10:00", "label": "Menyeberang ke Pulau Pahawang"},
            {"time": "11:00", "label": "Check-in homestay/tenda"},
            {"time": "12:00", "label": "Makan siang"},
            {"time": "14:00", "label": "Snorkeling spot 1 & 2"},
            {"time": "17:00", "label": "Free time & sunset"},
            {"time": "19:00", "label": "Makan malam & api unggun"}
          ]
        },
        {
          "day": 2,
          "dayNumber": 2,
          "title": "Island Hopping & Pulang",
          "activities": [
            {"time": "07:00", "label": "Sarapan"},
            {"time": "08:00", "label": "Island hopping ke Pulau Kelagian"},
            {"time": "10:00", "label": "Snorkeling spot 3"},
            {"time": "12:00", "label": "Makan siang di pulau"},
            {"time": "14:00", "label": "Kembali ke dermaga"},
            {"time": "16:00", "label": "Perjalanan pulang ke Bandar Lampung"},
            {"time": "18:00", "label": "Sampai di meeting point"}
          ]
        }
      ]'::jsonb
      WHERE id = pahawang_package_id;
      
      RAISE NOTICE 'Updated Pahawang package with itinerary JSONB';
    END IF;

    -- Update Kiluan package with itinerary JSONB (2D1N)
    IF kiluan_package_id IS NOT NULL THEN
      UPDATE packages
      SET itinerary = '[
        {
          "day": 1,
          "dayNumber": 1,
          "title": "Keberangkatan & Dolphin Watching",
          "activities": [
            {"time": "05:30", "label": "Berkumpul di meeting point"},
            {"time": "06:00", "label": "Berangkat ke Teluk Kiluan"},
            {"time": "08:00", "label": "Tiba di dermaga Kiluan"},
            {"time": "08:30", "label": "Dolphin watching di laut lepas"},
            {"time": "10:00", "label": "Snorkeling di spot terumbu karang"},
            {"time": "12:00", "label": "Makan siang di pulau"},
            {"time": "14:00", "label": "Beach time & foto-foto"},
            {"time": "16:00", "label": "Kembali ke dermaga"},
            {"time": "18:00", "label": "Check-in penginapan"},
            {"time": "19:00", "label": "Makan malam"}
          ]
        },
        {
          "day": 2,
          "dayNumber": 2,
          "title": "Pulang",
          "activities": [
            {"time": "07:00", "label": "Sarapan"},
            {"time": "08:00", "label": "Check-out penginapan"},
            {"time": "09:00", "label": "Perjalanan pulang"},
            {"time": "11:00", "label": "Sampai di meeting point"}
          ]
        }
      ]'::jsonb
      WHERE id = kiluan_package_id;
      
      RAISE NOTICE 'Updated Kiluan package with itinerary JSONB';
    END IF;

    -- Update any other package with basic itinerary
    IF sample_package_id IS NOT NULL AND sample_package_id != COALESCE(pahawang_package_id, '00000000-0000-0000-0000-000000000000'::uuid) AND sample_package_id != COALESCE(kiluan_package_id, '00000000-0000-0000-0000-000000000000'::uuid) THEN
      UPDATE packages
      SET itinerary = '[
        {
          "day": 1,
          "dayNumber": 1,
          "title": "Day 1",
          "activities": [
            {"time": "07:00", "label": "Meeting point"},
            {"time": "08:00", "label": "Keberangkatan"},
            {"time": "12:00", "label": "Makan siang"},
            {"time": "14:00", "label": "Aktivitas utama"},
            {"time": "18:00", "label": "Makan malam"}
          ]
        }
      ]'::jsonb
      WHERE id = sample_package_id
      AND (itinerary IS NULL OR itinerary = 'null'::jsonb);
      
      RAISE NOTICE 'Updated sample package with basic itinerary JSONB';
    END IF;
  END IF;

  -- ============================================
  -- OPS BROADCASTS (Correct table name)
  -- ============================================
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ops_broadcasts') THEN
    INSERT INTO ops_broadcasts (
      branch_id,
      broadcast_type,
      title,
      message,
      target_guides,
      is_active,
      is_urgent,
      scheduled_at,
      expires_at,
      created_by,
      created_at
    )
    VALUES
      (
        sample_branch_id,
        'sop_change',
        'Penting: Update SOP Keamanan',
        'Mohon semua guide membaca SOP keamanan terbaru di dashboard. Ada perubahan protokol untuk trip ke pulau terpencil. Pastikan semua peserta menggunakan life jacket saat di kapal.',
        NULL, -- All guides
        true,
        true,
        NULL,
        NOW() + INTERVAL '7 days',
        COALESCE(sample_admin_id, sample_guide_id),
        NOW() - INTERVAL '2 days'
      ),
      (
        sample_branch_id,
        'general_announcement',
        'Info: Libur Nasional',
        'Tanggal 25 Desember libur nasional, tidak ada trip. Semua guide libur. Mohon update status availability di aplikasi.',
        NULL,
        true,
        false,
        NULL,
        NOW() + INTERVAL '5 days',
        COALESCE(sample_admin_id, sample_guide_id),
        NOW() - INTERVAL '1 day'
      ),
      (
        sample_branch_id,
        'weather_info',
        'Peringatan Cuaca: Hujan Deras',
        'Prakiraan cuaca untuk hari ini menunjukkan kemungkinan hujan deras di sore hari. Mohon semua guide yang sedang on trip untuk waspada dan siapkan rencana alternatif jika diperlukan.',
        NULL,
        true,
        true,
        NULL,
        NOW() + INTERVAL '1 day',
        COALESCE(sample_admin_id, sample_guide_id),
        NOW() - INTERVAL '3 hours'
      ),
      (
        sample_branch_id,
        'general_announcement',
        'Reminder: Checklist Pre-Trip',
        'Jangan lupa lengkapi checklist pre-trip sebelum keberangkatan. Cek di aplikasi guide. Pastikan semua equipment sudah ready dan manifest sudah dicek.',
        NULL,
        true,
        false,
        NULL,
        NULL,
        COALESCE(sample_admin_id, sample_guide_id),
        NOW() - INTERVAL '3 hours'
      ),
      (
        sample_branch_id,
        'dock_info',
        'Info Dermaga: Perubahan Lokasi',
        'Mulai besok, meeting point untuk trip Pahawang dipindahkan ke Dermaga Marina (lokasi baru). Koordinat: -5.450000, 105.266670. Mohon informasikan ke semua peserta.',
        NULL,
        true,
        false,
        NULL,
        NOW() + INTERVAL '3 days',
        COALESCE(sample_admin_id, sample_guide_id),
        NOW() - INTERVAL '6 hours'
      )
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Inserted ops_broadcasts sample data';
  END IF;

  -- ============================================
  -- ADDITIONAL REVIEWS (if needed)
  -- ============================================
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviews') THEN
    -- Get existing bookings for trips
    SELECT booking_id INTO booking1_id FROM trip_bookings 
    WHERE trip_id = trip3_id 
    LIMIT 1;
    
    SELECT booking_id INTO booking2_id FROM trip_bookings 
    WHERE trip_id = trip3_id 
    AND booking_id != COALESCE(booking1_id, '00000000-0000-0000-0000-000000000000'::uuid)
    LIMIT 1;
    
    SELECT booking_id INTO booking3_id FROM trip_bookings 
    WHERE trip_id = trip4_id 
    LIMIT 1;

    -- Add more reviews if bookings exist
    IF booking1_id IS NOT NULL THEN
      INSERT INTO reviews (booking_id, guide_rating, overall_rating, review_text, reviewer_name, is_published, created_at)
      VALUES
        (
          booking1_id,
          5,
          5,
          'Guide sangat ramah dan profesional! Briefing jelas, foto-fotonya bagus banget! Recommended untuk trip berikutnya.',
          'Andi Pratama',
          true,
          NOW() - INTERVAL '7 days'
        )
      ON CONFLICT DO NOTHING;
    END IF;

    IF booking2_id IS NOT NULL THEN
      INSERT INTO reviews (booking_id, guide_rating, overall_rating, review_text, reviewer_name, is_published, created_at)
      VALUES
        (
          booking2_id,
          4,
          4,
          'Trip menyenangkan, cuma sedikit delay di keberangkatan. Overall guide bagus dan sabar menghadapi peserta yang banyak bertanya.',
          'Lina Kartika',
          true,
          NOW() - INTERVAL '7 days'
        )
      ON CONFLICT DO NOTHING;
    END IF;

    IF booking3_id IS NOT NULL THEN
      INSERT INTO reviews (booking_id, guide_rating, overall_rating, review_text, reviewer_name, is_published, created_at)
      VALUES
        (
          booking3_id,
          5,
          5,
          'Pelayanan excellent! Guide sangat membantu dan sabar. Spot snorkeling yang dipilih bagus sekali. Recommended!',
          'Maya Sari',
          true,
          NOW() - INTERVAL '3 days'
        )
      ON CONFLICT DO NOTHING;
    END IF;
    
    RAISE NOTICE 'Updated reviews sample data';
  END IF;

  RAISE NOTICE 'Complete sample data inserted successfully';
END $$;

COMMIT;
