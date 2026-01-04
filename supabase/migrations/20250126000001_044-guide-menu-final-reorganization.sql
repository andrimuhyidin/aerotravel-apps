-- Migration: 044-guide-menu-final-reorganization.sql
-- Description: Final reorganization of guide menu items - fix section names, remove redundancies, proper grouping
-- Date: 2025-01-26

BEGIN;

-- ============================================
-- 1. FIX SECTION NAMES
-- ============================================

-- Update "Pengaturan & Support" back to "Pengaturan"
UPDATE guide_menu_items
SET section = 'Pengaturan'
WHERE section = 'Pengaturan & Support';

-- Update "Laporan & Support" to "Dukungan" (merge items)
UPDATE guide_menu_items
SET section = 'Dukungan'
WHERE section = 'Laporan & Support';

-- Update "Insight Pribadi" to "Akun" (merge to Akun section)
UPDATE guide_menu_items
SET section = 'Akun'
WHERE section = 'Insight Pribadi';

-- Update "Pembelajaran & Development" to "Pembelajaran"
UPDATE guide_menu_items
SET section = 'Pembelajaran'
WHERE section = 'Pembelajaran & Development';

-- ============================================
-- 2. REMOVE REDUNDANT ITEMS
-- ============================================

-- Remove /guide/ratings (already integrated in insights)
DELETE FROM guide_menu_items
WHERE href = '/guide/ratings';

-- Remove /guide/documents (already in edit profile)
DELETE FROM guide_menu_items
WHERE href = '/guide/documents';

-- Remove /guide/incidents (can be accessed via help or removed)
DELETE FROM guide_menu_items
WHERE href = '/guide/incidents';

-- Remove /guide/assessments (already in learning hub)
DELETE FROM guide_menu_items
WHERE href = '/guide/assessments';

-- Remove /guide/skills (already in learning hub)
DELETE FROM guide_menu_items
WHERE href = '/guide/skills';

-- Remove /guide/performance (already integrated in insights)
DELETE FROM guide_menu_items
WHERE href = '/guide/performance';

-- Remove duplicate /guide/insights in "Insight Pribadi" section (keep the one in "Akun")
-- This is already handled by section update above, but ensure no duplicates
DO $$
DECLARE
  keep_id UUID;
BEGIN
  -- Keep the one in "Akun" section with label "Insight & Performance"
  SELECT id INTO keep_id
  FROM guide_menu_items
  WHERE href = '/guide/insights'
    AND section = 'Akun'
    AND label LIKE '%Insight%Performance%'
  ORDER BY display_order ASC, created_at ASC
  LIMIT 1;
  
  -- If found, delete others
  IF keep_id IS NOT NULL THEN
    DELETE FROM guide_menu_items
    WHERE href = '/guide/insights'
      AND id != keep_id;
  END IF;
END $$;

-- ============================================
-- 3. ENSURE REQUIRED ITEMS EXIST
-- ============================================

-- Ensure /guide/contracts exists in "Akun" section
INSERT INTO guide_menu_items (branch_id, section, href, label, icon_name, description, display_order, is_active)
SELECT * FROM (VALUES
  (NULL::uuid, 'Akun', '/guide/contracts', 'Kontrak Kerja', 'FileText', 'Lihat dan kelola kontrak kerja Anda', 2, true)
) AS v(branch_id, section, href, label, icon_name, description, display_order, is_active)
WHERE NOT EXISTS (
  SELECT 1 FROM guide_menu_items
  WHERE guide_menu_items.href = v.href
    AND guide_menu_items.section = v.section
    AND (guide_menu_items.branch_id = v.branch_id OR (guide_menu_items.branch_id IS NULL AND v.branch_id IS NULL))
);

-- Ensure /guide/training exists in "Pembelajaran" section
INSERT INTO guide_menu_items (branch_id, section, href, label, icon_name, description, display_order, is_active)
SELECT * FROM (VALUES
  (NULL::uuid, 'Pembelajaran', '/guide/training', 'Training', 'GraduationCap', 'Modul pelatihan dan sertifikasi', 2, true)
) AS v(branch_id, section, href, label, icon_name, description, display_order, is_active)
WHERE NOT EXISTS (
  SELECT 1 FROM guide_menu_items
  WHERE guide_menu_items.href = v.href
    AND guide_menu_items.section = v.section
    AND (guide_menu_items.branch_id = v.branch_id OR (guide_menu_items.branch_id IS NULL AND v.branch_id IS NULL))
);

-- Ensure /guide/learning exists in "Pembelajaran" section
INSERT INTO guide_menu_items (branch_id, section, href, label, icon_name, description, display_order, is_active)
SELECT * FROM (VALUES
  (NULL::uuid, 'Pembelajaran', '/guide/learning', 'Learning Hub', 'BookOpen', 'Panduan, SOP, dan tips untuk Guide', 3, true)
) AS v(branch_id, section, href, label, icon_name, description, display_order, is_active)
WHERE NOT EXISTS (
  SELECT 1 FROM guide_menu_items
  WHERE guide_menu_items.href = v.href
    AND guide_menu_items.section = v.section
    AND (guide_menu_items.branch_id = v.branch_id OR (guide_menu_items.branch_id IS NULL AND v.branch_id IS NULL))
);

-- Ensure /guide/onboarding exists in "Pembelajaran" section
INSERT INTO guide_menu_items (branch_id, section, href, label, icon_name, description, display_order, is_active)
SELECT * FROM (VALUES
  (NULL::uuid, 'Pembelajaran', '/guide/onboarding', 'Onboarding', 'GraduationCap', 'Lengkapi onboarding untuk memulai', 1, true)
) AS v(branch_id, section, href, label, icon_name, description, display_order, is_active)
WHERE NOT EXISTS (
  SELECT 1 FROM guide_menu_items
  WHERE guide_menu_items.href = v.href
    AND guide_menu_items.section = v.section
    AND (guide_menu_items.branch_id = v.branch_id OR (guide_menu_items.branch_id IS NULL AND v.branch_id IS NULL))
);

-- Ensure /guide/insights exists in "Akun" section as "Insight & Performance"
INSERT INTO guide_menu_items (branch_id, section, href, label, icon_name, description, display_order, is_active)
SELECT * FROM (VALUES
  (NULL::uuid, 'Akun', '/guide/insights', 'Insight & Performance', 'BarChart3', 'Analisis performa lengkap, trend bulanan, dan rekomendasi', 5, true)
) AS v(branch_id, section, href, label, icon_name, description, display_order, is_active)
WHERE NOT EXISTS (
  SELECT 1 FROM guide_menu_items
  WHERE guide_menu_items.href = v.href
    AND guide_menu_items.section = v.section
    AND (guide_menu_items.branch_id = v.branch_id OR (guide_menu_items.branch_id IS NULL AND v.branch_id IS NULL))
);

-- Update existing /guide/insights in "Akun" to have correct label
UPDATE guide_menu_items
SET label = 'Insight & Performance',
    description = 'Analisis performa lengkap, trend bulanan, dan rekomendasi',
    display_order = 5
WHERE href = '/guide/insights'
  AND section = 'Akun';

-- Ensure /guide/feedback/new exists in "Dukungan" section
INSERT INTO guide_menu_items (branch_id, section, href, label, icon_name, description, display_order, is_active)
SELECT * FROM (VALUES
  (NULL::uuid, 'Dukungan', '/guide/feedback/new', 'Beri Feedback', 'MessageSquare', 'Kirim masukan', 3, true)
) AS v(branch_id, section, href, label, icon_name, description, display_order, is_active)
WHERE NOT EXISTS (
  SELECT 1 FROM guide_menu_items
  WHERE guide_menu_items.href = v.href
    AND guide_menu_items.section = v.section
    AND (guide_menu_items.branch_id = v.branch_id OR (guide_menu_items.branch_id IS NULL AND v.branch_id IS NULL))
);

-- Move /guide/feedback from "Akun" to "Dukungan" if exists
UPDATE guide_menu_items
SET section = 'Dukungan',
    href = '/guide/feedback/new',
    label = 'Beri Feedback',
    display_order = 3
WHERE href = '/guide/feedback'
  AND section = 'Akun';

-- ============================================
-- 4. REORDER ITEMS IN EACH SECTION
-- ============================================

-- Akun Section (5 items)
UPDATE guide_menu_items SET display_order = 1 WHERE section = 'Akun' AND href = '/guide/profile/edit';
UPDATE guide_menu_items SET display_order = 2 WHERE section = 'Akun' AND href = '/guide/contracts';
UPDATE guide_menu_items SET display_order = 3 WHERE section = 'Akun' AND href = '/guide/id-card';
UPDATE guide_menu_items SET display_order = 4 WHERE section = 'Akun' AND href = '/guide/profile/password';
UPDATE guide_menu_items SET display_order = 5 WHERE section = 'Akun' AND href = '/guide/insights';

-- Pembelajaran Section (3 items)
UPDATE guide_menu_items SET display_order = 1 WHERE section = 'Pembelajaran' AND href = '/guide/onboarding';
UPDATE guide_menu_items SET display_order = 2 WHERE section = 'Pembelajaran' AND href = '/guide/training';
UPDATE guide_menu_items SET display_order = 3 WHERE section = 'Pembelajaran' AND href = '/guide/learning';

-- Dukungan Section (4 items)
UPDATE guide_menu_items SET display_order = 1 WHERE section = 'Dukungan' AND href = '/guide/notifications';
UPDATE guide_menu_items SET display_order = 2 WHERE section = 'Dukungan' AND href = '/guide/sos';
UPDATE guide_menu_items SET display_order = 3 WHERE section = 'Dukungan' AND href = '/guide/feedback/new';
UPDATE guide_menu_items SET display_order = 4 WHERE section = 'Dukungan' AND href = '/help';

-- Pengaturan Section (4 items)
UPDATE guide_menu_items SET display_order = 1 WHERE section = 'Pengaturan' AND href = '/guide/settings';
UPDATE guide_menu_items SET display_order = 2 WHERE section = 'Pengaturan' AND href = '/guide/preferences';
UPDATE guide_menu_items SET display_order = 3 WHERE section = 'Pengaturan' AND href = '/legal/privacy';
UPDATE guide_menu_items SET display_order = 4 WHERE section = 'Pengaturan' AND href = '/legal/terms';

-- ============================================
-- 5. CLEANUP: Remove any remaining duplicates
-- ============================================

-- Remove duplicates by (section, href), keep the one with lowest display_order
DO $$
DECLARE
  item_record RECORD;
  keep_id UUID;
BEGIN
  FOR item_record IN
    SELECT section, href, COUNT(*) as cnt
    FROM guide_menu_items
    WHERE is_active = true
    GROUP BY section, href
    HAVING COUNT(*) > 1
  LOOP
    -- Get the one to keep (lowest display_order, earliest created_at)
    SELECT id INTO keep_id
    FROM guide_menu_items
    WHERE section = item_record.section
      AND href = item_record.href
      AND is_active = true
    ORDER BY display_order ASC, created_at ASC
    LIMIT 1;
    
    -- Delete others
    IF keep_id IS NOT NULL THEN
      DELETE FROM guide_menu_items
      WHERE section = item_record.section
        AND href = item_record.href
        AND is_active = true
        AND id != keep_id;
    END IF;
  END LOOP;
END $$;

COMMIT;

