-- ============================================
-- Seed Corporate Portal Data
-- Description: Sample corporate clients, employees, budgets, invoices, deposits
-- Created: 2025-01-04
-- ============================================

-- Variables
DO $$
DECLARE
    v_branch_id UUID := 'b1000000-0000-0000-0000-000000000001';
    v_corporate_user UUID := '65e355fa-f467-46a0-bbd5-7e0452046dfa'; -- Corporate HRD user
    v_company_1 UUID := gen_random_uuid();
    v_company_2 UUID := gen_random_uuid();
    v_company_3 UUID := gen_random_uuid();
    v_client_1 UUID := gen_random_uuid();
    v_client_2 UUID := gen_random_uuid();
    v_client_3 UUID := gen_random_uuid();
BEGIN
    -- ============================================
    -- 1. COMPANIES - Parent company records
    -- ============================================
    
    INSERT INTO companies (id, name, address, phone, email, npwp, siup_number, is_active)
    VALUES
        (v_company_1, 'PT Maju Bersama Indonesia', 'Jl. Sudirman No. 123, Jakarta Selatan 12190', '+622157890123', 'info@majubersama.co.id', '01.234.567.8-901.000', 'SIUP-12345/2020', true),
        (v_company_2, 'CV Sukses Mandiri', 'Jl. Gatot Subroto No. 45, Bandung 40123', '+622287654321', 'contact@suksesmandiri.com', '02.345.678.9-012.000', 'SIUP-23456/2021', true),
        (v_company_3, 'PT Teknologi Nusantara', 'BSD Green Office Park, Tangerang 15310', '+622180123456', 'hrd@teknusa.id', '03.456.789.0-123.000', 'SIUP-34567/2022', true)
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Companies created: %, %, %', v_company_1, v_company_2, v_company_3;
    
    -- ============================================
    -- 2. CORPORATE CLIENTS
    -- ============================================
    
    INSERT INTO corporate_clients (id, branch_id, company_name, company_address, company_phone, company_email, npwp, npwp_name, npwp_address, pic_id, pic_name, pic_phone, pic_email, contract_start, contract_end, credit_limit, is_active)
    VALUES
        (v_client_1, v_branch_id, 'PT Maju Bersama Indonesia', 'Jl. Sudirman No. 123, Jakarta Selatan 12190', '+622157890123', 'travel@majubersama.co.id', '01.234.567.8-901.000', 'PT Maju Bersama Indonesia', 'Jl. Sudirman No. 123, Jakarta Selatan', v_corporate_user, 'Dewi Sartika', '+6281234567890', 'dewi@majubersama.co.id', '2025-01-01', '2025-12-31', 50000000, true),
        (v_client_2, v_branch_id, 'CV Sukses Mandiri', 'Jl. Gatot Subroto No. 45, Bandung 40123', '+622287654321', 'hr@suksesmandiri.com', '02.345.678.9-012.000', 'CV Sukses Mandiri', 'Jl. Gatot Subroto No. 45, Bandung', NULL, 'Budi Hartono', '+6281345678901', 'budi@suksesmandiri.com', '2025-01-01', '2025-06-30', 25000000, true),
        (v_client_3, v_branch_id, 'PT Teknologi Nusantara', 'BSD Green Office Park, Tangerang 15310', '+622180123456', 'outing@teknusa.id', '03.456.789.0-123.000', 'PT Teknologi Nusantara', 'BSD Green Office Park, Tangerang', NULL, 'Rini Wulandari', '+6281456789012', 'rini@teknusa.id', '2025-02-01', '2026-01-31', 100000000, true)
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Corporate clients created: %, %, %', v_client_1, v_client_2, v_client_3;
    
    -- ============================================
    -- 3. CORPORATE EMPLOYEES
    -- ============================================
    
    -- Employees for PT Maju Bersama Indonesia
    INSERT INTO corporate_employees (corporate_id, user_id, employee_id_number, full_name, email, phone, department, allocated_amount, used_amount, is_active)
    VALUES
        (v_client_1, v_corporate_user, 'MBI-001', 'Dewi Sartika', 'dewi@majubersama.co.id', '+6281234567890', 'HRD', 5000000, 1500000, true),
        (v_client_1, NULL, 'MBI-002', 'Andi Pratama', 'andi@majubersama.co.id', '+6281234567891', 'Finance', 3000000, 0, true),
        (v_client_1, NULL, 'MBI-003', 'Siti Nurhaliza', 'siti.n@majubersama.co.id', '+6281234567892', 'Marketing', 3000000, 750000, true),
        (v_client_1, NULL, 'MBI-004', 'Rizky Febrian', 'rizky@majubersama.co.id', '+6281234567893', 'IT', 2500000, 2000000, true),
        (v_client_1, NULL, 'MBI-005', 'Maya Putri', 'maya.p@majubersama.co.id', '+6281234567894', 'Operations', 2000000, 500000, true)
    ON CONFLICT DO NOTHING;
    
    -- Employees for CV Sukses Mandiri
    INSERT INTO corporate_employees (corporate_id, employee_id_number, full_name, email, phone, department, allocated_amount, used_amount, is_active)
    VALUES
        (v_client_2, 'SM-001', 'Budi Hartono', 'budi@suksesmandiri.com', '+6281345678901', 'Management', 5000000, 0, true),
        (v_client_2, 'SM-002', 'Fitri Handayani', 'fitri@suksesmandiri.com', '+6281345678902', 'Sales', 2000000, 500000, true),
        (v_client_2, 'SM-003', 'Denny Irawan', 'denny@suksesmandiri.com', '+6281345678903', 'Procurement', 2000000, 1000000, true)
    ON CONFLICT DO NOTHING;
    
    -- Employees for PT Teknologi Nusantara
    INSERT INTO corporate_employees (corporate_id, employee_id_number, full_name, email, phone, department, allocated_amount, used_amount, is_active)
    VALUES
        (v_client_3, 'TN-001', 'Rini Wulandari', 'rini@teknusa.id', '+6281456789012', 'HRD', 10000000, 3500000, true),
        (v_client_3, 'TN-002', 'Agus Suryanto', 'agus@teknusa.id', '+6281456789013', 'Engineering', 5000000, 1200000, true),
        (v_client_3, 'TN-003', 'Linda Permata', 'linda@teknusa.id', '+6281456789014', 'Product', 5000000, 0, true),
        (v_client_3, 'TN-004', 'Fajar Nugroho', 'fajar@teknusa.id', '+6281456789015', 'QA', 3000000, 750000, true),
        (v_client_3, 'TN-005', 'Rina Kusuma', 'rina@teknusa.id', '+6281456789016', 'DevOps', 3000000, 0, true),
        (v_client_3, 'TN-006', 'Hendra Wijaya', 'hendra@teknusa.id', '+6281456789017', 'Engineering', 5000000, 2500000, true),
        (v_client_3, 'TN-007', 'Sinta Dewi', 'sinta@teknusa.id', '+6281456789018', 'Design', 3000000, 1000000, true)
    ON CONFLICT DO NOTHING;
    
    -- ============================================
    -- 4. CORPORATE DEPOSITS
    -- ============================================
    
    INSERT INTO corporate_deposits (corporate_id, balance)
    VALUES
        (v_client_1, 35000000),
        (v_client_2, 15000000),
        (v_client_3, 75000000)
    ON CONFLICT DO NOTHING;
    
    -- ============================================
    -- 5. CORPORATE BUDGETS
    -- ============================================
    
    -- Budgets for company 1
    INSERT INTO corporate_budgets (company_id, department, fiscal_year, fiscal_quarter, allocated_amount, spent_amount, pending_amount, alert_threshold, is_active, notes)
    VALUES
        (v_company_1, 'HRD', 2025, 1, 15000000, 4500000, 2000000, 80, true, 'Q1 2025 - Employee Travel Budget'),
        (v_company_1, 'Marketing', 2025, 1, 10000000, 2500000, 1500000, 75, true, 'Q1 2025 - Marketing Team Events'),
        (v_company_1, 'IT', 2025, 1, 8000000, 3000000, 0, 80, true, 'Q1 2025 - Tech Team Offsite'),
        (v_company_1, 'Operations', 2025, 1, 5000000, 1000000, 500000, 90, true, 'Q1 2025 - Ops Team Building')
    ON CONFLICT DO NOTHING;
    
    -- Budgets for company 2
    INSERT INTO corporate_budgets (company_id, department, fiscal_year, fiscal_quarter, allocated_amount, spent_amount, pending_amount, alert_threshold, is_active)
    VALUES
        (v_company_2, 'Management', 2025, 1, 10000000, 0, 5000000, 80, true),
        (v_company_2, 'Sales', 2025, 1, 8000000, 1500000, 0, 80, true)
    ON CONFLICT DO NOTHING;
    
    -- Budgets for company 3
    INSERT INTO corporate_budgets (company_id, department, fiscal_year, fiscal_quarter, allocated_amount, spent_amount, pending_amount, alert_threshold, is_active)
    VALUES
        (v_company_3, 'Engineering', 2025, 1, 25000000, 8200000, 3000000, 70, true),
        (v_company_3, 'Product', 2025, 1, 10000000, 0, 2500000, 80, true),
        (v_company_3, 'HRD', 2025, 1, 15000000, 5500000, 1000000, 80, true)
    ON CONFLICT DO NOTHING;
    
    -- ============================================
    -- 6. CORPORATE INVOICES
    -- ============================================
    
    INSERT INTO corporate_invoices (corporate_id, invoice_number, invoice_date, due_date, subtotal, tax_amount, total_amount, status, paid_at, paid_amount, payment_reference)
    VALUES
        -- Paid invoices
        (v_client_1, 'INV-CORP-2024-001', '2024-12-01', '2024-12-15', 4500000, 495000, 4995000, 'paid', '2024-12-10 10:30:00+07', 4995000, 'TRF-123456789'),
        (v_client_1, 'INV-CORP-2024-002', '2024-12-15', '2024-12-30', 3000000, 330000, 3330000, 'paid', '2024-12-28 14:15:00+07', 3330000, 'TRF-234567890'),
        (v_client_2, 'INV-CORP-2024-003', '2024-12-20', '2025-01-04', 2500000, 275000, 2775000, 'paid', '2025-01-02 09:00:00+07', 2775000, 'TRF-345678901'),
        
        -- Sent (pending payment)
        (v_client_1, 'INV-CORP-2025-001', '2025-01-01', '2025-01-15', 5000000, 550000, 5550000, 'sent', NULL, NULL, NULL),
        (v_client_3, 'INV-CORP-2025-002', '2025-01-02', '2025-01-16', 8500000, 935000, 9435000, 'sent', NULL, NULL, NULL),
        
        -- Draft
        (v_client_3, 'INV-CORP-2025-003', '2025-01-04', '2025-01-18', 3500000, 385000, 3885000, 'draft', NULL, NULL, NULL)
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Corporate data seeded successfully';
END $$;

-- Summary
DO $$
DECLARE
    company_count INTEGER;
    client_count INTEGER;
    employee_count INTEGER;
    budget_count INTEGER;
    deposit_count INTEGER;
    invoice_count INTEGER;
BEGIN
    SELECT count(*) INTO company_count FROM companies;
    SELECT count(*) INTO client_count FROM corporate_clients;
    SELECT count(*) INTO employee_count FROM corporate_employees;
    SELECT count(*) INTO budget_count FROM corporate_budgets;
    SELECT count(*) INTO deposit_count FROM corporate_deposits;
    SELECT count(*) INTO invoice_count FROM corporate_invoices;
    
    RAISE NOTICE 'Corporate portal data seeded:';
    RAISE NOTICE '  - Companies: %', company_count;
    RAISE NOTICE '  - Corporate clients: %', client_count;
    RAISE NOTICE '  - Corporate employees: %', employee_count;
    RAISE NOTICE '  - Corporate budgets: %', budget_count;
    RAISE NOTICE '  - Corporate deposits: %', deposit_count;
    RAISE NOTICE '  - Corporate invoices: %', invoice_count;
END $$;
