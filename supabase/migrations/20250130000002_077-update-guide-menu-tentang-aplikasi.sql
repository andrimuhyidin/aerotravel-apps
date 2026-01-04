-- Migration: 077-update-guide-menu-tentang-aplikasi.sql
-- Description: Update menu label "Tentang" menjadi "Tentang Aplikasi" di guide_menu_items
-- Created: 2025-01-30

BEGIN;

-- Update label "Tentang" menjadi "Tentang Aplikasi" untuk semua menu items yang href = '/guide/about'
UPDATE guide_menu_items 
SET label = 'Tentang Aplikasi',
    description = 'Tentang aplikasi Guide yang Anda gunakan'
WHERE href = '/guide/about' 
  AND (label = 'Tentang' OR label = 'Tentang Perusahaan' OR label LIKE '%Tentang%');

-- Update juga jika ada menu item dengan label "Tentang Perusahaan" di section manapun
UPDATE guide_menu_items 
SET label = 'Tentang Aplikasi',
    description = 'Tentang aplikasi Guide yang Anda gunakan'
WHERE label = 'Tentang Perusahaan'
   OR (label LIKE '%Tentang Perusahaan%' AND href LIKE '/guide/%');

-- Pastikan menu item '/guide/about' ada di section 'Dukungan' (bukan 'Lainnya')
UPDATE guide_menu_items
SET section = 'Dukungan'
WHERE href = '/guide/about' 
  AND section != 'Dukungan'
  AND section IN ('Akun', 'Operasional', 'Pengaturan', 'Dukungan', 'Pembelajaran', 'Lainnya');

COMMIT;

