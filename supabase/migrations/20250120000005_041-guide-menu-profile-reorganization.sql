-- Migration: 041-guide-menu-profile-reorganization.sql
-- Description: Reorganize guide profile menu into new structure: Akun, Support, Pengaturan
-- Date: 2025-01-XX

BEGIN;

-- ============================================
-- 1. HAPUS MENU ITEMS YANG TIDAK DIPERLUKAN LAGI
-- ============================================

-- Hapus menu yang sudah digabung atau tidak diperlukan
-- (Preferences sudah digabung ke Settings, Documents ke Edit Profile, dll)

-- ============================================
-- 2. REORGANIZE SECTION: AKUN
-- ============================================

-- Update section untuk items di Akun
UPDATE guide_menu_items
SET section = 'Akun',
    display_order = 1
WHERE href = '/guide/profile/edit';

UPDATE guide_menu_items
SET section = 'Akun',
    display_order = 2
WHERE href = '/guide/profile/password';

UPDATE guide_menu_items
SET section = 'Akun',
    display_order = 3
WHERE href = '/guide/id-card';

-- ============================================
-- 3. REORGANIZE SECTION: SUPPORT (BARU)
-- ============================================

-- Update Onboarding ke section Support
UPDATE guide_menu_items
SET section = 'Support',
    display_order = 1
WHERE href = '/guide/onboarding';

-- Update Learning Hub ke section Support
UPDATE guide_menu_items
SET section = 'Support',
    display_order = 2
WHERE href = '/guide/learning';

-- Update Feedback (Saran & Masukan) ke section Support
UPDATE guide_menu_items
SET section = 'Support',
    display_order = 3,
    label = 'Saran & Masukan'
WHERE href = '/guide/feedback';

-- Update Help (Pusat Bantuan) ke section Support
UPDATE guide_menu_items
SET section = 'Support',
    display_order = 4,
    label = 'Pusat Bantuan'
WHERE href = '/help';

-- ============================================
-- 4. REORGANIZE SECTION: PENGATURAN
-- ============================================

-- Update Settings (Pengaturan Aplikasi) ke section Pengaturan
UPDATE guide_menu_items
SET section = 'Pengaturan',
    display_order = 1,
    label = 'Pengaturan Aplikasi'
WHERE href = '/guide/settings';

-- Insert atau update Language Settings (Pengaturan Bahasa)
-- Note: Language settings mungkin sudah ada di settings page, tapi kita buat menu item terpisah
INSERT INTO guide_menu_items (branch_id, section, href, label, icon_name, description, display_order, is_active)
SELECT * FROM (VALUES
  (NULL::uuid, 'Pengaturan', '/guide/settings#language', 'Pengaturan Bahasa', 'Globe', 'Atur bahasa aplikasi', 2, true)
) AS v(branch_id, section, href, label, icon_name, description, display_order, is_active)
WHERE NOT EXISTS (
  SELECT 1 FROM guide_menu_items 
  WHERE guide_menu_items.href = v.href 
    AND guide_menu_items.section = v.section
);

-- Update Privacy Policy ke section Pengaturan
UPDATE guide_menu_items
SET section = 'Pengaturan',
    display_order = 3,
    label = 'Kebijakan Privasi'
WHERE href = '/legal/privacy';

-- Hapus Terms dari Pengaturan (tidak disebutkan di requirement baru)
-- Atau bisa tetap di Pengaturan jika diperlukan
-- UPDATE guide_menu_items
-- SET section = 'Pengaturan',
--     display_order = 4
-- WHERE href = '/legal/terms';

-- ============================================
-- 5. HAPUS MENU ITEMS YANG TIDAK DIPERLUKAN
-- ============================================

-- Hapus menu yang sudah digabung atau tidak diperlukan lagi
-- (Insights sudah di widget, Performance sudah di Insights, dll)

-- Hapus menu yang tidak disebutkan di requirement:
-- - Ratings (sudah digabung ke Insights)
-- - Preferences (sudah digabung ke Settings)
-- - Documents (sudah digabung ke Edit Profile)
-- - Incidents (sudah digabung ke Help)
-- - Assessments (sudah digabung ke Learning Hub)
-- - Skills (sudah digabung ke Learning Hub)

-- ============================================
-- 6. UPDATE LABEL UNTUK KONSISTENSI
-- ============================================

-- Pastikan label sesuai dengan requirement
UPDATE guide_menu_items
SET label = 'Edit Profile'
WHERE href = '/guide/profile/edit';

UPDATE guide_menu_items
SET label = 'Ubah Password'
WHERE href = '/guide/profile/password';

UPDATE guide_menu_items
SET label = 'ID Card Guide'
WHERE href = '/guide/id-card';

UPDATE guide_menu_items
SET label = 'Onboarding'
WHERE href = '/guide/onboarding';

UPDATE guide_menu_items
SET label = 'Learning Hub'
WHERE href = '/guide/learning';

COMMIT;
