-- Migration: 037-guide-menu-cleanup-reorganization.sql
-- Description: Cleanup duplicates, reorganize menu, remove redundant items
-- Date: 2025-12-19

BEGIN;

-- ============================================
-- 1. REMOVE DUPLICATES
-- ============================================

-- Remove duplicates, keep only the first one (lowest display_order, earliest created_at)
DO $$
DECLARE
  keep_id UUID;
BEGIN
  -- Remove duplicate "Edit Profil" in Akun section
  SELECT id INTO keep_id
  FROM guide_menu_items 
  WHERE href = '/guide/profile/edit' 
    AND section = 'Akun'
  ORDER BY display_order ASC, created_at ASC
  LIMIT 1;
  
  IF keep_id IS NOT NULL THEN
    DELETE FROM guide_menu_items
    WHERE href = '/guide/profile/edit' 
      AND section = 'Akun'
      AND id != keep_id;
  END IF;

  -- Remove duplicate "Rating & Ulasan" in Akun section
  SELECT id INTO keep_id
  FROM guide_menu_items 
  WHERE href = '/guide/ratings' 
    AND section = 'Akun'
  ORDER BY display_order ASC, created_at ASC
  LIMIT 1;
  
  IF keep_id IS NOT NULL THEN
    DELETE FROM guide_menu_items
    WHERE href = '/guide/ratings' 
      AND section = 'Akun'
      AND id != keep_id;
  END IF;

  -- Remove duplicate "Insight Pribadi" in Insight Pribadi section
  -- Keep the one with label "Insight Pribadi" (not "Performance Metrics")
  SELECT id INTO keep_id
  FROM guide_menu_items 
  WHERE href = '/guide/insights' 
    AND section = 'Insight Pribadi'
    AND label = 'Insight Pribadi'
  ORDER BY display_order ASC, created_at ASC
  LIMIT 1;
  
  IF keep_id IS NOT NULL THEN
    DELETE FROM guide_menu_items
    WHERE href = '/guide/insights' 
      AND section = 'Insight Pribadi'
      AND id != keep_id;
  END IF;

  -- Remove duplicate "Broadcast Ops" in Operasional section
  SELECT id INTO keep_id
  FROM guide_menu_items 
  WHERE href = '/guide/broadcasts' 
    AND section = 'Operasional'
  ORDER BY display_order ASC, created_at ASC
  LIMIT 1;
  
  IF keep_id IS NOT NULL THEN
    DELETE FROM guide_menu_items
    WHERE href = '/guide/broadcasts' 
      AND section = 'Operasional'
      AND id != keep_id;
  END IF;

  -- Remove duplicate "Laporan Insiden" in Operasional section
  SELECT id INTO keep_id
  FROM guide_menu_items 
  WHERE href = '/guide/incidents' 
    AND section = 'Operasional'
  ORDER BY display_order ASC, created_at ASC
  LIMIT 1;
  
  IF keep_id IS NOT NULL THEN
    DELETE FROM guide_menu_items
    WHERE href = '/guide/incidents' 
      AND section = 'Operasional'
      AND id != keep_id;
  END IF;

  -- Remove duplicate "Pengaturan" in Pengaturan section
  SELECT id INTO keep_id
  FROM guide_menu_items 
  WHERE href = '/guide/settings' 
    AND section = 'Pengaturan'
  ORDER BY display_order ASC, created_at ASC
  LIMIT 1;
  
  IF keep_id IS NOT NULL THEN
    DELETE FROM guide_menu_items
    WHERE href = '/guide/settings' 
      AND section = 'Pengaturan'
      AND id != keep_id;
  END IF;

  -- Remove duplicate "Dokumen" in Pengaturan section
  SELECT id INTO keep_id
  FROM guide_menu_items 
  WHERE href = '/guide/documents' 
    AND section = 'Pengaturan'
  ORDER BY display_order ASC, created_at ASC
  LIMIT 1;
  
  IF keep_id IS NOT NULL THEN
    DELETE FROM guide_menu_items
    WHERE href = '/guide/documents' 
      AND section = 'Pengaturan'
      AND id != keep_id;
  END IF;

  -- Remove duplicate "Kebijakan Privasi" in Pengaturan section
  SELECT id INTO keep_id
  FROM guide_menu_items 
  WHERE href = '/legal/privacy' 
    AND section = 'Pengaturan'
  ORDER BY display_order ASC, created_at ASC
  LIMIT 1;
  
  IF keep_id IS NOT NULL THEN
    DELETE FROM guide_menu_items
    WHERE href = '/legal/privacy' 
      AND section = 'Pengaturan'
      AND id != keep_id;
  END IF;

  -- Remove duplicate "Bantuan" in Pengaturan section
  SELECT id INTO keep_id
  FROM guide_menu_items 
  WHERE href = '/help' 
    AND section = 'Pengaturan'
  ORDER BY display_order ASC, created_at ASC
  LIMIT 1;
  
  IF keep_id IS NOT NULL THEN
    DELETE FROM guide_menu_items
    WHERE href = '/help' 
      AND section = 'Pengaturan'
      AND id != keep_id;
  END IF;
END $$;

-- ============================================
-- 2. REMOVE REDUNDANT ITEMS
-- ============================================

-- Remove "Notifikasi" dari menu (sudah ada di Settings)
DELETE FROM guide_menu_items
WHERE href = '/guide/profile/notifications' 
  AND section = 'Akun';

-- Remove "Broadcast Ops" dari Operasional (sudah digabung ke Notifications)
DELETE FROM guide_menu_items
WHERE href = '/guide/broadcasts' 
  AND section = 'Operasional';

-- ============================================
-- 3. GABUNG PERFORMANCE KE INSIGHT PRIBADI
-- ============================================

-- Update Performance untuk menjadi sub-item atau dihapus (karena sudah terintegrasi)
-- Performance metrics sudah terintegrasi di Insight Pribadi page
-- Jadi kita bisa hapus menu item Performance, atau biarkan sebagai shortcut
-- Untuk sekarang, kita biarkan sebagai shortcut ke Insight Pribadi dengan anchor

-- Update Performance menu item untuk redirect ke Insight Pribadi
UPDATE guide_menu_items
SET href = '/guide/insights',
    label = 'Performance Metrics',
    description = 'Analisis performa terintegrasi di Insight Pribadi'
WHERE href = '/guide/performance' 
  AND section = 'Insight Pribadi';

-- ============================================
-- 4. RESTRUCTURE SECTIONS
-- ============================================

-- Gabung "Operasional" ke section lain atau hapus
-- Laporan Insiden bisa masuk ke "Pengaturan & Support" atau tetap di section sendiri
-- Untuk sekarang, kita buat section baru "Laporan & Support"

-- Update section "Operasional" menjadi "Laporan & Support"
UPDATE guide_menu_items
SET section = 'Laporan & Support'
WHERE section = 'Operasional';

-- Update section "Pengaturan" menjadi "Pengaturan & Support"
UPDATE guide_menu_items
SET section = 'Pengaturan & Support'
WHERE section = 'Pengaturan';

-- Gabung Laporan Insiden ke Pengaturan & Support (jika masih di Operasional)
UPDATE guide_menu_items
SET section = 'Pengaturan & Support',
    display_order = 6
WHERE href = '/guide/incidents' AND section != 'Pengaturan & Support';

-- ============================================
-- 5. REORDER ITEMS
-- ============================================

-- Akun & Profil (5 items)
UPDATE guide_menu_items SET display_order = 1 WHERE section = 'Akun' AND href = '/guide/profile/edit';
UPDATE guide_menu_items SET display_order = 2 WHERE section = 'Akun' AND href = '/guide/ratings';
UPDATE guide_menu_items SET display_order = 3 WHERE section = 'Akun' AND href = '/guide/profile/password';
UPDATE guide_menu_items SET display_order = 4 WHERE section = 'Akun' AND href = '/guide/feedback';
UPDATE guide_menu_items SET display_order = 5 WHERE section = 'Akun' AND href = '/guide/id-card';

-- Insight Pribadi (2 items - Performance sudah terintegrasi)
UPDATE guide_menu_items SET display_order = 1 WHERE section = 'Insight Pribadi' AND href = '/guide/insights';
UPDATE guide_menu_items SET display_order = 2 WHERE section = 'Insight Pribadi' AND href = '/guide/performance';

-- Pembelajaran & Development (4 items)
UPDATE guide_menu_items SET display_order = 1 WHERE section = 'Pembelajaran & Development' AND href = '/guide/onboarding';
UPDATE guide_menu_items SET display_order = 2 WHERE section = 'Pembelajaran & Development' AND href = '/guide/assessments';
UPDATE guide_menu_items SET display_order = 3 WHERE section = 'Pembelajaran & Development' AND href = '/guide/skills';
UPDATE guide_menu_items SET display_order = 4 WHERE section = 'Pembelajaran & Development' AND href = '/guide/learning';

-- Pengaturan & Support (5 items)
UPDATE guide_menu_items SET display_order = 1 WHERE section = 'Pengaturan & Support' AND href = '/guide/preferences';
UPDATE guide_menu_items SET display_order = 2 WHERE section = 'Pengaturan & Support' AND href = '/guide/settings';
UPDATE guide_menu_items SET display_order = 3 WHERE section = 'Pengaturan & Support' AND href = '/guide/documents';
UPDATE guide_menu_items SET display_order = 4 WHERE section = 'Pengaturan & Support' AND href = '/legal/privacy';
UPDATE guide_menu_items SET display_order = 5 WHERE section = 'Pengaturan & Support' AND href = '/help';
UPDATE guide_menu_items SET display_order = 6 WHERE section = 'Pengaturan & Support' AND href = '/guide/incidents';

COMMIT;
