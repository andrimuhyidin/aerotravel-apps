-- Migration: 043-guide-contracts-menu-item.sql
-- Description: Add "Kontrak Kerja" menu item to guide profile menu
-- Created: 2025-01-22

BEGIN;

-- Insert "Kontrak Kerja" menu item in "Akun" section
INSERT INTO guide_menu_items (branch_id, section, href, label, icon_name, description, display_order, is_active)
SELECT * FROM (VALUES
  (NULL::uuid, 'Akun', '/guide/contracts', 'Kontrak Kerja', 'FileText', 'Lihat dan kelola kontrak kerja Anda', 3, true)
) AS v(branch_id, section, href, label, icon_name, description, display_order, is_active)
WHERE NOT EXISTS (
  SELECT 1 FROM guide_menu_items 
  WHERE guide_menu_items.href = v.href 
    AND guide_menu_items.section = v.section
    AND (guide_menu_items.branch_id = v.branch_id OR (guide_menu_items.branch_id IS NULL AND v.branch_id IS NULL))
);

-- Update display_order untuk menu items di section "Akun" agar urutannya benar
-- Edit Profil = 1, Rating & Ulasan = 2, Kontrak Kerja = 3, Password = 4, dll
UPDATE guide_menu_items 
SET display_order = 4 
WHERE section = 'Akun' 
  AND href = '/guide/profile/password'
  AND display_order < 4;

UPDATE guide_menu_items 
SET display_order = 5 
WHERE section = 'Akun' 
  AND href = '/guide/feedback'
  AND display_order < 5;

UPDATE guide_menu_items 
SET display_order = 6 
WHERE section = 'Akun' 
  AND href = '/guide/id-card'
  AND display_order < 6;

COMMIT;
