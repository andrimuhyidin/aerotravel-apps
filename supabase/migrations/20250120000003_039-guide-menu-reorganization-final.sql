-- Migration: 039-guide-menu-reorganization-final.sql
-- Description: Final menu reorganization - merge items, remove duplicates, add missing items
-- Date: 2025-01-XX

BEGIN;

-- ============================================
-- 1. HAPUS MENU YANG DIGABUNG/DIHAPUS
-- ============================================

-- Hapus menu Insight Pribadi (akan digabung ke widget dengan link)
DELETE FROM guide_menu_items WHERE href = '/guide/insights' AND section = 'Insight Pribadi';

-- Hapus menu Rating & Ulasan (akan digabung ke Insight)
DELETE FROM guide_menu_items WHERE href = '/guide/ratings';

-- Hapus menu Preferences (akan digabung ke Pengaturan)
DELETE FROM guide_menu_items WHERE href = '/guide/preferences';

-- Hapus menu Dokumen (akan digabung ke Edit Profile)
DELETE FROM guide_menu_items WHERE href = '/guide/documents';

-- Hapus menu Laporan Insiden (akan digabung ke Bantuan)
DELETE FROM guide_menu_items WHERE href = '/guide/incidents';

-- Hapus menu Assessment (akan digabung ke Learning Hub)
DELETE FROM guide_menu_items WHERE href = '/guide/assessments';

-- Hapus menu Skills (akan digabung ke Learning Hub)
DELETE FROM guide_menu_items WHERE href = '/guide/skills';

-- ============================================
-- 2. UPDATE MENU ITEMS YANG DIGABUNG
-- ============================================

-- Update Learning Hub untuk include Assessment & Skills (akan di-handle di page)
-- Update Settings untuk include Preferences (akan di-handle di page)
-- Update Edit Profile untuk include Dokumen (akan di-handle di page)
-- Update Help untuk include Laporan Insiden (akan di-handle di page)

-- ============================================
-- 3. TAMBAH MENU YANG HILANG
-- ============================================

-- Tambah menu Syarat dan Ketentuan
INSERT INTO guide_menu_items (branch_id, section, href, label, icon_name, description, display_order)
SELECT * FROM (VALUES
  (NULL::uuid, 'Pengaturan', '/legal/terms', 'Syarat dan Ketentuan', 'FileText', 'Syarat dan ketentuan penggunaan', 5)
) AS v(branch_id, section, href, label, icon_name, description, display_order)
WHERE NOT EXISTS (
  SELECT 1 FROM guide_menu_items 
  WHERE guide_menu_items.href = v.href 
    AND guide_menu_items.section = v.section
    AND (guide_menu_items.branch_id = v.branch_id OR (guide_menu_items.branch_id IS NULL AND v.branch_id IS NULL))
);

-- ============================================
-- 4. REORGANIZE SECTIONS
-- ============================================

-- Update Learning Hub section untuk menjadi "Pembelajaran" (jika belum)
UPDATE guide_menu_items
SET section = 'Pembelajaran'
WHERE href = '/guide/learning' AND section != 'Pembelajaran';

-- Update section order untuk konsistensi
-- Akun: 1, Operasional: 2, Pembelajaran: 3, Pengaturan: 4

COMMIT;
