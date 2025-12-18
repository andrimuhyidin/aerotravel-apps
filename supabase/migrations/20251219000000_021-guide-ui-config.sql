-- Migration: 021-guide-ui-config.sql
-- Description: Guide UI configuration tables (quick actions & menu items)
-- Created: 2025-12-19

-- ============================================
-- GUIDE QUICK ACTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS guide_quick_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  href VARCHAR(200) NOT NULL,
  label VARCHAR(100) NOT NULL,
  icon_name VARCHAR(50) NOT NULL,
  color VARCHAR(50) NOT NULL,
  description VARCHAR(200),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guide_quick_actions_branch ON guide_quick_actions(branch_id);
CREATE INDEX IF NOT EXISTS idx_guide_quick_actions_active ON guide_quick_actions(is_active, display_order);

-- ============================================
-- GUIDE MENU ITEMS
-- ============================================
CREATE TABLE IF NOT EXISTS guide_menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  section VARCHAR(50) NOT NULL,
  href VARCHAR(200) NOT NULL,
  label VARCHAR(100) NOT NULL,
  icon_name VARCHAR(50) NOT NULL,
  description VARCHAR(200),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guide_menu_items_branch ON guide_menu_items(branch_id);
CREATE INDEX IF NOT EXISTS idx_guide_menu_items_section ON guide_menu_items(section, display_order);
CREATE INDEX IF NOT EXISTS idx_guide_menu_items_active ON guide_menu_items(is_active);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE guide_quick_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE guide_menu_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Guides can read active quick actions" ON guide_quick_actions;
DROP POLICY IF EXISTS "Guides can read active menu items" ON guide_menu_items;
DROP POLICY IF EXISTS "Admins can manage quick actions" ON guide_quick_actions;
DROP POLICY IF EXISTS "Admins can manage menu items" ON guide_menu_items;

-- Quick Actions: Guides can read active items (global or their branch)
DROP POLICY IF EXISTS "Guides can read active quick actions" ON guide_quick_actions;
CREATE POLICY "Guides can read active quick actions"
  ON guide_quick_actions FOR SELECT
  USING (
    is_active = true AND
    (
      branch_id IS NULL 
      OR branch_id IN (SELECT branch_id FROM users WHERE id = auth.uid())
    )
  );

-- Menu Items: Guides can read active items (global or their branch)
DROP POLICY IF EXISTS "Guides can read active menu items" ON guide_menu_items;
CREATE POLICY "Guides can read active menu items"
  ON guide_menu_items FOR SELECT
  USING (
    is_active = true AND
    (
      branch_id IS NULL 
      OR branch_id IN (SELECT branch_id FROM users WHERE id = auth.uid())
    )
  );

-- Admins can manage
CREATE POLICY "Admins can manage quick actions"
  ON guide_quick_actions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'ops_admin')
    )
  );

CREATE POLICY "Admins can manage menu items"
  ON guide_menu_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'ops_admin')
    )
  );

