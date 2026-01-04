-- Migration: 028-guide-profile-menu-reorganization.sql
-- Description: Reorganize guide profile menu sesuai standar industri
-- Created: 2025-12-20
-- 
-- Perubahan:
-- 1. Hapus menu redundan: Pendapatan (sudah ada widget dompet), Riwayat Trip (sudah ada di menu utama)
-- 2. Tambahkan menu Learning Hub ke profile
-- 3. Reorganisasi menu sesuai best practices

BEGIN;

-- ============================================
-- HAPUS MENU REDUNDAN
-- ============================================

-- Hapus "Pendapatan" (sudah ada widget dompet di profile header)
UPDATE guide_menu_items
SET is_active = false
WHERE href = '/guide/wallet' 
  AND section = 'Operasional'
  AND branch_id IS NULL;

-- Hapus "Riwayat Trip" (sudah ada di menu utama trips)
UPDATE guide_menu_items
SET is_active = false
WHERE href = '/guide/trips/history' 
  AND section = 'Operasional'
  AND branch_id IS NULL;

-- ============================================
-- TAMBAHKAN MENU LEARNING HUB
-- ============================================

-- Tambahkan Learning Hub ke section "Pembelajaran" (section baru)
INSERT INTO guide_menu_items (branch_id, section, href, label, icon_name, description, display_order)
SELECT * FROM (VALUES
  (NULL::uuid, 'Pembelajaran', '/guide/learning', 'Learning Hub', 'HelpCircle', 'Panduan, SOP, dan tips untuk Guide', 1)
) AS v(branch_id, section, href, label, icon_name, description, display_order)
WHERE NOT EXISTS (
  SELECT 1 FROM guide_menu_items 
  WHERE guide_menu_items.href = v.href 
    AND guide_menu_items.section = v.section
    AND (guide_menu_items.branch_id = v.branch_id OR (guide_menu_items.branch_id IS NULL AND v.branch_id IS NULL))
);

-- ============================================
-- REORGANISASI MENU ITEMS
-- ============================================

-- Update display_order untuk menu yang sudah ada agar lebih terorganisir
-- Akun Section
UPDATE guide_menu_items
SET display_order = CASE
  WHEN href = '/guide/profile/edit' THEN 1
  WHEN href = '/guide/ratings' THEN 2
  WHEN href = '/guide/profile/password' THEN 3
  WHEN href = '/guide/profile/notifications' THEN 4
  ELSE display_order
END
WHERE section = 'Akun' AND branch_id IS NULL;

-- Operasional Section (setelah hapus redundan)
UPDATE guide_menu_items
SET display_order = CASE
  WHEN href = '/guide/insights' THEN 1
  WHEN href = '/guide/broadcasts' THEN 2
  WHEN href = '/guide/incidents' THEN 3
  ELSE display_order
END
WHERE section = 'Operasional' AND branch_id IS NULL AND is_active = true;

-- Pengaturan Section
UPDATE guide_menu_items
SET display_order = CASE
  WHEN href = '/guide/settings' THEN 1
  WHEN href = '/guide/documents' THEN 2
  WHEN href = '/legal/privacy' THEN 3
  WHEN href = '/help' THEN 4
  WHEN href = '/guide/settings/language' THEN 5
  ELSE display_order
END
WHERE section = 'Pengaturan' AND branch_id IS NULL;

COMMIT;
