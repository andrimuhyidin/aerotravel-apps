-- Guide App Sample Seed Data
--
-- NOTE:
-- - Sesuaikan UUID dan kolom jika schema berbeda.
-- - Seed ini fokus ke tabel yang sudah dipakai di kode: trips, trip_guides, trip_manifest.
-- - Diasumsikan sudah ada user guide dengan id = 'guide-001' di tabel user_profiles / auth.user_mapping.
--   Jika berbeda, ganti nilai guide_id di bawah.

BEGIN;

-- =============================================
-- 1) TRIPS (minimal kolom: id, trip_code, trip_date, departure_time)
-- =============================================

INSERT INTO trips (id, trip_code, trip_date, departure_time)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'AT-PHW-2401', '2024-12-17', '07:00:00'), -- Pahawang One Day
  ('00000000-0000-0000-0000-000000000002', 'AT-KRA-2402', '2024-12-18', '05:30:00'), -- Krakatau Sunrise
  ('00000000-0000-0000-0000-000000000003', 'AT-PHW-2399', '2024-12-10', '07:30:00')  -- Pahawang Weekend
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 2) TRIP_GUIDES (assignment guide ke trip)
--    Kolom yang dipakai di kode: trip_id, guide_id
-- =============================================

INSERT INTO trip_guides (trip_id, guide_id)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'guide-001'),
  ('00000000-0000-0000-0000-000000000003', 'guide-001')
ON CONFLICT DO NOTHING;

-- =============================================
-- 3) TRIP_MANIFEST (sample manifest penumpang)
--    Dari kode dan PRD diasumsikan minimal kolom:
--    - id (PK)
--    - trip_id (FK ke trips)
--    - full_name / name
--    - passenger_type (adult/child/infant) atau setara
--    - status (pending/boarded/returned)
--    - created_at, updated_at (opsional)
-- =============================================

-- Sesuaikan nama kolom berikut dengan schema aktual Anda.
-- Contoh menggunakan: id, trip_id, full_name, passenger_type, status, created_at, updated_at

INSERT INTO trip_manifest (id, trip_id, full_name, passenger_type, status, created_at, updated_at)
VALUES
  ('11111111-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Ahmad Fadli', 'adult',  'boarded',  now(), now()),
  ('11111111-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Siti Rahayu', 'adult',  'boarded',  now(), now()),
  ('11111111-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Dewi Lestari', 'child',  'pending',  now(), now()),
  ('11111111-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Budi Hartono', 'adult',  'returned', now(), now())
ON CONFLICT (id) DO NOTHING;

COMMIT;
