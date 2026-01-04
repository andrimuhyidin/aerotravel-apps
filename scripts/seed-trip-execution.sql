-- ============================================
-- Seed Trip Execution Data
-- Description: Sample trip_crews, trip_manifest, trip_expenses
-- Created: 2025-01-04
-- ============================================

-- Define branch_id for reference
DO $$
DECLARE
    v_branch_id UUID := 'b1000000-0000-0000-0000-000000000001';
    v_guide_1 UUID := '10000000-0000-0000-0000-000000000001'; -- Customer Guide
    v_guide_2 UUID := '40000000-0000-0000-0000-000000000004'; -- Guide Mitra
    v_guide_3 UUID := '60000000-0000-0000-0000-000000000006'; -- Guide Corporate
    v_guide_4 UUID := '093249c7-4719-4b97-894b-7cd6f2a84372'; -- Tour Guide Demo
BEGIN
    -- ============================================
    -- TRIP CREWS - Assign guides to trips
    -- ============================================
    
    -- Trip 1: AT-PHW-2401 (on_trip) - 2 guides (lead + support)
    INSERT INTO trip_crews (trip_id, guide_id, branch_id, role, status, fee_amount, assigned_at, confirmed_at)
    VALUES 
        ('00000000-0000-0000-0000-000000000001', v_guide_1, v_branch_id, 'lead', 'confirmed', 500000, NOW() - INTERVAL '7 days', NOW() - INTERVAL '6 days'),
        ('00000000-0000-0000-0000-000000000001', v_guide_2, v_branch_id, 'support', 'confirmed', 350000, NOW() - INTERVAL '7 days', NOW() - INTERVAL '6 days')
    ON CONFLICT (trip_id, guide_id) DO NOTHING;
    
    -- Trip 2: AT-KRA-2402 (scheduled) - Lead only
    INSERT INTO trip_crews (trip_id, guide_id, branch_id, role, status, fee_amount, assigned_at, confirmed_at)
    VALUES 
        ('00000000-0000-0000-0000-000000000002', v_guide_3, v_branch_id, 'lead', 'confirmed', 500000, NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days')
    ON CONFLICT (trip_id, guide_id) DO NOTHING;
    
    -- Trip 3: AT-PHW-2399 (scheduled) - Lead + Support
    INSERT INTO trip_crews (trip_id, guide_id, branch_id, role, status, fee_amount, assigned_at)
    VALUES 
        ('00000000-0000-0000-0000-000000000003', v_guide_4, v_branch_id, 'lead', 'assigned', 500000, NOW() - INTERVAL '3 days'),
        ('00000000-0000-0000-0000-000000000003', v_guide_1, v_branch_id, 'support', 'assigned', 350000, NOW() - INTERVAL '3 days')
    ON CONFLICT (trip_id, guide_id) DO NOTHING;
    
    -- Trip 4: AT-PHW-2400 (scheduled) - Lead confirmed
    INSERT INTO trip_crews (trip_id, guide_id, branch_id, role, status, fee_amount, assigned_at, confirmed_at)
    VALUES 
        ('00000000-0000-0000-0000-000000000004', v_guide_2, v_branch_id, 'lead', 'confirmed', 500000, NOW() - INTERVAL '10 days', NOW() - INTERVAL '9 days')
    ON CONFLICT (trip_id, guide_id) DO NOTHING;
    
    -- Trip 5: Completed trip - All confirmed
    INSERT INTO trip_crews (trip_id, guide_id, branch_id, role, status, fee_amount, assigned_at, confirmed_at)
    VALUES 
        ('00000000-0000-0000-0000-00000000000b', v_guide_3, v_branch_id, 'lead', 'confirmed', 500000, NOW() - INTERVAL '30 days', NOW() - INTERVAL '29 days'),
        ('00000000-0000-0000-0000-00000000000b', v_guide_4, v_branch_id, 'support', 'confirmed', 350000, NOW() - INTERVAL '30 days', NOW() - INTERVAL '29 days')
    ON CONFLICT (trip_id, guide_id) DO NOTHING;
    
    -- Trip 6: Completed trip 
    INSERT INTO trip_crews (trip_id, guide_id, branch_id, role, status, fee_amount, assigned_at, confirmed_at)
    VALUES 
        ('00000000-0000-0000-0000-00000000000c', v_guide_1, v_branch_id, 'lead', 'confirmed', 500000, NOW() - INTERVAL '25 days', NOW() - INTERVAL '24 days')
    ON CONFLICT (trip_id, guide_id) DO NOTHING;
    
    RAISE NOTICE 'Trip crews inserted successfully';
END $$;

-- ============================================
-- TRIP MANIFEST - Generate from booking passengers
-- ============================================

-- Manifest for AT-PHW-2401 (on_trip - current trip)
INSERT INTO trip_manifest (trip_id, passenger_name, passenger_email, passenger_phone, passenger_id_number, check_in_status, checked_in_at, seat_number)
VALUES
    ('00000000-0000-0000-0000-000000000001', 'Budi Santoso', 'budi@example.com', '+6281234567890', '3171234567890001', 'checked_in', NOW() - INTERVAL '1 hour', 'A1'),
    ('00000000-0000-0000-0000-000000000001', 'Siti Rahayu', 'siti@example.com', '+6281234567891', '3171234567890002', 'checked_in', NOW() - INTERVAL '45 minutes', 'A2'),
    ('00000000-0000-0000-0000-000000000001', 'Ahmad Wijaya', 'ahmad@example.com', '+6281234567892', '3171234567890003', 'checked_in', NOW() - INTERVAL '30 minutes', 'A3'),
    ('00000000-0000-0000-0000-000000000001', 'Dewi Lestari', 'dewi@example.com', '+6281234567893', '3171234567890004', 'pending', NULL, 'A4'),
    ('00000000-0000-0000-0000-000000000001', 'Rizki Pratama', 'rizki@example.com', '+6281234567894', '3171234567890005', 'pending', NULL, 'A5')
ON CONFLICT DO NOTHING;

-- Manifest for AT-KRA-2402 (scheduled - upcoming)
INSERT INTO trip_manifest (trip_id, passenger_name, passenger_email, passenger_phone, passenger_id_number, check_in_status, seat_number, health_notes, allergies)
VALUES
    ('00000000-0000-0000-0000-000000000002', 'Eko Prasetyo', 'eko@example.com', '+6281234567895', '3171234567890006', 'pending', 'B1', NULL, NULL),
    ('00000000-0000-0000-0000-000000000002', 'Fitriani', 'fitri@example.com', '+6281234567896', '3171234567890007', 'pending', 'B2', 'Punya asma ringan', ARRAY['kacang']),
    ('00000000-0000-0000-0000-000000000002', 'Gunawan', 'gunawan@example.com', '+6281234567897', '3171234567890008', 'pending', 'B3', NULL, ARRAY['seafood']),
    ('00000000-0000-0000-0000-000000000002', 'Hana Kusuma', 'hana@example.com', '+6281234567898', '3171234567890009', 'pending', 'B4', NULL, NULL)
ON CONFLICT DO NOTHING;

-- Manifest for completed trip TRP-20250110-001
INSERT INTO trip_manifest (trip_id, passenger_name, passenger_email, passenger_phone, passenger_id_number, check_in_status, checked_in_at, seat_number, room_number)
VALUES
    ('00000000-0000-0000-0000-00000000000b', 'Indra Maulana', 'indra@example.com', '+6281234567899', '3171234567890010', 'checked_in', NOW() - INTERVAL '25 days', 'C1', '101'),
    ('00000000-0000-0000-0000-00000000000b', 'Joko Widodo', 'joko@example.com', '+6281234567800', '3171234567890011', 'checked_in', NOW() - INTERVAL '25 days', 'C2', '101'),
    ('00000000-0000-0000-0000-00000000000b', 'Kartini Dewi', 'kartini@example.com', '+6281234567801', '3171234567890012', 'checked_in', NOW() - INTERVAL '25 days', 'C3', '102'),
    ('00000000-0000-0000-0000-00000000000b', 'Lukman Hakim', 'lukman@example.com', '+6281234567802', '3171234567890013', 'checked_in', NOW() - INTERVAL '25 days', 'C4', '102'),
    ('00000000-0000-0000-0000-00000000000b', 'Maya Sari', 'maya@example.com', '+6281234567803', '3171234567890014', 'checked_in', NOW() - INTERVAL '25 days', 'C5', '103'),
    ('00000000-0000-0000-0000-00000000000b', 'Nurdin Ahmad', 'nurdin@example.com', '+6281234567804', '3171234567890015', 'checked_in', NOW() - INTERVAL '25 days', 'C6', '103')
ON CONFLICT DO NOTHING;

-- ============================================
-- TRIP EXPENSES - Sample expenses for trips
-- ============================================

-- Expenses for current trip AT-PHW-2401
INSERT INTO trip_expenses (trip_id, category, description, quantity, unit_price, total_amount, created_by, created_at) 
SELECT 
    '00000000-0000-0000-0000-000000000001',
    category,
    description,
    quantity,
    unit_price,
    total_amount,
    '10000000-0000-0000-0000-000000000001',
    created_at
FROM (VALUES
    ('fuel'::expense_category, 'BBM Solar - Keberangkatan', 1, 850000.00, 850000.00, NOW() - INTERVAL '2 hours'),
    ('food'::expense_category, 'Makan siang crew + peserta', 20, 25000.00, 500000.00, NOW() - INTERVAL '1 hour'),
    ('ticket'::expense_category, 'Tiket masuk Pantai Pasir Putih', 18, 15000.00, 270000.00, NOW() - INTERVAL '30 minutes'),
    ('transport'::expense_category, 'Parkir bus di lokasi wisata', 1, 50000.00, 50000.00, NOW() - INTERVAL '20 minutes')
) AS t(category, description, quantity, unit_price, total_amount, created_at);

-- Expenses for completed trip TRP-20250110-001
INSERT INTO trip_expenses (trip_id, category, description, quantity, unit_price, total_amount, created_by, created_at)
SELECT 
    '00000000-0000-0000-0000-00000000000b',
    category,
    description,
    quantity,
    unit_price,
    total_amount,
    '60000000-0000-0000-0000-000000000006',
    created_at
FROM (VALUES
    ('fuel'::expense_category, 'BBM Solar - Full trip', 1, 1500000.00, 1500000.00, NOW() - INTERVAL '24 days'),
    ('food'::expense_category, 'Sarapan crew + peserta', 12, 20000.00, 240000.00, NOW() - INTERVAL '24 days'),
    ('food'::expense_category, 'Makan siang crew + peserta', 12, 30000.00, 360000.00, NOW() - INTERVAL '24 days'),
    ('food'::expense_category, 'Makan malam crew + peserta', 12, 35000.00, 420000.00, NOW() - INTERVAL '24 days'),
    ('ticket'::expense_category, 'Tiket masuk Kawah Ijen', 10, 25000.00, 250000.00, NOW() - INTERVAL '24 days'),
    ('ticket'::expense_category, 'Tiket masuk Air Terjun Tumpak Sewu', 10, 20000.00, 200000.00, NOW() - INTERVAL '23 days'),
    ('transport'::expense_category, 'Jeep menuju Kawah Ijen', 2, 300000.00, 600000.00, NOW() - INTERVAL '24 days'),
    ('equipment'::expense_category, 'Sewa masker gas (10 pcs)', 10, 25000.00, 250000.00, NOW() - INTERVAL '24 days'),
    ('emergency'::expense_category, 'Obat P3K tambahan', 1, 75000.00, 75000.00, NOW() - INTERVAL '23 days'),
    ('other'::expense_category, 'Tips porter lokal', 1, 200000.00, 200000.00, NOW() - INTERVAL '23 days')
) AS t(category, description, quantity, unit_price, total_amount, created_at);

-- Expenses for completed trip TRP-20250115-001
INSERT INTO trip_expenses (trip_id, category, description, quantity, unit_price, total_amount, created_by, created_at)
SELECT 
    '00000000-0000-0000-0000-00000000000c',
    category,
    description,
    quantity,
    unit_price,
    total_amount,
    '10000000-0000-0000-0000-000000000001',
    created_at
FROM (VALUES
    ('fuel'::expense_category, 'BBM Solar - Trip Krakatau', 1, 1200000.00, 1200000.00, NOW() - INTERVAL '20 days'),
    ('food'::expense_category, 'Snack perjalanan', 15, 15000.00, 225000.00, NOW() - INTERVAL '20 days'),
    ('food'::expense_category, 'Makan siang di resto lokal', 15, 40000.00, 600000.00, NOW() - INTERVAL '20 days'),
    ('ticket'::expense_category, 'Tiket speedboat ke Krakatau', 15, 150000.00, 2250000.00, NOW() - INTERVAL '20 days'),
    ('ticket'::expense_category, 'Tiket masuk TNUK', 13, 50000.00, 650000.00, NOW() - INTERVAL '20 days'),
    ('transport'::expense_category, 'Parkir bus di Pelabuhan Carita', 1, 30000.00, 30000.00, NOW() - INTERVAL '20 days'),
    ('equipment'::expense_category, 'Life jacket sewa (15 pcs)', 15, 20000.00, 300000.00, NOW() - INTERVAL '20 days')
) AS t(category, description, quantity, unit_price, total_amount, created_at);

-- Summary
DO $$
DECLARE
    crew_count INTEGER;
    manifest_count INTEGER;
    expense_count INTEGER;
BEGIN
    SELECT count(*) INTO crew_count FROM trip_crews;
    SELECT count(*) INTO manifest_count FROM trip_manifest;
    SELECT count(*) INTO expense_count FROM trip_expenses;
    
    RAISE NOTICE 'Trip execution data seeded:';
    RAISE NOTICE '  - Trip crews: %', crew_count;
    RAISE NOTICE '  - Trip manifest: %', manifest_count;
    RAISE NOTICE '  - Trip expenses: %', expense_count;
END $$;

