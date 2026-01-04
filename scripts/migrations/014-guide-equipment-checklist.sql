-- Migration: 014-guide-equipment-checklist.sql
-- Description: Equipment Checklist & Inventory for Guides
-- Created: 2025-01-XX

-- ============================================
-- EQUIPMENT CHECKLIST
-- ============================================
CREATE TABLE IF NOT EXISTS guide_equipment_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  guide_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id),
  
  -- Equipment Items
  equipment_items JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of {id, name, checked, photo_url, notes, needs_repair}
  
  -- Status
  completed_at TIMESTAMPTZ,
  is_completed BOOLEAN DEFAULT false,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- EQUIPMENT REPORTS (Damage/Repair)
-- ============================================
CREATE TABLE IF NOT EXISTS guide_equipment_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_checklist_id UUID REFERENCES guide_equipment_checklists(id) ON DELETE CASCADE,
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  guide_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id),
  
  -- Equipment Info
  equipment_name VARCHAR(200) NOT NULL,
  equipment_type VARCHAR(50), -- life_jacket, snorkeling_gear, first_aid, etc.
  
  -- Report Details
  issue_type VARCHAR(50) NOT NULL, -- damage, missing, needs_repair, low_stock
  description TEXT NOT NULL,
  photo_url TEXT,
  severity VARCHAR(20) DEFAULT 'medium', -- low, medium, high, critical
  
  -- Status
  status VARCHAR(20) DEFAULT 'reported', -- reported, acknowledged, in_progress, resolved
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id),
  resolution_notes TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_guide_equipment_checklists_trip_id ON guide_equipment_checklists(trip_id);
CREATE INDEX IF NOT EXISTS idx_guide_equipment_checklists_guide_id ON guide_equipment_checklists(guide_id);
CREATE INDEX IF NOT EXISTS idx_guide_equipment_checklists_branch_id ON guide_equipment_checklists(branch_id);
CREATE INDEX IF NOT EXISTS idx_guide_equipment_reports_checklist_id ON guide_equipment_reports(equipment_checklist_id);
CREATE INDEX IF NOT EXISTS idx_guide_equipment_reports_trip_id ON guide_equipment_reports(trip_id);
CREATE INDEX IF NOT EXISTS idx_guide_equipment_reports_guide_id ON guide_equipment_reports(guide_id);
CREATE INDEX IF NOT EXISTS idx_guide_equipment_reports_status ON guide_equipment_reports(status);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE guide_equipment_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE guide_equipment_reports ENABLE ROW LEVEL SECURITY;

-- Guides can manage their own checklists
CREATE POLICY "guide_equipment_checklists_own" ON guide_equipment_checklists
  FOR ALL
  USING (guide_id = auth.uid())
  WITH CHECK (guide_id = auth.uid());

-- Guides can create reports
CREATE POLICY "guide_equipment_reports_create" ON guide_equipment_reports
  FOR INSERT
  WITH CHECK (guide_id = auth.uid());

-- Guides can view their own reports
CREATE POLICY "guide_equipment_reports_own" ON guide_equipment_reports
  FOR SELECT
  USING (guide_id = auth.uid());

-- Ops/admin can view all
CREATE POLICY "guide_equipment_checklists_ops" ON guide_equipment_checklists
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'ops_admin')
    )
  );

CREATE POLICY "guide_equipment_reports_ops" ON guide_equipment_reports
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'ops_admin')
    )
  );

