-- Migration: 037-guide-feedback-id-card-menu-items.sql
-- Description: Add menu items for feedback and ID card features
-- Date: 2025-01-20

BEGIN;

-- Insert menu items for Feedback
INSERT INTO guide_menu_items (branch_id, section, href, label, icon_name, description, display_order)
SELECT * FROM (VALUES
  -- Akun Section
  (NULL::uuid, 'Akun', '/guide/feedback', 'Feedback & Saran', 'MessageSquare', 'Berikan feedback untuk perbaikan', 3),
  (NULL::uuid, 'Akun', '/guide/id-card', 'ID Card Guide', 'CreditCard', 'AeroTravel Guide License (ATGL)', 4),
  
  -- Development Section (if exists)
  (NULL::uuid, 'Development', '/guide/license/apply', 'Apply License', 'FileText', 'Ajukan Guide License', 5)
) AS v(branch_id, section, href, label, icon_name, description, display_order)
WHERE NOT EXISTS (
  SELECT 1 FROM guide_menu_items 
  WHERE guide_menu_items.href = v.href 
    AND guide_menu_items.section = v.section
    AND (guide_menu_items.branch_id = v.branch_id OR (guide_menu_items.branch_id IS NULL AND v.branch_id IS NULL))
);

COMMIT;
