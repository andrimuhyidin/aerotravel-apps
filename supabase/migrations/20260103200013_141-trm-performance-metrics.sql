-- Migration: 141-trm-performance-metrics.sql
-- Description: TRM Performance Metrics for ISO 31030 Compliance
-- Created: 2025-03-03
-- Standards: ISO 31030 Travel Risk Management

-- ============================================
-- TRM PERFORMANCE METRICS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS trm_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES branches(id),
  
  -- Period
  metric_period DATE NOT NULL, -- First day of month
  
  -- Trip Metrics
  total_trips INTEGER DEFAULT 0,
  completed_trips INTEGER DEFAULT 0,
  cancelled_trips INTEGER DEFAULT 0,
  
  -- Incident Metrics
  incidents_count INTEGER DEFAULT 0,
  incidents_high_severity INTEGER DEFAULT 0,
  incidents_resolved INTEGER DEFAULT 0,
  near_misses_count INTEGER DEFAULT 0,
  
  -- Risk Assessment Metrics
  risk_assessments_required INTEGER DEFAULT 0,
  risk_assessments_completed INTEGER DEFAULT 0,
  risk_assessments_rate DECIMAL(5, 2) DEFAULT 0,
  average_risk_score DECIMAL(5, 2),
  high_risk_trips INTEGER DEFAULT 0,
  
  -- Response Metrics
  sos_alerts_count INTEGER DEFAULT 0,
  average_response_time_minutes INTEGER,
  fastest_response_time_minutes INTEGER,
  slowest_response_time_minutes INTEGER,
  
  -- Training Metrics
  guides_total INTEGER DEFAULT 0,
  guides_training_compliant INTEGER DEFAULT 0,
  training_compliance_rate DECIMAL(5, 2) DEFAULT 0,
  
  -- Safety Metrics
  safety_briefings_completed INTEGER DEFAULT 0,
  safety_briefing_rate DECIMAL(5, 2) DEFAULT 0,
  equipment_checks_completed INTEGER DEFAULT 0,
  equipment_check_rate DECIMAL(5, 2) DEFAULT 0,
  
  -- Customer Safety Metrics
  passenger_injuries INTEGER DEFAULT 0,
  crew_injuries INTEGER DEFAULT 0,
  safety_complaints INTEGER DEFAULT 0,
  
  -- Performance Score (0-100)
  overall_trm_score INTEGER,
  score_breakdown JSONB DEFAULT '{}',
  -- Structure: {
  --   "risk_assessment": 85,
  --   "incident_management": 90,
  --   "training_compliance": 95,
  --   "response_time": 80
  -- }
  
  -- Comparison
  previous_month_score INTEGER,
  score_change INTEGER,
  
  -- Audit
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique per branch per month
  UNIQUE(branch_id, metric_period)
);

-- ============================================
-- TRM KPI TARGETS TABLE
-- Define KPI targets for each branch
-- ============================================
CREATE TABLE IF NOT EXISTS trm_kpi_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES branches(id),
  
  -- Target Period
  target_year INTEGER NOT NULL,
  target_quarter INTEGER, -- 1-4, NULL for yearly
  
  -- Risk Assessment KPIs
  target_risk_assessment_rate DECIMAL(5, 2) DEFAULT 100, -- Target: 100%
  target_max_high_risk_trips INTEGER DEFAULT 0, -- Target: 0
  
  -- Incident KPIs
  target_max_incidents INTEGER DEFAULT 5,
  target_incident_resolution_days INTEGER DEFAULT 7,
  target_zero_high_severity BOOLEAN DEFAULT true,
  
  -- Response KPIs
  target_response_time_minutes INTEGER DEFAULT 15,
  target_sos_acknowledgment_minutes INTEGER DEFAULT 5,
  
  -- Training KPIs
  target_training_compliance_rate DECIMAL(5, 2) DEFAULT 100,
  
  -- Safety KPIs
  target_safety_briefing_rate DECIMAL(5, 2) DEFAULT 100,
  target_zero_injuries BOOLEAN DEFAULT true,
  
  -- Overall Score Target
  target_overall_score INTEGER DEFAULT 90,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  
  -- Unique per branch per period
  UNIQUE(branch_id, target_year, target_quarter)
);

-- ============================================
-- TRM IMPROVEMENT ACTIONS TABLE
-- Track corrective/improvement actions
-- ============================================
CREATE TABLE IF NOT EXISTS trm_improvement_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES branches(id),
  
  -- Source
  source_type VARCHAR(50) NOT NULL, -- 'incident', 'audit', 'near_miss', 'feedback', 'internal_review'
  source_id UUID, -- Reference to source record
  
  -- Action Info
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL, -- 'training', 'equipment', 'procedure', 'communication', 'documentation'
  
  -- Priority
  priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  
  -- Assignment
  assigned_to UUID REFERENCES users(id),
  
  -- Timeline
  due_date DATE,
  completed_at TIMESTAMPTZ,
  
  -- Status
  status VARCHAR(20) DEFAULT 'open', -- 'open', 'in_progress', 'completed', 'verified', 'closed'
  
  -- Verification
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMPTZ,
  verification_notes TEXT,
  
  -- Effectiveness
  effectiveness_rating INTEGER CHECK (effectiveness_rating >= 1 AND effectiveness_rating <= 5),
  effectiveness_notes TEXT,
  
  -- Documentation
  evidence_urls TEXT[],
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  
  -- Constraints
  CONSTRAINT valid_source_type CHECK (source_type IN ('incident', 'audit', 'near_miss', 'feedback', 'internal_review', 'drill', 'other')),
  CONSTRAINT valid_action_category CHECK (category IN ('training', 'equipment', 'procedure', 'communication', 'documentation', 'personnel', 'other')),
  CONSTRAINT valid_action_priority CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  CONSTRAINT valid_action_status CHECK (status IN ('open', 'in_progress', 'completed', 'verified', 'closed', 'cancelled'))
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_trm_performance_metrics_branch ON trm_performance_metrics(branch_id);
CREATE INDEX IF NOT EXISTS idx_trm_performance_metrics_period ON trm_performance_metrics(metric_period DESC);
CREATE INDEX IF NOT EXISTS idx_trm_performance_metrics_score ON trm_performance_metrics(overall_trm_score);

CREATE INDEX IF NOT EXISTS idx_trm_kpi_targets_branch ON trm_kpi_targets(branch_id);
CREATE INDEX IF NOT EXISTS idx_trm_kpi_targets_year ON trm_kpi_targets(target_year);
CREATE INDEX IF NOT EXISTS idx_trm_kpi_targets_active ON trm_kpi_targets(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_trm_improvement_actions_branch ON trm_improvement_actions(branch_id);
CREATE INDEX IF NOT EXISTS idx_trm_improvement_actions_status ON trm_improvement_actions(status);
CREATE INDEX IF NOT EXISTS idx_trm_improvement_actions_priority ON trm_improvement_actions(priority);
CREATE INDEX IF NOT EXISTS idx_trm_improvement_actions_due_date ON trm_improvement_actions(due_date);
CREATE INDEX IF NOT EXISTS idx_trm_improvement_actions_assigned ON trm_improvement_actions(assigned_to);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE trm_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE trm_kpi_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE trm_improvement_actions ENABLE ROW LEVEL SECURITY;

-- Performance Metrics: Admins manage, all view
CREATE POLICY "Admins can manage TRM metrics"
  ON trm_performance_metrics
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('super_admin', 'ops_admin')
    )
  );

CREATE POLICY "Authenticated users can view TRM metrics"
  ON trm_performance_metrics
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- KPI Targets: Admins only
CREATE POLICY "Admins can manage KPI targets"
  ON trm_kpi_targets
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('super_admin', 'ops_admin')
    )
  );

CREATE POLICY "Authenticated users can view KPI targets"
  ON trm_kpi_targets
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Improvement Actions: Admins and assigned users
CREATE POLICY "Admins can manage improvement actions"
  ON trm_improvement_actions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('super_admin', 'ops_admin')
    )
  );

CREATE POLICY "Assigned users can update their actions"
  ON trm_improvement_actions
  FOR UPDATE
  USING (assigned_to = auth.uid());

CREATE POLICY "Authenticated users can view improvement actions"
  ON trm_improvement_actions
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to calculate TRM metrics for a month
CREATE OR REPLACE FUNCTION calculate_trm_metrics(
  p_branch_id UUID,
  p_month DATE
)
RETURNS VOID AS $$
DECLARE
  v_start_date DATE;
  v_end_date DATE;
  v_total_trips INTEGER;
  v_incidents INTEGER;
  v_sos_alerts INTEGER;
  v_risk_assessments INTEGER;
  v_risk_required INTEGER;
  v_training_compliant INTEGER;
  v_guides_total INTEGER;
  v_prev_score INTEGER;
  v_overall_score INTEGER;
BEGIN
  v_start_date := DATE_TRUNC('month', p_month);
  v_end_date := v_start_date + INTERVAL '1 month' - INTERVAL '1 day';
  
  -- Count trips
  SELECT COUNT(*) INTO v_total_trips
  FROM trips
  WHERE branch_id = p_branch_id
    AND departure_date >= v_start_date
    AND departure_date <= v_end_date;
  
  -- Count incidents
  SELECT COUNT(*) INTO v_incidents
  FROM incident_reports
  WHERE branch_id = p_branch_id
    AND created_at >= v_start_date
    AND created_at <= v_end_date;
  
  -- Count SOS alerts
  SELECT COUNT(*) INTO v_sos_alerts
  FROM sos_alerts
  WHERE branch_id = p_branch_id
    AND triggered_at >= v_start_date
    AND triggered_at <= v_end_date;
  
  -- Count risk assessments
  SELECT COUNT(*) INTO v_risk_assessments
  FROM pre_trip_assessments pta
  JOIN trips t ON t.id = pta.trip_id
  WHERE t.branch_id = p_branch_id
    AND t.departure_date >= v_start_date
    AND t.departure_date <= v_end_date;
  
  v_risk_required := v_total_trips;
  
  -- Count training compliant guides
  SELECT 
    COUNT(DISTINCT u.id),
    COUNT(DISTINCT CASE WHEN EXISTS (
      SELECT 1 FROM trm_training_completions ttc
      WHERE ttc.user_id = u.id AND ttc.status = 'completed' AND ttc.valid_until > CURRENT_DATE
    ) THEN u.id END)
  INTO v_guides_total, v_training_compliant
  FROM users u
  WHERE u.branch_id = p_branch_id AND u.role = 'guide';
  
  -- Get previous month score
  SELECT overall_trm_score INTO v_prev_score
  FROM trm_performance_metrics
  WHERE branch_id = p_branch_id
    AND metric_period = v_start_date - INTERVAL '1 month';
  
  -- Calculate overall score (simplified)
  v_overall_score := 100;
  IF v_risk_required > 0 THEN
    v_overall_score := v_overall_score - (100 - (v_risk_assessments::DECIMAL / v_risk_required * 100))::INTEGER * 0.3;
  END IF;
  IF v_incidents > 0 THEN
    v_overall_score := v_overall_score - v_incidents * 5;
  END IF;
  IF v_guides_total > 0 THEN
    v_overall_score := v_overall_score - (100 - (v_training_compliant::DECIMAL / v_guides_total * 100))::INTEGER * 0.2;
  END IF;
  v_overall_score := GREATEST(0, LEAST(100, v_overall_score));
  
  -- Upsert metrics
  INSERT INTO trm_performance_metrics (
    branch_id,
    metric_period,
    total_trips,
    incidents_count,
    sos_alerts_count,
    risk_assessments_required,
    risk_assessments_completed,
    risk_assessments_rate,
    guides_total,
    guides_training_compliant,
    training_compliance_rate,
    overall_trm_score,
    previous_month_score,
    score_change
  ) VALUES (
    p_branch_id,
    v_start_date,
    v_total_trips,
    v_incidents,
    v_sos_alerts,
    v_risk_required,
    v_risk_assessments,
    CASE WHEN v_risk_required > 0 THEN (v_risk_assessments::DECIMAL / v_risk_required * 100) ELSE 0 END,
    v_guides_total,
    v_training_compliant,
    CASE WHEN v_guides_total > 0 THEN (v_training_compliant::DECIMAL / v_guides_total * 100) ELSE 0 END,
    v_overall_score,
    v_prev_score,
    v_overall_score - COALESCE(v_prev_score, v_overall_score)
  )
  ON CONFLICT (branch_id, metric_period) DO UPDATE SET
    total_trips = EXCLUDED.total_trips,
    incidents_count = EXCLUDED.incidents_count,
    sos_alerts_count = EXCLUDED.sos_alerts_count,
    risk_assessments_required = EXCLUDED.risk_assessments_required,
    risk_assessments_completed = EXCLUDED.risk_assessments_completed,
    risk_assessments_rate = EXCLUDED.risk_assessments_rate,
    guides_total = EXCLUDED.guides_total,
    guides_training_compliant = EXCLUDED.guides_training_compliant,
    training_compliance_rate = EXCLUDED.training_compliance_rate,
    overall_trm_score = EXCLUDED.overall_trm_score,
    previous_month_score = EXCLUDED.previous_month_score,
    score_change = EXCLUDED.score_change,
    calculated_at = NOW(),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE trm_performance_metrics IS 'Monthly TRM performance metrics for ISO 31030 compliance tracking';
COMMENT ON TABLE trm_kpi_targets IS 'KPI targets for TRM performance';
COMMENT ON TABLE trm_improvement_actions IS 'Corrective and improvement actions from TRM reviews';
COMMENT ON COLUMN trm_performance_metrics.overall_trm_score IS 'Overall TRM performance score (0-100)';

