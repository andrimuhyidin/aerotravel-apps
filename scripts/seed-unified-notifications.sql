-- ============================================
-- Seed Unified Notifications Sample Data
-- Description: Sample notifications for all apps (admin, partner, guide, customer, corporate)
-- Created: 2025-01-04
-- Schema: user_id, app, type, title, message, metadata, read, read_at, created_at
-- ============================================

DO $$
DECLARE
    -- Users
    v_admin_id UUID;
    v_partner_id UUID := 'c275147e-03e2-4ba4-bfef-72a7a071018e';
    v_customer_id UUID;
    v_guide_id UUID;
    v_corporate_id UUID;
    v_ops_admin_id UUID;
    -- Bookings
    v_booking_id UUID;
    v_booking_code TEXT;
BEGIN
    -- Get user IDs
    SELECT id INTO v_admin_id FROM users WHERE role = 'super_admin' LIMIT 1;
    SELECT id INTO v_customer_id FROM users WHERE role = 'customer' AND email = 'andrimuhyidin55@gmail.com' LIMIT 1;
    SELECT id INTO v_guide_id FROM users WHERE role = 'guide' LIMIT 1;
    SELECT id INTO v_corporate_id FROM users WHERE role = 'corporate' LIMIT 1;
    SELECT id INTO v_ops_admin_id FROM users WHERE role = 'ops_admin' LIMIT 1;
    
    -- Get a booking for reference
    SELECT id, booking_code INTO v_booking_id, v_booking_code FROM bookings LIMIT 1;
    
    -- Fallback if no customer found
    IF v_customer_id IS NULL THEN
        SELECT id INTO v_customer_id FROM users WHERE role = 'customer' LIMIT 1;
    END IF;
    
    -- ============================================
    -- 1. ADMIN NOTIFICATIONS
    -- ============================================
    
    IF v_admin_id IS NOT NULL THEN
        INSERT INTO unified_notifications (user_id, app, type, title, message, metadata, read, created_at)
        VALUES
            -- System notifications
            (v_admin_id, 'admin', 'system.announcement', 'Update Sistem', 
             'Sistem akan mengalami maintenance pada 5 Januari 2025 pukul 02:00-04:00 WIB.',
             '{"maintenance_date": "2025-01-05", "duration": "2 hours", "priority": "high"}'::jsonb, false, NOW() - INTERVAL '1 day'),
            
            -- Booking notifications
            (v_admin_id, 'admin', 'booking.created', 'Booking Baru Diterima',
             'Booking baru ' || COALESCE(v_booking_code, 'BK-000001') || ' telah dibuat.',
             jsonb_build_object('booking_id', COALESCE(v_booking_id::text, ''), 'amount', 2500000), true, NOW() - INTERVAL '2 days'),
            
            -- Payment notifications
            (v_admin_id, 'admin', 'payment.received', 'Pembayaran Diterima',
             'Pembayaran untuk booking ' || COALESCE(v_booking_code, 'BK-000001') || ' telah dikonfirmasi.',
             jsonb_build_object('booking_id', COALESCE(v_booking_id::text, ''), 'amount', 2500000, 'method', 'bank_transfer'), true, NOW() - INTERVAL '2 days'),
            
            -- Trip notifications
            (v_admin_id, 'admin', 'trip.status_changed', 'Trip Dimulai',
             'Trip TRP-000001 telah dimulai oleh guide.',
             '{"trip_id": "test", "old_status": "confirmed", "new_status": "on_trip"}'::jsonb, false, NOW() - INTERVAL '4 hours'),
            
            -- Guide notifications
            (v_admin_id, 'admin', 'guide.contract_signed', 'Kontrak Ditandatangani',
             'Guide Ahmad Rizki telah menandatangani kontrak CON-2025-001.',
             '{"contract_id": "test", "guide_name": "Ahmad Rizki"}'::jsonb, true, NOW() - INTERVAL '3 days')
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Admin notifications seeded';
    ELSE
        RAISE NOTICE 'No admin user found, skipping admin notifications';
    END IF;
    
    -- ============================================
    -- 2. PARTNER NOTIFICATIONS
    -- ============================================
    
    INSERT INTO unified_notifications (user_id, app, type, title, message, metadata, read, created_at)
    VALUES
        -- Wallet notifications
        (v_partner_id, 'partner', 'wallet.balance_changed', 'Top Up Berhasil',
         'Top up wallet sebesar Rp 5.000.000 telah berhasil dikonfirmasi.',
         '{"amount": 5000000, "balance_after": 12500000}'::jsonb, true, NOW() - INTERVAL '5 days'),
        
        (v_partner_id, 'partner', 'wallet.balance_changed', 'Pembayaran Booking',
         'Saldo wallet dipotong Rp 2.500.000 untuk pembayaran booking BK-000010.',
         '{"amount": -2500000, "balance_after": 10000000, "booking_code": "BK-000010"}'::jsonb, true, NOW() - INTERVAL '3 days'),
        
        -- Booking notifications
        (v_partner_id, 'partner', 'booking.confirmed', 'Booking Dikonfirmasi',
         'Booking BK-000010 telah dikonfirmasi dan siap diproses.',
         '{"booking_code": "BK-000010", "trip_date": "2025-01-15"}'::jsonb, true, NOW() - INTERVAL '3 days'),
        
        -- Package notifications
        (v_partner_id, 'partner', 'package.availability_changed', 'Slot Hampir Habis',
         'Paket Pahawang 3D2N tanggal 20 Januari hanya tersisa 2 slot.',
         '{"package_name": "Pahawang 3D2N", "date": "2025-01-20", "remaining": 2, "priority": "high"}'::jsonb, false, NOW() - INTERVAL '1 day'),
        
        -- Promo notifications
        (v_partner_id, 'partner', 'system.announcement', 'Promo Spesial Partner',
         'Dapatkan bonus komisi 2% untuk semua booking di bulan Januari 2025!',
         '{"promo_code": "PARTNER2025", "valid_until": "2025-01-31"}'::jsonb, false, NOW() - INTERVAL '10 days'),
        
        -- Support ticket update
        (v_partner_id, 'partner', 'support.ticket_resolved', 'Tiket Support Selesai',
         'Tiket #TKT-001 "Gagal top up wallet" telah diselesaikan.',
         '{"ticket_id": "TKT-001", "subject": "Gagal top up wallet"}'::jsonb, true, NOW() - INTERVAL '25 days')
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Partner notifications seeded';
    
    -- ============================================
    -- 3. GUIDE NOTIFICATIONS
    -- ============================================
    
    IF v_guide_id IS NOT NULL THEN
        INSERT INTO unified_notifications (user_id, app, type, title, message, metadata, read, created_at)
        VALUES
            -- Trip assignment
            (v_guide_id, 'guide', 'trip.assigned', 'Penugasan Trip Baru',
             'Anda ditugaskan sebagai lead guide untuk trip TRP-000001 pada 15 Januari 2025.',
             '{"trip_id": "test", "trip_code": "TRP-000001", "date": "2025-01-15", "role": "lead", "priority": "high"}'::jsonb, false, NOW() - INTERVAL '2 days'),
            
            -- Trip reminder
            (v_guide_id, 'guide', 'trip.status_changed', 'Pengingat Trip',
             'Trip TRP-000001 akan dimulai besok. Pastikan semua persiapan sudah selesai.',
             '{"trip_id": "test", "trip_code": "TRP-000001", "date": "2025-01-15", "priority": "high"}'::jsonb, false, NOW() - INTERVAL '1 day'),
            
            -- Contract notification
            (v_guide_id, 'guide', 'guide.contract_signed', 'Kontrak Aktif',
             'Kontrak CON-2025-001 Anda telah aktif hingga 31 Desember 2025.',
             '{"contract_id": "test", "valid_until": "2025-12-31"}'::jsonb, true, NOW() - INTERVAL '30 days'),
            
            -- Payment notification
            (v_guide_id, 'guide', 'payment.received', 'Pembayaran Fee Trip',
             'Fee trip TRP-000001 sebesar Rp 500.000 telah ditransfer ke rekening Anda.',
             '{"trip_code": "TRP-000001", "amount": 500000}'::jsonb, true, NOW() - INTERVAL '5 days'),
            
            -- System notification
            (v_guide_id, 'guide', 'system.announcement', 'Pelatihan Wajib',
             'Pelatihan first aid wajib untuk semua guide pada 10 Januari 2025.',
             '{"training_date": "2025-01-10", "location": "Kantor Pusat"}'::jsonb, false, NOW() - INTERVAL '7 days')
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Guide notifications seeded';
    ELSE
        RAISE NOTICE 'No guide user found, skipping guide notifications';
    END IF;
    
    -- ============================================
    -- 4. CUSTOMER NOTIFICATIONS
    -- ============================================
    
    IF v_customer_id IS NOT NULL THEN
        INSERT INTO unified_notifications (user_id, app, type, title, message, metadata, read, created_at)
        VALUES
            -- Booking confirmation
            (v_customer_id, 'customer', 'booking.confirmed', 'Booking Dikonfirmasi!',
             'Selamat! Booking Anda untuk Pahawang 3D2N pada 15 Januari 2025 telah dikonfirmasi.',
             '{"booking_code": "BK-000001", "package": "Pahawang 3D2N", "date": "2025-01-15"}'::jsonb, true, NOW() - INTERVAL '5 days'),
            
            -- Payment reminder
            (v_customer_id, 'customer', 'payment.failed', 'Pengingat Pembayaran',
             'Pembayaran booking BK-000002 akan expired dalam 2 jam. Segera selesaikan pembayaran.',
             '{"booking_code": "BK-000002", "expires_in": "2 hours", "priority": "high"}'::jsonb, false, NOW() - INTERVAL '1 day'),
            
            -- Trip reminder
            (v_customer_id, 'customer', 'trip.status_changed', 'Trip Dimulai Besok!',
             'Trip Pahawang 3D2N Anda akan dimulai besok. Meeting point: Pelabuhan Bakauheni pukul 08:00.',
             '{"trip_code": "TRP-000001", "date": "2025-01-15", "meeting_point": "Pelabuhan Bakauheni", "priority": "high"}'::jsonb, false, NOW() - INTERVAL '1 day'),
            
            -- Promo notification
            (v_customer_id, 'customer', 'system.announcement', 'Diskon Spesial untuk Anda!',
             'Gunakan kode HAPPY2025 untuk diskon 10% booking berikutnya!',
             '{"promo_code": "HAPPY2025", "discount": "10%", "valid_until": "2025-01-31"}'::jsonb, false, NOW() - INTERVAL '10 days'),
            
            -- Review request
            (v_customer_id, 'customer', 'trip.status_changed', 'Bagaimana Trip Anda?',
             'Terima kasih sudah memilih kami! Yuk berikan review untuk trip Pahawang Anda.',
             '{"trip_code": "TRP-000001", "action": "review"}'::jsonb, false, NOW() - INTERVAL '3 days'),
            
            -- Welcome notification
            (v_customer_id, 'customer', 'customer.created', 'Selamat Datang!',
             'Selamat datang di MyAeroTravel! Jelajahi paket wisata terbaik kami.',
             '{"action": "explore"}'::jsonb, true, NOW() - INTERVAL '30 days')
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Customer notifications seeded';
    ELSE
        RAISE NOTICE 'No customer user found, skipping customer notifications';
    END IF;
    
    -- ============================================
    -- 5. CORPORATE NOTIFICATIONS
    -- ============================================
    
    IF v_corporate_id IS NOT NULL THEN
        INSERT INTO unified_notifications (user_id, app, type, title, message, metadata, read, created_at)
        VALUES
            -- Approval notification
            (v_corporate_id, 'corporate', 'corporate.approval_approved', 'Booking Disetujui',
             'Request booking BK-CORP-001 telah disetujui oleh Manager.',
             '{"booking_code": "BK-CORP-001", "approved_by": "Manager HRD"}'::jsonb, true, NOW() - INTERVAL '3 days'),
            
            -- Budget warning
            (v_corporate_id, 'corporate', 'corporate.budget_threshold', 'Peringatan Budget',
             'Budget perjalanan Q1 2025 tersisa 20%. Pertimbangkan untuk mengajukan tambahan budget.',
             '{"remaining_percentage": 20, "budget_name": "Q1 2025", "priority": "high"}'::jsonb, false, NOW() - INTERVAL '2 days'),
            
            -- New employee notification
            (v_corporate_id, 'corporate', 'customer.created', 'Karyawan Baru Ditambahkan',
             '5 karyawan baru telah ditambahkan ke daftar traveler perusahaan.',
             '{"count": 5}'::jsonb, true, NOW() - INTERVAL '7 days'),
            
            -- Invoice notification
            (v_corporate_id, 'corporate', 'payment.received', 'Invoice Tersedia',
             'Invoice INV-2024-012 untuk bulan Desember 2024 telah tersedia untuk diunduh.',
             '{"invoice_number": "INV-2024-012", "amount": 15000000}'::jsonb, false, NOW() - INTERVAL '5 days'),
            
            -- Report notification
            (v_corporate_id, 'corporate', 'system.announcement', 'Laporan Bulanan',
             'Laporan perjalanan bulan Desember 2024 telah tersedia.',
             '{"report_month": "December 2024", "action": "download"}'::jsonb, false, NOW() - INTERVAL '4 days')
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Corporate notifications seeded';
    ELSE
        RAISE NOTICE 'No corporate user found, skipping corporate notifications';
    END IF;
    
    -- ============================================
    -- 6. OPS ADMIN NOTIFICATIONS
    -- ============================================
    
    IF v_ops_admin_id IS NOT NULL THEN
        INSERT INTO unified_notifications (user_id, app, type, title, message, metadata, read, created_at)
        VALUES
            -- Trip alert
            (v_ops_admin_id, 'admin', 'trip.status_changed', 'Trip Selesai',
             'Trip TRP-000001 telah selesai. Laporan expense tersedia untuk review.',
             '{"trip_code": "TRP-000001", "status": "completed"}'::jsonb, false, NOW() - INTERVAL '3 hours'),
            
            -- Booking alert
            (v_ops_admin_id, 'admin', 'booking.created', 'Booking Baru',
             '3 booking baru hari ini membutuhkan konfirmasi ketersediaan.',
             '{"count": 3, "action": "review", "priority": "high"}'::jsonb, false, NOW() - INTERVAL '1 hour'),
            
            -- Guide alert
            (v_ops_admin_id, 'admin', 'guide.contract_signed', 'Lisensi Guide Expired',
             'Lisensi guide Ahmad Rizki akan expired dalam 30 hari.',
             '{"guide_name": "Ahmad Rizki", "expires_in_days": 30, "priority": "high"}'::jsonb, false, NOW() - INTERVAL '1 day')
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Ops admin notifications seeded';
    END IF;

    RAISE NOTICE 'Unified notifications seeded successfully';
END $$;

-- Summary
DO $$
DECLARE
    total_count INTEGER;
    admin_count INTEGER;
    partner_count INTEGER;
    guide_count INTEGER;
    customer_count INTEGER;
    corporate_count INTEGER;
BEGIN
    SELECT count(*) INTO total_count FROM unified_notifications;
    SELECT count(*) INTO admin_count FROM unified_notifications WHERE app = 'admin';
    SELECT count(*) INTO partner_count FROM unified_notifications WHERE app = 'partner';
    SELECT count(*) INTO guide_count FROM unified_notifications WHERE app = 'guide';
    SELECT count(*) INTO customer_count FROM unified_notifications WHERE app = 'customer';
    SELECT count(*) INTO corporate_count FROM unified_notifications WHERE app = 'corporate';
    
    RAISE NOTICE 'Unified notifications summary:';
    RAISE NOTICE '  - Total: %', total_count;
    RAISE NOTICE '  - Admin: %', admin_count;
    RAISE NOTICE '  - Partner: %', partner_count;
    RAISE NOTICE '  - Guide: %', guide_count;
    RAISE NOTICE '  - Customer: %', customer_count;
    RAISE NOTICE '  - Corporate: %', corporate_count;
END $$;
