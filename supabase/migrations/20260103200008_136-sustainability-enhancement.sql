-- Migration: 136-sustainability-enhancement.sql
-- Description: Enhanced Sustainability Goals System for GSTC Compliance
-- Created: 2025-03-03
-- Standards: GSTC Sustainable Tourism

-- ============================================
-- ENHANCE SUSTAINABILITY GOALS TABLE
-- (Base table already exists from 070-waste-tracking.sql)
-- ============================================
ALTER TABLE sustainability_goals
ADD COLUMN IF NOT EXISTS goal_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS target_value DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS target_unit VARCHAR(20),
ADD COLUMN IF NOT EXISTS current_value DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active',
ADD COLUMN IF NOT EXISTS baseline_value DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS baseline_date DATE,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add constraint for goal_type if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'valid_goal_type'
  ) THEN
    ALTER TABLE sustainability_goals
    ADD CONSTRAINT valid_goal_type CHECK (
      goal_type IS NULL OR goal_type IN (
        'waste_reduction', 
        'carbon_reduction', 
        'recycling_rate', 
        'water_conservation',
        'fuel_efficiency',
        'local_sourcing'
      )
    );
  END IF;
END $$;

-- ============================================
-- SUSTAINABILITY METRICS MONTHLY TABLE
-- Track monthly progress
-- ============================================
CREATE TABLE IF NOT EXISTS sustainability_metrics_monthly (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES branches(id),
  
  -- Period
  metric_month DATE NOT NULL, -- First day of month
  
  -- Waste Metrics
  total_waste_kg DECIMAL(10, 2) DEFAULT 0,
  plastic_waste_kg DECIMAL(10, 2) DEFAULT 0,
  organic_waste_kg DECIMAL(10, 2) DEFAULT 0,
  recycled_waste_kg DECIMAL(10, 2) DEFAULT 0,
  recycling_rate DECIMAL(5, 2) DEFAULT 0, -- Percentage
  
  -- Carbon Metrics
  total_fuel_liters DECIMAL(10, 2) DEFAULT 0,
  total_co2_kg DECIMAL(10, 2) DEFAULT 0,
  co2_per_passenger_kg DECIMAL(10, 2) DEFAULT 0,
  co2_per_trip_kg DECIMAL(10, 2) DEFAULT 0,
  
  -- Trip Metrics
  total_trips INTEGER DEFAULT 0,
  total_passengers INTEGER DEFAULT 0,
  total_distance_nm DECIMAL(10, 2) DEFAULT 0,
  
  -- Water Metrics
  total_water_liters DECIMAL(10, 2) DEFAULT 0,
  water_per_passenger_liters DECIMAL(10, 2) DEFAULT 0,
  
  -- Comparison
  previous_month_co2_kg DECIMAL(10, 2),
  previous_month_waste_kg DECIMAL(10, 2),
  co2_change_percent DECIMAL(5, 2),
  waste_change_percent DECIMAL(5, 2),
  
  -- Audit
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique per branch per month
  UNIQUE(branch_id, metric_month)
);

-- ============================================
-- SUSTAINABILITY INITIATIVES TABLE
-- Track sustainability improvement initiatives
-- ============================================
CREATE TABLE IF NOT EXISTS sustainability_initiatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES branches(id),
  
  -- Initiative Info
  title VARCHAR(255) NOT NULL,
  description TEXT,
  initiative_type VARCHAR(50) NOT NULL, -- 'waste_reduction', 'carbon_reduction', 'community', 'conservation', 'education'
  
  -- Targets
  target_metric VARCHAR(50),
  target_value DECIMAL(10, 2),
  target_unit VARCHAR(20),
  
  -- Timeline
  start_date DATE NOT NULL,
  end_date DATE,
  status VARCHAR(20) DEFAULT 'planned', -- 'planned', 'active', 'completed', 'cancelled'
  
  -- Progress
  current_progress DECIMAL(5, 2) DEFAULT 0, -- Percentage
  milestones JSONB DEFAULT '[]',
  
  -- Resources
  budget_allocated DECIMAL(15, 2),
  budget_spent DECIMAL(15, 2) DEFAULT 0,
  responsible_person UUID REFERENCES users(id),
  
  -- Impact
  estimated_impact TEXT,
  actual_impact TEXT,
  
  -- Documentation
  documentation_urls TEXT[],
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  
  -- Constraints
  CONSTRAINT valid_initiative_type CHECK (initiative_type IN ('waste_reduction', 'carbon_reduction', 'community', 'conservation', 'education', 'efficiency', 'other')),
  CONSTRAINT valid_initiative_status CHECK (status IN ('planned', 'active', 'completed', 'cancelled', 'on_hold'))
);

-- ============================================
-- SUSTAINABILITY CERTIFICATIONS TABLE
-- Track environmental certifications (beyond CHSE)
-- ============================================
CREATE TABLE IF NOT EXISTS sustainability_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES branches(id),
  
  -- Certification Info
  certification_name VARCHAR(255) NOT NULL,
  certification_type VARCHAR(50) NOT NULL, -- 'gstc', 'iso_14001', 'green_globe', 'blue_flag', 'other'
  certification_body VARCHAR(255),
  certification_number VARCHAR(100),
  
  -- Validity
  issued_date DATE NOT NULL,
  valid_from DATE NOT NULL,
  valid_until DATE NOT NULL,
  
  -- Status
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'expired', 'pending', 'revoked'
  
  -- Documentation
  certificate_url TEXT,
  audit_report_url TEXT,
  
  -- Renewal
  renewal_date DATE,
  renewal_reminder_sent BOOLEAN DEFAULT false,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  
  -- Constraints
  CONSTRAINT valid_cert_type CHECK (certification_type IN ('gstc', 'iso_14001', 'green_globe', 'blue_flag', 'travelife', 'other')),
  CONSTRAINT valid_cert_status CHECK (status IN ('active', 'expired', 'pending', 'revoked', 'pending_renewal'))
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_sustainability_metrics_monthly_branch ON sustainability_metrics_monthly(branch_id);
CREATE INDEX IF NOT EXISTS idx_sustainability_metrics_monthly_month ON sustainability_metrics_monthly(metric_month DESC);

CREATE INDEX IF NOT EXISTS idx_sustainability_initiatives_branch ON sustainability_initiatives(branch_id);
CREATE INDEX IF NOT EXISTS idx_sustainability_initiatives_status ON sustainability_initiatives(status);
CREATE INDEX IF NOT EXISTS idx_sustainability_initiatives_type ON sustainability_initiatives(initiative_type);

CREATE INDEX IF NOT EXISTS idx_sustainability_certifications_branch ON sustainability_certifications(branch_id);
CREATE INDEX IF NOT EXISTS idx_sustainability_certifications_status ON sustainability_certifications(status);
CREATE INDEX IF NOT EXISTS idx_sustainability_certifications_valid_until ON sustainability_certifications(valid_until);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE sustainability_metrics_monthly ENABLE ROW LEVEL SECURITY;
ALTER TABLE sustainability_initiatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE sustainability_certifications ENABLE ROW LEVEL SECURITY;

-- Metrics: Admins can manage, guides can view
CREATE POLICY "Admins can manage sustainability metrics"
  ON sustainability_metrics_monthly
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('super_admin', 'ops_admin')
    )
  );

CREATE POLICY "Authenticated users can view sustainability metrics"
  ON sustainability_metrics_monthly
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Initiatives: Admins manage
CREATE POLICY "Admins can manage sustainability initiatives"
  ON sustainability_initiatives
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('super_admin', 'ops_admin')
    )
  );

CREATE POLICY "Authenticated users can view sustainability initiatives"
  ON sustainability_initiatives
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Certifications: Admins manage
CREATE POLICY "Admins can manage sustainability certifications"
  ON sustainability_certifications
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('super_admin', 'ops_admin')
    )
  );

CREATE POLICY "Anyone can view active certifications"
  ON sustainability_certifications
  FOR SELECT
  USING (status = 'active');

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to calculate monthly sustainability metrics
CREATE OR REPLACE FUNCTION calculate_monthly_sustainability_metrics(
  p_branch_id UUID,
  p_month DATE
)
RETURNS VOID AS $$
DECLARE
  v_start_date DATE;
  v_end_date DATE;
  v_total_waste DECIMAL;
  v_plastic_waste DECIMAL;
  v_organic_waste DECIMAL;
  v_recycled_waste DECIMAL;
  v_total_fuel DECIMAL;
  v_total_co2 DECIMAL;
  v_total_trips INTEGER;
  v_total_passengers INTEGER;
  v_total_water DECIMAL;
  v_prev_co2 DECIMAL;
  v_prev_waste DECIMAL;
BEGIN
  -- Calculate date range
  v_start_date := DATE_TRUNC('month', p_month);
  v_end_date := v_start_date + INTERVAL '1 month' - INTERVAL '1 day';
  
  -- Calculate waste metrics
  SELECT 
    COALESCE(SUM(quantity), 0),
    COALESCE(SUM(CASE WHEN waste_type = 'plastic' THEN quantity ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN waste_type = 'organic' THEN quantity ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN disposal_method = 'recycling' THEN quantity ELSE 0 END), 0)
  INTO v_total_waste, v_plastic_waste, v_organic_waste, v_recycled_waste
  FROM waste_logs
  WHERE branch_id = p_branch_id
    AND logged_at >= v_start_date
    AND logged_at <= v_end_date;
  
  -- Calculate fuel/CO2 metrics
  SELECT 
    COALESCE(SUM(fuel_liters), 0),
    COALESCE(SUM(co2_emissions_kg), 0)
  INTO v_total_fuel, v_total_co2
  FROM trip_fuel_logs
  WHERE branch_id = p_branch_id
    AND logged_at >= v_start_date
    AND logged_at <= v_end_date;
  
  -- Get trip count
  SELECT COUNT(*)::INTEGER INTO v_total_trips
  FROM trips
  WHERE branch_id = p_branch_id
    AND departure_date >= v_start_date
    AND departure_date <= v_end_date
    AND status = 'completed';
  
  -- Get water usage if available
  SELECT COALESCE(SUM(quantity_liters), 0) INTO v_total_water
  FROM water_usage_logs
  WHERE branch_id = p_branch_id
    AND logged_at >= v_start_date
    AND logged_at <= v_end_date;
  
  -- Get previous month values
  SELECT total_co2_kg, total_waste_kg INTO v_prev_co2, v_prev_waste
  FROM sustainability_metrics_monthly
  WHERE branch_id = p_branch_id
    AND metric_month = v_start_date - INTERVAL '1 month';
  
  -- Upsert metrics
  INSERT INTO sustainability_metrics_monthly (
    branch_id,
    metric_month,
    total_waste_kg,
    plastic_waste_kg,
    organic_waste_kg,
    recycled_waste_kg,
    recycling_rate,
    total_fuel_liters,
    total_co2_kg,
    total_trips,
    total_water_liters,
    previous_month_co2_kg,
    previous_month_waste_kg,
    co2_change_percent,
    waste_change_percent
  ) VALUES (
    p_branch_id,
    v_start_date,
    v_total_waste,
    v_plastic_waste,
    v_organic_waste,
    v_recycled_waste,
    CASE WHEN v_total_waste > 0 THEN (v_recycled_waste / v_total_waste * 100) ELSE 0 END,
    v_total_fuel,
    v_total_co2,
    v_total_trips,
    v_total_water,
    v_prev_co2,
    v_prev_waste,
    CASE WHEN v_prev_co2 > 0 THEN ((v_total_co2 - v_prev_co2) / v_prev_co2 * 100) ELSE 0 END,
    CASE WHEN v_prev_waste > 0 THEN ((v_total_waste - v_prev_waste) / v_prev_waste * 100) ELSE 0 END
  )
  ON CONFLICT (branch_id, metric_month) DO UPDATE SET
    total_waste_kg = EXCLUDED.total_waste_kg,
    plastic_waste_kg = EXCLUDED.plastic_waste_kg,
    organic_waste_kg = EXCLUDED.organic_waste_kg,
    recycled_waste_kg = EXCLUDED.recycled_waste_kg,
    recycling_rate = EXCLUDED.recycling_rate,
    total_fuel_liters = EXCLUDED.total_fuel_liters,
    total_co2_kg = EXCLUDED.total_co2_kg,
    total_trips = EXCLUDED.total_trips,
    total_water_liters = EXCLUDED.total_water_liters,
    previous_month_co2_kg = EXCLUDED.previous_month_co2_kg,
    previous_month_waste_kg = EXCLUDED.previous_month_waste_kg,
    co2_change_percent = EXCLUDED.co2_change_percent,
    waste_change_percent = EXCLUDED.waste_change_percent,
    calculated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE sustainability_metrics_monthly IS 'Monthly aggregated sustainability metrics for GSTC reporting';
COMMENT ON TABLE sustainability_initiatives IS 'Sustainability improvement initiatives and projects';
COMMENT ON TABLE sustainability_certifications IS 'Environmental and sustainability certifications (GSTC, ISO 14001, etc.)';

