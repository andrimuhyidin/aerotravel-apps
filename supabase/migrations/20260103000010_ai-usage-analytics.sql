-- AI Usage Analytics Table
-- Tracks usage of AI features for monitoring and billing

CREATE TABLE IF NOT EXISTS ai_usage_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature TEXT NOT NULL CHECK (feature IN ('rag_search', 'briefing_generation', 'briefing_edit', 'chat_assistant', 'vision_sentiment', 'quotation_copilot', 'inbox_parser', 'sales_insights')),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
  tokens_used INTEGER DEFAULT 0,
  latency_ms INTEGER,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_ai_usage_feature ON ai_usage_analytics(feature);
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_id ON ai_usage_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_created_at ON ai_usage_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_usage_feature_date ON ai_usage_analytics(feature, created_at);

-- RLS Policies
ALTER TABLE ai_usage_analytics ENABLE ROW LEVEL SECURITY;

-- Only admins can read analytics
CREATE POLICY "Admins can read AI usage analytics"
  ON ai_usage_analytics
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'ops_admin', 'finance_manager')
    )
  );

-- System/server can insert (no user context needed for tracking)
CREATE POLICY "Service role can insert AI usage analytics"
  ON ai_usage_analytics
  FOR INSERT
  WITH CHECK (true);

-- Function to get AI usage summary
CREATE OR REPLACE FUNCTION get_ai_usage_summary(
  p_start_date TIMESTAMPTZ DEFAULT (now() - INTERVAL '30 days'),
  p_end_date TIMESTAMPTZ DEFAULT now()
)
RETURNS TABLE (
  feature TEXT,
  total_count BIGINT,
  success_count BIGINT,
  error_count BIGINT,
  avg_latency_ms NUMERIC,
  total_tokens BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.feature,
    COUNT(*)::BIGINT as total_count,
    COUNT(*) FILTER (WHERE a.success = true)::BIGINT as success_count,
    COUNT(*) FILTER (WHERE a.success = false)::BIGINT as error_count,
    ROUND(AVG(a.latency_ms), 2) as avg_latency_ms,
    COALESCE(SUM(a.tokens_used), 0)::BIGINT as total_tokens
  FROM ai_usage_analytics a
  WHERE a.created_at BETWEEN p_start_date AND p_end_date
  GROUP BY a.feature
  ORDER BY total_count DESC;
END;
$$;

COMMENT ON TABLE ai_usage_analytics IS 'Tracks AI feature usage for analytics and monitoring';

