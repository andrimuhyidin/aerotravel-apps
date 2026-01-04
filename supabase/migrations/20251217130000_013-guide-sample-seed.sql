-- Migration: 013-guide-sample-seed
-- Description: Seed sample trips for Guide App

BEGIN;

-- TRIPS
INSERT INTO trips (id, branch_id, trip_code, trip_date, package_id, total_pax, status, departure_time)
SELECT
  '00000000-0000-0000-0000-000000000001'::uuid,
  b.id,
  'AT-PHW-2401',
  '2024-12-17',
  p.id,
  12,
  'scheduled',
  '07:00:00'
FROM branches b
JOIN packages p ON p.code = 'PKG-PHW-001'
WHERE b.code = 'AERO-LPG'
ON CONFLICT (id) DO NOTHING;

INSERT INTO trips (id, branch_id, trip_code, trip_date, package_id, total_pax, status, departure_time)
SELECT
  '00000000-0000-0000-0000-000000000002'::uuid,
  b.id,
  'AT-KRA-2402',
  '2024-12-18',
  p.id,
  18,
  'scheduled',
  '05:30:00'
FROM branches b
JOIN packages p ON p.code = 'PKG-KLN-001'
WHERE b.code = 'AERO-LPG'
ON CONFLICT (id) DO NOTHING;

INSERT INTO trips (id, branch_id, trip_code, trip_date, package_id, total_pax, status, departure_time)
SELECT
  '00000000-0000-0000-0000-000000000003'::uuid,
  b.id,
  'AT-PHW-2399',
  '2024-12-10',
  p.id,
  10,
  'completed',
  '07:30:00'
FROM branches b
JOIN packages p ON p.code = 'PKG-PHW-001'
WHERE b.code = 'AERO-LPG'
ON CONFLICT (id) DO NOTHING;

COMMIT;
