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
      AND users.role IN ('super_admin', 'admin', 'ops')
    )
  );

CREATE POLICY "guide_equipment_reports_ops" ON guide_equipment_reports
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'admin', 'ops')
    )
  );

-- Migration: 015-guide-trip-activity-log.sql
-- Description: Trip Activity Log dengan auto-timestamp untuk timeline
-- Created: 2025-01-XX

-- ============================================
-- TRIP ACTIVITY LOG
-- ============================================
CREATE TABLE IF NOT EXISTS guide_trip_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  guide_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id),
  
  -- Activity Info
  activity_type VARCHAR(50) NOT NULL, -- boarding, activity, return, check_in, check_out, etc.
  activity_label VARCHAR(200) NOT NULL,
  activity_description TEXT,
  
  -- Location (optional)
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  location_name TEXT,
  
  -- Auto-timestamp
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Metadata
  metadata JSONB, -- Additional data (guest count, photos, etc.)
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TRIP TIMELINE SHARES
-- ============================================
CREATE TABLE IF NOT EXISTS guide_trip_timeline_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  guide_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Share Info
  share_token VARCHAR(64) NOT NULL UNIQUE, -- Unique token for sharing
  expires_at TIMESTAMPTZ, -- Optional expiration
  
  -- Access Control
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_guide_trip_activity_logs_trip_id ON guide_trip_activity_logs(trip_id);
CREATE INDEX IF NOT EXISTS idx_guide_trip_activity_logs_guide_id ON guide_trip_activity_logs(guide_id);
CREATE INDEX IF NOT EXISTS idx_guide_trip_activity_logs_recorded_at ON guide_trip_activity_logs(recorded_at);
CREATE INDEX IF NOT EXISTS idx_guide_trip_timeline_shares_trip_id ON guide_trip_timeline_shares(trip_id);
CREATE INDEX IF NOT EXISTS idx_guide_trip_timeline_shares_token ON guide_trip_timeline_shares(share_token);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE guide_trip_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE guide_trip_timeline_shares ENABLE ROW LEVEL SECURITY;

-- Guides can manage their own activity logs
CREATE POLICY "guide_trip_activity_logs_own" ON guide_trip_activity_logs
  FOR ALL
  USING (guide_id = auth.uid())
  WITH CHECK (guide_id = auth.uid());

-- Guides can manage their own timeline shares
CREATE POLICY "guide_trip_timeline_shares_own" ON guide_trip_timeline_shares
  FOR ALL
  USING (guide_id = auth.uid())
  WITH CHECK (guide_id = auth.uid());

-- Public access to shared timelines (read-only)
CREATE POLICY "guide_trip_timeline_shares_public" ON guide_trip_timeline_shares
  FOR SELECT
  USING (is_active = true AND (expires_at IS NULL OR expires_at > NOW()));

-- Ops/admin can view all
CREATE POLICY "guide_trip_activity_logs_ops" ON guide_trip_activity_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'admin', 'ops')
    )
  );

-- Migration: 016-guide-performance-goals.sql
-- Description: Performance Goals & Personal Targets untuk Guide
-- Created: 2025-01-XX

-- ============================================
-- GUIDE PERFORMANCE GOALS
-- ============================================
CREATE TABLE IF NOT EXISTS guide_performance_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id),
  
  -- Period
  year INTEGER NOT NULL,
  month INTEGER NOT NULL, -- 1-12
  
  -- Targets
  target_trips INTEGER DEFAULT 0,
  target_rating DECIMAL(3,2) DEFAULT 0, -- Target rating (0-5)
  target_income DECIMAL(14,2) DEFAULT 0, -- Target income in Rupiah
  
  -- Current Progress (calculated from actual data)
  current_trips INTEGER DEFAULT 0,
  current_rating DECIMAL(3,2) DEFAULT 0,
  current_income DECIMAL(14,2) DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(guide_id, year, month)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_guide_performance_goals_guide_id ON guide_performance_goals(guide_id);
CREATE INDEX IF NOT EXISTS idx_guide_performance_goals_period ON guide_performance_goals(year, month);
CREATE INDEX IF NOT EXISTS idx_guide_performance_goals_branch_id ON guide_performance_goals(branch_id);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE guide_performance_goals ENABLE ROW LEVEL SECURITY;

-- Guides can manage their own goals
CREATE POLICY "guide_performance_goals_own" ON guide_performance_goals
  FOR ALL
  USING (guide_id = auth.uid())
  WITH CHECK (guide_id = auth.uid());

-- Ops/admin can view all
CREATE POLICY "guide_performance_goals_ops" ON guide_performance_goals
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'admin', 'ops')
    )
  );

