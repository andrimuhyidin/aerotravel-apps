-- Migration: 070-waste-tracking.sql
-- Description: Waste Tracking & Carbon Footprint (ISO 14001)
-- Created: 2025-01-26

-- ============================================
-- ENUMS
-- ============================================
DO $$ BEGIN
  CREATE TYPE waste_type AS ENUM ('plastic', 'organic', 'glass', 'hazmat');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE waste_unit AS ENUM ('kg', 'pieces');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE disposal_method AS ENUM ('landfill', 'recycling', 'incineration', 'ocean');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE fuel_type AS ENUM ('diesel', 'gasoline', 'other');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE period_type AS ENUM ('monthly', 'quarterly', 'yearly');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- WASTE LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS waste_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id),
  
  -- Waste Details
  waste_type waste_type NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL CHECK (quantity > 0),
  unit waste_unit NOT NULL,
  disposal_method disposal_method NOT NULL,
  
  -- Logged By
  logged_by UUID NOT NULL REFERENCES users(id),
  logged_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Notes
  notes TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- WASTE LOG PHOTOS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS waste_log_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  waste_log_id UUID NOT NULL REFERENCES waste_logs(id) ON DELETE CASCADE,
  
  -- Photo Details
  photo_url TEXT NOT NULL,
  photo_gps JSONB, -- {latitude, longitude, accuracy}
  captured_at TIMESTAMPTZ,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TRIP FUEL LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS trip_fuel_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id),
  
  -- Fuel Details
  fuel_liters DECIMAL(10, 2) NOT NULL CHECK (fuel_liters > 0),
  fuel_type fuel_type NOT NULL DEFAULT 'diesel',
  distance_nm DECIMAL(10, 2), -- Distance in nautical miles
  
  -- CO2 Calculation (auto-calculated)
  co2_emissions_kg DECIMAL(10, 2), -- Calculated by function
  
  -- Logged By (Admin only)
  logged_by UUID NOT NULL REFERENCES users(id),
  logged_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Notes
  notes TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SUSTAINABILITY GOALS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS sustainability_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES branches(id),
  
  -- Period
  period_type period_type NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Targets
  target_co2_kg DECIMAL(10, 2),
  target_waste_kg DECIMAL(10, 2),
  
  -- Created By
  created_by UUID NOT NULL REFERENCES users(id),
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(branch_id, period_type, period_start, period_end)
);

-- ============================================
-- FUNCTION: Calculate CO2 Emissions
-- ============================================
CREATE OR REPLACE FUNCTION calculate_co2_emissions(
  p_fuel_liters DECIMAL,
  p_fuel_type fuel_type
)
RETURNS DECIMAL AS $$
DECLARE
  v_emission_factor DECIMAL;
BEGIN
  -- Emission factors (kg CO2 per liter)
  -- Source: IPCC 2006 Guidelines
  CASE p_fuel_type
    WHEN 'diesel' THEN
      v_emission_factor := 2.68; -- kg CO2/L
    WHEN 'gasoline' THEN
      v_emission_factor := 2.31; -- kg CO2/L
    WHEN 'other' THEN
      v_emission_factor := 2.50; -- Average estimate
    ELSE
      v_emission_factor := 2.50; -- Default
  END CASE;
  
  RETURN ROUND(p_fuel_liters * v_emission_factor, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- TRIGGER: Auto-calculate CO2 on fuel log insert/update
-- ============================================
CREATE OR REPLACE FUNCTION auto_calculate_co2_emissions()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.fuel_liters IS NOT NULL AND NEW.fuel_type IS NOT NULL THEN
    NEW.co2_emissions_kg := calculate_co2_emissions(NEW.fuel_liters, NEW.fuel_type);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_calculate_co2
  BEFORE INSERT OR UPDATE ON trip_fuel_logs
  FOR EACH ROW
  EXECUTE FUNCTION auto_calculate_co2_emissions();

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_waste_logs_trip_id ON waste_logs(trip_id);
CREATE INDEX IF NOT EXISTS idx_waste_logs_branch_id ON waste_logs(branch_id);
CREATE INDEX IF NOT EXISTS idx_waste_logs_logged_by ON waste_logs(logged_by);
CREATE INDEX IF NOT EXISTS idx_waste_logs_logged_at ON waste_logs(logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_waste_logs_waste_type ON waste_logs(waste_type);

CREATE INDEX IF NOT EXISTS idx_waste_log_photos_waste_log_id ON waste_log_photos(waste_log_id);

CREATE INDEX IF NOT EXISTS idx_trip_fuel_logs_trip_id ON trip_fuel_logs(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_fuel_logs_branch_id ON trip_fuel_logs(branch_id);
CREATE INDEX IF NOT EXISTS idx_trip_fuel_logs_logged_at ON trip_fuel_logs(logged_at DESC);

CREATE INDEX IF NOT EXISTS idx_sustainability_goals_branch_id ON sustainability_goals(branch_id);
CREATE INDEX IF NOT EXISTS idx_sustainability_goals_period ON sustainability_goals(period_type, period_start, period_end);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE waste_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE waste_log_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_fuel_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sustainability_goals ENABLE ROW LEVEL SECURITY;

-- Guides can view and create waste logs for their trips
CREATE POLICY "Guides can view own waste logs"
  ON waste_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM trip_guides
      WHERE trip_guides.trip_id = waste_logs.trip_id
        AND trip_guides.guide_id = auth.uid()
    )
  );

CREATE POLICY "Guides can create waste logs"
  ON waste_logs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trip_guides
      WHERE trip_guides.trip_id = waste_logs.trip_id
        AND trip_guides.guide_id = auth.uid()
    )
    AND logged_by = auth.uid()
  );

-- Guides can view and create waste log photos
CREATE POLICY "Guides can view own waste log photos"
  ON waste_log_photos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM waste_logs
      WHERE waste_logs.id = waste_log_photos.waste_log_id
        AND EXISTS (
          SELECT 1 FROM trip_guides
          WHERE trip_guides.trip_id = waste_logs.trip_id
            AND trip_guides.guide_id = auth.uid()
        )
    )
  );

CREATE POLICY "Guides can create waste log photos"
  ON waste_log_photos
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM waste_logs
      WHERE waste_logs.id = waste_log_photos.waste_log_id
        AND EXISTS (
          SELECT 1 FROM trip_guides
          WHERE trip_guides.trip_id = waste_logs.trip_id
            AND trip_guides.guide_id = auth.uid()
        )
    )
  );

-- Admins can view all fuel logs
CREATE POLICY "Admins can view all fuel logs"
  ON trip_fuel_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
        AND role IN ('super_admin', 'ops_admin')
    )
  );

-- Admins can create fuel logs
CREATE POLICY "Admins can create fuel logs"
  ON trip_fuel_logs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
        AND role IN ('super_admin', 'ops_admin')
    )
    AND logged_by = auth.uid()
  );

-- Admins can update fuel logs
CREATE POLICY "Admins can update fuel logs"
  ON trip_fuel_logs
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
        AND role IN ('super_admin', 'ops_admin')
    )
  );

-- Admins can view and manage sustainability goals
CREATE POLICY "Admins can view sustainability goals"
  ON sustainability_goals
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
        AND role IN ('super_admin', 'ops_admin')
    )
  );

CREATE POLICY "Admins can manage sustainability goals"
  ON sustainability_goals
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
        AND role IN ('super_admin', 'ops_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
        AND role IN ('super_admin', 'ops_admin')
    )
  );

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE waste_logs IS 'Waste tracking logs per trip for ISO 14001 compliance';
COMMENT ON TABLE waste_log_photos IS 'Photo documentation for waste logs (audit trail)';
COMMENT ON TABLE trip_fuel_logs IS 'Fuel consumption tracking with auto CO2 calculation';
COMMENT ON TABLE sustainability_goals IS 'Sustainability targets per period (CO2 and waste)';
COMMENT ON FUNCTION calculate_co2_emissions IS 'Calculate CO2 emissions from fuel consumption (diesel: 2.68 kg CO2/L, gasoline: 2.31 kg CO2/L)';

