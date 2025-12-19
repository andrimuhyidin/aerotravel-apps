-- Migration: 033-guide-enhancement-system.sql
-- Description: Comprehensive Guide Enhancement System
-- Includes: Onboarding, Assessment, Skillset, Preferences, Performance
-- Date: 2025-12-19

BEGIN;

-- ============================================
-- ONBOARDING SYSTEM
-- ============================================

-- Onboarding Steps/Tasks
CREATE TABLE IF NOT EXISTS guide_onboarding_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES branches(id),
  
  -- Step Info
  step_order INTEGER NOT NULL,
  step_type VARCHAR(50) NOT NULL, -- 'document', 'training', 'assessment', 'profile_setup'
  title VARCHAR(255) NOT NULL,
  description TEXT,
  instructions TEXT,
  
  -- Requirements
  is_required BOOLEAN DEFAULT true,
  estimated_minutes INTEGER, -- Time to complete
  
  -- Dependencies
  depends_on_step_id UUID REFERENCES guide_onboarding_steps(id),
  
  -- Resources
  resource_url TEXT, -- Link to training material, video, etc
  resource_type VARCHAR(50), -- 'video', 'document', 'link', 'form'
  
  -- Validation
  validation_type VARCHAR(50), -- 'manual', 'auto', 'quiz'
  validation_config JSONB, -- Quiz questions, auto-check rules
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Guide Onboarding Progress
CREATE TABLE IF NOT EXISTS guide_onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Progress Tracking
  current_step_id UUID REFERENCES guide_onboarding_steps(id),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  -- Status
  status VARCHAR(50) DEFAULT 'in_progress', -- 'in_progress', 'completed', 'paused', 'failed'
  completion_percentage INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(guide_id)
);

-- Step Completion Log
CREATE TABLE IF NOT EXISTS guide_onboarding_step_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  progress_id UUID NOT NULL REFERENCES guide_onboarding_progress(id) ON DELETE CASCADE,
  step_id UUID NOT NULL REFERENCES guide_onboarding_steps(id),
  
  -- Completion Data
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  completion_data JSONB, -- Answers, uploads, etc
  validation_result JSONB, -- Quiz scores, auto-validation results
  
  -- Status
  status VARCHAR(50) DEFAULT 'completed', -- 'completed', 'failed', 'needs_review'
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ASSESSMENT & SURVEY SYSTEM
-- ============================================

-- Assessment Templates
CREATE TABLE IF NOT EXISTS guide_assessment_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES branches(id),
  
  -- Template Info
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL, -- 'self_assessment', 'performance_review', 'skills_evaluation'
  version INTEGER DEFAULT 1,
  
  -- Assessment Config
  assessment_type VARCHAR(50) NOT NULL, -- 'quiz', 'survey', 'rating', 'mixed'
  estimated_minutes INTEGER,
  passing_score INTEGER, -- For quiz type (0-100)
  
  -- Questions (JSONB for flexibility)
  questions JSONB NOT NULL, -- Array of question objects
  
  -- Scoring
  scoring_config JSONB, -- How to calculate scores
  result_categories JSONB, -- Categories for results (e.g., "Beginner", "Intermediate", "Advanced")
  
  -- Scheduling
  is_recurring BOOLEAN DEFAULT false,
  recurrence_interval INTEGER, -- Days between assessments
  is_required BOOLEAN DEFAULT false,
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Guide Assessments
CREATE TABLE IF NOT EXISTS guide_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES guide_assessment_templates(id),
  
  -- Assessment Data
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  -- Answers
  answers JSONB NOT NULL DEFAULT '{}'::jsonb, -- { "q1": "answer1", "q2": "answer2" }
  
  -- Results
  score INTEGER, -- 0-100
  category VARCHAR(50), -- Result category from template
  insights JSONB, -- AI-generated insights
  
  -- Status
  status VARCHAR(50) DEFAULT 'in_progress', -- 'in_progress', 'completed', 'expired'
  
  -- Review
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Survey Responses (for periodic surveys)
CREATE TABLE IF NOT EXISTS guide_survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  survey_id UUID NOT NULL, -- Reference to survey template (can be external)
  
  -- Response Data
  responses JSONB NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Metadata
  survey_type VARCHAR(50), -- 'satisfaction', 'feedback', 'needs_assessment'
  is_anonymous BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SKILLSET MANAGEMENT
-- ============================================

-- Skills Catalog
CREATE TABLE IF NOT EXISTS guide_skills_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES branches(id),
  
  -- Skill Info
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL, -- 'language', 'activity', 'safety', 'communication', 'technical'
  icon_name VARCHAR(50), -- Icon identifier
  
  -- Skill Levels
  levels JSONB NOT NULL, -- Array of level definitions
  
  -- Validation
  validation_method VARCHAR(50), -- 'self_claim', 'assessment', 'certification', 'peer_review'
  requires_certification BOOLEAN DEFAULT false,
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Guide Skills
CREATE TABLE IF NOT EXISTS guide_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES guide_skills_catalog(id),
  
  -- Skill Level
  current_level INTEGER NOT NULL DEFAULT 1, -- 1-5 or based on catalog
  target_level INTEGER, -- Goal level
  
  -- Validation
  validated_at TIMESTAMPTZ,
  validated_by UUID REFERENCES users(id), -- Admin/Ops who validated
  validation_method VARCHAR(50), -- How it was validated
  validation_evidence JSONB, -- Certificates, assessment results, etc
  
  -- Status
  status VARCHAR(50) DEFAULT 'claimed', -- 'claimed', 'validated', 'expired', 'revoked'
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(guide_id, skill_id)
);

-- Skill Development Goals
CREATE TABLE IF NOT EXISTS guide_skill_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES guide_skills_catalog(id),
  
  -- Goal Info
  target_level INTEGER NOT NULL,
  target_date DATE,
  priority VARCHAR(50) DEFAULT 'medium', -- 'high', 'medium', 'low'
  
  -- Progress
  current_progress INTEGER DEFAULT 0, -- 0-100
  milestones JSONB, -- Array of milestone objects
  
  -- Status
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'completed', 'paused', 'cancelled'
  completed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PREFERENCES SYSTEM (Enhanced)
-- ============================================

-- Drop existing guide_preferences if exists and recreate with enhanced structure
DROP TABLE IF EXISTS guide_preferences CASCADE;

CREATE TABLE guide_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Work Preferences
  preferred_trip_types UUID[], -- Array of package/trip type IDs
  preferred_locations UUID[], -- Array of location IDs
  preferred_days_of_week INTEGER[], -- [1,2,3,4,5] for Mon-Fri
  preferred_time_slots JSONB, -- { "morning": true, "afternoon": true, "evening": false }
  max_trips_per_day INTEGER DEFAULT 1,
  max_trips_per_week INTEGER DEFAULT 5,
  
  -- Communication Preferences
  notification_preferences JSONB DEFAULT '{"push": true, "email": false, "sms": false}'::jsonb,
  preferred_language VARCHAR(10) DEFAULT 'id',
  
  -- Display Preferences
  theme_preference VARCHAR(20) DEFAULT 'system', -- 'light', 'dark', 'system'
  dashboard_layout JSONB, -- Custom dashboard widget order
  
  -- Learning Preferences
  learning_style VARCHAR(50), -- 'visual', 'auditory', 'reading', 'kinesthetic'
  preferred_content_format VARCHAR(50), -- 'video', 'text', 'interactive'
  
  -- Legacy fields (for backward compatibility)
  favorite_destinations TEXT[] DEFAULT ARRAY[]::TEXT[],
  preferred_durations TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(guide_id)
);

-- ============================================
-- PERFORMANCE TRACKING
-- ============================================

-- Guide Performance Metrics
CREATE TABLE IF NOT EXISTS guide_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  period_type VARCHAR(20) DEFAULT 'monthly', -- 'weekly', 'monthly', 'quarterly'
  
  -- Metrics
  total_trips INTEGER DEFAULT 0,
  completed_trips INTEGER DEFAULT 0,
  cancelled_trips INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2),
  total_ratings INTEGER DEFAULT 0,
  on_time_rate DECIMAL(5,2), -- Percentage
  customer_satisfaction_score DECIMAL(3,2),
  
  -- Skills Progress
  skills_improved INTEGER DEFAULT 0,
  assessments_completed INTEGER DEFAULT 0,
  
  -- Earnings
  total_earnings DECIMAL(12,2) DEFAULT 0,
  average_per_trip DECIMAL(10,2),
  
  -- Calculated Scores
  overall_score DECIMAL(5,2), -- Composite score
  performance_tier VARCHAR(50), -- 'excellent', 'good', 'average', 'needs_improvement'
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(guide_id, period_start, period_end, period_type)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_guide_onboarding_steps_branch ON guide_onboarding_steps(branch_id);
CREATE INDEX IF NOT EXISTS idx_guide_onboarding_steps_order ON guide_onboarding_steps(step_order);
CREATE INDEX IF NOT EXISTS idx_guide_onboarding_progress_guide ON guide_onboarding_progress(guide_id);
CREATE INDEX IF NOT EXISTS idx_guide_onboarding_progress_status ON guide_onboarding_progress(status);
CREATE INDEX IF NOT EXISTS idx_guide_onboarding_completions_progress ON guide_onboarding_step_completions(progress_id);
CREATE INDEX IF NOT EXISTS idx_guide_onboarding_completions_step ON guide_onboarding_step_completions(step_id);

CREATE INDEX IF NOT EXISTS idx_guide_assessment_templates_branch ON guide_assessment_templates(branch_id);
CREATE INDEX IF NOT EXISTS idx_guide_assessment_templates_category ON guide_assessment_templates(category);
CREATE INDEX IF NOT EXISTS idx_guide_assessments_guide ON guide_assessments(guide_id);
CREATE INDEX IF NOT EXISTS idx_guide_assessments_template ON guide_assessments(template_id);
CREATE INDEX IF NOT EXISTS idx_guide_assessments_status ON guide_assessments(status);
CREATE INDEX IF NOT EXISTS idx_guide_survey_responses_guide ON guide_survey_responses(guide_id);

CREATE INDEX IF NOT EXISTS idx_guide_skills_catalog_branch ON guide_skills_catalog(branch_id);
CREATE INDEX IF NOT EXISTS idx_guide_skills_catalog_category ON guide_skills_catalog(category);
CREATE INDEX IF NOT EXISTS idx_guide_skills_guide ON guide_skills(guide_id);
CREATE INDEX IF NOT EXISTS idx_guide_skills_skill ON guide_skills(skill_id);
CREATE INDEX IF NOT EXISTS idx_guide_skills_status ON guide_skills(status);
CREATE INDEX IF NOT EXISTS idx_guide_skill_goals_guide ON guide_skill_goals(guide_id);
CREATE INDEX IF NOT EXISTS idx_guide_skill_goals_skill ON guide_skill_goals(skill_id);

CREATE INDEX IF NOT EXISTS idx_guide_preferences_guide ON guide_preferences(guide_id);
CREATE INDEX IF NOT EXISTS idx_guide_performance_metrics_guide ON guide_performance_metrics(guide_id);
CREATE INDEX IF NOT EXISTS idx_guide_performance_metrics_period ON guide_performance_metrics(period_start, period_end);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE guide_onboarding_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE guide_onboarding_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE guide_onboarding_step_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE guide_assessment_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE guide_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE guide_survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE guide_skills_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE guide_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE guide_skill_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE guide_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE guide_performance_metrics ENABLE ROW LEVEL SECURITY;

-- Onboarding Steps: Ops/Admin can manage, Guides can view active
CREATE POLICY "guide_onboarding_steps_view" ON guide_onboarding_steps FOR SELECT
  USING (is_active = true OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND (role::text IN ('ops_admin', 'super_admin'))
  ));

CREATE POLICY "guide_onboarding_steps_manage" ON guide_onboarding_steps FOR ALL
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND (role::text IN ('ops_admin', 'super_admin'))
  ));

-- Onboarding Progress: Guides can see their own, Ops can see all
CREATE POLICY "guide_onboarding_progress_own" ON guide_onboarding_progress FOR ALL
  USING (guide_id = auth.uid() OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND (role::text IN ('ops_admin', 'super_admin'))
  ));

CREATE POLICY "guide_onboarding_completions_own" ON guide_onboarding_step_completions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM guide_onboarding_progress 
      WHERE id = progress_id AND guide_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND (role::text IN ('ops_admin', 'super_admin'))
    )
  );

-- Assessment Templates: Ops/Admin can manage, Guides can view active
CREATE POLICY "guide_assessment_templates_view" ON guide_assessment_templates FOR SELECT
  USING (is_active = true OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND (role::text IN ('ops_admin', 'super_admin'))
  ));

CREATE POLICY "guide_assessment_templates_manage" ON guide_assessment_templates FOR ALL
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND (role::text IN ('ops_admin', 'super_admin'))
  ));

-- Assessments: Guides can see their own, Ops can see all
CREATE POLICY "guide_assessments_own" ON guide_assessments FOR ALL
  USING (guide_id = auth.uid() OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND (role::text IN ('ops_admin', 'super_admin'))
  ));

-- Survey Responses: Guides can submit their own, Ops can view (if not anonymous)
CREATE POLICY "guide_survey_responses_own" ON guide_survey_responses FOR ALL
  USING (guide_id = auth.uid() OR (
    NOT is_anonymous AND EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND (role::text IN ('ops_admin', 'super_admin'))
    )
  ));

-- Skills Catalog: All can view active, Ops can manage
CREATE POLICY "guide_skills_catalog_view" ON guide_skills_catalog FOR SELECT
  USING (is_active = true OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND (role::text IN ('ops_admin', 'super_admin'))
  ));

CREATE POLICY "guide_skills_catalog_manage" ON guide_skills_catalog FOR ALL
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND (role::text IN ('ops_admin', 'super_admin'))
  ));

-- Guide Skills: Guides can manage their own, Ops can view all
CREATE POLICY "guide_skills_own" ON guide_skills FOR ALL
  USING (guide_id = auth.uid() OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND (role::text IN ('ops_admin', 'super_admin'))
  ));

-- Skill Goals: Guides can manage their own, Ops can view all
CREATE POLICY "guide_skill_goals_own" ON guide_skill_goals FOR ALL
  USING (guide_id = auth.uid() OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND (role::text IN ('ops_admin', 'super_admin'))
  ));

-- Preferences: Guides can manage their own, Ops can view for assignment
-- Note: This policy will be created after table is created
-- CREATE POLICY "guide_preferences_own" ON guide_preferences FOR ALL
--   USING (guide_id = auth.uid() OR EXISTS (
--     SELECT 1 FROM users WHERE id = auth.uid() AND (role::text IN ('ops_admin', 'super_admin'))
--   ));

-- Performance Metrics: Guides can see their own, Ops can see all
CREATE POLICY "guide_performance_metrics_own" ON guide_performance_metrics FOR SELECT
  USING (guide_id = auth.uid() OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND (role::text IN ('ops_admin', 'super_admin'))
  ));

-- Create guide_preferences policy after table is created
CREATE POLICY "guide_preferences_own" ON guide_preferences FOR ALL
  USING (guide_id = auth.uid() OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND (role::text IN ('ops_admin', 'super_admin'))
  ));

COMMIT;
