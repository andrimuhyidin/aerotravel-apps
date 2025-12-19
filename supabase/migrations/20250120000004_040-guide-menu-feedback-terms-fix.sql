-- Migration: 040-guide-menu-feedback-terms-fix.sql
-- Description: Fix feedback menu position (move to below help) and ensure terms menu appears
-- Date: 2025-01-XX

BEGIN;

-- ============================================
-- 1. PINDAH FEEDBACK KE SECTION PENGATURAN (DI BAWAH BANTUAN)
-- ============================================

-- Hapus feedback dari section Akun jika ada
DELETE FROM guide_menu_items WHERE href = '/guide/feedback' AND section = 'Akun';

-- Insert atau update feedback di section Pengaturan (di bawah bantuan)
INSERT INTO guide_menu_items (branch_id, section, href, label, icon_name, description, display_order)
SELECT * FROM (VALUES
  (NULL::uuid, 'Pengaturan', '/guide/feedback', 'Feedback & Saran', 'MessageSquare', 'Berikan feedback untuk perbaikan', 6)
) AS v(branch_id, section, href, label, icon_name, description, display_order)
WHERE NOT EXISTS (
  SELECT 1 FROM guide_menu_items 
  WHERE guide_menu_items.href = v.href
    AND guide_menu_items.section = v.section
);

-- Update jika sudah ada di section lain
UPDATE guide_menu_items
SET section = 'Pengaturan',
    display_order = 6,
    label = 'Feedback & Saran',
    icon_name = 'MessageSquare',
    description = 'Berikan feedback untuk perbaikan'
WHERE href = '/guide/feedback';

-- ============================================
-- 2. PASTIKAN SYARAT DAN KETENTUAN MUNCUL
-- ============================================

-- Update atau insert menu Syarat dan Ketentuan
-- Pastikan href benar: /legal/terms (bukan /guide/legal/terms)
INSERT INTO guide_menu_items (branch_id, section, href, label, icon_name, description, display_order)
SELECT * FROM (VALUES
  (NULL::uuid, 'Pengaturan', '/legal/terms', 'Syarat dan Ketentuan', 'FileText', 'Syarat dan ketentuan penggunaan', 7)
) AS v(branch_id, section, href, label, icon_name, description, display_order)
WHERE NOT EXISTS (
  SELECT 1 FROM guide_menu_items 
  WHERE guide_menu_items.href = v.href 
    AND guide_menu_items.section = v.section
    AND (guide_menu_items.branch_id = v.branch_id OR (guide_menu_items.branch_id IS NULL AND v.branch_id IS NULL))
);

-- Update jika sudah ada tapi section atau display_order salah
UPDATE guide_menu_items
SET section = 'Pengaturan',
    display_order = 7,
    label = 'Syarat dan Ketentuan',
    icon_name = 'FileText',
    description = 'Syarat dan ketentuan penggunaan'
WHERE href = '/legal/terms';

-- ============================================
-- 3. REORDER MENU PENGATURAN
-- ============================================

-- Pastikan urutan menu Pengaturan benar:
-- 1. Preferences (sudah digabung ke settings, jadi tidak perlu)
-- 2. Settings / Pengaturan
-- 3. Documents (sudah digabung ke edit profile, jadi tidak perlu)
-- 4. Privacy Policy / Kebijakan Privasi
-- 5. Help / Bantuan
-- 6. Feedback & Saran
-- 7. Syarat dan Ketentuan

UPDATE guide_menu_items SET display_order = 2 WHERE section = 'Pengaturan' AND href = '/guide/settings';
UPDATE guide_menu_items SET display_order = 4 WHERE section = 'Pengaturan' AND href = '/legal/privacy';
UPDATE guide_menu_items SET display_order = 5 WHERE section = 'Pengaturan' AND href = '/help';
UPDATE guide_menu_items SET display_order = 6 WHERE section = 'Pengaturan' AND href = '/guide/feedback';
UPDATE guide_menu_items SET display_order = 7 WHERE section = 'Pengaturan' AND href = '/legal/terms';

COMMIT;
