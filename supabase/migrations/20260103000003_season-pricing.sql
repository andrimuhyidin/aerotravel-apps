-- Migration: Season Pricing
-- Purpose: Dynamic seasonality for package pricing
-- Allows defining peak/low seasons with price multipliers

-- Create seasons table
CREATE TABLE IF NOT EXISTS seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  price_multiplier DECIMAL(4,2) DEFAULT 1.00,
  color VARCHAR(7) DEFAULT '#3b82f6',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure valid date range
  CONSTRAINT valid_date_range CHECK (end_date >= start_date),
  -- Ensure valid multiplier
  CONSTRAINT valid_multiplier CHECK (price_multiplier >= 0.01 AND price_multiplier <= 10.00)
);

-- Add indexes
CREATE INDEX idx_seasons_branch ON seasons(branch_id);
CREATE INDEX idx_seasons_dates ON seasons(start_date, end_date);
CREATE INDEX idx_seasons_active ON seasons(is_active) WHERE is_active = true;

-- Add comments
COMMENT ON TABLE seasons IS 'Seasonal pricing periods for packages';
COMMENT ON COLUMN seasons.price_multiplier IS 'Price multiplier: 1.0 = normal, 1.5 = 50% markup, 0.8 = 20% discount';
COMMENT ON COLUMN seasons.color IS 'Display color for calendar UI (hex format)';

-- RLS Policies
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;

-- Public can view active seasons
CREATE POLICY "Anyone can view active seasons" ON seasons
  FOR SELECT
  USING (is_active = true);

-- Admins can manage seasons
CREATE POLICY "Admins can manage seasons" ON seasons
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('super_admin', 'ops_admin', 'marketing')
    )
  );

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_seasons_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_seasons_timestamp
  BEFORE UPDATE ON seasons
  FOR EACH ROW
  EXECUTE FUNCTION update_seasons_timestamp();

-- Create helper function to get price multiplier for a date
CREATE OR REPLACE FUNCTION get_season_multiplier(
  p_branch_id UUID,
  p_date DATE
)
RETURNS DECIMAL(4,2) AS $$
DECLARE
  v_multiplier DECIMAL(4,2);
BEGIN
  SELECT price_multiplier INTO v_multiplier
  FROM seasons
  WHERE (branch_id = p_branch_id OR branch_id IS NULL)
    AND is_active = true
    AND p_date BETWEEN start_date AND end_date
  ORDER BY branch_id NULLS LAST
  LIMIT 1;
  
  RETURN COALESCE(v_multiplier, 1.00);
END;
$$ LANGUAGE plpgsql STABLE;

-- Insert sample seasons
INSERT INTO seasons (branch_id, name, description, start_date, end_date, price_multiplier, color)
VALUES
  (NULL, 'Peak Season - Lebaran', 'Periode libur Lebaran', '2026-03-20', '2026-04-10', 1.50, '#ef4444'),
  (NULL, 'Peak Season - Natal/Tahun Baru', 'Periode libur akhir tahun', '2026-12-20', '2027-01-05', 1.40, '#ef4444'),
  (NULL, 'Peak Season - Liburan Sekolah', 'Libur sekolah semester 1', '2026-06-15', '2026-07-15', 1.25, '#f97316'),
  (NULL, 'Low Season', 'Periode sepi pengunjung', '2026-02-01', '2026-02-28', 0.85, '#22c55e'),
  (NULL, 'Regular Season', 'Periode normal', '2026-01-06', '2026-01-31', 1.00, '#3b82f6')
ON CONFLICT DO NOTHING;

