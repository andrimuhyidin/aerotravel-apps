-- Migration: 024-guide-quick-actions-menu-items.sql
-- Description: Create tables for guide quick actions and menu items (migrate from hardcoded)
-- Created: 2025-12-20

BEGIN;

-- ============================================
-- GUIDE QUICK ACTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS guide_quick_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  
  -- Action Details
  href VARCHAR(200) NOT NULL,
  label VARCHAR(100) NOT NULL,
  icon_name VARCHAR(50) NOT NULL, -- 'MapPin', 'ClipboardList', etc.
  color VARCHAR(50) NOT NULL, -- 'bg-emerald-500', etc.
  description VARCHAR(200),
  
  -- Display
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT guide_quick_actions_href_check CHECK (href ~ '^/'),
  CONSTRAINT guide_quick_actions_label_check CHECK (char_length(label) > 0)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_guide_quick_actions_branch_id ON guide_quick_actions(branch_id);
CREATE INDEX IF NOT EXISTS idx_guide_quick_actions_active ON guide_quick_actions(is_active, display_order);

-- Updated_at trigger
CREATE TRIGGER update_guide_quick_actions_updated_at
  BEFORE UPDATE ON guide_quick_actions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- GUIDE MENU ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS guide_menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  
  -- Menu Details
  section VARCHAR(50) NOT NULL, -- 'Akun', 'Operasional', 'Pengaturan'
  href VARCHAR(200) NOT NULL,
  label VARCHAR(100) NOT NULL,
  icon_name VARCHAR(50) NOT NULL,
  description VARCHAR(200),
  
  -- Display
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT guide_menu_items_href_check CHECK (href ~ '^/'),
  CONSTRAINT guide_menu_items_label_check CHECK (char_length(label) > 0),
  CONSTRAINT guide_menu_items_section_check CHECK (section IN ('Akun', 'Operasional', 'Pengaturan'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_guide_menu_items_branch_id ON guide_menu_items(branch_id);
CREATE INDEX IF NOT EXISTS idx_guide_menu_items_section ON guide_menu_items(section, display_order);
CREATE INDEX IF NOT EXISTS idx_guide_menu_items_active ON guide_menu_items(is_active);

-- Updated_at trigger
CREATE TRIGGER update_guide_menu_items_updated_at
  BEFORE UPDATE ON guide_menu_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS POLICIES
-- ============================================

-- Guide Quick Actions RLS
ALTER TABLE guide_quick_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Guides can view active quick actions" ON guide_quick_actions;
CREATE POLICY "Guides can view active quick actions"
  ON guide_quick_actions FOR SELECT
  USING (
    is_active = true AND
    (branch_id IS NULL OR branch_id IN (
      SELECT branch_id FROM users WHERE id = auth.uid()
    ))
  );

DROP POLICY IF EXISTS "Admins can manage quick actions" ON guide_quick_actions;
CREATE POLICY "Admins can manage quick actions"
  ON guide_quick_actions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'ops_admin')
      AND (branch_id IS NULL OR users.branch_id = guide_quick_actions.branch_id)
    )
  );

-- Guide Menu Items RLS
ALTER TABLE guide_menu_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Guides can view active menu items" ON guide_menu_items;
CREATE POLICY "Guides can view active menu items"
  ON guide_menu_items FOR SELECT
  USING (
    is_active = true AND
    (branch_id IS NULL OR branch_id IN (
      SELECT branch_id FROM users WHERE id = auth.uid()
    ))
  );

DROP POLICY IF EXISTS "Admins can manage menu items" ON guide_menu_items;
CREATE POLICY "Admins can manage menu items"
  ON guide_menu_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'ops_admin')
      AND (branch_id IS NULL OR users.branch_id = guide_menu_items.branch_id)
    )
  );

-- ============================================
-- DEFAULT DATA
-- ============================================

-- Insert default quick actions (branch_id = NULL means applies to all branches)
-- Use INSERT ... ON CONFLICT with href as unique identifier
INSERT INTO guide_quick_actions (branch_id, href, label, icon_name, color, description, display_order)
SELECT * FROM (VALUES
  (NULL::uuid, '/guide/attendance', 'Absensi', 'MapPin', 'bg-emerald-500', 'Check-in lokasi', 1),
  (NULL::uuid, '/guide/manifest', 'Manifest', 'ClipboardList', 'bg-blue-500', 'Cek tamu', 2),
  (NULL::uuid, '/guide/sos', 'SOS', 'AlertTriangle', 'bg-red-500', 'Panic button', 3),
  (NULL::uuid, '/guide/insights', 'Insight', 'BarChart3', 'bg-purple-500', 'Analisis performa', 4),
  (NULL::uuid, '/guide/incidents', 'Insiden', 'FileText', 'bg-orange-500', 'Laporan insiden', 5),
  (NULL::uuid, '/guide/trips', 'Trip Saya', 'Calendar', 'bg-cyan-500', 'Daftar trip', 6),
  (NULL::uuid, '/guide/status', 'Status', 'Clock', 'bg-slate-500', 'Ketersediaan', 7),
  (NULL::uuid, '/guide/preferences', 'Preferensi', 'Settings', 'bg-gray-500', 'Pengaturan', 8),
  (NULL::uuid, '/guide/wallet', 'Dompet', 'Wallet', 'bg-green-500', 'Pendapatan', 9),
  (NULL::uuid, '/guide/broadcasts', 'Broadcast', 'Megaphone', 'bg-yellow-500', 'Pengumuman', 10),
  (NULL::uuid, '/guide/locations', 'Lokasi', 'MapPin', 'bg-indigo-500', 'Peta offline', 11)
) AS v(branch_id, href, label, icon_name, color, description, display_order)
WHERE NOT EXISTS (
  SELECT 1 FROM guide_quick_actions 
  WHERE guide_quick_actions.href = v.href 
    AND (guide_quick_actions.branch_id = v.branch_id OR (guide_quick_actions.branch_id IS NULL AND v.branch_id IS NULL))
);

-- Insert default menu items
INSERT INTO guide_menu_items (branch_id, section, href, label, icon_name, description, display_order)
SELECT * FROM (VALUES
  -- Akun Section
  (NULL::uuid, 'Akun', '/guide/profile/edit', 'Edit Profil', 'User', 'Ubah informasi profil', 1),
  (NULL::uuid, 'Akun', '/guide/ratings', 'Rating & Ulasan', 'Star', 'Lihat penilaian customer', 2),
  
  -- Operasional Section
  (NULL::uuid, 'Operasional', '/guide/insights', 'Insight Pribadi', 'BarChart3', 'Analisis performa pribadi', 1),
  (NULL::uuid, 'Operasional', '/guide/broadcasts', 'Broadcast Ops', 'Megaphone', 'Pengumuman dari operasional', 2),
  (NULL::uuid, 'Operasional', '/guide/incidents', 'Laporan Insiden', 'FileText', 'Laporkan insiden atau masalah', 3),
  
  -- Pengaturan Section
  (NULL::uuid, 'Pengaturan', '/guide/settings', 'Pengaturan', 'Settings', 'Pengaturan aplikasi', 1),
  (NULL::uuid, 'Pengaturan', '/guide/documents', 'Dokumen', 'FileText', 'Dokumen dan sertifikat', 2),
  (NULL::uuid, 'Pengaturan', '/legal/privacy', 'Kebijakan Privasi', 'Shield', 'Kebijakan privasi dan data', 3),
  (NULL::uuid, 'Pengaturan', '/help', 'Bantuan', 'HelpCircle', 'Pusat bantuan dan FAQ', 4)
) AS v(branch_id, section, href, label, icon_name, description, display_order)
WHERE NOT EXISTS (
  SELECT 1 FROM guide_menu_items 
  WHERE guide_menu_items.href = v.href 
    AND guide_menu_items.section = v.section
    AND (guide_menu_items.branch_id = v.branch_id OR (guide_menu_items.branch_id IS NULL AND v.branch_id IS NULL))
);

COMMIT;

