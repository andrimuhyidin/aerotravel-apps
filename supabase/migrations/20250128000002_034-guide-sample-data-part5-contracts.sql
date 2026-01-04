-- Migration: 034-guide-sample-data-part5-contracts.sql
-- Description: Sample data for Part 5 - Contracts Data
-- Created: 2025-01-28
-- 
-- This migration creates sample data for:
-- - Contracts with various statuses
-- - Contract trips assignments
-- - Contract payments
-- - Contract sanctions
-- - Resignation requests

BEGIN;

DO $$
DECLARE
  sample_branch_id UUID;
  admin_user_id UUID;
  guide1_id UUID; -- Veteran Lead Guide
  guide2_id UUID; -- New Support Guide
  guide3_id UUID; -- Guide with Issues
  guide5_id UUID; -- Experienced Guide
  guide6_id UUID; -- Guide Pending Contract
  
  contract1_id UUID;
  contract2_id UUID;
  contract3_id UUID;
  contract4_id UUID;
  contract5_id UUID;
  contract6_id UUID;
  
BEGIN
  -- Get branch and guides
  SELECT id INTO sample_branch_id FROM branches LIMIT 1;
  IF sample_branch_id IS NULL THEN
    RAISE NOTICE 'No branch found, skipping sample data';
    RETURN;
  END IF;
  
  SELECT id INTO admin_user_id FROM users WHERE role IN ('super_admin', 'ops_admin') LIMIT 1;
  SELECT id INTO guide1_id FROM users WHERE role = 'guide' LIMIT 1;
  IF guide1_id IS NULL THEN
    RAISE NOTICE 'No guide users found, skipping sample data';
    RETURN;
  END IF;
  
  guide2_id := guide1_id;
  guide3_id := guide1_id;
  guide5_id := guide1_id;
  guide6_id := guide1_id;

  -- ============================================
  -- PART 5: CONTRACTS DATA
  -- ============================================
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guide_contracts') THEN
    -- Guide 1: Active contract (annual)
    INSERT INTO guide_contracts (id, guide_id, branch_id, contract_number, contract_type, title, description, start_date, end_date, fee_amount, fee_type, payment_terms, status, guide_signed_at, company_signed_at, signed_pdf_url, created_by)
    VALUES
      (gen_random_uuid(), guide1_id, sample_branch_id, 'CT-20250101-001', 'annual', 'Kontrak Tahunan 2025', 'Kontrak kerja tahunan untuk guide profesional', 
       CURRENT_DATE - INTERVAL '1 month', CURRENT_DATE + INTERVAL '11 months', NULL, 'per_trip', 
       'Dibayar setelah trip selesai', 'active', 
       NOW() - INTERVAL '1 month' + INTERVAL '2 days', NOW() - INTERVAL '1 month' + INTERVAL '3 days',
       'https://example.com/contracts/ct-20250101-001-signed.pdf', admin_user_id)
    ON CONFLICT DO NOTHING
    RETURNING id INTO contract1_id;
    
    IF contract1_id IS NULL THEN
      SELECT id INTO contract1_id FROM guide_contracts WHERE guide_id = guide1_id AND status = 'active' LIMIT 1;
    END IF;
    
    -- Guide 5: Active contract
    INSERT INTO guide_contracts (guide_id, branch_id, contract_number, contract_type, title, start_date, end_date, fee_amount, fee_type, status, guide_signed_at, company_signed_at, created_by)
    VALUES
      (guide5_id, sample_branch_id, 'CT-20250101-002', 'annual', 'Kontrak Tahunan 2025', 
       CURRENT_DATE - INTERVAL '2 months', CURRENT_DATE + INTERVAL '10 months', NULL, 'per_trip',
       'active', NOW() - INTERVAL '2 months' + INTERVAL '2 days', NOW() - INTERVAL '2 months' + INTERVAL '3 days', admin_user_id)
    ON CONFLICT DO NOTHING
    RETURNING id INTO contract2_id;
    
    -- Guide 2: Active contract (new guide)
    INSERT INTO guide_contracts (guide_id, branch_id, contract_number, contract_type, title, start_date, end_date, fee_amount, fee_type, status, guide_signed_at, company_signed_at, created_by)
    VALUES
      (guide2_id, sample_branch_id, 'CT-20250115-001', 'annual', 'Kontrak Tahunan 2025', 
       CURRENT_DATE - INTERVAL '2 weeks', CURRENT_DATE + INTERVAL '50 weeks', NULL, 'per_trip',
       'active', NOW() - INTERVAL '2 weeks' + INTERVAL '1 day', NOW() - INTERVAL '2 weeks' + INTERVAL '2 days', admin_user_id)
    ON CONFLICT DO NOTHING
    RETURNING id INTO contract3_id;
    
    -- Guide 6: Pending signature (guide needs to sign)
    INSERT INTO guide_contracts (guide_id, branch_id, contract_number, contract_type, title, start_date, end_date, fee_amount, fee_type, status, created_by)
    VALUES
      (guide6_id, sample_branch_id, 'CT-20250120-001', 'annual', 'Kontrak Tahunan 2025', 
       CURRENT_DATE + INTERVAL '1 week', CURRENT_DATE + INTERVAL '1 year 1 week', NULL, 'per_trip',
       'pending_signature', admin_user_id)
    ON CONFLICT DO NOTHING
    RETURNING id INTO contract4_id;
    
    -- Guide 3: Expired contract
    INSERT INTO guide_contracts (guide_id, branch_id, contract_number, contract_type, title, start_date, end_date, fee_amount, fee_type, status, guide_signed_at, company_signed_at, created_by)
    VALUES
      (guide3_id, sample_branch_id, 'CT-20240101-001', 'annual', 'Kontrak Tahunan 2024', 
       CURRENT_DATE - INTERVAL '13 months', CURRENT_DATE - INTERVAL '1 month', NULL, 'per_trip',
       'expired', NOW() - INTERVAL '13 months' + INTERVAL '2 days', NOW() - INTERVAL '13 months' + INTERVAL '3 days', admin_user_id)
    ON CONFLICT DO NOTHING
    RETURNING id INTO contract5_id;
    
    -- Guide 3: New contract pending company signature (after expired one)
    INSERT INTO guide_contracts (guide_id, branch_id, contract_number, contract_type, title, start_date, end_date, fee_amount, fee_type, status, guide_signed_at, created_by)
    VALUES
      (guide3_id, sample_branch_id, 'CT-20250125-001', 'annual', 'Kontrak Tahunan 2025 - Renewal', 
       CURRENT_DATE, CURRENT_DATE + INTERVAL '1 year', NULL, 'per_trip',
       'pending_company', NOW() - INTERVAL '3 days', admin_user_id)
    ON CONFLICT DO NOTHING
    RETURNING id INTO contract6_id;
    
    -- Contract Trips (for active contracts)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guide_contract_trips') THEN
      -- Get some trip IDs for contract trips
      DECLARE
        trip_for_contract1 UUID;
        trip_for_contract2 UUID;
        trip_for_contract3 UUID;
      BEGIN
        SELECT id INTO trip_for_contract1 FROM trips WHERE branch_id = sample_branch_id AND status = 'completed' LIMIT 1;
        SELECT id INTO trip_for_contract2 FROM trips WHERE branch_id = sample_branch_id AND status = 'completed' OFFSET 1 LIMIT 1;
        
        IF contract1_id IS NOT NULL AND trip_for_contract1 IS NOT NULL THEN
          INSERT INTO guide_contract_trips (contract_id, trip_id, trip_code, trip_date, fee_amount, status, completed_at)
          VALUES
            (contract1_id, trip_for_contract1, 'TRP-001', CURRENT_DATE - INTERVAL '7 days', 350000, 'completed', CURRENT_DATE - INTERVAL '7 days' + INTERVAL '12 hours'),
            (contract1_id, trip_for_contract2, 'TRP-002', CURRENT_DATE - INTERVAL '3 days', 400000, 'completed', CURRENT_DATE - INTERVAL '3 days' + INTERVAL '12 hours')
          ON CONFLICT DO NOTHING;
        END IF;
      END;
    END IF;
    
    -- Contract Payments
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guide_contract_payments') AND contract1_id IS NOT NULL THEN
      INSERT INTO guide_contract_payments (contract_id, amount, payment_date, payment_method, reference_number)
      VALUES
        (contract1_id, 350000, CURRENT_DATE - INTERVAL '6 days', 'wallet', 'PAY-001'),
        (contract1_id, 400000, CURRENT_DATE - INTERVAL '2 days', 'wallet', 'PAY-002')
      ON CONFLICT DO NOTHING;
    END IF;
    
    -- Contract Sanctions (for guide with issues)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guide_contract_sanctions') AND contract1_id IS NOT NULL THEN
      INSERT INTO guide_contract_sanctions (contract_id, guide_id, branch_id, sanction_type, title, description, violation_date, fine_amount, status, issued_at, issued_by)
      VALUES
        (contract1_id, guide3_id, sample_branch_id, 'warning', 'Terlambat Check-in Berulang', 'Terlambat check-in 3 kali dalam 1 bulan', CURRENT_DATE - INTERVAL '10 days', NULL, 'active', NOW() - INTERVAL '10 days', admin_user_id),
        (contract1_id, guide3_id, sample_branch_id, 'fine', 'Dokumentasi Trip Tidak Lengkap', 'Tidak melengkapi dokumentasi trip', CURRENT_DATE - INTERVAL '5 days', 50000, 'resolved', NOW() - INTERVAL '5 days', admin_user_id)
      ON CONFLICT DO NOTHING;
    END IF;
    
    -- Resignation Request
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guide_contract_resignations') AND contract2_id IS NOT NULL THEN
      -- Note: In real scenario, this would be for a different guide
      -- But for sample data, we'll create it but it won't be active
      INSERT INTO guide_contract_resignations (contract_id, guide_id, branch_id, reason, effective_date, notice_period_days, status, submitted_at, withdrawn_at)
      VALUES
        (contract2_id, guide5_id, sample_branch_id, 'Pindah ke kota lain untuk kuliah', CURRENT_DATE + INTERVAL '30 days', 30, 'withdrawn', NOW() - INTERVAL '1 week', NOW() - INTERVAL '5 days')
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  
  RAISE NOTICE 'Part 5 completed: Contracts data created';
  
END $$;

COMMIT;

