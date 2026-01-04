-- User Saved Filters Schema
-- Store user's custom filter presets

CREATE TABLE IF NOT EXISTS user_saved_filters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module TEXT NOT NULL, -- 'bookings', 'users', 'products', 'payments', etc.
  filter_name TEXT NOT NULL,
  filter_conditions JSONB NOT NULL,
  is_default BOOLEAN DEFAULT false,
  is_shared BOOLEAN DEFAULT false, -- If true, visible to all admins
  usage_count INT DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, module, filter_name)
);

-- Indexes for saved filters
CREATE INDEX IF NOT EXISTS idx_user_saved_filters_user_id ON user_saved_filters(user_id);
CREATE INDEX IF NOT EXISTS idx_user_saved_filters_module ON user_saved_filters(module);
CREATE INDEX IF NOT EXISTS idx_user_saved_filters_is_shared ON user_saved_filters(is_shared);

-- Filter usage statistics
CREATE TABLE IF NOT EXISTS filter_usage_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  filter_id UUID REFERENCES user_saved_filters(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  used_at TIMESTAMPTZ DEFAULT NOW(),
  result_count INT
);

CREATE INDEX IF NOT EXISTS idx_filter_usage_stats_filter_id ON filter_usage_stats(filter_id);
CREATE INDEX IF NOT EXISTS idx_filter_usage_stats_used_at ON filter_usage_stats(used_at);

-- RLS for saved filters
ALTER TABLE user_saved_filters ENABLE ROW LEVEL SECURITY;

-- Users can manage their own filters
CREATE POLICY "Users can manage own filters" ON user_saved_filters
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Users can view shared filters
CREATE POLICY "Users can view shared filters" ON user_saved_filters
  FOR SELECT
  TO authenticated
  USING (is_shared = true);

-- RLS for usage stats
ALTER TABLE filter_usage_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own filter stats" ON filter_usage_stats
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

COMMENT ON TABLE user_saved_filters IS 'User-created filter presets for various admin modules';
COMMENT ON TABLE filter_usage_stats IS 'Track filter usage for analytics';

