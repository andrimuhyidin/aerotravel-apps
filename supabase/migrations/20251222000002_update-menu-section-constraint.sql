-- Migration: Update Guide Menu Items Section Constraint
-- Add 'Lainnya' section to valid sections

BEGIN;

-- Drop old constraint
ALTER TABLE guide_menu_items DROP CONSTRAINT IF EXISTS guide_menu_items_section_check;

-- Add new constraint with 'Lainnya'
ALTER TABLE guide_menu_items ADD CONSTRAINT guide_menu_items_section_check 
  CHECK (section IN ('Akun', 'Operasional', 'Pembelajaran', 'Lainnya'));

COMMIT;

