-- Migration: Update Guide Menu Items untuk Legal & Help Pages
-- Created: 2025-12-22
-- Description: Update menu items untuk mengarahkan ke guide-specific pages

BEGIN;

-- Update existing menu items untuk guide-specific pages
UPDATE guide_menu_items 
SET href = '/guide/legal/privacy', 
    label = 'Kebijakan Privasi',
    description = 'Kebijakan privasi Guide App'
WHERE href = '/legal/privacy' AND section = 'Pengaturan';

UPDATE guide_menu_items 
SET href = '/guide/help', 
    label = 'Bantuan',
    description = 'Pusat bantuan Guide App'
WHERE href = '/help' AND section = 'Pengaturan';

-- Insert new menu items jika belum ada (dengan section 'Dukungan')
INSERT INTO guide_menu_items (branch_id, section, href, label, icon_name, description, display_order)
SELECT * FROM (VALUES
  -- Dukungan Section (New)
  (NULL::uuid, 'Dukungan', '/guide/help', 'Bantuan', 'HelpCircle', 'Pusat bantuan dan FAQ', 1),
  (NULL::uuid, 'Dukungan', '/guide/about', 'Tentang', 'Info', 'Tentang Guide App', 2),
  (NULL::uuid, 'Dukungan', '/guide/legal/terms', 'Syarat & Ketentuan', 'FileText', 'Syarat dan ketentuan Guide', 3),
  (NULL::uuid, 'Dukungan', '/guide/legal/privacy', 'Kebijakan Privasi', 'Shield', 'Kebijakan privasi dan data', 4)
) AS v(branch_id, section, href, label, icon_name, description, display_order)
WHERE NOT EXISTS (
  SELECT 1 FROM guide_menu_items 
  WHERE guide_menu_items.href = v.href 
    AND guide_menu_items.section = v.section
    AND (guide_menu_items.branch_id = v.branch_id OR (guide_menu_items.branch_id IS NULL AND v.branch_id IS NULL))
);

-- Hapus duplikat dari section 'Pengaturan' jika ada di 'Dukungan'
DELETE FROM guide_menu_items 
WHERE section = 'Pengaturan' 
  AND href IN ('/guide/help', '/guide/legal/privacy', '/guide/legal/terms', '/guide/about')
  AND EXISTS (
    SELECT 1 FROM guide_menu_items AS gmi2 
    WHERE gmi2.href = guide_menu_items.href 
      AND gmi2.section = 'Dukungan'
  );

-- Update section constraint untuk include 'Dukungan'
ALTER TABLE guide_menu_items DROP CONSTRAINT IF EXISTS guide_menu_items_section_check;
ALTER TABLE guide_menu_items ADD CONSTRAINT guide_menu_items_section_check 
  CHECK (section IN ('Akun', 'Operasional', 'Pengaturan', 'Dukungan', 'Pembelajaran'));

COMMIT;

