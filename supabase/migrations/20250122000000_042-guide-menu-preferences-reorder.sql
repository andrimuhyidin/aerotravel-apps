-- Migration: 042-guide-menu-preferences-reorder.sql
-- Description: 
--   1. Remove "Pengaturan Bahasa" menu (redundant, already in preferences)
--   2. Move "Preferensi" menu after "Pengaturan Aplikasi" (order 2)
--   3. Add "Insight & Performance" menu to Akun section after ID Card Guide
-- Date: 2025-01-22

BEGIN;

-- ============================================
-- 1. REMOVE "PENGATURAN BAHASA" MENU
-- ============================================
-- Pengaturan Bahasa is redundant because language settings 
-- are already available in preferences page

UPDATE guide_menu_items
SET is_active = false
WHERE href = '/guide/settings#language'
  AND section = 'Pengaturan'
  AND label = 'Pengaturan Bahasa';

-- ============================================
-- 2. REORDER PENGATURAN SECTION
-- ============================================
-- New order:
--   1. Pengaturan Aplikasi (/guide/settings)
--   2. Preferensi (/guide/preferences) - moved here
--   3. Kebijakan Privasi (/legal/privacy)
--   4. Syarat & Ketentuan (/legal/terms) - if exists

-- Update Pengaturan Aplikasi (keep order 1)
UPDATE guide_menu_items
SET display_order = 1,
    label = 'Pengaturan Aplikasi'
WHERE href = '/guide/settings'
  AND section = 'Pengaturan';

-- Update Preferensi (move to order 2, after Pengaturan Aplikasi)
UPDATE guide_menu_items
SET display_order = 2
WHERE href = '/guide/preferences'
  AND section = 'Pengaturan';

-- Update Kebijakan Privasi (move to order 3)
UPDATE guide_menu_items
SET display_order = 3
WHERE href = '/legal/privacy'
  AND section = 'Pengaturan';

-- Update Syarat & Ketentuan (move to order 4, if exists)
UPDATE guide_menu_items
SET display_order = 4
WHERE href = '/legal/terms'
  AND section = 'Pengaturan';

-- ============================================
-- 3. ADD "INSIGHT & PERFORMANCE" TO AKUN SECTION
-- ============================================
-- Add Insight & Performance menu item to Akun section
-- Place it after ID Card Guide

-- First, ensure ID Card Guide is at order 5 (if exists)
UPDATE guide_menu_items
SET display_order = 5
WHERE href = '/guide/id-card'
  AND section = 'Akun';

-- Insert or update Insight & Performance menu item (order 6, after ID Card)
-- Use INSERT with WHERE NOT EXISTS to avoid conflicts
INSERT INTO guide_menu_items (branch_id, section, href, label, icon_name, description, display_order, is_active)
SELECT * FROM (VALUES
  (NULL::uuid, 'Akun', '/guide/insights', 'Insight & Performance', 'BarChart3', 'Analisis performa lengkap, trend bulanan, dan rekomendasi', 6, true)
) AS v(branch_id, section, href, label, icon_name, description, display_order, is_active)
WHERE NOT EXISTS (
  SELECT 1 FROM guide_menu_items 
  WHERE guide_menu_items.href = v.href 
    AND guide_menu_items.section = v.section
    AND (guide_menu_items.branch_id = v.branch_id OR (guide_menu_items.branch_id IS NULL AND v.branch_id IS NULL))
);

-- If menu item exists in other section (e.g., "Insight Pribadi"), move it to Akun
UPDATE guide_menu_items
SET section = 'Akun',
    display_order = 6,
    label = 'Insight & Performance',
    icon_name = 'BarChart3',
    description = 'Analisis performa lengkap, trend bulanan, dan rekomendasi',
    is_active = true
WHERE href = '/guide/insights'
  AND section != 'Akun';

COMMIT;
