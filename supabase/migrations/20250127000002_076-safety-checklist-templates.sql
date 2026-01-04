-- Migration: 076-safety-checklist-templates.sql
-- Description: Safety checklist templates lookup table and safety_checklists table
-- Date: 2025-01-27

-- ============================================
-- SAFETY CHECKLIST TEMPLATES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS safety_checklist_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  
  -- Template Item Details
  item_key VARCHAR(100) NOT NULL, -- Unique identifier: 'life_jacket', 'snorkeling_equipment', etc.
  label VARCHAR(200) NOT NULL, -- Display label in Indonesian
  label_en VARCHAR(200), -- Display label in English (for future i18n)
  description TEXT, -- Optional description/help text
  
  -- Configuration
  required BOOLEAN DEFAULT false, -- Whether this item is required before trip can start
  display_order INTEGER DEFAULT 0, -- Order in which items appear
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT safety_checklist_templates_item_key_check CHECK (char_length(item_key) > 0),
  CONSTRAINT safety_checklist_templates_label_check CHECK (char_length(label) > 0)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_safety_checklist_templates_branch_id ON safety_checklist_templates(branch_id);
CREATE INDEX IF NOT EXISTS idx_safety_checklist_templates_active ON safety_checklist_templates(is_active, display_order);
CREATE UNIQUE INDEX IF NOT EXISTS idx_safety_checklist_templates_branch_item_key ON safety_checklist_templates(COALESCE(branch_id, '00000000-0000-0000-0000-000000000000'::uuid), item_key);

-- Updated_at trigger
CREATE TRIGGER update_safety_checklist_templates_updated_at
  BEFORE UPDATE ON safety_checklist_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SAFETY CHECKLISTS TABLE (if not exists)
-- Stores completed safety checklists
-- ============================================
CREATE TABLE IF NOT EXISTS safety_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id),
  
  -- Checked Items (array of item_key values from templates)
  checked_items TEXT[] NOT NULL DEFAULT '{}',
  
  -- Completion
  completed_at TIMESTAMPTZ,
  
  -- Notes (optional)
  note TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_safety_checklists_guide_id ON safety_checklists(guide_id);
CREATE INDEX IF NOT EXISTS idx_safety_checklists_trip_id ON safety_checklists(trip_id);
CREATE INDEX IF NOT EXISTS idx_safety_checklists_branch_id ON safety_checklists(branch_id);
CREATE INDEX IF NOT EXISTS idx_safety_checklists_created_at ON safety_checklists(created_at);

-- Updated_at trigger
CREATE TRIGGER update_safety_checklists_updated_at
  BEFORE UPDATE ON safety_checklists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- INSERT DEFAULT SAFETY CHECKLIST TEMPLATES
-- Global templates (branch_id = NULL)
-- ============================================
INSERT INTO safety_checklist_templates (branch_id, item_key, label, label_en, description, required, display_order) VALUES
  (NULL, 'life_jacket', 'Life jacket cukup untuk semua peserta', 'Life jackets sufficient for all participants', 'Pastikan jumlah life jacket sesuai dengan jumlah peserta trip', true, 1),
  (NULL, 'snorkeling_equipment', 'Alat snorkeling lengkap dan dalam kondisi baik', 'Snorkeling equipment complete and in good condition', 'Mask, fin, snorkel untuk semua peserta', true, 2),
  (NULL, 'weather_check', 'Kondisi cuaca aman untuk aktivitas', 'Weather conditions safe for activity', 'Periksa kondisi cuaca sebelum memulai trip', true, 3),
  (NULL, 'safety_briefing', 'Briefing safety sudah dilakukan kepada peserta', 'Safety briefing has been conducted for participants', 'Pastikan semua peserta sudah mendapat briefing keselamatan', true, 4),
  (NULL, 'first_aid_kit', 'First aid kit tersedia dan lengkap', 'First aid kit available and complete', 'P3K harus lengkap dan mudah diakses', true, 5),
  (NULL, 'communication_device', 'Alat komunikasi (HP/Radio) berfungsi dengan baik', 'Communication device (phone/radio) functioning properly', 'Pastikan alat komunikasi berfungsi untuk komunikasi darurat', true, 6),
  (NULL, 'boat_condition', 'Kondisi perahu/kendaraan aman untuk digunakan', 'Boat/vehicle condition safe for use', 'Periksa kondisi perahu atau kendaraan sebelum digunakan', false, 7),
  (NULL, 'emergency_contact', 'Kontak darurat sudah diinformasikan ke peserta', 'Emergency contact has been informed to participants', 'Pastikan peserta tahu kontak darurat', false, 8)
ON CONFLICT (COALESCE(branch_id, '00000000-0000-0000-0000-000000000000'::uuid), item_key) DO UPDATE SET
  label = EXCLUDED.label,
  label_en = EXCLUDED.label_en,
  description = EXCLUDED.description,
  required = EXCLUDED.required,
  display_order = EXCLUDED.display_order,
  updated_at = NOW();

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE safety_checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_checklists ENABLE ROW LEVEL SECURITY;

-- Templates: Anyone authenticated can view active templates
DROP POLICY IF EXISTS "Anyone can view active safety checklist templates" ON safety_checklist_templates;
CREATE POLICY "Anyone can view active safety checklist templates"
  ON safety_checklist_templates FOR SELECT
  USING (
    is_active = true AND
    (branch_id IS NULL OR branch_id IN (
      SELECT branch_id FROM users WHERE id = auth.uid()
    ))
  );

-- Templates: Admins can manage templates
DROP POLICY IF EXISTS "Admins can manage safety checklist templates" ON safety_checklist_templates;
CREATE POLICY "Admins can manage safety checklist templates"
  ON safety_checklist_templates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'ops_admin')
      AND (
        users.role = 'super_admin'
        OR users.branch_id = safety_checklist_templates.branch_id
      )
    )
  );

-- Checklists: Guides can view their own checklists
DROP POLICY IF EXISTS "Guides can view own safety checklists" ON safety_checklists;
CREATE POLICY "Guides can view own safety checklists"
  ON safety_checklists FOR SELECT
  USING (guide_id = auth.uid());

-- Checklists: Guides can create their own checklists
DROP POLICY IF EXISTS "Guides can create own safety checklists" ON safety_checklists;
CREATE POLICY "Guides can create own safety checklists"
  ON safety_checklists FOR INSERT
  WITH CHECK (guide_id = auth.uid());

-- Checklists: Admins can view all checklists
DROP POLICY IF EXISTS "Admins can view all safety checklists" ON safety_checklists;
CREATE POLICY "Admins can view all safety checklists"
  ON safety_checklists FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'ops_admin')
      AND (
        users.role = 'super_admin'
        OR users.branch_id = safety_checklists.branch_id
      )
    )
  );

