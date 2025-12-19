-- Migration: 036-guide-menu-reorganization.sql
-- Description: Reorganize menu items - merge Development & Learning, move Performance to Insight Pribadi
-- Date: 2025-12-19

BEGIN;

-- ============================================
-- 1. GABUNG DEVELOPMENT + PEMBELAJARAN
-- ============================================

-- Update section "Development" menjadi "Pembelajaran & Development"
UPDATE guide_menu_items
SET section = 'Pembelajaran & Development'
WHERE section = 'Development';

-- Update section "Pembelajaran" menjadi "Pembelajaran & Development"
UPDATE guide_menu_items
SET section = 'Pembelajaran & Development'
WHERE section = 'Pembelajaran';

-- Reorder items di section "Pembelajaran & Development"
UPDATE guide_menu_items
SET display_order = 1
WHERE section = 'Pembelajaran & Development' AND href = '/guide/onboarding';

UPDATE guide_menu_items
SET display_order = 2
WHERE section = 'Pembelajaran & Development' AND href = '/guide/assessments';

UPDATE guide_menu_items
SET display_order = 3
WHERE section = 'Pembelajaran & Development' AND href = '/guide/skills';

UPDATE guide_menu_items
SET display_order = 4
WHERE section = 'Pembelajaran & Development' AND href = '/guide/learning';

-- ============================================
-- 2. PINDAHKAN PERFORMANCE KE INSIGHT PRIBADI
-- ============================================

-- Update Performance dari Development ke Insight Pribadi
UPDATE guide_menu_items
SET section = 'Insight Pribadi',
    display_order = 2
WHERE href = '/guide/performance';

-- Update Insight Pribadi dari Operasional ke section baru "Insight Pribadi"
UPDATE guide_menu_items
SET section = 'Insight Pribadi',
    display_order = 1
WHERE href = '/guide/insights' AND section = 'Operasional';

-- Jika Insight Pribadi belum ada, insert baru
INSERT INTO guide_menu_items (branch_id, section, href, label, icon_name, description, display_order)
SELECT * FROM (VALUES
  (NULL::uuid, 'Insight Pribadi', '/guide/insights', 'Insight Pribadi', 'BarChart3', 'Analisis performa pribadi dan metrics', 1)
) AS v(branch_id, section, href, label, icon_name, description, display_order)
WHERE NOT EXISTS (
  SELECT 1 FROM guide_menu_items 
  WHERE guide_menu_items.href = v.href 
    AND guide_menu_items.section = v.section
);

-- ============================================
-- 3. CLEANUP: Hapus duplikat jika ada
-- ============================================

-- Hapus duplikat Insight Pribadi di Operasional (jika masih ada setelah update)
-- Keep only the first one (lowest display_order or earliest created_at)
DO $$
DECLARE
  keep_id UUID;
BEGIN
  SELECT id INTO keep_id
  FROM guide_menu_items 
  WHERE href = '/guide/insights' 
    AND section = 'Operasional'
  ORDER BY display_order ASC, created_at ASC
  LIMIT 1;
  
  IF keep_id IS NOT NULL THEN
    DELETE FROM guide_menu_items
    WHERE href = '/guide/insights' 
      AND section = 'Operasional'
      AND id != keep_id;
  END IF;
END $$;

COMMIT;
