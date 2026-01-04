/**
 * About Page Content Tables
 * CMS for managing About page stats, values, and awards
 */

-- About Stats Table
CREATE TABLE IF NOT EXISTS about_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label VARCHAR(100) NOT NULL,
  value VARCHAR(50) NOT NULL,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- About Values Table
CREATE TABLE IF NOT EXISTS about_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(100) NOT NULL,
  description TEXT,
  icon_name VARCHAR(50), -- Lucide icon name
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- About Awards Table
CREATE TABLE IF NOT EXISTS about_awards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_about_stats_active ON about_stats(is_active);
CREATE INDEX IF NOT EXISTS idx_about_stats_order ON about_stats(display_order);
CREATE INDEX IF NOT EXISTS idx_about_values_active ON about_values(is_active);
CREATE INDEX IF NOT EXISTS idx_about_values_order ON about_values(display_order);
CREATE INDEX IF NOT EXISTS idx_about_awards_active ON about_awards(is_active);
CREATE INDEX IF NOT EXISTS idx_about_awards_order ON about_awards(display_order);

-- RLS Policies for about_stats
ALTER TABLE about_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active about stats"
  ON about_stats FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage about stats"
  ON about_stats FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin'));

-- RLS Policies for about_values
ALTER TABLE about_values ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active about values"
  ON about_values FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage about values"
  ON about_values FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin'));

-- RLS Policies for about_awards
ALTER TABLE about_awards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active about awards"
  ON about_awards FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage about awards"
  ON about_awards FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin'));

-- Comments
COMMENT ON TABLE about_stats IS 'CMS table for managing About page statistics';
COMMENT ON TABLE about_values IS 'CMS table for managing About page company values';
COMMENT ON TABLE about_awards IS 'CMS table for managing About page awards and certifications';
COMMENT ON COLUMN about_values.icon_name IS 'Lucide icon name for the value icon';

