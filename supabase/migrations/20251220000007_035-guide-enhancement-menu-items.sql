-- Migration: 035-guide-enhancement-menu-items.sql
-- Description: Add menu items for new enhancement features
-- Date: 2025-12-19

BEGIN;

-- Insert new menu items for enhancement features
INSERT INTO guide_menu_items (branch_id, section, href, label, icon_name, description, display_order)
SELECT * FROM (VALUES
  -- Development Section (New)
  (NULL::uuid, 'Development', '/guide/onboarding', 'Onboarding', 'GraduationCap', 'Lengkapi onboarding untuk memulai', 1),
  (NULL::uuid, 'Development', '/guide/assessments', 'Assessments', 'FileText', 'Self assessment dan evaluasi', 2),
  (NULL::uuid, 'Development', '/guide/skills', 'Skills', 'Award', 'Kelola skillset dan kemampuan', 3),
  (NULL::uuid, 'Development', '/guide/performance', 'Performance', 'BarChart3', 'Analisis performa dan metrics', 4),
  
  -- Pengaturan Section (Enhanced)
  (NULL::uuid, 'Pengaturan', '/guide/preferences', 'Preferences', 'Settings', 'Preferensi kerja dan personalisasi', 1),
  (NULL::uuid, 'Pengaturan', '/guide/settings', 'Pengaturan', 'Settings', 'Pengaturan aplikasi', 2),
  (NULL::uuid, 'Pengaturan', '/guide/documents', 'Dokumen', 'FileText', 'Dokumen dan sertifikat', 3),
  (NULL::uuid, 'Pengaturan', '/legal/privacy', 'Kebijakan Privasi', 'Shield', 'Kebijakan privasi dan data', 4),
  (NULL::uuid, 'Pengaturan', '/help', 'Bantuan', 'HelpCircle', 'Pusat bantuan dan FAQ', 5)
) AS v(branch_id, section, href, label, icon_name, description, display_order)
WHERE NOT EXISTS (
  SELECT 1 FROM guide_menu_items 
  WHERE guide_menu_items.href = v.href 
    AND guide_menu_items.section = v.section
    AND (guide_menu_items.branch_id = v.branch_id OR (guide_menu_items.branch_id IS NULL AND v.branch_id IS NULL))
);

COMMIT;
