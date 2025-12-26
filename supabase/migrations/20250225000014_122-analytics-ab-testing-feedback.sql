-- Migration: Add Analytics & Tracking Tables
-- Description: Tables for A/B testing, feature analytics, performance monitoring, and user feedback
-- Author: AI Assistant
-- Date: 2025-12-25

-- =====================================================
-- Table: feature_analytics_events
-- =====================================================
CREATE TABLE IF NOT EXISTS public.feature_analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  
  -- Event metadata
  event_name TEXT NOT NULL,
  event_category TEXT NOT NULL, -- 'page_view', 'click', 'form_submit', 'feature_use', etc.
  event_action TEXT NOT NULL,
  event_label TEXT,
  event_value NUMERIC,
  
  -- Feature-specific
  feature_name TEXT, -- 'package_filter', 'quick_view', 'booking_widget', etc.
  feature_variant TEXT, -- For A/B testing: 'control', 'variant_a', 'variant_b'
  
  -- Page context
  page_url TEXT,
  page_title TEXT,
  referrer TEXT,
  
  -- User context
  user_agent TEXT,
  device_type TEXT, -- 'mobile', 'tablet', 'desktop'
  browser TEXT,
  os TEXT,
  
  -- Performance metrics
  page_load_time INTEGER, -- milliseconds
  time_to_interactive INTEGER, -- milliseconds
  first_contentful_paint INTEGER, -- milliseconds
  
  -- Custom properties (JSONB for flexibility)
  properties JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON public.feature_analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_session_id ON public.feature_analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event_name ON public.feature_analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_event_category ON public.feature_analytics_events(event_category);
CREATE INDEX IF NOT EXISTS idx_analytics_feature_name ON public.feature_analytics_events(feature_name);
CREATE INDEX IF NOT EXISTS idx_analytics_feature_variant ON public.feature_analytics_events(feature_variant);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON public.feature_analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_device_type ON public.feature_analytics_events(device_type);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_analytics_feature_variant_date ON public.feature_analytics_events(feature_name, feature_variant, created_at DESC);

-- =====================================================
-- Table: ab_test_experiments
-- =====================================================
CREATE TABLE IF NOT EXISTS public.ab_test_experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_key TEXT UNIQUE NOT NULL,
  experiment_name TEXT NOT NULL,
  description TEXT,
  
  -- Variants
  variants JSONB NOT NULL, -- Array of variant configs: [{"key": "control", "weight": 50}, {"key": "variant_a", "weight": 50}]
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'paused', 'completed')),
  
  -- Targeting
  target_audience JSONB, -- Rules for who sees the experiment
  target_pages TEXT[], -- Which pages the experiment runs on
  
  -- Dates
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  
  -- Results
  winning_variant TEXT,
  statistical_significance NUMERIC,
  
  -- Metadata
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ab_experiments_status ON public.ab_test_experiments(status);
CREATE INDEX IF NOT EXISTS idx_ab_experiments_key ON public.ab_test_experiments(experiment_key);

-- =====================================================
-- Table: ab_test_assignments
-- =====================================================
CREATE TABLE IF NOT EXISTS public.ab_test_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID NOT NULL REFERENCES public.ab_test_experiments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  variant_key TEXT NOT NULL,
  
  -- Timestamps
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique: one assignment per user/session per experiment
  UNIQUE(experiment_id, COALESCE(user_id::text, session_id))
);

CREATE INDEX IF NOT EXISTS idx_ab_assignments_experiment_id ON public.ab_test_assignments(experiment_id);
CREATE INDEX IF NOT EXISTS idx_ab_assignments_user_id ON public.ab_test_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_ab_assignments_session_id ON public.ab_test_assignments(session_id);

-- =====================================================
-- Table: performance_metrics
-- =====================================================
CREATE TABLE IF NOT EXISTS public.performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Page identification
  page_url TEXT NOT NULL,
  page_type TEXT, -- 'listing', 'detail', 'booking', etc.
  
  -- Core Web Vitals
  lcp NUMERIC, -- Largest Contentful Paint (seconds)
  fid NUMERIC, -- First Input Delay (milliseconds)
  cls NUMERIC, -- Cumulative Layout Shift (score)
  
  -- Additional metrics
  ttfb NUMERIC, -- Time to First Byte (milliseconds)
  fcp NUMERIC, -- First Contentful Paint (milliseconds)
  tti NUMERIC, -- Time to Interactive (milliseconds)
  
  -- Resource timing
  dom_load_time INTEGER, -- milliseconds
  page_load_time INTEGER, -- milliseconds
  resource_count INTEGER,
  
  -- Connection info
  connection_type TEXT, -- '4g', '3g', 'wifi', etc.
  effective_type TEXT,
  downlink NUMERIC, -- Mbps
  rtt INTEGER, -- Round-trip time (milliseconds)
  
  -- User context
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  device_type TEXT,
  browser TEXT,
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_performance_page_url ON public.performance_metrics(page_url);
CREATE INDEX IF NOT EXISTS idx_performance_page_type ON public.performance_metrics(page_type);
CREATE INDEX IF NOT EXISTS idx_performance_created_at ON public.performance_metrics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_performance_lcp ON public.performance_metrics(lcp);
CREATE INDEX IF NOT EXISTS idx_performance_device_type ON public.performance_metrics(device_type);

-- =====================================================
-- Table: user_feedback
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User info
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  user_email TEXT,
  user_name TEXT,
  
  -- Feedback type
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('bug', 'feature_request', 'general', 'complaint', 'praise')),
  category TEXT, -- 'ui_ux', 'performance', 'functionality', 'content', etc.
  
  -- Content
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  screenshots TEXT[], -- Array of image URLs
  
  -- Context
  page_url TEXT,
  user_agent TEXT,
  device_info JSONB,
  
  -- Priority & Status
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'under_review', 'in_progress', 'resolved', 'wont_fix', 'duplicate')),
  
  -- Assignment
  assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ,
  
  -- Resolution
  resolution_notes TEXT,
  resolved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  
  -- Engagement
  upvotes INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON public.user_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON public.user_feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON public.user_feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_priority ON public.user_feedback(priority);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON public.user_feedback(created_at DESC);

-- =====================================================
-- Table: feature_flags
-- =====================================================
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_key TEXT UNIQUE NOT NULL,
  flag_name TEXT NOT NULL,
  description TEXT,
  
  -- Status
  is_enabled BOOLEAN DEFAULT FALSE,
  
  -- Rollout
  rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  target_users UUID[], -- Specific user IDs
  target_roles TEXT[], -- Specific roles
  target_branches UUID[], -- Specific branch IDs
  
  -- Conditions
  conditions JSONB, -- Complex targeting rules
  
  -- Metadata
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON public.feature_flags(flag_key);
CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON public.feature_flags(is_enabled);

-- =====================================================
-- Materialized View: Feature Usage Stats
-- =====================================================
DROP MATERIALIZED VIEW IF EXISTS public.feature_usage_stats;
CREATE MATERIALIZED VIEW public.feature_usage_stats AS
SELECT
  feature_name,
  feature_variant,
  device_type,
  DATE_TRUNC('day', created_at) as date,
  COUNT(*) as total_events,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT session_id) as unique_sessions,
  AVG(CASE WHEN page_load_time IS NOT NULL THEN page_load_time END) as avg_page_load_time,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY page_load_time) as median_page_load_time,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY page_load_time) as p95_page_load_time
FROM feature_analytics_events
WHERE feature_name IS NOT NULL
GROUP BY feature_name, feature_variant, device_type, DATE_TRUNC('day', created_at);

CREATE INDEX IF NOT EXISTS idx_feature_usage_stats_name_date ON public.feature_usage_stats(feature_name, date DESC);
CREATE INDEX IF NOT EXISTS idx_feature_usage_stats_variant ON public.feature_usage_stats(feature_variant);

-- =====================================================
-- Functions
-- =====================================================

-- Function: Get user's A/B test variant
CREATE OR REPLACE FUNCTION get_ab_test_variant(
  p_experiment_key TEXT,
  p_user_id UUID DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
  v_experiment_id UUID;
  v_variant TEXT;
  v_variants JSONB;
  v_random_value NUMERIC;
  v_cumulative_weight NUMERIC := 0;
  v_variant_obj JSONB;
BEGIN
  -- Get experiment
  SELECT id, variants INTO v_experiment_id, v_variants
  FROM ab_test_experiments
  WHERE experiment_key = p_experiment_key
    AND status = 'running'
    AND (start_date IS NULL OR start_date <= NOW())
    AND (end_date IS NULL OR end_date >= NOW());
  
  IF v_experiment_id IS NULL THEN
    RETURN 'control'; -- Default to control if experiment not found
  END IF;
  
  -- Check existing assignment
  SELECT variant_key INTO v_variant
  FROM ab_test_assignments
  WHERE experiment_id = v_experiment_id
    AND (user_id = p_user_id OR session_id = p_session_id)
  LIMIT 1;
  
  IF v_variant IS NOT NULL THEN
    RETURN v_variant;
  END IF;
  
  -- Assign new variant based on weights
  v_random_value := random() * 100;
  
  FOR v_variant_obj IN SELECT * FROM jsonb_array_elements(v_variants)
  LOOP
    v_cumulative_weight := v_cumulative_weight + (v_variant_obj->>'weight')::NUMERIC;
    IF v_random_value <= v_cumulative_weight THEN
      v_variant := v_variant_obj->>'key';
      EXIT;
    END IF;
  END LOOP;
  
  -- Store assignment
  INSERT INTO ab_test_assignments (experiment_id, user_id, session_id, variant_key)
  VALUES (v_experiment_id, p_user_id, p_session_id, v_variant);
  
  RETURN v_variant;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Refresh feature usage stats
CREATE OR REPLACE FUNCTION refresh_feature_usage_stats()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.feature_usage_stats;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Note: For production, refresh on a schedule (e.g., every hour) instead of on every insert
-- CREATE TRIGGER trigger_refresh_feature_stats
--   AFTER INSERT ON public.feature_analytics_events
--   FOR EACH STATEMENT
--   EXECUTE FUNCTION refresh_feature_usage_stats();

-- =====================================================
-- RLS Policies
-- =====================================================

ALTER TABLE public.feature_analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ab_test_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ab_test_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Analytics: Users can insert their own events
CREATE POLICY "Users can insert their own analytics events"
  ON public.feature_analytics_events
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- Analytics: Staff can read all
CREATE POLICY "Staff can read all analytics"
  ON public.feature_analytics_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'marketing', 'ops_admin')
    )
  );

-- A/B Tests: Staff can manage
CREATE POLICY "Staff can manage experiments"
  ON public.ab_test_experiments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'marketing')
    )
  );

-- A/B Assignments: Users can read their own
CREATE POLICY "Users can read their assignments"
  ON public.ab_test_assignments
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Performance: Users can insert their own metrics
CREATE POLICY "Users can insert performance metrics"
  ON public.performance_metrics
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- Feedback: Users can create and read their own
CREATE POLICY "Users can manage their feedback"
  ON public.user_feedback
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Feedback: Staff can read all
CREATE POLICY "Staff can read all feedback"
  ON public.user_feedback
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'ops_admin', 'marketing')
    )
  );

-- Feature Flags: Anyone authenticated can read
CREATE POLICY "Authenticated users can read feature flags"
  ON public.feature_flags
  FOR SELECT
  TO authenticated
  USING (true);

-- Feature Flags: Only admins can modify
CREATE POLICY "Admins can manage feature flags"
  ON public.feature_flags
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'super_admin'
    )
  );

-- =====================================================
-- Grant permissions
-- =====================================================
GRANT SELECT ON public.feature_usage_stats TO authenticated;

-- =====================================================
-- Comments
-- =====================================================
COMMENT ON TABLE public.feature_analytics_events IS 'Tracks user interactions with new features for analytics';
COMMENT ON TABLE public.ab_test_experiments IS 'A/B test experiment configurations';
COMMENT ON TABLE public.ab_test_assignments IS 'User assignments to A/B test variants';
COMMENT ON TABLE public.performance_metrics IS 'Client-side performance metrics (Core Web Vitals, etc.)';
COMMENT ON TABLE public.user_feedback IS 'User-submitted feedback, bug reports, and feature requests';
COMMENT ON TABLE public.feature_flags IS 'Feature flag configurations for gradual rollouts';
COMMENT ON FUNCTION get_ab_test_variant IS 'Get or assign A/B test variant for a user/session';

