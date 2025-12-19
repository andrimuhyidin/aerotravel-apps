-- Migration: 038-remove-license-apply-menu.sql
-- Description: Remove license apply menu item (now merged into id-card page)
-- Date: 2025-01-XX

BEGIN;

-- Delete license apply menu item (now integrated into /guide/id-card)
DELETE FROM guide_menu_items 
WHERE href = '/guide/license/apply';

COMMIT;
