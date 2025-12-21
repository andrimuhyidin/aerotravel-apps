-- Migration: 062-guide-promos-table.sql
-- Description: Create guide_promos table for managing promos and announcements for guides
-- Created: 2025-01-24

BEGIN;

-- ============================================
-- GUIDE PROMOS & ANNOUNCEMENTS
-- ============================================

DO $$ BEGIN
  CREATE TYPE promo_item_type AS ENUM (
    'promo',
    'update',
    'announcement'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE promo_priority AS ENUM (
    'low',
    'medium',
    'high'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS guide_promos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL, -- NULL = global for all branches
  
  -- Item Info
  type promo_item_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  subtitle VARCHAR(255),
  description TEXT,
  
  -- Link & Badge
  link TEXT, -- Internal link (e.g., '/guide/insights')
  badge VARCHAR(50), -- Display badge (e.g., 'HOT', 'NEW', 'INFO')
  gradient VARCHAR(100), -- Tailwind gradient class (e.g., 'from-emerald-500 to-teal-600')
  
  -- Priority & Scheduling
  priority promo_priority NOT NULL DEFAULT 'medium',
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ, -- NULL = no end date
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Target Audience (optional)
  target_roles UUID[], -- NULL = all guides, or specific role IDs
  target_guide_ids UUID[], -- NULL = all guides, or specific guide IDs
  
  -- Audit
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_date_range CHECK (end_date IS NULL OR end_date >= start_date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_guide_promos_branch_id ON guide_promos(branch_id);
CREATE INDEX IF NOT EXISTS idx_guide_promos_type ON guide_promos(type);
CREATE INDEX IF NOT EXISTS idx_guide_promos_is_active ON guide_promos(is_active);
CREATE INDEX IF NOT EXISTS idx_guide_promos_priority ON guide_promos(priority);
CREATE INDEX IF NOT EXISTS idx_guide_promos_dates ON guide_promos(start_date, end_date);

-- RLS Policies
ALTER TABLE guide_promos ENABLE ROW LEVEL SECURITY;

-- Guides can view active promos for their branch
CREATE POLICY "guide_view_promos" ON guide_promos
  FOR SELECT
  USING (
    is_active = true
    AND (end_date IS NULL OR end_date >= NOW())
    AND start_date <= NOW()
    AND (
      branch_id IS NULL -- Global promos
      OR branch_id IN (
        SELECT branch_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- Admins can manage promos
CREATE POLICY "admin_manage_promos" ON guide_promos
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'ops_admin', 'marketing')
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_guide_promos_updated_at
  BEFORE UPDATE ON guide_promos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE guide_promos IS 'Promos, updates, and announcements for guides';
COMMENT ON COLUMN guide_promos.type IS 'Type of item: promo, update, or announcement';
COMMENT ON COLUMN guide_promos.branch_id IS 'NULL means global (all branches), otherwise specific branch';
COMMENT ON COLUMN guide_promos.target_roles IS 'Optional: target specific roles. NULL = all roles';
COMMENT ON COLUMN guide_promos.target_guide_ids IS 'Optional: target specific guides. NULL = all guides';

COMMIT;

