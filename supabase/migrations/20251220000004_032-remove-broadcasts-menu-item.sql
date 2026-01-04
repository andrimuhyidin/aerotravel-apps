-- Migration: 032-remove-broadcasts-menu-item.sql
-- Description: Remove/deactivate broadcasts menu item since it's now merged into notifications
-- Date: 2025-12-19

BEGIN;

-- Deactivate broadcasts menu item (merged into notifications)
UPDATE guide_menu_items
SET is_active = false,
    updated_at = NOW()
WHERE href = '/guide/broadcasts'
  AND section = 'Operasional'
  AND label = 'Broadcast Ops';

-- Log the change
DO $$
BEGIN
  RAISE NOTICE 'Deactivated broadcasts menu item (merged into notifications)';
END $$;

COMMIT;
