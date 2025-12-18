-- Migration: 022-guide-sample-data.sql
-- Description: Comprehensive sample data for Guide App features
-- Created: 2025-12-19

-- ============================================
-- INSERT DEFAULT QUICK ACTIONS
-- ============================================
INSERT INTO guide_quick_actions (branch_id, href, label, icon_name, color, description, display_order) VALUES
  (NULL, '/guide/attendance', 'Absensi', 'MapPin', 'bg-emerald-500', 'Check-in lokasi', 1),
  (NULL, '/guide/manifest', 'Manifest', 'ClipboardList', 'bg-blue-500', 'Cek tamu', 2),
  (NULL, '/guide/sos', 'SOS', 'AlertTriangle', 'bg-red-500', 'Darurat', 3),
  (NULL, '/guide/insights', 'Insight', 'BarChart3', 'bg-purple-500', 'Ringkasan performa', 4),
  (NULL, '/guide/incidents', 'Insiden', 'FileText', 'bg-orange-500', 'Laporan insiden', 5),
  (NULL, '/guide/trips', 'Trip Saya', 'Calendar', 'bg-indigo-500', 'Lihat jadwal', 6),
  (NULL, '/guide/status', 'Status', 'Clock', 'bg-slate-700', 'Atur jadwal', 7),
  (NULL, '/guide/preferences', 'Preferensi', 'Settings', 'bg-blue-600', 'Pilih preferensi trip', 8),
  (NULL, '/guide/wallet', 'Dompet', 'Wallet', 'bg-amber-500', 'Saldo & pendapatan', 9),
  (NULL, '/guide/broadcasts', 'Broadcast', 'Megaphone', 'bg-teal-500', 'Info dari Ops', 10),
  (NULL, '/guide/locations', 'Lokasi', 'MapPin', 'bg-green-500', 'Peta offline', 11)
ON CONFLICT DO NOTHING;

-- ============================================
-- INSERT DEFAULT MENU ITEMS
-- ============================================
INSERT INTO guide_menu_items (branch_id, section, href, label, icon_name, description, display_order) VALUES
  -- Akun Section
  (NULL, 'Akun', '/guide/profile/edit', 'Edit Profil', 'User', 'Ubah informasi profil', 1),
  (NULL, 'Akun', '/guide/ratings', 'Rating & Ulasan', 'Star', 'Lihat penilaian customer', 2),
  
  -- Operasional Section
  (NULL, 'Operasional', '/guide/insights', 'Insight Pribadi', 'BarChart3', 'Ringkasan performa & riwayat penalty', 1),
  (NULL, 'Operasional', '/guide/broadcasts', 'Broadcast Ops', 'Megaphone', 'Info penting dari tim operasional', 2),
  (NULL, 'Operasional', '/guide/incidents', 'Laporan Insiden', 'FileText', 'Laporkan kejadian insiden', 3),
  
  -- Pengaturan Section
  (NULL, 'Pengaturan', '/guide/settings', 'Pengaturan', 'Settings', 'Pengaturan aplikasi', 1),
  (NULL, 'Pengaturan', '/guide/documents', 'Dokumen', 'FileText', 'Kelola dokumen', 2),
  (NULL, 'Pengaturan', '/legal/privacy', 'Kebijakan Privasi', 'Shield', 'Kebijakan privasi', 3),
  (NULL, 'Pengaturan', '/help', 'Bantuan', 'HelpCircle', 'Pusat bantuan', 4)
ON CONFLICT DO NOTHING;

-- ============================================
-- SAMPLE DATA FOR TESTING
-- ============================================
-- Note: This assumes branches and users already exist
-- Get first branch ID for sample data
DO $$
DECLARE
  sample_branch_id UUID;
  sample_guide_id UUID;
  sample_trip_id UUID;
  sample_booking_id UUID;
BEGIN
  -- Get first branch
  SELECT id INTO sample_branch_id FROM branches LIMIT 1;
  
  -- Get first guide user
  SELECT id INTO sample_guide_id FROM users WHERE role = 'guide' LIMIT 1;
  
  IF sample_branch_id IS NULL OR sample_guide_id IS NULL THEN
    RAISE NOTICE 'No branch or guide found, skipping sample data';
    RETURN;
  END IF;

  -- Sample trips (if trips table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trips') THEN
    SELECT id INTO sample_trip_id FROM trips WHERE branch_id = sample_branch_id LIMIT 1;
    
    -- Sample trip_guides assignment
    IF sample_trip_id IS NOT NULL THEN
      INSERT INTO trip_guides (trip_id, guide_id, status, assigned_at)
      VALUES (sample_trip_id, sample_guide_id, 'assigned', NOW())
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  -- Sample reviews (if reviews table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviews') THEN
    SELECT id INTO sample_booking_id FROM bookings WHERE branch_id = sample_branch_id LIMIT 1;
    
    IF sample_booking_id IS NOT NULL THEN
      INSERT INTO reviews (booking_id, guide_rating, overall_rating, review_text, reviewer_name, created_at)
      VALUES 
        (sample_booking_id, 5, 5, 'Guide sangat ramah dan profesional!', 'Customer Sample', NOW() - INTERVAL '5 days'),
        (sample_booking_id, 4, 4, 'Pelayanan bagus, sedikit delay di awal.', 'Customer Sample 2', NOW() - INTERVAL '3 days')
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  -- Sample guide_status (if table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guide_status') THEN
    INSERT INTO guide_status (guide_id, current_status, updated_at)
    VALUES (sample_guide_id, 'standby', NOW())
    ON CONFLICT (guide_id) DO UPDATE SET current_status = 'standby', updated_at = NOW();
  END IF;

  -- Sample broadcasts (if table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'broadcasts') THEN
    INSERT INTO broadcasts (branch_id, title, content, priority, is_active, created_by, created_at)
    VALUES 
      (sample_branch_id, 'Penting: Update SOP Keamanan', 'Mohon semua guide membaca SOP keamanan terbaru di dashboard.', 'high', true, sample_guide_id, NOW() - INTERVAL '2 days'),
      (sample_branch_id, 'Info: Libur Nasional', 'Tanggal 25 Desember libur nasional, tidak ada trip.', 'medium', true, sample_guide_id, NOW() - INTERVAL '1 day')
    ON CONFLICT DO NOTHING;
  END IF;

  RAISE NOTICE 'Sample data inserted successfully';
END $$;

