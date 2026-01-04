-- Guide App Seed Data
-- Comprehensive seed data for guide_challenges, guide_promos, guide_quick_actions, and guide_menu_items
-- Created: 2025-01-25
--
-- Usage:
--   psql -d your_database -f scripts/seed/guide-app-data.sql
--   OR run via Supabase SQL Editor

BEGIN;

-- ============================================
-- GUIDE QUICK ACTIONS (Default Actions)
-- ============================================
-- Note: These are global (branch_id = NULL) so they appear for all branches
INSERT INTO guide_quick_actions (branch_id, href, label, icon_name, color, description, display_order, is_active) VALUES
  (NULL, '/guide/attendance', 'Absensi', 'MapPin', 'bg-emerald-500', 'Check-in lokasi', 1, true),
  (NULL, '/guide/trips', 'Trip Saya', 'Calendar', 'bg-blue-500', 'Lihat jadwal trip', 2, true),
  (NULL, '/guide/manifest', 'Manifest', 'ClipboardList', 'bg-indigo-500', 'Cek tamu', 3, true),
  (NULL, '/guide/wallet', 'Dompet', 'Wallet', 'bg-amber-500', 'Saldo & pendapatan', 4, true),
  (NULL, '/guide/sos', 'SOS', 'AlertTriangle', 'bg-red-500', 'Darurat', 5, true),
  (NULL, '/guide/insights', 'Insight', 'BarChart3', 'bg-purple-500', 'Ringkasan performa', 6, true),
  (NULL, '/guide/status', 'Status', 'Clock', 'bg-slate-700', 'Atur ketersediaan', 7, true),
  (NULL, '/guide/training', 'Pelatihan', 'GraduationCap', 'bg-teal-500', 'Modul pelatihan', 8, true),
  (NULL, '/guide/crew/directory', 'Crew', 'Users', 'bg-cyan-500', 'Direktori guide', 9, true),
  (NULL, '/guide/notifications', 'Notifikasi', 'Bell', 'bg-pink-500', 'Pemberitahuan', 10, true)
ON CONFLICT DO NOTHING;

-- ============================================
-- GUIDE MENU ITEMS (Default Menu Items)
-- ============================================
-- Note: These are global (branch_id = NULL) so they appear for all branches
INSERT INTO guide_menu_items (branch_id, section, href, label, icon_name, description, display_order, is_active) VALUES
  -- Akun Section (6 items)
  (NULL, 'Akun', '/guide/profile/edit', 'Edit Profil', 'User', 'Ubah informasi profil', 1, true),
  (NULL, 'Akun', '/guide/contracts', 'Kontrak Kerja', 'FileText', 'Lihat dan kelola kontrak kerja Anda', 2, true),
  (NULL, 'Akun', '/guide/id-card', 'ID Card', 'CreditCard', 'Kartu identitas guide', 3, true),
  (NULL, 'Akun', '/guide/profile/password', 'Ubah Password', 'Lock', 'Ganti kata sandi', 4, true),
  (NULL, 'Akun', '/guide/insights', 'Insight & Performance', 'BarChart3', 'Analisis performa lengkap, trend bulanan, dan rekomendasi', 5, true),
  (NULL, 'Akun', '/guide/rewards', 'Reward Points', 'Gift', 'Poin reward, katalog, dan riwayat penukaran', 6, true),
  
  -- Pembelajaran Section (3 items)
  (NULL, 'Pembelajaran', '/guide/onboarding', 'Onboarding', 'GraduationCap', 'Lengkapi onboarding untuk memulai', 1, true),
  (NULL, 'Pembelajaran', '/guide/training', 'Training', 'GraduationCap', 'Modul pelatihan dan sertifikasi', 2, true),
  (NULL, 'Pembelajaran', '/guide/learning', 'Learning Hub', 'BookOpen', 'Panduan, SOP, dan tips untuk Guide', 3, true),
  
  -- Dukungan Section (4 items)
  (NULL, 'Dukungan', '/guide/notifications', 'Notifikasi', 'Bell', 'Pemberitahuan penting', 1, true),
  (NULL, 'Dukungan', '/guide/sos', 'SOS Emergency', 'AlertTriangle', 'Tombol darurat', 2, true),
  (NULL, 'Dukungan', '/guide/feedback/new', 'Beri Feedback', 'MessageSquare', 'Kirim masukan', 3, true),
  (NULL, 'Dukungan', '/help', 'Bantuan', 'HelpCircle', 'Pusat bantuan dan FAQ', 4, true),
  
  -- Pengaturan Section (3 items)
  (NULL, 'Pengaturan', '/guide/settings', 'Pengaturan & Preferensi', 'Settings', 'Pengaturan aplikasi dan preferensi kerja', 1, true),
  (NULL, 'Pengaturan', '/legal/privacy', 'Kebijakan Privasi', 'Shield', 'Kebijakan privasi', 3, true),
  (NULL, 'Pengaturan', '/legal/terms', 'Syarat & Ketentuan', 'FileText', 'Syarat dan ketentuan', 4, true)
ON CONFLICT DO NOTHING;

-- ============================================
-- GUIDE CHALLENGES (Default Challenges)
-- ============================================
-- Note: These will be created per guide automatically by the API,
-- but we can create sample challenges for testing
-- This assumes there's at least one guide user in the system
DO $$
DECLARE
  sample_guide_id UUID;
  challenge_start_date DATE := CURRENT_DATE;
  challenge_target_date DATE := CURRENT_DATE + INTERVAL '30 days';
BEGIN
  -- Get first guide user
  SELECT id INTO sample_guide_id FROM users WHERE role = 'guide' LIMIT 1;
  
  IF sample_guide_id IS NULL THEN
    RAISE NOTICE 'No guide user found, skipping challenge seed data';
  ELSE
    -- Sample challenges for the first guide
    INSERT INTO guide_challenges (guide_id, challenge_type, title, description, target_value, current_value, start_date, target_date, status, reward_description)
    VALUES
      (sample_guide_id, 'trip_count', 'Complete 10 Trips', 'Selesaikan 10 trip dalam sebulan', 10, 0, challenge_start_date, challenge_target_date, 'active', 'Bonus Rp 500.000'),
      (sample_guide_id, 'rating', 'Maintain 4.5 Rating', 'Pertahankan rating minimal 4.5', 4.5, 0, challenge_start_date, challenge_target_date, 'active', 'Bonus Rp 300.000'),
      (sample_guide_id, 'earnings', 'Earn Rp 5.000.000', 'Kumpulkan pendapatan Rp 5.000.000', 5000000, 0, challenge_start_date, challenge_target_date, 'active', 'Bonus Rp 1.000.000')
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Challenge seed data inserted for guide: %', sample_guide_id;
  END IF;
END $$;

-- ============================================
-- GUIDE PROMOS (Sample Promos & Updates)
-- ============================================
-- Note: These are global (branch_id = NULL) so they appear for all branches
INSERT INTO guide_promos (branch_id, type, title, subtitle, description, link, badge, gradient, priority, start_date, end_date, is_active) VALUES
  -- High Priority Announcement
  (NULL, 'announcement', 'Update SOP Keamanan', 'Mohon baca SOP terbaru', 'SOP keamanan telah diperbarui. Silakan baca di dashboard.', '/guide/learning', 'PENTING', 'from-red-500 to-orange-600', 'high', CURRENT_DATE - INTERVAL '2 days', NULL, true),
  
  -- Medium Priority Promo
  (NULL, 'promo', 'Bonus Trip Desember', 'Dapatkan bonus tambahan!', 'Setiap trip yang diselesaikan di bulan Desember akan mendapat bonus 10% dari fee.', '/guide/wallet', 'HOT', 'from-emerald-500 to-teal-600', 'medium', CURRENT_DATE, CURRENT_DATE + INTERVAL '10 days', true),
  
  -- Low Priority Update
  (NULL, 'update', 'Fitur Baru: Offline Map', 'Peta offline sekarang tersedia', 'Download peta untuk digunakan saat offline di menu Lokasi.', '/guide/locations', 'NEW', 'from-blue-500 to-indigo-600', 'low', CURRENT_DATE - INTERVAL '5 days', NULL, true),
  
  -- Another Promo
  (NULL, 'promo', 'Challenge Bulanan', 'Ikuti challenge dan menang hadiah', 'Selesaikan 15 trip dalam sebulan dan dapatkan hadiah spesial.', '/guide/challenges', 'REWARD', 'from-purple-500 to-pink-600', 'medium', CURRENT_DATE, CURRENT_DATE + INTERVAL '20 days', true)
ON CONFLICT DO NOTHING;

COMMIT;

-- ============================================
-- VERIFICATION QUERIES (Optional)
-- ============================================
-- Run these to verify seed data was inserted:
-- SELECT COUNT(*) FROM guide_quick_actions WHERE is_active = true;
-- SELECT COUNT(*) FROM guide_menu_items WHERE is_active = true;
-- SELECT COUNT(*) FROM guide_challenges;
-- SELECT COUNT(*) FROM guide_promos WHERE is_active = true;

