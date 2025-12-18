-- Sample Users Seed Data
-- IMPORTANT: Only for development/testing environment
-- Password for all users: Test@1234

-- ============================================
-- BRANCH: Lampung (Default)
-- ============================================
INSERT INTO branches (id, code, name, address, phone, email)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'LPG',
  'Aero Travel Lampung',
  'Jl. Raden Intan No. 88, Bandar Lampung',
  '0721-123456',
  'lampung@aerotravel.co.id'
) ON CONFLICT (id) DO NOTHING;

-- ============================================
-- SAMPLE USERS (All passwords: Test@1234)
-- ============================================

-- 1. SUPER ADMIN (Owner/Direktur)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'superadmin@aerotravel.co.id',
  crypt('Test@1234', gen_salt('bf')),
  NOW(),
  '{"full_name": "Super Admin"}'::jsonb
) ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, branch_id, role, full_name, phone)
VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '11111111-1111-1111-1111-111111111111',
  'super_admin',
  'Super Admin',
  '081234567890'
) ON CONFLICT (id) DO NOTHING;

-- 2. INVESTOR (Komisaris - View Only)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
VALUES (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'investor@aerotravel.co.id',
  crypt('Test@1234', gen_salt('bf')),
  NOW(),
  '{"full_name": "Komisaris Demo"}'::jsonb
) ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, branch_id, role, full_name, phone)
VALUES (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  '11111111-1111-1111-1111-111111111111',
  'investor',
  'Komisaris Demo',
  '081234567891'
) ON CONFLICT (id) DO NOTHING;

-- 3. FINANCE MANAGER (Keuangan)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
VALUES (
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  'finance@aerotravel.co.id',
  crypt('Test@1234', gen_salt('bf')),
  NOW(),
  '{"full_name": "Finance Manager"}'::jsonb
) ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, branch_id, role, full_name, phone)
VALUES (
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  '11111111-1111-1111-1111-111111111111',
  'finance_manager',
  'Finance Manager',
  '081234567892'
) ON CONFLICT (id) DO NOTHING;

-- 4. MARKETING (Marketing & CS - Aero Engine)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
VALUES (
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  'marketing@aerotravel.co.id',
  crypt('Test@1234', gen_salt('bf')),
  NOW(),
  '{"full_name": "Marketing CS"}'::jsonb
) ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, branch_id, role, full_name, phone)
VALUES (
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  '11111111-1111-1111-1111-111111111111',
  'marketing',
  'Marketing CS',
  '081234567893'
) ON CONFLICT (id) DO NOTHING;

-- 5. OPS ADMIN (Admin Operasional - Elang Engine)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
VALUES (
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  'ops@aerotravel.co.id',
  crypt('Test@1234', gen_salt('bf')),
  NOW(),
  '{"full_name": "Ops Admin"}'::jsonb
) ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, branch_id, role, full_name, phone)
VALUES (
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  '11111111-1111-1111-1111-111111111111',
  'ops_admin',
  'Ops Admin',
  '081234567894'
) ON CONFLICT (id) DO NOTHING;

-- 6. GUIDE (Tour Guide)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
VALUES (
  'ffffffff-ffff-ffff-ffff-ffffffffffff',
  'guide@aerotravel.co.id',
  crypt('Test@1234', gen_salt('bf')),
  NOW(),
  '{"full_name": "Tour Guide Demo"}'::jsonb
) ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, branch_id, role, full_name, phone)
VALUES (
  'ffffffff-ffff-ffff-ffff-ffffffffffff',
  '11111111-1111-1111-1111-111111111111',
  'guide',
  'Tour Guide Demo',
  '081234567895'
) ON CONFLICT (id) DO NOTHING;

-- 7. MITRA/PARTNER (B2B Agent)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
VALUES (
  '77777777-7777-7777-7777-777777777777',
  'partner@aerotravel.co.id',
  crypt('Test@1234', gen_salt('bf')),
  NOW(),
  '{"full_name": "Partner Demo"}'::jsonb
) ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, branch_id, role, full_name, phone)
VALUES (
  '77777777-7777-7777-7777-777777777777',
  '11111111-1111-1111-1111-111111111111',
  'mitra',
  'Partner Demo',
  '081234567896'
) ON CONFLICT (id) DO NOTHING;

-- Create wallet for partner
INSERT INTO mitra_wallets (id, mitra_id, balance, credit_limit)
VALUES (
  '77777777-0000-0000-0000-000000000001',
  '77777777-7777-7777-7777-777777777777',
  5000000,
  10000000
) ON CONFLICT (id) DO NOTHING;

-- 8. CUSTOMER (Public B2C)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
VALUES (
  '88888888-8888-8888-8888-888888888888',
  'customer@gmail.com',
  crypt('Test@1234', gen_salt('bf')),
  NOW(),
  '{"full_name": "Customer Demo"}'::jsonb
) ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, branch_id, role, full_name, phone)
VALUES (
  '88888888-8888-8888-8888-888888888888',
  '11111111-1111-1111-1111-111111111111',
  'customer',
  'Customer Demo',
  '081234567897'
) ON CONFLICT (id) DO NOTHING;

-- 9. CORPORATE (B2B Enterprise)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
VALUES (
  '99999999-9999-9999-9999-999999999999',
  'corporate@company.com',
  crypt('Test@1234', gen_salt('bf')),
  NOW(),
  '{"full_name": "Corporate HRD"}'::jsonb
) ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, branch_id, role, full_name, phone)
VALUES (
  '99999999-9999-9999-9999-999999999999',
  '11111111-1111-1111-1111-111111111111',
  'corporate',
  'Corporate HRD',
  '081234567898'
) ON CONFLICT (id) DO NOTHING;
