-- Migration: 026-guide-social-challenges.sql
-- Description: Social feed & challenge system tables
-- Created: 2025-12-19

BEGIN;

-- ============================================
-- GUIDE SOCIAL POSTS (Feed)
-- ============================================
CREATE TABLE IF NOT EXISTS guide_social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Post Content
  caption TEXT NOT NULL,
  photos TEXT[], -- Array of photo URLs
  
  -- Trip Reference (optional)
  trip_id UUID REFERENCES trips(id),
  
  -- Engagement
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  
  -- Visibility
  is_public BOOLEAN DEFAULT true, -- Public feed or guide-only
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- GUIDE SOCIAL POST LIKES
-- ============================================
CREATE TABLE IF NOT EXISTS guide_social_post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES guide_social_posts(id) ON DELETE CASCADE,
  guide_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(post_id, guide_id)
);

-- ============================================
-- GUIDE SOCIAL POST COMMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS guide_social_post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES guide_social_posts(id) ON DELETE CASCADE,
  guide_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- GUIDE CHALLENGES (Custom Challenges)
-- ============================================
CREATE TABLE IF NOT EXISTS guide_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Challenge Info
  challenge_type VARCHAR(50) NOT NULL, -- 'trip_count', 'rating', 'earnings', 'perfect_month', 'custom'
  title VARCHAR(200) NOT NULL,
  description TEXT,
  target_value DECIMAL(14,2) NOT NULL,
  current_value DECIMAL(14,2) DEFAULT 0,
  
  -- Timeline
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  target_date DATE,
  
  -- Status
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed', 'failed', 'paused'
  completed_at TIMESTAMPTZ,
  
  -- Reward
  reward_description TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_guide_social_posts_guide_id ON guide_social_posts(guide_id);
CREATE INDEX IF NOT EXISTS idx_guide_social_posts_trip_id ON guide_social_posts(trip_id);
CREATE INDEX IF NOT EXISTS idx_guide_social_posts_created_at ON guide_social_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_guide_social_post_likes_post_id ON guide_social_post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_guide_social_post_comments_post_id ON guide_social_post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_guide_challenges_guide_id ON guide_challenges(guide_id);
CREATE INDEX IF NOT EXISTS idx_guide_challenges_status ON guide_challenges(status);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE guide_social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE guide_social_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE guide_social_post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE guide_challenges ENABLE ROW LEVEL SECURITY;

-- Social Posts: Guides can see public posts and own posts
CREATE POLICY "guide_social_posts_view" ON guide_social_posts
  FOR SELECT
  USING (
    is_public = true OR guide_id = auth.uid()
  );

CREATE POLICY "guide_social_posts_own" ON guide_social_posts
  FOR ALL
  USING (guide_id = auth.uid());

-- Likes: Guides can like any post
CREATE POLICY "guide_social_post_likes_all" ON guide_social_post_likes
  FOR ALL
  USING (true);

-- Comments: Guides can comment on any post
CREATE POLICY "guide_social_post_comments_all" ON guide_social_post_comments
  FOR ALL
  USING (true);

-- Challenges: Guides can manage own challenges
CREATE POLICY "guide_challenges_own" ON guide_challenges
  FOR ALL
  USING (guide_id = auth.uid());

COMMIT;

