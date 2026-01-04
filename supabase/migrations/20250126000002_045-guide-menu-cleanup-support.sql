-- Migration: 045-guide-menu-cleanup-support.sql
-- Description: Cleanup remaining "Support" section and fix any remaining issues
-- Date: 2025-01-26

BEGIN;

-- ============================================
-- 1. REMOVE OLD "Support" SECTION
-- ============================================

-- Update any remaining "Support" section items to "Dukungan"
UPDATE guide_menu_items
SET section = 'Dukungan'
WHERE section = 'Support';

-- ============================================
-- 2. REMOVE CREW DIRECTORY FROM MENU
-- ============================================

-- Crew Directory should not be in menu (already in Super App Menu)
DELETE FROM guide_menu_items
WHERE href = '/guide/crew/directory';

-- ============================================
-- 3. ENSURE /help EXISTS IN DUKUNGAN
-- ============================================

-- Ensure /help exists in "Dukungan" section
INSERT INTO guide_menu_items (branch_id, section, href, label, icon_name, description, display_order, is_active)
SELECT * FROM (VALUES
  (NULL::uuid, 'Dukungan', '/help', 'Bantuan', 'HelpCircle', 'Pusat bantuan dan FAQ', 4, true)
) AS v(branch_id, section, href, label, icon_name, description, display_order, is_active)
WHERE NOT EXISTS (
  SELECT 1 FROM guide_menu_items
  WHERE guide_menu_items.href = v.href
    AND guide_menu_items.section = v.section
    AND (guide_menu_items.branch_id = v.branch_id OR (guide_menu_items.branch_id IS NULL AND v.branch_id IS NULL))
);

-- ============================================
-- 4. REMOVE DUPLICATES
-- ============================================

-- Remove duplicate items, keep the one with lowest display_order
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

-- ============================================
-- 5. FINAL REORDER
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

COMMIT;

