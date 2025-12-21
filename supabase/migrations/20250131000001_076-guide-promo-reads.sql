-- Migration: 076-guide-promo-reads.sql
-- Description: Add read status tracking for guide promos (similar to broadcast_reads)
-- Created: 2025-01-31

BEGIN;

-- ============================================
-- GUIDE PROMO READS (Read Status Tracking)
-- ============================================

CREATE TABLE IF NOT EXISTS guide_promo_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  promo_id UUID NOT NULL REFERENCES guide_promos(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Prevent duplicate reads
  UNIQUE(guide_id, promo_id)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_guide_promo_reads_guide_id ON guide_promo_reads(guide_id);
CREATE INDEX IF NOT EXISTS idx_guide_promo_reads_promo_id ON guide_promo_reads(promo_id);
CREATE INDEX IF NOT EXISTS idx_guide_promo_reads_read_at ON guide_promo_reads(read_at DESC);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE guide_promo_reads ENABLE ROW LEVEL SECURITY;

-- Guides can view their own read status
CREATE POLICY "guide_promo_reads_guide_view"
  ON guide_promo_reads FOR SELECT
  USING (guide_id = auth.uid());

-- Guides can mark their own reads (insert)
CREATE POLICY "guide_promo_reads_guide_insert"
  ON guide_promo_reads FOR INSERT
  WITH CHECK (guide_id = auth.uid());

-- Admins can view all read statuses
CREATE POLICY "guide_promo_reads_admin_view"
  ON guide_promo_reads FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'ops_admin', 'marketing')
    )
  );

-- Comments
COMMENT ON TABLE guide_promo_reads IS 'Track which guides have read which promos/updates/announcements';
COMMENT ON COLUMN guide_promo_reads.guide_id IS 'Guide who read the promo';
COMMENT ON COLUMN guide_promo_reads.promo_id IS 'Promo that was read';
COMMENT ON COLUMN guide_promo_reads.read_at IS 'Timestamp when promo was read';

COMMIT;

