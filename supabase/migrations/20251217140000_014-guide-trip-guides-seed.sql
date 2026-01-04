-- Migration: 014-guide-trip-guides-seed
-- Description: Seed trip_guides assignments for sample Guide user

BEGIN;

-- Assign Tour Guide Demo (role = 'guide') to sample trips
-- Guide user id from current database: 093249c7-4719-4b97-894b-7cd6f2a84372

INSERT INTO trip_guides (trip_id, guide_id, guide_role, fee_amount)
VALUES
  ('00000000-0000-0000-0000-000000000001', '093249c7-4719-4b97-894b-7cd6f2a84372', 'lead', 300000),
  ('00000000-0000-0000-0000-000000000003', '093249c7-4719-4b97-894b-7cd6f2a84372', 'lead', 350000)
ON CONFLICT (trip_id, guide_id) DO NOTHING;

COMMIT;
