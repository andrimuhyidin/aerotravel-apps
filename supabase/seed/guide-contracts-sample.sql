-- Sample Guide Contracts Data (Master Contract Only)
-- For testing and development
-- IMPORTANT: Only for development/testing environment
-- All contracts are annual master contracts

-- ============================================
-- SAMPLE CONTRACTS (MASTER CONTRACT ONLY)
-- ============================================

DO $$
DECLARE
  sample_branch_id UUID;
  sample_guide_id UUID;
  sample_admin_id UUID;
  contract1_id UUID := gen_random_uuid();
  contract2_id UUID := gen_random_uuid();
  contract3_id UUID := gen_random_uuid();
  start_date1 DATE := CURRENT_DATE;
  end_date1 DATE := CURRENT_DATE + INTERVAL '1 year';
  start_date2 DATE := CURRENT_DATE - INTERVAL '30 days';
  end_date2 DATE := CURRENT_DATE - INTERVAL '30 days' + INTERVAL '1 year';
  start_date3 DATE := CURRENT_DATE + INTERVAL '10 days';
  end_date3 DATE := CURRENT_DATE + INTERVAL '10 days' + INTERVAL '1 year';
BEGIN
  -- Get first branch
  SELECT id INTO sample_branch_id FROM branches LIMIT 1;
  IF sample_branch_id IS NULL THEN
    RAISE NOTICE 'No branch found, skipping contract sample data';
    RETURN;
  END IF;

  -- Get guide user
  SELECT id INTO sample_guide_id FROM users WHERE role = 'guide' LIMIT 1;
  IF sample_guide_id IS NULL THEN
    RAISE NOTICE 'No guide found, skipping contract sample data';
    RETURN;
  END IF;

  -- Get admin user
  SELECT id INTO sample_admin_id FROM users WHERE role IN ('super_admin', 'ops_admin', 'finance_manager') LIMIT 1;
  IF sample_admin_id IS NULL THEN
    SELECT id INTO sample_admin_id FROM users WHERE role = 'super_admin' LIMIT 1;
  END IF;

  -- ============================================
  -- CONTRACT 1: Pending Signature (Annual Master)
  -- ============================================
  INSERT INTO guide_contracts (
    id,
    branch_id,
    guide_id,
    contract_number,
    contract_type,
    title,
    description,
    start_date,
    end_date,
    fee_amount,
    fee_type,
    payment_terms,
    status,
    is_master_contract,
    auto_cover_trips,
    renewal_date,
    created_by,
    created_at,
    updated_at
  ) VALUES (
    contract1_id,
    sample_branch_id,
    sample_guide_id,
    'CT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-001',
    'annual',
    'Kontrak Kerja Tahunan ' || EXTRACT(YEAR FROM start_date1),
    'Kontrak kerja tahunan (master contract) yang berlaku untuk semua trip dalam periode 1 tahun. Fee ditentukan per trip assignment.',
    start_date1,
    end_date1,
    NULL, -- Fee in trip_guides, not in contract
    'per_trip',
    'Dibayar setelah trip selesai berdasarkan fee di trip assignment',
    'pending_signature',
    true, -- Master contract
    true, -- Auto-cover trips
    end_date1, -- Renewal date
    COALESCE(sample_admin_id, sample_guide_id),
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days'
  ) ON CONFLICT (id) DO NOTHING;

  -- ============================================
  -- CONTRACT 2: Active (Annual Master)
  -- ============================================
  INSERT INTO guide_contracts (
    id,
    branch_id,
    guide_id,
    contract_number,
    contract_type,
    title,
    description,
    start_date,
    end_date,
    fee_amount,
    fee_type,
    payment_terms,
    status,
    guide_signed_at,
    company_signed_at,
    guide_signature_url,
    company_signature_url,
    is_master_contract,
    auto_cover_trips,
    renewal_date,
    created_by,
    created_at,
    updated_at
  ) VALUES (
    contract2_id,
    sample_branch_id,
    sample_guide_id,
    'CT-' || TO_CHAR(start_date2, 'YYYYMMDD') || '-002',
    'annual',
    'Kontrak Kerja Tahunan ' || EXTRACT(YEAR FROM start_date2),
    'Kontrak kerja tahunan (master contract) yang aktif. Fee ditentukan per trip assignment di trip_guides.',
    start_date2,
    end_date2,
    NULL, -- Fee in trip_guides, not in contract
    'per_trip',
    'Dibayar setelah trip selesai berdasarkan fee di trip assignment',
    'active',
    NOW() - INTERVAL '25 days',
    NOW() - INTERVAL '20 days',
    'typed:Guide Signature',
    'typed:Company Signature',
    true, -- Master contract
    true, -- Auto-cover trips
    end_date2, -- Renewal date
    COALESCE(sample_admin_id, sample_guide_id),
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '20 days'
  ) ON CONFLICT (id) DO NOTHING;

  -- ============================================
  -- CONTRACT 3: Pending Company (Annual Master)
  -- ============================================
  INSERT INTO guide_contracts (
    id,
    branch_id,
    guide_id,
    contract_number,
    contract_type,
    title,
    description,
    start_date,
    end_date,
    fee_amount,
    fee_type,
    payment_terms,
    status,
    guide_signed_at,
    guide_signature_url,
    is_master_contract,
    auto_cover_trips,
    renewal_date,
    created_by,
    created_at,
    updated_at
  ) VALUES (
    contract3_id,
    sample_branch_id,
    sample_guide_id,
    'CT-' || TO_CHAR(start_date3, 'YYYYMMDD') || '-003',
    'annual',
    'Kontrak Kerja Tahunan ' || EXTRACT(YEAR FROM start_date3),
    'Kontrak kerja tahunan (master contract) menunggu tanda tangan company. Fee ditentukan per trip assignment.',
    start_date3,
    end_date3,
    NULL, -- Fee in trip_guides, not in contract
    'per_trip',
    'Dibayar setelah trip selesai berdasarkan fee di trip assignment',
    'pending_company',
    NOW() - INTERVAL '2 days',
    'typed:Guide Signature',
    true, -- Master contract
    true, -- Auto-cover trips
    end_date3, -- Renewal date
    COALESCE(sample_admin_id, sample_guide_id),
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '2 days'
  ) ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Sample master contracts created successfully';
  RAISE NOTICE '  - Contract 1: Pending Signature (Annual Master)';
  RAISE NOTICE '  - Contract 2: Active (Annual Master)';
  RAISE NOTICE '  - Contract 3: Pending Company (Annual Master)';
  RAISE NOTICE 'All contracts are master contracts (annual) with fee per trip assignment';

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating sample contracts: %', SQLERRM;
END $$;
