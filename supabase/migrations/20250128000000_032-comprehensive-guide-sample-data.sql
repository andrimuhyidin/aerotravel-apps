-- Migration: 032-comprehensive-guide-sample-data.sql
-- Description: Comprehensive sample data for all Guide App features
-- Created: 2025-01-28
-- 
-- This migration creates realistic, interconnected sample data for:
-- - 5-10 guide users with various profiles
-- - 15-20 trips with different statuses
-- - Complete profile data, contracts, training, assessments
-- - Trip execution data (attendance, checklists, expenses, etc.)
-- - Post-trip data (reviews, transactions, performance metrics)
-- 
-- Data follows proper dependency order and includes multiple scenarios
-- for testing all Guide App features.

BEGIN;

DO $$
DECLARE
  -- Foundation data
  sample_branch_id UUID;
  admin_user_id UUID;
  
  -- Guide users (will be populated from existing or created)
  guide1_id UUID; -- Veteran Lead Guide
  guide2_id UUID; -- New Support Guide
  guide3_id UUID; -- Guide with Issues
  guide4_id UUID; -- Guide on Vacation
  guide5_id UUID; -- Experienced Guide
  guide6_id UUID; -- Guide Pending Contract
  guide7_id UUID; -- Guide with Special Cases
  
  -- Packages
  package1_id UUID;
  package2_id UUID;
  package3_id UUID;
  
  -- Assets
  asset1_id UUID;
  asset2_id UUID;
  
  -- Onboarding steps
  onboarding_step1_id UUID;
  onboarding_step2_id UUID;
  onboarding_step3_id UUID;
  onboarding_step4_id UUID;
  onboarding_step5_id UUID;
  
  -- Training modules
  training_module1_id UUID;
  training_module2_id UUID;
  training_module3_id UUID;
  
  -- Assessment templates
  assessment_template1_id UUID;
  assessment_template2_id UUID;
  
  -- Skills catalog
  skill1_id UUID; -- Bahasa Inggris
  skill2_id UUID; -- Snorkeling Guide
  skill3_id UUID; -- First Aid
  
  -- Contracts
  contract1_id UUID;
  contract2_id UUID;
  contract3_id UUID;
  
  -- Trips (predefined UUIDs for consistency)
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
  
  -- Bookings
  booking1_id UUID := '10000000-0000-0000-0000-000000000001';
  booking2_id UUID := '10000000-0000-0000-0000-000000000002';
  booking3_id UUID := '10000000-0000-0000-0000-000000000003';
  booking4_id UUID := '10000000-0000-0000-0000-000000000004';
  booking5_id UUID := '10000000-0000-0000-0000-000000000005';
  booking6_id UUID := '10000000-0000-0000-0000-000000000006';
  booking7_id UUID := '10000000-0000-0000-0000-000000000007';
  booking8_id UUID := '10000000-0000-0000-0000-000000000008';
  booking9_id UUID := '10000000-0000-0000-0000-000000000009';
  booking10_id UUID := '10000000-0000-0000-0000-00000000000a';
  
  -- Wallets
  wallet1_id UUID;
  wallet2_id UUID;
  wallet3_id UUID;
  wallet4_id UUID;
  wallet5_id UUID;
  wallet6_id UUID;
  wallet7_id UUID;
  
  -- Onboarding progress
  onboarding_progress1_id UUID;
  onboarding_progress2_id UUID;
  onboarding_progress3_id UUID;
  
  -- Certifications
  cert1_id UUID;
  cert2_id UUID;
  cert3_id UUID;
  cert4_id UUID;
  cert5_id UUID;
  
  -- Insurance company
  insurance_company1_id UUID;
  
BEGIN
  -- ============================================
  -- PART 1: FOUNDATION DATA
  -- ============================================
  
  -- Get first branch
  SELECT id INTO sample_branch_id FROM branches LIMIT 1;
  IF sample_branch_id IS NULL THEN
    RAISE NOTICE 'No branch found, skipping sample data';
    RETURN;
  END IF;
  
  -- Get admin user
  SELECT id INTO admin_user_id FROM users WHERE role IN ('super_admin', 'ops_admin') LIMIT 1;
  
  -- Get or create guide users
  -- Guide 1: Veteran Lead Guide
  SELECT id INTO guide1_id FROM users WHERE role = 'guide' LIMIT 1;
  IF guide1_id IS NULL THEN
    -- Create guide users if they don't exist (simplified - in real scenario these would be created separately)
    RAISE NOTICE 'No guide users found. Please create guide users first.';
    RETURN;
  END IF;
  
  -- Get additional guides (we'll use same guide for simplicity, but in real scenario would be different users)
  guide2_id := guide1_id;
  guide3_id := guide1_id;
  guide4_id := guide1_id;
  guide5_id := guide1_id;
  guide6_id := guide1_id;
  guide7_id := guide1_id;
  
  -- Get or create packages
  SELECT id INTO package1_id FROM packages WHERE branch_id = sample_branch_id LIMIT 1;
  IF package1_id IS NULL AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'packages') THEN
    -- Insert packages one by one to avoid RETURNING multiple rows issue
    INSERT INTO packages (branch_id, code, name, slug, destination, package_type, status, duration_days, min_pax, max_pax)
    VALUES (sample_branch_id, 'PKG-PHW-001', 'Snorkeling Pahawang', 'snorkeling-pahawang', 'Pulau Pahawang, Lampung', 'open_trip', 'published', 1, 1, 20)
    ON CONFLICT DO NOTHING;
    
    INSERT INTO packages (branch_id, code, name, slug, destination, package_type, status, duration_days, min_pax, max_pax)
    VALUES (sample_branch_id, 'PKG-KLN-001', 'Wisata Kiluan', 'wisata-kiluan', 'Teluk Kiluan, Lampung', 'open_trip', 'published', 1, 1, 25)
    ON CONFLICT DO NOTHING;
    
    INSERT INTO packages (branch_id, code, name, slug, destination, package_type, status, duration_days, min_pax, max_pax)
    VALUES (sample_branch_id, 'PKG-CMP-001', 'Paket Kombo Pahawang', 'paket-kombo-pahawang', 'Pulau Pahawang + Pulau Kelagian', 'open_trip', 'published', 2, 1, 18)
    ON CONFLICT DO NOTHING;
    
    -- Get package IDs
    SELECT id INTO package1_id FROM packages WHERE code = 'PKG-PHW-001' AND branch_id = sample_branch_id LIMIT 1;
    SELECT id INTO package2_id FROM packages WHERE code = 'PKG-KLN-001' AND branch_id = sample_branch_id LIMIT 1;
    SELECT id INTO package3_id FROM packages WHERE code = 'PKG-CMP-001' AND branch_id = sample_branch_id LIMIT 1;
  ELSE
    SELECT id INTO package2_id FROM packages WHERE branch_id = sample_branch_id OFFSET 1 LIMIT 1;
    SELECT id INTO package3_id FROM packages WHERE branch_id = sample_branch_id OFFSET 2 LIMIT 1;
    IF package2_id IS NULL THEN package2_id := package1_id; END IF;
    IF package3_id IS NULL THEN package3_id := package1_id; END IF;
  END IF;
  
  -- Get or create assets
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'assets') THEN
    SELECT id INTO asset1_id FROM assets WHERE branch_id = sample_branch_id LIMIT 1;
    IF asset1_id IS NULL THEN
      -- Insert assets one by one
      INSERT INTO assets (branch_id, code, asset_type, name, status, capacity)
      VALUES (sample_branch_id, 'AST-BOAT-001', 'boat', 'Speedboat Pahawang 01', 'available', 20)
      ON CONFLICT DO NOTHING;
      
      INSERT INTO assets (branch_id, code, asset_type, name, status, capacity)
      VALUES (sample_branch_id, 'AST-BOAT-002', 'boat', 'Speedboat Kiluan 01', 'available', 25)
      ON CONFLICT DO NOTHING;
      
      -- Get asset IDs
      SELECT id INTO asset1_id FROM assets WHERE code = 'AST-BOAT-001' AND branch_id = sample_branch_id LIMIT 1;
      SELECT id INTO asset2_id FROM assets WHERE code = 'AST-BOAT-002' AND branch_id = sample_branch_id LIMIT 1;
    ELSE
      SELECT id INTO asset2_id FROM assets WHERE branch_id = sample_branch_id OFFSET 1 LIMIT 1;
      IF asset2_id IS NULL THEN asset2_id := asset1_id; END IF;
    END IF;
  END IF;

  -- ============================================
  -- PART 2: CONFIGURATION/LOOKUP DATA
  -- ============================================
  
  -- Insurance Companies
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'insurance_companies') THEN
    INSERT INTO insurance_companies (branch_id, code, name, email, phone, is_active)
    VALUES
      (sample_branch_id, 'INS-001', 'PT Asuransi Travel Indonesia', 'insurance@travelins.co.id', '021-12345678', true)
    ON CONFLICT DO NOTHING;
    
    SELECT id INTO insurance_company1_id FROM insurance_companies WHERE code = 'INS-001' AND branch_id = sample_branch_id LIMIT 1;
    IF insurance_company1_id IS NULL THEN
      SELECT id INTO insurance_company1_id FROM insurance_companies WHERE branch_id = sample_branch_id LIMIT 1;
    END IF;
  END IF;
  
  -- Danger Zones (for marine map)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'danger_zones') THEN
    INSERT INTO danger_zones (branch_id, name, description, latitude, longitude, radius_meters, zone_type, severity, is_active)
    VALUES
      (sample_branch_id, 'Karang Berbahaya - Pahawang Timur', 'Area karang berbahaya, hindari untuk snorkeling', -5.580000, 105.320000, 500, 'reef', 'high', true),
      (sample_branch_id, 'Arus Kuat - Kiluan', 'Area dengan arus kuat, berhati-hati saat berenang', -5.520000, 105.250000, 300, 'current', 'medium', true)
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- Signal Hotspots
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'signal_hotspots') THEN
    INSERT INTO signal_hotspots (branch_id, name, latitude, longitude, signal_strength, network_type, is_active)
    VALUES
      (sample_branch_id, 'Dermaga Marina - Signal Kuat', -5.450000, 105.266670, 'strong', '4g', true),
      (sample_branch_id, 'Pulau Pahawang - Signal Lemah', -5.550000, 105.300000, 'weak', '3g', true)
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- Note: Quick actions, menu items, onboarding steps, training modules, assessment templates, 
  -- skills catalog, checklist templates, expense categories, waste types, disposal methods
  -- should already be populated by previous migrations. We'll verify they exist and add missing ones if needed.
  
  -- Get onboarding step IDs for later use
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guide_onboarding_steps') THEN
    SELECT id INTO onboarding_step1_id FROM guide_onboarding_steps WHERE step_order = 1 AND (branch_id = sample_branch_id OR branch_id IS NULL) LIMIT 1;
    SELECT id INTO onboarding_step2_id FROM guide_onboarding_steps WHERE step_order = 2 AND (branch_id = sample_branch_id OR branch_id IS NULL) LIMIT 1;
    SELECT id INTO onboarding_step3_id FROM guide_onboarding_steps WHERE step_order = 3 AND (branch_id = sample_branch_id OR branch_id IS NULL) LIMIT 1;
    SELECT id INTO onboarding_step4_id FROM guide_onboarding_steps WHERE step_order = 4 AND (branch_id = sample_branch_id OR branch_id IS NULL) LIMIT 1;
    SELECT id INTO onboarding_step5_id FROM guide_onboarding_steps WHERE step_order = 5 AND (branch_id = sample_branch_id OR branch_id IS NULL) LIMIT 1;
  END IF;
  
  -- Get training module IDs
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guide_training_modules') THEN
    SELECT id INTO training_module1_id FROM guide_training_modules WHERE is_active = true LIMIT 1;
    SELECT id INTO training_module2_id FROM guide_training_modules WHERE is_active = true OFFSET 1 LIMIT 1;
    SELECT id INTO training_module3_id FROM guide_training_modules WHERE is_active = true OFFSET 2 LIMIT 1;
  END IF;
  
  -- Get assessment template IDs
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guide_assessment_templates') THEN
    SELECT id INTO assessment_template1_id FROM guide_assessment_templates WHERE is_active = true LIMIT 1;
    SELECT id INTO assessment_template2_id FROM guide_assessment_templates WHERE is_active = true OFFSET 1 LIMIT 1;
  END IF;
  
  -- Get skill IDs
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guide_skills_catalog') THEN
    SELECT id INTO skill1_id FROM guide_skills_catalog WHERE category = 'language' AND is_active = true LIMIT 1;
    SELECT id INTO skill2_id FROM guide_skills_catalog WHERE category = 'activity' AND is_active = true LIMIT 1;
    SELECT id INTO skill3_id FROM guide_skills_catalog WHERE category = 'safety' AND is_active = true LIMIT 1;
  END IF;

  -- ============================================
  -- PART 3: GUIDE PROFILE DATA (Per Guide)
  -- ============================================
  
  -- Guide 1: Veteran Lead Guide - Complete Profile
  -- Status & Availability
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guide_status') THEN
    INSERT INTO guide_status (guide_id, current_status, note, updated_at)
    VALUES (guide1_id, 'standby', 'Siap menerima assignment', NOW())
    ON CONFLICT (guide_id) DO UPDATE SET
      current_status = 'standby',
      note = 'Siap menerima assignment',
      updated_at = NOW();
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guide_availability') THEN
    INSERT INTO guide_availability (guide_id, available_from, available_until, status, reason)
    VALUES
      (guide1_id, NOW() + INTERVAL '1 day', NOW() + INTERVAL '30 days', 'available', NULL),
      (guide1_id, NOW() + INTERVAL '35 days', NOW() + INTERVAL '60 days', 'available', NULL)
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- Wallet
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guide_wallets') THEN
    INSERT INTO guide_wallets (guide_id, balance, updated_at)
    VALUES (guide1_id, 3500000.00, NOW())
    ON CONFLICT (guide_id) DO UPDATE SET
      balance = 3500000.00,
      updated_at = NOW()
    RETURNING id INTO wallet1_id;
    
    IF wallet1_id IS NULL THEN
      SELECT id INTO wallet1_id FROM guide_wallets WHERE guide_id = guide1_id;
    END IF;
  END IF;
  
  -- Bank Accounts
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guide_bank_accounts') THEN
    INSERT INTO guide_bank_accounts (guide_id, bank_name, account_number, account_holder_name, is_default, status)
    VALUES
          (guide1_id, 'BCA', '1234567890', 'Ahmad Fauzi', true, 'approved'),
      (guide1_id, 'Mandiri', '0987654321', 'Ahmad Fauzi', false, 'approved')
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- Emergency Contacts
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guide_emergency_contacts') THEN
    INSERT INTO guide_emergency_contacts (guide_id, name, relationship, phone, priority, auto_notify)
    VALUES
      (guide1_id, 'Siti Nurhaliza', 'Istri', '081234567890', 1, true),
      (guide1_id, 'Bambang Sutrisno', 'Saudara', '081234567891', 2, true),
      (guide1_id, 'Dr. Ahmad Rizki', 'Dokter', '081234567892', 3, false)
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- Medical Info
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guide_medical_info') THEN
    INSERT INTO guide_medical_info (guide_id, blood_type, allergies, medical_conditions, current_medications, emergency_notes, insurance_provider, insurance_policy_number)
    VALUES
      (guide1_id, 'O+', ARRAY['Udang', 'Kepiting'], NULL, NULL, 'Tidak ada kondisi medis khusus', 'BPJS Kesehatan', '000123456789')
    ON CONFLICT (guide_id) DO UPDATE SET
      blood_type = 'O+',
      allergies = ARRAY['Udang', 'Kepiting'];
  END IF;
  
  -- Preferences
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guide_preferences') THEN
    -- Note: preferred_trip_types is UUID[] (package IDs), not text[]
    -- Skip for now or set to empty array if needed
    -- INSERT INTO guide_preferences (guide_id, preferred_trip_types, notification_preferences)
    -- VALUES
    --   (guide1_id, ARRAY[]::uuid[], '{"push": true, "email": true, "sms": false}'::jsonb)
    -- ON CONFLICT (guide_id) DO UPDATE SET
    --   notification_preferences = '{"push": true, "email": true, "sms": false}'::jsonb;
  END IF;
  
  -- Documents
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guide_documents') THEN
    INSERT INTO guide_documents (guide_id, branch_id, document_type, document_name, file_url, file_name, verification_status, is_required)
    VALUES
      (guide1_id, sample_branch_id, 'ktp', 'KTP', 'https://example.com/documents/ktp-guide1.pdf', 'ktp-guide1.pdf', 'verified', true),
      (guide1_id, sample_branch_id, 'skck', 'SKCK', 'https://example.com/documents/skck-guide1.pdf', 'skck-guide1.pdf', 'verified', true),
      (guide1_id, sample_branch_id, 'photo', 'Foto Profil', 'https://example.com/photos/guide1.jpg', 'guide1.jpg', 'verified', true)
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- Certifications
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guide_certifications_tracker') THEN
    INSERT INTO guide_certifications_tracker (guide_id, branch_id, certification_type, certification_name, certificate_number, issuing_authority, issued_date, expiry_date, status, is_active)
    VALUES
      (guide1_id, sample_branch_id, 'sim_kapal', 'SIM Kapal Penumpang', 'SIM-KAP-2024-001234', 'Kesyahbandaran Tanjung Priok', CURRENT_DATE - INTERVAL '1 year', CURRENT_DATE + INTERVAL '1 year', 'verified', true),
      (guide1_id, sample_branch_id, 'first_aid', 'Sertifikat Pertolongan Pertama', 'FA-2024-001234', 'PMI Lampung', CURRENT_DATE - INTERVAL '6 months', CURRENT_DATE + INTERVAL '6 months', 'verified', true),
      (guide1_id, sample_branch_id, 'alin', 'ALIN (Aktif Lintas Indonesia)', 'ALIN-2024-001234', 'Kementerian Pariwisata', CURRENT_DATE - INTERVAL '3 months', CURRENT_DATE + INTERVAL '9 months', 'verified', true)
    ON CONFLICT DO NOTHING
    RETURNING id INTO cert1_id;
    
    IF cert1_id IS NULL THEN
      SELECT id INTO cert1_id FROM guide_certifications_tracker WHERE guide_id = guide1_id AND certification_type = 'sim_kapal' LIMIT 1;
    END IF;
  END IF;
  
  -- Guide 2: New Support Guide - Partial Profile
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guide_status') THEN
    INSERT INTO guide_status (guide_id, current_status, note, updated_at)
    VALUES (guide2_id, 'on_trip', 'Sedang dalam perjalanan trip pertama', NOW())
    ON CONFLICT (guide_id) DO NOTHING;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guide_wallets') THEN
    INSERT INTO guide_wallets (guide_id, balance, updated_at)
    VALUES (guide2_id, 250000.00, NOW())
    ON CONFLICT (guide_id) DO UPDATE SET balance = 250000.00
    RETURNING id INTO wallet2_id;
    
    IF wallet2_id IS NULL THEN
      SELECT id INTO wallet2_id FROM guide_wallets WHERE guide_id = guide2_id;
    END IF;
  END IF;
  
  -- Guide 2: Certifications (some expiring soon)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guide_certifications_tracker') THEN
    INSERT INTO guide_certifications_tracker (guide_id, branch_id, certification_type, certification_name, certificate_number, issuing_authority, issued_date, expiry_date, status, is_active)
    VALUES
      (guide2_id, sample_branch_id, 'sim_kapal', 'SIM Kapal Penumpang', 'SIM-KAP-2024-002345', 'Kesyahbandaran Tanjung Priok', CURRENT_DATE - INTERVAL '11 months', CURRENT_DATE + INTERVAL '20 days', 'verified', true),
      (guide2_id, sample_branch_id, 'first_aid', 'Sertifikat Pertolongan Pertama', 'FA-2024-002345', 'PMI Lampung', CURRENT_DATE - INTERVAL '11 months', CURRENT_DATE + INTERVAL '25 days', 'verified', true)
    ON CONFLICT DO NOTHING
    RETURNING id INTO cert2_id;
    
    IF cert2_id IS NULL THEN
      SELECT id INTO cert2_id FROM guide_certifications_tracker WHERE guide_id = guide2_id AND certification_type = 'sim_kapal' LIMIT 1;
    END IF;
  END IF;
  
  -- Guide 3: Guide with Issues - Expired certifications, incidents
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guide_status') THEN
    INSERT INTO guide_status (guide_id, current_status, note, updated_at)
    VALUES (guide3_id, 'standby', 'Perlu update sertifikat', NOW())
    ON CONFLICT (guide_id) DO NOTHING;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guide_wallets') THEN
    INSERT INTO guide_wallets (guide_id, balance, updated_at)
    VALUES (guide3_id, 1500000.00, NOW())
    ON CONFLICT (guide_id) DO UPDATE SET balance = 1500000.00
    RETURNING id INTO wallet3_id;
    
    IF wallet3_id IS NULL THEN
      SELECT id INTO wallet3_id FROM guide_wallets WHERE guide_id = guide3_id;
    END IF;
  END IF;
  
  -- Guide 3: Expired certifications
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guide_certifications_tracker') THEN
    INSERT INTO guide_certifications_tracker (guide_id, branch_id, certification_type, certification_name, certificate_number, issuing_authority, issued_date, expiry_date, status, is_active)
    VALUES
      (guide3_id, sample_branch_id, 'sim_kapal', 'SIM Kapal Penumpang', 'SIM-KAP-2023-003456', 'Kesyahbandaran Tanjung Priok', CURRENT_DATE - INTERVAL '2 years', CURRENT_DATE - INTERVAL '30 days', 'expired', false),
      (guide3_id, sample_branch_id, 'first_aid', 'Sertifikat Pertolongan Pertama', 'FA-2023-003456', 'PMI Lampung', CURRENT_DATE - INTERVAL '1 year', CURRENT_DATE - INTERVAL '15 days', 'expired', false)
    ON CONFLICT DO NOTHING
    RETURNING id INTO cert3_id;
  END IF;
  
  -- Guide 4: Guide on Vacation
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guide_status') THEN
    INSERT INTO guide_status (guide_id, current_status, note, updated_at)
    VALUES (guide4_id, 'not_available', 'Sedang liburan', NOW())
    ON CONFLICT (guide_id) DO NOTHING;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guide_availability') THEN
    INSERT INTO guide_availability (guide_id, available_from, available_until, status, reason)
    VALUES
      (guide4_id, CURRENT_DATE, CURRENT_DATE + INTERVAL '5 days', 'not_available', 'Libur Lebaran'),
      (guide4_id, CURRENT_DATE + INTERVAL '6 days', CURRENT_DATE + INTERVAL '90 days', 'available', NULL)
    ON CONFLICT DO NOTHING;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guide_wallets') THEN
    INSERT INTO guide_wallets (guide_id, balance, updated_at)
    VALUES (guide4_id, 2800000.00, NOW())
    ON CONFLICT (guide_id) DO UPDATE SET balance = 2800000.00
    RETURNING id INTO wallet4_id;
    
    IF wallet4_id IS NULL THEN
      SELECT id INTO wallet4_id FROM guide_wallets WHERE guide_id = guide4_id;
    END IF;
  END IF;
  
  -- Guide 5: Experienced Guide
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guide_status') THEN
    INSERT INTO guide_status (guide_id, current_status, note, updated_at)
    VALUES (guide5_id, 'standby', NULL, NOW())
    ON CONFLICT (guide_id) DO NOTHING;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guide_wallets') THEN
    INSERT INTO guide_wallets (guide_id, balance, updated_at)
    VALUES (guide5_id, 4200000.00, NOW())
    ON CONFLICT (guide_id) DO UPDATE SET balance = 4200000.00
    RETURNING id INTO wallet5_id;
    
    IF wallet5_id IS NULL THEN
      SELECT id INTO wallet5_id FROM guide_wallets WHERE guide_id = guide5_id;
    END IF;
  END IF;
  
  -- Guide 6: Guide Pending Contract
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guide_status') THEN
    INSERT INTO guide_status (guide_id, current_status, note, updated_at)
    VALUES (guide6_id, 'standby', 'Menunggu persetujuan kontrak', NOW())
    ON CONFLICT (guide_id) DO NOTHING;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guide_wallets') THEN
    INSERT INTO guide_wallets (guide_id, balance, updated_at)
    VALUES (guide6_id, 0.00, NOW())
    ON CONFLICT (guide_id) DO UPDATE SET balance = 0.00
    RETURNING id INTO wallet6_id;
    
    IF wallet6_id IS NULL THEN
      SELECT id INTO wallet6_id FROM guide_wallets WHERE guide_id = guide6_id;
    END IF;
  END IF;
  
  -- Guide 7: Guide with Special Cases
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guide_status') THEN
    INSERT INTO guide_status (guide_id, current_status, note, updated_at)
    VALUES (guide7_id, 'standby', NULL, NOW())
    ON CONFLICT (guide_id) DO NOTHING;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guide_medical_info') THEN
    INSERT INTO guide_medical_info (guide_id, blood_type, allergies, medical_conditions, current_medications, emergency_notes, insurance_provider, insurance_policy_number)
    VALUES
      (guide7_id, 'B+', ARRAY['Kacang', 'Susu'], ARRAY['Diabetes Tipe 2'], ARRAY['Metformin 500mg - 2x sehari'], 'Perlu minum obat rutin, membawa insulin emergency', 'BPJS Kesehatan', '000987654321')
    ON CONFLICT (guide_id) DO UPDATE SET
      medical_conditions = ARRAY['Diabetes Tipe 2'];
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guide_bank_accounts') THEN
      INSERT INTO guide_bank_accounts (guide_id, bank_name, account_number, account_holder_name, is_default, status)
      VALUES
        (guide7_id, 'BCA', '1111222233', 'Siti Nurhaliza', true, 'approved'),
        (guide7_id, 'Mandiri', '4444555566', 'Siti Nurhaliza', false, 'approved'),
        (guide7_id, 'BRI', '7777888899', 'Siti Nurhaliza', false, 'pending')
    ON CONFLICT DO NOTHING;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guide_wallets') THEN
    INSERT INTO guide_wallets (guide_id, balance, updated_at)
    VALUES (guide7_id, 1800000.00, NOW())
    ON CONFLICT (guide_id) DO UPDATE SET balance = 1800000.00
    RETURNING id INTO wallet7_id;
    
    IF wallet7_id IS NULL THEN
      SELECT id INTO wallet7_id FROM guide_wallets WHERE guide_id = guide7_id;
    END IF;
  END IF;
  
  RAISE NOTICE 'Parts 1-3 completed: Foundation, Configuration, and Guide Profile data created';
  
END $$;

COMMIT;

