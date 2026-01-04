-- Migration: 078-video-briefing.sql
-- Description: Add video briefing option
-- Created: 2025-12-22

-- ============================================
-- TABLE: Safety Briefing Videos
-- ============================================
CREATE TABLE IF NOT EXISTS safety_briefing_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id),
  
  -- Video metadata
  video_title VARCHAR(255) NOT NULL,
  video_description TEXT,
  video_url TEXT NOT NULL, -- URL to video file in storage
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  file_size_bytes BIGINT,
  
  -- Language support
  language VARCHAR(10) DEFAULT 'id', -- 'id', 'en', 'zh', 'ja'
  
  -- Offline support
  is_available_offline BOOLEAN DEFAULT false,
  offline_download_url TEXT, -- For downloading for offline use
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_safety_briefing_videos_trip_id ON safety_briefing_videos(trip_id);
CREATE INDEX IF NOT EXISTS idx_safety_briefing_videos_branch_id ON safety_briefing_videos(branch_id);
CREATE INDEX IF NOT EXISTS idx_safety_briefing_videos_language ON safety_briefing_videos(language);
CREATE INDEX IF NOT EXISTS idx_safety_briefing_videos_is_active ON safety_briefing_videos(is_active);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE safety_briefing_videos ENABLE ROW LEVEL SECURITY;

-- Guides can view videos for their trips
CREATE POLICY "Guides can view trip videos"
  ON safety_briefing_videos
  FOR SELECT
  USING (
    is_active = true
    AND (
      trip_id IN (
        SELECT id FROM trips
        WHERE id IN (
          SELECT trip_id FROM trip_guides WHERE guide_id = auth.uid()
          UNION
          SELECT trip_id FROM trip_crews WHERE guide_id = auth.uid()
        )
      )
      OR EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
          AND users.role IN ('super_admin', 'ops_admin')
      )
    )
  );

-- Admins can manage videos
CREATE POLICY "Admins can manage videos"
  ON safety_briefing_videos
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('super_admin', 'ops_admin')
    )
  );

-- ============================================
-- TRIGGERS
-- ============================================
CREATE TRIGGER update_safety_briefing_videos_updated_at
  BEFORE UPDATE ON safety_briefing_videos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE safety_briefing_videos IS 'Video briefings for safety instructions (multi-language support)';

