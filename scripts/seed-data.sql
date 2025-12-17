-- Seed Data Script
-- Sesuai PRD - Initial Data Setup
-- 
-- Run this script to populate initial data for development/testing

-- ============================================
-- BRANCHES (Multi-Branch Architecture)
-- ============================================

INSERT INTO branches (id, name, code, address, phone, email, timezone, is_active)
VALUES
  ('branch-001', 'Aero Travel Jakarta', 'JKT', 'Jl. Sudirman No. 1, Jakarta', '021-12345678', 'jakarta@aerotravel.co.id', 'Asia/Jakarta', true),
  ('branch-002', 'Aero Travel Bandung', 'BDG', 'Jl. Dago No. 2, Bandung', '022-87654321', 'bandung@aerotravel.co.id', 'Asia/Jakarta', true),
  ('branch-003', 'Aero Travel Bali', 'BAL', 'Jl. Legian No. 3, Bali', '0361-11223344', 'bali@aerotravel.co.id', 'Asia/Makassar', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- CITIES (Origin Cities for SEO)
-- ============================================

INSERT INTO cities (id, name, province, code, is_active)
VALUES
  ('city-001', 'Jakarta', 'DKI Jakarta', 'JKT', true),
  ('city-002', 'Surabaya', 'Jawa Timur', 'SBY', true),
  ('city-003', 'Bandung', 'Jawa Barat', 'BDG', true),
  ('city-004', 'Medan', 'Sumatera Utara', 'MDN', true),
  ('city-005', 'Semarang', 'Jawa Tengah', 'SMG', true),
  ('city-006', 'Makassar', 'Sulawesi Selatan', 'MKS', true),
  ('city-007', 'Palembang', 'Sumatera Selatan', 'PLG', true),
  ('city-008', 'Lampung', 'Lampung', 'LPG', true),
  ('city-009', 'Yogyakarta', 'DI Yogyakarta', 'YGY', true),
  ('city-010', 'Denpasar', 'Bali', 'DPS', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- PACKAGES (Sample Travel Packages)
-- ============================================

INSERT INTO packages (id, name, slug, destination, description, branch_id, price_publish, price_nta, is_published, created_at)
VALUES
  (
    'pkg-001',
    'Paket Wisata Pahawang',
    'pahawang-murah',
    'Pulau Pahawang, Lampung',
    'Nikmati keindahan Pulau Pahawang dengan paket wisata lengkap termasuk transportasi, akomodasi, dan makan.',
    'branch-001',
    500000,
    400000,
    true,
    NOW()
  ),
  (
    'pkg-002',
    'Paket Wisata Raja Ampat',
    'raja-ampat',
    'Raja Ampat, Papua',
    'Eksplorasi keindahan bawah laut Raja Ampat dengan paket diving lengkap.',
    'branch-001',
    5000000,
    4000000,
    true,
    NOW()
  ),
  (
    'pkg-003',
    'Paket Wisata Bali',
    'bali-tour',
    'Bali',
    'Paket wisata lengkap ke berbagai destinasi populer di Bali.',
    'branch-003',
    2000000,
    1500000,
    true,
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- ROLES (User Roles)
-- ============================================

-- Roles are managed in Supabase Auth, but we can document them here:
-- - super_admin: Full access to all branches
-- - admin: Full access to own branch
-- - finance: Financial operations in own branch
-- - guide: Guide operations (offline-first)
-- - mitra: Partner/Agent access
-- - customer: Public customer

-- ============================================
-- NOTES
-- ============================================
-- 
-- 1. This is a sample seed data script
-- 2. Adjust data according to your actual schema
-- 3. Run this script in Supabase SQL Editor or via CLI
-- 4. For production, use proper migration tools
-- 
-- To run:
-- psql -h <host> -U <user> -d <database> -f scripts/seed-data.sql
-- Or via Supabase CLI: supabase db reset

