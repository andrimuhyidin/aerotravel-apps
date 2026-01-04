-- Migration: 077-equipment-checklist-templates.sql
-- Description: Equipment checklist templates lookup table
-- Date: 2025-01-27

-- ============================================
-- EQUIPMENT CHECKLIST TEMPLATES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS equipment_checklist_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  
  -- Template Item Details
  item_key VARCHAR(100) NOT NULL, -- Unique identifier: 'life_jacket', 'snorkeling_gear', etc.
  name VARCHAR(200) NOT NULL, -- Display name in Indonesian
  name_en VARCHAR(200), -- Display name in English (for future i18n)
  description TEXT, -- Optional description/help text
  
  -- Configuration
  display_order INTEGER DEFAULT 0, -- Order in which items appear
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT equipment_checklist_templates_item_key_check CHECK (char_length(item_key) > 0),
  CONSTRAINT equipment_checklist_templates_name_check CHECK (char_length(name) > 0)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_equipment_checklist_templates_branch_id ON equipment_checklist_templates(branch_id);
CREATE INDEX IF NOT EXISTS idx_equipment_checklist_templates_active ON equipment_checklist_templates(is_active, display_order);
CREATE UNIQUE INDEX IF NOT EXISTS idx_equipment_checklist_templates_branch_item_key ON equipment_checklist_templates(COALESCE(branch_id, '00000000-0000-0000-0000-000000000000'::uuid), item_key);

-- Updated_at trigger
CREATE TRIGGER update_equipment_checklist_templates_updated_at
  BEFORE UPDATE ON equipment_checklist_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- INSERT DEFAULT EQUIPMENT CHECKLIST TEMPLATES
-- Global templates (branch_id = NULL)
-- ============================================
INSERT INTO equipment_checklist_templates (branch_id, item_key, name, name_en, description, display_order) VALUES
  (NULL, 'life_jacket', 'Life Jacket (sesuai jumlah peserta)', 'Life Jacket (per passenger count)', 'Life jacket harus cukup untuk semua peserta trip', 1),
  (NULL, 'snorkeling_gear', 'Alat Snorkeling (mask, fin, snorkel)', 'Snorkeling Equipment (mask, fin, snorkel)', 'Mask, fin, dan snorkel untuk semua peserta', 2),
  (NULL, 'first_aid_kit', 'First Aid Kit lengkap', 'Complete First Aid Kit', 'P3K harus lengkap dan mudah diakses', 3),
  (NULL, 'communication_device', 'Alat Komunikasi (HP/Radio)', 'Communication Device (Phone/Radio)', 'Alat komunikasi untuk komunikasi darurat', 4),
  (NULL, 'safety_equipment', 'Peralatan Safety (whistle, flashlight)', 'Safety Equipment (whistle, flashlight)', 'Peralatan safety tambahan seperti peluit dan senter', 5),
  (NULL, 'water_supply', 'Persediaan Air Minum', 'Water Supply', 'Persediaan air minum yang cukup untuk trip', 6),
  (NULL, 'navigation_tools', 'Alat Navigasi (kompas, GPS)', 'Navigation Tools (compass, GPS)', 'Alat navigasi untuk memastikan tidak tersesat', 7)
ON CONFLICT (COALESCE(branch_id, '00000000-0000-0000-0000-000000000000'::uuid), item_key) DO UPDATE SET
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  description = EXCLUDED.description,
  display_order = EXCLUDED.display_order,
  updated_at = NOW();

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE equipment_checklist_templates ENABLE ROW LEVEL SECURITY;

-- Templates: Anyone authenticated can view active templates
DROP POLICY IF EXISTS "Anyone can view active equipment checklist templates" ON equipment_checklist_templates;
CREATE POLICY "Anyone can view active equipment checklist templates"
  ON equipment_checklist_templates FOR SELECT
  USING (
    is_active = true AND
    (branch_id IS NULL OR branch_id IN (
      SELECT branch_id FROM users WHERE id = auth.uid()
    ))
  );

-- Templates: Admins can manage templates
DROP POLICY IF EXISTS "Admins can manage equipment checklist templates" ON equipment_checklist_templates;
CREATE POLICY "Admins can manage equipment checklist templates"
  ON equipment_checklist_templates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'ops_admin')
      AND (
        users.role = 'super_admin'
        OR users.branch_id = equipment_checklist_templates.branch_id
      )
    )
  );

