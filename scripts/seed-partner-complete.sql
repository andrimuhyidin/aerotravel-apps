-- ============================================
-- Seed Partner Portal Complete Data
-- Description: Sample partner broadcasts, support tickets, referrals, activity logs
-- Created: 2025-01-04
-- ============================================

DO $$
DECLARE
    v_partner_id UUID := 'c275147e-03e2-4ba4-bfef-72a7a071018e'; -- Partner Demo
BEGIN
    -- ============================================
    -- 1. PARTNER BROADCASTS
    -- ============================================
    
    INSERT INTO partner_broadcasts (partner_id, name, template_name, audience_filter, recipient_count, sent_count, failed_count, status, scheduled_at, sent_at)
    VALUES
        (v_partner_id, 'Promo Natal 2024', 'promo_holiday', '{"segment": "all"}', 150, 145, 5, 'completed', NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days'),
        (v_partner_id, 'Promo Tahun Baru 2025', 'promo_new_year', '{"segment": "vip"}', 50, 48, 2, 'completed', NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days'),
        (v_partner_id, 'Flash Sale Weekend', 'flash_sale', '{"segment": "active"}', 80, 0, 0, 'scheduled', NOW() + INTERVAL '2 days', NULL),
        (v_partner_id, 'Follow Up Customer', 'follow_up', '{"last_booking_days_ago": 30}', 25, 0, 0, 'draft', NULL, NULL),
        (v_partner_id, 'Reminder Pembayaran', 'payment_reminder', '{"payment_status": "pending"}', 10, 10, 0, 'completed', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days')
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Partner broadcasts seeded';

    -- ============================================
    -- 2. PARTNER SUPPORT TICKETS
    -- ============================================
    
    INSERT INTO partner_support_tickets (partner_id, user_id, subject, description, category, status, priority, messages, first_response_at, resolved_at)
    VALUES
        -- Resolved tickets
        (v_partner_id, v_partner_id, 'Gagal top up wallet', 'Saya sudah transfer tapi saldo tidak bertambah. Bukti transfer terlampir.', 'billing', 'resolved', 'high', 
         '[{"role": "user", "message": "Saya sudah transfer tapi saldo tidak bertambah.", "timestamp": "2024-12-20T10:30:00Z"}, {"role": "admin", "message": "Terima kasih sudah menghubungi. Kami akan cek dan konfirmasi dalam 1x24 jam.", "timestamp": "2024-12-20T11:00:00Z"}, {"role": "admin", "message": "Saldo sudah ditambahkan. Silakan cek wallet Anda.", "timestamp": "2024-12-20T14:30:00Z"}]',
         NOW() - INTERVAL '25 days', NOW() - INTERVAL '25 days'),
        
        (v_partner_id, v_partner_id, 'Ubah data booking', 'Mohon bantu ubah tanggal trip booking BK-000005 dari 15 Jan ke 17 Jan.', 'booking', 'resolved', 'normal',
         '[{"role": "user", "message": "Mohon ubah tanggal trip.", "timestamp": "2024-12-22T09:00:00Z"}, {"role": "admin", "message": "Baik, akan kami proses. Mohon tunggu.", "timestamp": "2024-12-22T10:00:00Z"}, {"role": "admin", "message": "Perubahan sudah diproses. Tanggal baru: 17 Januari 2025.", "timestamp": "2024-12-22T11:30:00Z"}]',
         NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days'),
        
        -- In progress tickets
        (v_partner_id, v_partner_id, 'Request harga khusus grup 50 pax', 'Ada customer mau booking 50 orang untuk Pahawang 3D2N. Mohon info harga khusus.', 'quotation', 'in_progress', 'normal',
         '[{"role": "user", "message": "Request harga khusus untuk 50 pax.", "timestamp": "2025-01-02T08:00:00Z"}, {"role": "admin", "message": "Terima kasih. Kami akan siapkan quotation dan kirim via email.", "timestamp": "2025-01-02T09:30:00Z"}]',
         NOW() - INTERVAL '2 days', NULL),
        
        -- Submitted (new) tickets
        (v_partner_id, v_partner_id, 'Akses dashboard error', 'Tidak bisa akses halaman statistik, muncul error 500.', 'technical', 'submitted', 'high',
         '[{"role": "user", "message": "Tidak bisa akses halaman statistik.", "timestamp": "2025-01-04T07:00:00Z"}]',
         NULL, NULL),
        
        (v_partner_id, v_partner_id, 'Request materi marketing', 'Mohon dikirim foto-foto HD dan video untuk paket Krakatau terbaru.', 'marketing', 'submitted', 'low',
         '[{"role": "user", "message": "Butuh materi marketing paket Krakatau.", "timestamp": "2025-01-04T06:00:00Z"}]',
         NULL, NULL)
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Partner support tickets seeded';

    -- ============================================
    -- 3. PARTNER REFERRALS
    -- ============================================
    
    -- Seed partner_referrals (requires referred_id NOT NULL, uses points_awarded)
    -- Insert referrals using customer users as referred (simulates partner referral to customers)
    INSERT INTO partner_referrals (referrer_id, referred_id, status, referral_code, points_awarded, awarded_at)
    SELECT
        v_partner_id,
        u.id,
        'approved',
        'REF-' || substring(u.id::text from 1 for 8),
        100,
        NOW() - INTERVAL '15 days'
    FROM users u
    WHERE u.id != v_partner_id
    AND u.role = 'customer'
    AND NOT EXISTS (
        SELECT 1 FROM partner_referrals pr 
        WHERE pr.referred_id = u.id  -- UNIQUE constraint on referred_id
    )
    LIMIT 3
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Partner referrals seeded';

    -- ============================================
    -- 4. PARTNER ACTIVITY LOGS
    -- ============================================
    
    -- Actual schema: partner_id, user_id, action_type, entity_type, entity_id, details, ip_address, user_agent
    INSERT INTO partner_activity_logs (partner_id, user_id, action_type, entity_type, details, ip_address, user_agent, created_at)
    VALUES
        (v_partner_id, v_partner_id, 'login', 'session', '{"device": "Chrome/Windows"}', '103.28.12.45'::inet, 'Mozilla/5.0 Chrome/120.0', NOW() - INTERVAL '3 days'),
        (v_partner_id, v_partner_id, 'create', 'booking', '{"booking_code": "BK-000010", "amount": 2500000}', '103.28.12.45'::inet, 'Mozilla/5.0 Chrome/120.0', NOW() - INTERVAL '3 days'),
        (v_partner_id, v_partner_id, 'topup', 'wallet', '{"amount": 5000000, "method": "bank_transfer"}', '103.28.12.45'::inet, 'Mozilla/5.0 Chrome/120.0', NOW() - INTERVAL '5 days'),
        (v_partner_id, v_partner_id, 'send', 'broadcast', '{"name": "Promo Tahun Baru", "recipients": 48}', '103.28.12.45'::inet, 'Mozilla/5.0 Chrome/120.0', NOW() - INTERVAL '15 days'),
        (v_partner_id, v_partner_id, 'login', 'session', '{"device": "Safari/iPhone"}', '103.28.12.45'::inet, 'Mozilla/5.0 Safari/17.0', NOW() - INTERVAL '2 days'),
        (v_partner_id, v_partner_id, 'create', 'booking', '{"booking_code": "BK-000011", "amount": 3200000}', '103.28.12.45'::inet, 'Mozilla/5.0 Chrome/120.0', NOW() - INTERVAL '2 days'),
        (v_partner_id, v_partner_id, 'create', 'customer', '{"name": "Budi Santoso", "phone": "081234567890"}', '103.28.12.45'::inet, 'Mozilla/5.0 Chrome/120.0', NOW() - INTERVAL '2 days'),
        (v_partner_id, v_partner_id, 'login', 'session', '{"device": "Chrome/Windows"}', '103.28.12.45'::inet, 'Mozilla/5.0 Chrome/120.0', NOW() - INTERVAL '1 day'),
        (v_partner_id, v_partner_id, 'create', 'support_ticket', '{"subject": "Request harga khusus grup 50 pax"}', '103.28.12.45'::inet, 'Mozilla/5.0 Chrome/120.0', NOW() - INTERVAL '2 days'),
        (v_partner_id, v_partner_id, 'login', 'session', '{"device": "Chrome/Windows"}', '103.28.12.45'::inet, 'Mozilla/5.0 Chrome/120.0', NOW())
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Partner activity logs seeded';

    RAISE NOTICE 'Partner complete data seeded successfully';
END $$;

-- Summary
DO $$
DECLARE
    broadcast_count INTEGER;
    ticket_count INTEGER;
BEGIN
    SELECT count(*) INTO broadcast_count FROM partner_broadcasts;
    SELECT count(*) INTO ticket_count FROM partner_support_tickets;
    
    RAISE NOTICE 'Partner portal data seeded:';
    RAISE NOTICE '  - Partner broadcasts: %', broadcast_count;
    RAISE NOTICE '  - Partner support tickets: %', ticket_count;
END $$;

