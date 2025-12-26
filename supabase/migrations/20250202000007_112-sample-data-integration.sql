/**
 * Migration: Sample Data for Cross-App Integration Testing
 * Description: Create sample data untuk testing unified notifications, events, dan real-time sync
 * Created: 2025-02-02
 * 
 * NOTE: This creates sample data for testing purposes only
 */

-- ============================================
-- SAMPLE PARTNER CUSTOMERS
-- ============================================

-- Get first partner user
DO $$
DECLARE
  sample_partner_id UUID;
  customer_count INTEGER;
BEGIN
  -- Get first partner user
  SELECT id INTO sample_partner_id
  FROM users
  WHERE role = 'mitra'
  LIMIT 1;

  IF sample_partner_id IS NULL THEN
    RAISE NOTICE 'No partner user found, skipping partner customers sample data';
    RETURN;
  END IF;

  -- Check existing customers
  SELECT COUNT(*) INTO customer_count
  FROM partner_customers
  WHERE partner_id = sample_partner_id;

  -- Only insert if no customers exist
  IF customer_count = 0 THEN
    INSERT INTO partner_customers (partner_id, name, email, phone, segment, created_at)
    VALUES
      (sample_partner_id, 'Ahmad Fadli', 'ahmad.fadli@example.com', '081234567890', 'premium', NOW() - INTERVAL '30 days'),
      (sample_partner_id, 'Siti Nurhaliza', 'siti.nurhaliza@example.com', '081234567891', 'regular', NOW() - INTERVAL '25 days'),
      (sample_partner_id, 'Budi Santoso', 'budi.santoso@example.com', '081234567892', 'regular', NOW() - INTERVAL '20 days'),
      (sample_partner_id, 'Dewi Sartika', 'dewi.sartika@example.com', '081234567893', 'premium', NOW() - INTERVAL '15 days'),
      (sample_partner_id, 'Rudi Hartono', 'rudi.hartono@example.com', '081234567894', 'regular', NOW() - INTERVAL '10 days'),
      (sample_partner_id, 'Maya Sari', 'maya.sari@example.com', '081234567895', 'premium', NOW() - INTERVAL '5 days'),
      (sample_partner_id, 'Indra Gunawan', 'indra.gunawan@example.com', '081234567896', 'regular', NOW() - INTERVAL '3 days'),
      (sample_partner_id, 'Lina Wijaya', 'lina.wijaya@example.com', '081234567897', 'premium', NOW() - INTERVAL '2 days'),
      (sample_partner_id, 'Agus Prasetyo', 'agus.prasetyo@example.com', '081234567898', 'regular', NOW() - INTERVAL '1 day'),
      (sample_partner_id, 'Rina Kartika', 'rina.kartika@example.com', '081234567899', 'premium', NOW())
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Created 10 sample partner customers';
  ELSE
    RAISE NOTICE 'Partner customers already exist, skipping sample data';
  END IF;
END $$;

-- ============================================
-- SAMPLE UNIFIED NOTIFICATIONS
-- ============================================

-- Create sample notifications untuk testing UI
DO $$
DECLARE
  sample_user_id UUID;
  notification_count INTEGER;
BEGIN
  -- Get first partner user
  SELECT id INTO sample_user_id
  FROM users
  WHERE role = 'mitra'
  LIMIT 1;

  IF sample_user_id IS NULL THEN
    RAISE NOTICE 'No partner user found, skipping notifications sample data';
    RETURN;
  END IF;

  -- Check existing notifications
  SELECT COUNT(*) INTO notification_count
  FROM unified_notifications
  WHERE user_id = sample_user_id;

  -- Only insert if no notifications exist
  IF notification_count = 0 THEN
    INSERT INTO unified_notifications (user_id, app, type, title, message, metadata, read, created_at)
    VALUES
      (sample_user_id, 'partner', 'booking.created', 'Booking Baru Dibuat', 'Booking BK-20250201-001 telah berhasil dibuat untuk Ahmad Fadli', '{"bookingId": "sample-1", "bookingCode": "BK-20250201-001"}'::jsonb, false, NOW() - INTERVAL '2 days'),
      (sample_user_id, 'partner', 'payment.received', 'Pembayaran Diterima', 'Pembayaran untuk booking BK-20250201-001 sebesar Rp 2.500.000 telah diterima', '{"bookingId": "sample-1", "amount": 2500000}'::jsonb, false, NOW() - INTERVAL '1 day'),
      (sample_user_id, 'partner', 'booking.status_changed', 'Status Booking Diperbarui', 'Status booking BK-20250201-001 telah berubah menjadi confirmed', '{"bookingId": "sample-1", "newStatus": "confirmed"}'::jsonb, true, NOW() - INTERVAL '12 hours'),
      (sample_user_id, 'partner', 'booking.created', 'Booking Baru Dibuat', 'Booking BK-20250201-002 telah berhasil dibuat untuk Siti Nurhaliza', '{"bookingId": "sample-2", "bookingCode": "BK-20250201-002"}'::jsonb, false, NOW() - INTERVAL '6 hours'),
      (sample_user_id, 'partner', 'system.announcement', 'Pengumuman Sistem', 'Maintenance jadwal akan dilakukan pada tanggal 5 Februari 2025 pukul 02:00 - 04:00 WIB', '{}'::jsonb, false, NOW() - INTERVAL '3 hours')
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Created 5 sample unified notifications';
  ELSE
    RAISE NOTICE 'Unified notifications already exist, skipping sample data';
  END IF;
END $$;

-- ============================================
-- VERIFICATION
-- ============================================

DO $$
DECLARE
  partner_customers_count INTEGER;
  notifications_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO partner_customers_count FROM partner_customers;
  SELECT COUNT(*) INTO notifications_count FROM unified_notifications;

  RAISE NOTICE 'Sample data summary:';
  RAISE NOTICE '  - Partner customers: %', partner_customers_count;
  RAISE NOTICE '  - Unified notifications: %', notifications_count;
END $$;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE partner_customers IS 'Sample data created for testing cross-app integration';
COMMENT ON TABLE unified_notifications IS 'Sample notifications created for testing unified notification system';

