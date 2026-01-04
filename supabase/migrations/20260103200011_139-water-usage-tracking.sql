-- Migration: 139-water-usage-tracking.sql
-- Description: Water Usage Tracking for GSTC Compliance
-- Created: 2025-03-03
-- Standards: GSTC Sustainable Tourism - Water Conservation

-- ============================================
-- WATER USAGE LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS water_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id),
  
  -- Usage Type
  usage_type VARCHAR(50) NOT NULL, -- 'drinking', 'cleaning', 'cooking', 'sanitation', 'other'
  
  -- Quantity
  quantity_liters DECIMAL(10, 2) NOT NULL CHECK (quantity_liters > 0),
  
  -- Source
  source VARCHAR(50) NOT NULL DEFAULT 'onboard', -- 'onboard', 'refill', 'natural', 'desalination'
  source_location VARCHAR(255),
  
  -- Logged By
  logged_by UUID NOT NULL REFERENCES users(id),
  logged_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Notes
  notes TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_usage_type CHECK (usage_type IN ('drinking', 'cleaning', 'cooking', 'sanitation', 'engine', 'other')),
  CONSTRAINT valid_water_source CHECK (source IN ('onboard', 'refill', 'natural', 'desalination', 'provided'))
);

-- ============================================
-- WATER TANKS TABLE
-- Track water tank levels on vessels
-- ============================================
CREATE TABLE IF NOT EXISTS water_tanks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES branches(id),
  vessel_id UUID, -- Reference to vessel if applicable
  
  -- Tank Info
  tank_name VARCHAR(100) NOT NULL,
  tank_type VARCHAR(50) NOT NULL, -- 'freshwater', 'greywater', 'blackwater'
  capacity_liters DECIMAL(10, 2) NOT NULL,
  
  -- Current Level
  current_level_liters DECIMAL(10, 2) DEFAULT 0,
  current_percentage DECIMAL(5, 2) GENERATED ALWAYS AS (
    CASE WHEN capacity_liters > 0 
         THEN (current_level_liters / capacity_liters * 100)
         ELSE 0 
    END
  ) STORED,
  
  -- Last Updated
  last_checked_at TIMESTAMPTZ,
  last_refilled_at TIMESTAMPTZ,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_tank_type CHECK (tank_type IN ('freshwater', 'greywater', 'blackwater', 'reserve'))
);

-- ============================================
-- WATER TANK LOGS TABLE
-- Track tank level changes
-- ============================================
CREATE TABLE IF NOT EXISTS water_tank_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tank_id UUID NOT NULL REFERENCES water_tanks(id) ON DELETE CASCADE,
  trip_id UUID REFERENCES trips(id),
  
  -- Level Change
  previous_level_liters DECIMAL(10, 2),
  new_level_liters DECIMAL(10, 2) NOT NULL,
  change_liters DECIMAL(10, 2),
  
  -- Action
  action_type VARCHAR(50) NOT NULL, -- 'refill', 'usage', 'discharge', 'adjustment'
  
  -- Logged By
  logged_by UUID NOT NULL REFERENCES users(id),
  logged_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Notes
  notes TEXT,
  
  -- Constraints
  CONSTRAINT valid_action_type CHECK (action_type IN ('refill', 'usage', 'discharge', 'adjustment', 'initial'))
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_water_usage_logs_trip_id ON water_usage_logs(trip_id);
CREATE INDEX IF NOT EXISTS idx_water_usage_logs_branch_id ON water_usage_logs(branch_id);
CREATE INDEX IF NOT EXISTS idx_water_usage_logs_usage_type ON water_usage_logs(usage_type);
CREATE INDEX IF NOT EXISTS idx_water_usage_logs_logged_at ON water_usage_logs(logged_at DESC);

CREATE INDEX IF NOT EXISTS idx_water_tanks_branch_id ON water_tanks(branch_id);
CREATE INDEX IF NOT EXISTS idx_water_tanks_active ON water_tanks(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_water_tank_logs_tank_id ON water_tank_logs(tank_id);
CREATE INDEX IF NOT EXISTS idx_water_tank_logs_logged_at ON water_tank_logs(logged_at DESC);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE water_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_tanks ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_tank_logs ENABLE ROW LEVEL SECURITY;

-- Water Usage Logs: Guides can create for their trips
CREATE POLICY "Guides can log water usage for their trips"
  ON water_usage_logs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trip_guides
      WHERE trip_guides.trip_id = water_usage_logs.trip_id
        AND trip_guides.guide_id = auth.uid()
    )
    AND logged_by = auth.uid()
  );

CREATE POLICY "Guides can view own trip water usage"
  ON water_usage_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM trip_guides
      WHERE trip_guides.trip_id = water_usage_logs.trip_id
        AND trip_guides.guide_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all water usage logs"
  ON water_usage_logs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('super_admin', 'ops_admin')
    )
  );

-- Water Tanks: Admins manage
CREATE POLICY "Admins can manage water tanks"
  ON water_tanks
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('super_admin', 'ops_admin')
    )
  );

CREATE POLICY "Authenticated users can view water tanks"
  ON water_tanks
  FOR SELECT
  USING (auth.uid() IS NOT NULL AND is_active = true);

-- Tank Logs: Similar to water usage
CREATE POLICY "Guides can log tank levels"
  ON water_tank_logs
  FOR INSERT
  WITH CHECK (logged_by = auth.uid());

CREATE POLICY "Authenticated users can view tank logs"
  ON water_tank_logs
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to calculate trip water usage summary
CREATE OR REPLACE FUNCTION get_trip_water_summary(p_trip_id UUID)
RETURNS TABLE (
  total_liters DECIMAL,
  drinking_liters DECIMAL,
  cleaning_liters DECIMAL,
  cooking_liters DECIMAL,
  other_liters DECIMAL,
  passengers_count INTEGER,
  liters_per_passenger DECIMAL
) AS $$
DECLARE
  v_passengers INTEGER;
BEGIN
  -- Get passenger count
  SELECT COUNT(*)::INTEGER INTO v_passengers
  FROM booking_passengers bp
  JOIN bookings b ON bp.booking_id = b.id
  JOIN trips t ON t.booking_id = b.id
  WHERE t.id = p_trip_id;
  
  RETURN QUERY
  SELECT 
    COALESCE(SUM(quantity_liters), 0) as total_liters,
    COALESCE(SUM(CASE WHEN usage_type = 'drinking' THEN quantity_liters ELSE 0 END), 0) as drinking_liters,
    COALESCE(SUM(CASE WHEN usage_type = 'cleaning' THEN quantity_liters ELSE 0 END), 0) as cleaning_liters,
    COALESCE(SUM(CASE WHEN usage_type = 'cooking' THEN quantity_liters ELSE 0 END), 0) as cooking_liters,
    COALESCE(SUM(CASE WHEN usage_type NOT IN ('drinking', 'cleaning', 'cooking') THEN quantity_liters ELSE 0 END), 0) as other_liters,
    v_passengers as passengers_count,
    CASE WHEN v_passengers > 0 
         THEN ROUND(SUM(quantity_liters) / v_passengers, 2) 
         ELSE 0 
    END as liters_per_passenger
  FROM water_usage_logs
  WHERE trip_id = p_trip_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update tank level and log
CREATE OR REPLACE FUNCTION log_tank_level_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.current_level_liters IS DISTINCT FROM NEW.current_level_liters THEN
    INSERT INTO water_tank_logs (
      tank_id,
      previous_level_liters,
      new_level_liters,
      change_liters,
      action_type,
      logged_by
    ) VALUES (
      NEW.id,
      OLD.current_level_liters,
      NEW.current_level_liters,
      NEW.current_level_liters - OLD.current_level_liters,
      CASE 
        WHEN NEW.current_level_liters > OLD.current_level_liters THEN 'refill'
        ELSE 'usage'
      END,
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_tank_level_change
  AFTER UPDATE ON water_tanks
  FOR EACH ROW
  WHEN (OLD.current_level_liters IS DISTINCT FROM NEW.current_level_liters)
  EXECUTE FUNCTION log_tank_level_change();

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE water_usage_logs IS 'Water usage tracking per trip for GSTC water conservation compliance';
COMMENT ON TABLE water_tanks IS 'Water tank registry for vessels';
COMMENT ON TABLE water_tank_logs IS 'Log of water tank level changes for monitoring';

