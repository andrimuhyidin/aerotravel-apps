-- Migration: 100-partner-search-presets.sql
-- Description: Saved search presets for partners
-- Created: 2025-12-25

-- ============================================
-- PARTNER SEARCH PRESETS
-- ============================================
CREATE TABLE IF NOT EXISTS partner_search_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  filters JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_partner_search_presets_partner_id ON partner_search_presets(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_search_presets_created_at ON partner_search_presets(created_at DESC);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_partner_search_presets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER partner_search_presets_updated_at
  BEFORE UPDATE ON partner_search_presets
  FOR EACH ROW
  EXECUTE FUNCTION update_partner_search_presets_updated_at();

-- RLS Policies
ALTER TABLE partner_search_presets ENABLE ROW LEVEL SECURITY;

-- Partners can only see their own presets
CREATE POLICY "partner_search_presets_select_own" ON partner_search_presets
  FOR SELECT
  USING (partner_id = auth.uid());

-- Partners can insert their own presets
CREATE POLICY "partner_search_presets_insert_own" ON partner_search_presets
  FOR INSERT
  WITH CHECK (partner_id = auth.uid());

-- Partners can update their own presets
CREATE POLICY "partner_search_presets_update_own" ON partner_search_presets
  FOR UPDATE
  USING (partner_id = auth.uid())
  WITH CHECK (partner_id = auth.uid());

-- Partners can delete their own presets
CREATE POLICY "partner_search_presets_delete_own" ON partner_search_presets
  FOR DELETE
  USING (partner_id = auth.uid());

-- Admins can see all presets
CREATE POLICY "partner_search_presets_select_admin" ON partner_search_presets
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'admin', 'ops_admin')
    )
  );

