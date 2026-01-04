-- Multi-Role Test Users Seed Data
-- IMPORTANT: Only for development/testing environment
-- Password for all users: Test@1234
-- 
-- This script creates users with MULTIPLE ROLES for comprehensive testing
-- of the role switching functionality

BEGIN;

-- ============================================
-- BRANCH: Lampung (Default) - Ensure exists
-- ============================================
-- Get or create branch (handle conflicts)
DO $$
DECLARE
  branch_id_var UUID;
BEGIN
  -- Try to get existing branch by code or id
  SELECT id INTO branch_id_var 
  FROM branches 
  WHERE code = 'LPG' OR id = '11111111-1111-1111-1111-111111111111'
  LIMIT 1;
  
  -- If not found, create new branch
  IF branch_id_var IS NULL THEN
    INSERT INTO branches (id, code, name, address, phone, email)
    VALUES (
      '11111111-1111-1111-1111-111111111111',
      'LPG',
      'Aero Travel Lampung',
      'Jl. Raden Intan No. 88, Bandar Lampung',
      '0721-123456',
      'lampung@aerotravel.co.id'
    )
    RETURNING id INTO branch_id_var;
  END IF;
EXCEPTION
  WHEN unique_violation THEN
    -- Branch already exists, ignore
    NULL;
END $$;

-- ============================================
-- TEST USER 1: Customer + Guide (2 roles)
-- Email: customer-guide@test.com
-- ============================================
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
VALUES (
  '10000000-0000-0000-0000-000000000001',
  'customer-guide@test.com',
  crypt('Test@1234', gen_salt('bf')),
  NOW(),
  '{"full_name": "Customer Guide"}'::jsonb
) ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, branch_id, role, full_name, phone)
VALUES (
  '10000000-0000-0000-0000-000000000001',
  '11111111-1111-1111-1111-111111111111',
  'customer', -- Default role (backward compatibility)
  'Customer Guide',
  '081111111111'
) ON CONFLICT (id) DO NOTHING;

-- Add multiple roles to user_roles table
INSERT INTO user_roles (user_id, role, status, is_primary, applied_at, approved_at)
VALUES
  ('10000000-0000-0000-0000-000000000001', 'customer', 'active', true, NOW(), NOW()),
  ('10000000-0000-0000-0000-000000000001', 'guide', 'active', false, NOW(), NOW())
ON CONFLICT (user_id, role) DO NOTHING;

-- ============================================
-- TEST USER 2: Customer + Mitra (2 roles)
-- Email: customer-mitra@test.com
-- ============================================
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
VALUES (
  '20000000-0000-0000-0000-000000000002',
  'customer-mitra@test.com',
  crypt('Test@1234', gen_salt('bf')),
  NOW(),
  '{"full_name": "Customer Mitra"}'::jsonb
) ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, branch_id, role, full_name, phone)
VALUES (
  '20000000-0000-0000-0000-000000000002',
  '11111111-1111-1111-1111-111111111111',
  'customer',
  'Customer Mitra',
  '081222222222'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO user_roles (user_id, role, status, is_primary, applied_at, approved_at)
VALUES
  ('20000000-0000-0000-0000-000000000002', 'customer', 'active', true, NOW(), NOW()),
  ('20000000-0000-0000-0000-000000000002', 'mitra', 'active', false, NOW(), NOW())
ON CONFLICT (user_id, role) DO NOTHING;

-- Create wallet for mitra
INSERT INTO mitra_wallets (id, mitra_id, balance, credit_limit)
VALUES (
  '20000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000002',
  5000000,
  10000000
) ON CONFLICT (id) DO NOTHING;

-- ============================================
-- TEST USER 3: Customer + Corporate (2 roles)
-- Email: customer-corporate@test.com
-- ============================================
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
VALUES (
  '30000000-0000-0000-0000-000000000003',
  'customer-corporate@test.com',
  crypt('Test@1234', gen_salt('bf')),
  NOW(),
  '{"full_name": "Customer Corporate"}'::jsonb
) ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, branch_id, role, full_name, phone)
VALUES (
  '30000000-0000-0000-0000-000000000003',
  '11111111-1111-1111-1111-111111111111',
  'customer',
  'Customer Corporate',
  '081333333333'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO user_roles (user_id, role, status, is_primary, applied_at, approved_at)
VALUES
  ('30000000-0000-0000-0000-000000000003', 'customer', 'active', true, NOW(), NOW()),
  ('30000000-0000-0000-0000-000000000003', 'corporate', 'active', false, NOW(), NOW())
ON CONFLICT (user_id, role) DO NOTHING;

-- ============================================
-- TEST USER 4: Guide + Mitra (2 roles)
-- Email: guide-mitra@test.com
-- ============================================
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
VALUES (
  '40000000-0000-0000-0000-000000000004',
  'guide-mitra@test.com',
  crypt('Test@1234', gen_salt('bf')),
  NOW(),
  '{"full_name": "Guide Mitra"}'::jsonb
) ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, branch_id, role, full_name, phone)
VALUES (
  '40000000-0000-0000-0000-000000000004',
  '11111111-1111-1111-1111-111111111111',
  'guide',
  'Guide Mitra',
  '081444444444'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO user_roles (user_id, role, status, is_primary, applied_at, approved_at)
VALUES
  ('40000000-0000-0000-0000-000000000004', 'guide', 'active', true, NOW(), NOW()),
  ('40000000-0000-0000-0000-000000000004', 'mitra', 'active', false, NOW(), NOW())
ON CONFLICT (user_id, role) DO NOTHING;

-- Create wallet for mitra
INSERT INTO mitra_wallets (id, mitra_id, balance, credit_limit)
VALUES (
  '40000000-0000-0000-0000-000000000001',
  '40000000-0000-0000-0000-000000000004',
  3000000,
  5000000
) ON CONFLICT (id) DO NOTHING;

-- ============================================
-- TEST USER 5: Customer + Guide + Mitra (3 roles)
-- Email: customer-guide-mitra@test.com
-- ============================================
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
VALUES (
  '50000000-0000-0000-0000-000000000005',
  'customer-guide-mitra@test.com',
  crypt('Test@1234', gen_salt('bf')),
  NOW(),
  '{"full_name": "Multi Role User"}'::jsonb
) ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, branch_id, role, full_name, phone)
VALUES (
  '50000000-0000-0000-0000-000000000005',
  '11111111-1111-1111-1111-111111111111',
  'customer',
  'Multi Role User',
  '081555555555'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO user_roles (user_id, role, status, is_primary, applied_at, approved_at)
VALUES
  ('50000000-0000-0000-0000-000000000005', 'customer', 'active', true, NOW(), NOW()),
  ('50000000-0000-0000-0000-000000000005', 'guide', 'active', false, NOW(), NOW()),
  ('50000000-0000-0000-0000-000000000005', 'mitra', 'active', false, NOW(), NOW())
ON CONFLICT (user_id, role) DO NOTHING;

-- Create wallet for mitra
INSERT INTO mitra_wallets (id, mitra_id, balance, credit_limit)
VALUES (
  '50000000-0000-0000-0000-000000000001',
  '50000000-0000-0000-0000-000000000005',
  10000000,
  20000000
) ON CONFLICT (id) DO NOTHING;

-- ============================================
-- TEST USER 6: Guide + Corporate (2 roles)
-- Email: guide-corporate@test.com
-- ============================================
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
VALUES (
  '60000000-0000-0000-0000-000000000006',
  'guide-corporate@test.com',
  crypt('Test@1234', gen_salt('bf')),
  NOW(),
  '{"full_name": "Guide Corporate"}'::jsonb
) ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, branch_id, role, full_name, phone)
VALUES (
  '60000000-0000-0000-0000-000000000006',
  '11111111-1111-1111-1111-111111111111',
  'guide',
  'Guide Corporate',
  '081666666666'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO user_roles (user_id, role, status, is_primary, applied_at, approved_at)
VALUES
  ('60000000-0000-0000-0000-000000000006', 'guide', 'active', true, NOW(), NOW()),
  ('60000000-0000-0000-0000-000000000006', 'corporate', 'active', false, NOW(), NOW())
ON CONFLICT (user_id, role) DO NOTHING;

-- ============================================
-- TEST USER 7: Mitra + Corporate (2 roles)
-- Email: mitra-corporate@test.com
-- ============================================
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
VALUES (
  '70000000-0000-0000-0000-000000000007',
  'mitra-corporate@test.com',
  crypt('Test@1234', gen_salt('bf')),
  NOW(),
  '{"full_name": "Mitra Corporate"}'::jsonb
) ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, branch_id, role, full_name, phone)
VALUES (
  '70000000-0000-0000-0000-000000000007',
  '11111111-1111-1111-1111-111111111111',
  'mitra',
  'Mitra Corporate',
  '081777777777'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO user_roles (user_id, role, status, is_primary, applied_at, approved_at)
VALUES
  ('70000000-0000-0000-0000-000000000007', 'mitra', 'active', true, NOW(), NOW()),
  ('70000000-0000-0000-0000-000000000007', 'corporate', 'active', false, NOW(), NOW())
ON CONFLICT (user_id, role) DO NOTHING;

-- Create wallet for mitra
INSERT INTO mitra_wallets (id, mitra_id, balance, credit_limit)
VALUES (
  '70000000-0000-0000-0000-000000000001',
  '70000000-0000-0000-0000-000000000007',
  7500000,
  15000000
) ON CONFLICT (id) DO NOTHING;

-- ============================================
-- TEST USER 8: Customer + Guide + Corporate (3 roles)
-- Email: customer-guide-corporate@test.com
-- ============================================
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
VALUES (
  '80000000-0000-0000-0000-000000000008',
  'customer-guide-corporate@test.com',
  crypt('Test@1234', gen_salt('bf')),
  NOW(),
  '{"full_name": "Triple Role User"}'::jsonb
) ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, branch_id, role, full_name, phone)
VALUES (
  '80000000-0000-0000-0000-000000000008',
  '11111111-1111-1111-1111-111111111111',
  'customer',
  'Triple Role User',
  '081888888888'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO user_roles (user_id, role, status, is_primary, applied_at, approved_at)
VALUES
  ('80000000-0000-0000-0000-000000000008', 'customer', 'active', true, NOW(), NOW()),
  ('80000000-0000-0000-0000-000000000008', 'guide', 'active', false, NOW(), NOW()),
  ('80000000-0000-0000-0000-000000000008', 'corporate', 'active', false, NOW(), NOW())
ON CONFLICT (user_id, role) DO NOTHING;

-- ============================================
-- UPDATE EXISTING GUIDE USER (if exists)
-- Add customer role to existing guide
-- ============================================
-- This will add customer role to the guide user that already exists
-- (assuming guide user ID from sample-users.sql: ffffffff-ffff-ffff-ffff-ffffffffffff)
INSERT INTO user_roles (user_id, role, status, is_primary, applied_at, approved_at)
SELECT 
  'ffffffff-ffff-ffff-ffff-ffffffffffff',
  'customer',
  'active',
  false,
  NOW(),
  NOW()
WHERE EXISTS (
  SELECT 1 FROM users WHERE id = 'ffffffff-ffff-ffff-ffff-ffffffffffff'
)
ON CONFLICT (user_id, role) DO NOTHING;

-- ============================================
-- UPDATE EXISTING CUSTOMER USER (if exists)
-- Add guide role to existing customer
-- ============================================
-- This will add guide role to the customer user that already exists
-- (assuming customer user ID from sample-users.sql: 88888888-8888-8888-8888-888888888888)
INSERT INTO user_roles (user_id, role, status, is_primary, applied_at, approved_at)
SELECT 
  '88888888-8888-8888-8888-888888888888',
  'guide',
  'active',
  false,
  NOW(),
  NOW()
WHERE EXISTS (
  SELECT 1 FROM users WHERE id = '88888888-8888-8888-8888-888888888888'
)
ON CONFLICT (user_id, role) DO NOTHING;

-- ============================================
-- VERIFICATION
-- ============================================
DO $$
DECLARE
  multi_role_count INTEGER;
BEGIN
  SELECT COUNT(DISTINCT user_id) INTO multi_role_count
  FROM user_roles
  WHERE status = 'active'
  GROUP BY user_id
  HAVING COUNT(*) > 1;
  
  RAISE NOTICE 'Multi-role users created: %', multi_role_count;
END $$;

COMMIT;

-- ============================================
-- TEST USERS SUMMARY
-- ============================================
-- 
-- 1. customer-guide@test.com
--    Roles: Customer (primary), Guide
--    Password: Test@1234
--
-- 2. customer-mitra@test.com
--    Roles: Customer (primary), Mitra
--    Password: Test@1234
--
-- 3. customer-corporate@test.com
--    Roles: Customer (primary), Corporate
--    Password: Test@1234
--
-- 4. guide-mitra@test.com
--    Roles: Guide (primary), Mitra
--    Password: Test@1234
--
-- 5. customer-guide-mitra@test.com
--    Roles: Customer (primary), Guide, Mitra
--    Password: Test@1234
--
-- 6. guide-corporate@test.com
--    Roles: Guide (primary), Corporate
--    Password: Test@1234
--
-- 7. mitra-corporate@test.com
--    Roles: Mitra (primary), Corporate
--    Password: Test@1234
--
-- 8. customer-guide-corporate@test.com
--    Roles: Customer (primary), Guide, Corporate
--    Password: Test@1234
--
-- ============================================
-- TESTING SCENARIOS
-- ============================================
-- 
-- 1. Test RoleSwitcher visibility:
--    - Login as any multi-role user above
--    - RoleSwitcher should appear in header
--    - Should show current active role
--
-- 2. Test role switching:
--    - Click RoleSwitcher dropdown
--    - Select different role
--    - Should redirect to appropriate dashboard
--    - Should show correct navigation/menu
--
-- 3. Test routing:
--    - Switch to Guide -> should go to /guide
--    - Switch to Mitra -> should go to /partner/dashboard
--    - Switch to Corporate -> should go to /corporate/employees
--    - Switch to Customer -> should go to / (home)
--
-- 4. Test internal role restrictions:
--    - Internal roles (super_admin, investor, etc.) should NOT see RoleSwitcher
--    - Internal roles should NOT be able to switch roles
--
-- 5. Test single role users:
--    - Users with only 1 role should NOT see RoleSwitcher
--
-- ============================================
