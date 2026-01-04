-- Migration: 025-guide-menu-improvements.sql
-- Description: Add missing menu items and improve quick actions priority
-- Created: 2025-12-19

BEGIN;

-- ============================================
-- ADD MISSING MENU ITEMS
-- ============================================

-- Add missing items to Akun section
INSERT INTO guide_menu_items (branch_id, section, href, label, icon_name, description, display_order)
SELECT * FROM (VALUES
  (NULL::uuid, 'Akun', '/guide/profile/password', 'Ubah Password', 'Lock', 'Ganti kata sandi', 3),
  (NULL::uuid, 'Akun', '/guide/profile/notifications', 'Notifikasi', 'Bell', 'Pengaturan notifikasi', 4)
) AS v(branch_id, section, href, label, icon_name, description, display_order)
WHERE NOT EXISTS (
  SELECT 1 FROM guide_menu_items 
  WHERE guide_menu_items.href = v.href 
    AND guide_menu_items.section = v.section
    AND (guide_menu_items.branch_id = v.branch_id OR (guide_menu_items.branch_id IS NULL AND v.branch_id IS NULL))
);

-- Add missing items to Operasional section
INSERT INTO guide_menu_items (branch_id, section, href, label, icon_name, description, display_order)
SELECT * FROM (VALUES
  (NULL::uuid, 'Operasional', '/guide/trips/history', 'Riwayat Trip', 'History', 'Lihat riwayat trip', 4),
  (NULL::uuid, 'Operasional', '/guide/wallet', 'Pendapatan', 'Wallet', 'Lihat pendapatan dan saldo', 5)
) AS v(branch_id, section, href, label, icon_name, description, display_order)
WHERE NOT EXISTS (
  SELECT 1 FROM guide_menu_items 
  WHERE guide_menu_items.href = v.href 
    AND guide_menu_items.section = v.section
    AND (guide_menu_items.branch_id = v.branch_id OR (guide_menu_items.branch_id IS NULL AND v.branch_id IS NULL))
);

-- Add missing items to Pengaturan section
INSERT INTO guide_menu_items (branch_id, section, href, label, icon_name, description, display_order)
SELECT * FROM (VALUES
  (NULL::uuid, 'Pengaturan', '/guide/settings/language', 'Bahasa', 'Globe', 'Pilih bahasa', 5)
) AS v(branch_id, section, href, label, icon_name, description, display_order)
WHERE NOT EXISTS (
  SELECT 1 FROM guide_menu_items 
  WHERE guide_menu_items.href = v.href 
    AND guide_menu_items.section = v.section
    AND (guide_menu_items.branch_id = v.branch_id OR (guide_menu_items.branch_id IS NULL AND v.branch_id IS NULL))
);

-- ============================================
-- UPDATE QUICK ACTIONS PRIORITY (via display_order)
-- ============================================
-- Reorder quick actions to prioritize most important ones
-- Lower display_order = higher priority (shown first)

UPDATE guide_quick_actions
SET display_order = CASE
  WHEN href = '/guide/sos' THEN 1
  WHEN href = '/guide/trips' THEN 2
  WHEN href = '/guide/insights' THEN 3
  WHEN href = '/guide/wallet' THEN 4
  WHEN href = '/guide/status' THEN 5
  WHEN href = '/guide/broadcasts' THEN 6
  WHEN href = '/guide/incidents' THEN 7
  WHEN href = '/guide/preferences' THEN 8
  WHEN href = '/guide/locations' THEN 9
  ELSE display_order
END
WHERE branch_id IS NULL; -- Only update global actions

COMMIT;
