-- Migration: 059-guest-engagement.sql
-- Description: Guest Engagement Kit (Quiz, Games, Music)
-- Created: 2025-01-23

-- ============================================
-- QUIZ QUESTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES branches(id), -- NULL = global question
  
  -- Question Info
  question_text TEXT NOT NULL,
  question_type VARCHAR(20) DEFAULT 'multiple_choice', -- 'multiple_choice', 'true_false', 'open_ended'
  
  -- Options (JSONB for flexibility)
  options JSONB, -- Array of {text, is_correct} for multiple choice
  correct_answer TEXT, -- For true/false or open-ended
  
  -- Category
  category VARCHAR(50), -- 'destination', 'marine_life', 'safety', 'general'
  difficulty VARCHAR(20) DEFAULT 'medium', -- 'easy', 'medium', 'hard'
  
  -- Destination Link (optional)
  destination_id UUID, -- Link to specific destination
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_question_type CHECK (question_type IN ('multiple_choice', 'true_false', 'open_ended')),
  CONSTRAINT valid_difficulty CHECK (difficulty IN ('easy', 'medium', 'hard'))
);

-- ============================================
-- GUEST ENGAGEMENT SCORES
-- ============================================
CREATE TABLE IF NOT EXISTS guest_engagement_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  passenger_id UUID NOT NULL REFERENCES booking_passengers(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id),
  
  -- Activity Type
  activity_type VARCHAR(20) NOT NULL, -- 'quiz', 'photo_challenge', 'game'
  
  -- Quiz Specific
  question_id UUID REFERENCES quiz_questions(id),
  answer TEXT,
  is_correct BOOLEAN,
  points_earned INTEGER DEFAULT 0,
  
  -- Photo Challenge
  photo_url TEXT,
  photo_challenge_type VARCHAR(50), -- 'sunset', 'marine_life', 'best_selfie', etc.
  
  -- Game
  game_type VARCHAR(50), -- 'trivia', 'scavenger_hunt', etc.
  game_score INTEGER,
  
  -- Total Score
  total_points INTEGER DEFAULT 0,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_activity_type CHECK (activity_type IN ('quiz', 'photo_challenge', 'game')),
  CONSTRAINT valid_points CHECK (points_earned >= 0 AND total_points >= 0)
);

-- ============================================
-- GUEST ENGAGEMENT LEADERBOARD
-- ============================================
CREATE TABLE IF NOT EXISTS guest_engagement_leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  passenger_id UUID NOT NULL REFERENCES booking_passengers(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id),
  
  -- Scores
  total_points INTEGER DEFAULT 0,
  quiz_points INTEGER DEFAULT 0,
  photo_challenge_points INTEGER DEFAULT 0,
  game_points INTEGER DEFAULT 0,
  
  -- Ranking
  rank INTEGER,
  
  -- Audit
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(trip_id, passenger_id)
);

-- ============================================
-- MUSIC PLAYLISTS
-- ============================================
CREATE TABLE IF NOT EXISTS music_playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES branches(id), -- NULL = global playlist
  
  -- Playlist Info
  name VARCHAR(200) NOT NULL,
  description TEXT,
  spotify_playlist_id VARCHAR(200), -- Spotify playlist ID or URL
  spotify_playlist_url TEXT, -- Full Spotify URL
  
  -- Category
  category VARCHAR(50), -- 'chill', 'party', 'nature', 'indonesian'
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_quiz_questions_branch_id ON quiz_questions(branch_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_category ON quiz_questions(category);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_destination ON quiz_questions(destination_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_active ON quiz_questions(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_guest_scores_trip_id ON guest_engagement_scores(trip_id);
CREATE INDEX IF NOT EXISTS idx_guest_scores_passenger_id ON guest_engagement_scores(passenger_id);
CREATE INDEX IF NOT EXISTS idx_guest_scores_activity_type ON guest_engagement_scores(activity_type);

CREATE INDEX IF NOT EXISTS idx_leaderboard_trip_id ON guest_engagement_leaderboard(trip_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_points ON guest_engagement_leaderboard(total_points DESC);

CREATE INDEX IF NOT EXISTS idx_music_playlists_branch_id ON music_playlists(branch_id);
CREATE INDEX IF NOT EXISTS idx_music_playlists_category ON music_playlists(category);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_engagement_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_engagement_leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE music_playlists ENABLE ROW LEVEL SECURITY;

-- Everyone can view active quiz questions
CREATE POLICY "Anyone can view active quiz questions"
  ON quiz_questions
  FOR SELECT
  USING (is_active = true);

-- Guides can view scores for their trips
CREATE POLICY "Guides can view trip scores"
  ON guest_engagement_scores
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = guest_engagement_scores.trip_id
      AND (
        EXISTS (
          SELECT 1 FROM trip_guides
          WHERE trip_guides.trip_id = trips.id
          AND trip_guides.guide_id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM trip_crews
          WHERE trip_crews.trip_id = trips.id
          AND trip_crews.guide_id = auth.uid()
        )
      )
    )
  );

-- Anyone can submit scores (for passengers)
CREATE POLICY "Anyone can submit scores"
  ON guest_engagement_scores
  FOR INSERT
  WITH CHECK (true);

-- Everyone can view leaderboard
CREATE POLICY "Anyone can view leaderboard"
  ON guest_engagement_leaderboard
  FOR SELECT
  USING (true);

-- Everyone can view active playlists
CREATE POLICY "Anyone can view active playlists"
  ON music_playlists
  FOR SELECT
  USING (is_active = true);

-- Admins can manage all
CREATE POLICY "Admins can manage quiz questions"
  ON quiz_questions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'ops_admin')
    )
  );

CREATE POLICY "Admins can manage playlists"
  ON music_playlists
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'ops_admin')
    )
  );

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update leaderboard
CREATE OR REPLACE FUNCTION update_guest_leaderboard(
  p_trip_id UUID
)
RETURNS void AS $$
BEGIN
  -- Delete existing leaderboard
  DELETE FROM guest_engagement_leaderboard
  WHERE trip_id = p_trip_id;
  
  -- Recalculate and insert
  INSERT INTO guest_engagement_leaderboard (
    trip_id,
    passenger_id,
    branch_id,
    total_points,
    quiz_points,
    photo_challenge_points,
    game_points,
    rank,
    updated_at
  )
  SELECT 
    trip_id,
    passenger_id,
    branch_id,
    SUM(points_earned) AS total_points,
    SUM(points_earned) FILTER (WHERE activity_type = 'quiz') AS quiz_points,
    SUM(points_earned) FILTER (WHERE activity_type = 'photo_challenge') AS photo_challenge_points,
    SUM(points_earned) FILTER (WHERE activity_type = 'game') AS game_points,
    ROW_NUMBER() OVER (ORDER BY SUM(points_earned) DESC) AS rank,
    NOW()
  FROM guest_engagement_scores
  WHERE trip_id = p_trip_id
  GROUP BY trip_id, passenger_id, branch_id
  ORDER BY total_points DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at
CREATE TRIGGER update_quiz_questions_updated_at
  BEFORE UPDATE ON quiz_questions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_music_playlists_updated_at
  BEFORE UPDATE ON music_playlists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-update leaderboard when score is added
CREATE OR REPLACE FUNCTION auto_update_leaderboard()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_guest_leaderboard(NEW.trip_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_update_leaderboard_trigger
  AFTER INSERT OR UPDATE ON guest_engagement_scores
  FOR EACH ROW
  EXECUTE FUNCTION auto_update_leaderboard();

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE quiz_questions IS 'Quiz questions for guest engagement (destination trivia, marine life, etc.)';
COMMENT ON TABLE guest_engagement_scores IS 'Guest engagement scores (quiz answers, photo challenges, games)';
COMMENT ON TABLE guest_engagement_leaderboard IS 'Leaderboard for trip engagement (auto-updated)';
COMMENT ON TABLE music_playlists IS 'Spotify playlists for guest entertainment';
COMMENT ON FUNCTION update_guest_leaderboard IS 'Recalculate and update leaderboard for a trip';
