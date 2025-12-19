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
      AND users.role IN ('super_admin', 'ops_admin')
    )
  );

