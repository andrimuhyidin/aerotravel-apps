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
      AND users.role IN ('super_admin', 'ops_admin')
    )
  );

