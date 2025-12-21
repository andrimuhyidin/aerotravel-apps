-- Migration: 078-waste-types-disposal-methods-lookup.sql
-- Description: Waste types and disposal methods lookup tables for frontend consumption
-- Date: 2025-01-27

-- ============================================
-- WASTE TYPES LOOKUP TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS waste_types_lookup (
  value VARCHAR(50) PRIMARY KEY, -- Maps to waste_type enum value
  label_id VARCHAR(100) NOT NULL, -- Indonesian label
  label_en VARCHAR(100), -- English label (for future i18n)
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  description TEXT, -- Optional description/help text
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for ordering
CREATE INDEX IF NOT EXISTS idx_waste_types_lookup_display_order ON waste_types_lookup(display_order, is_active);

-- Updated_at trigger
CREATE TRIGGER update_waste_types_lookup_updated_at
  BEFORE UPDATE ON waste_types_lookup
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- DISPOSAL METHODS LOOKUP TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS disposal_methods_lookup (
  value VARCHAR(50) PRIMARY KEY, -- Maps to disposal_method enum value
  label_id VARCHAR(100) NOT NULL, -- Indonesian label
  label_en VARCHAR(100), -- English label (for future i18n)
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  description TEXT, -- Optional description/help text
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for ordering
CREATE INDEX IF NOT EXISTS idx_disposal_methods_lookup_display_order ON disposal_methods_lookup(display_order, is_active);

-- Updated_at trigger
CREATE TRIGGER update_disposal_methods_lookup_updated_at
  BEFORE UPDATE ON disposal_methods_lookup
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- INSERT DEFAULT WASTE TYPES
-- Maps to waste_type enum: plastic, organic, glass, hazmat
-- ============================================
INSERT INTO waste_types_lookup (value, label_id, label_en, description, display_order) VALUES
  ('plastic', 'Plastik', 'Plastic', 'Sampah plastik seperti botol, kemasan, dll', 1),
  ('organic', 'Organik', 'Organic', 'Sampah organik seperti sisa makanan, daun, dll', 2),
  ('glass', 'Kaca', 'Glass', 'Sampah kaca seperti botol, gelas, dll', 3),
  ('hazmat', 'Bahan Berbahaya', 'Hazardous Materials', 'Bahan berbahaya yang memerlukan penanganan khusus', 4)
ON CONFLICT (value) DO UPDATE SET
  label_id = EXCLUDED.label_id,
  label_en = EXCLUDED.label_en,
  description = EXCLUDED.description,
  display_order = EXCLUDED.display_order,
  updated_at = NOW();

-- ============================================
-- INSERT DEFAULT DISPOSAL METHODS
-- Maps to disposal_method enum: landfill, recycling, incineration, ocean
-- ============================================
INSERT INTO disposal_methods_lookup (value, label_id, label_en, description, display_order) VALUES
  ('landfill', 'Tempat Pembuangan Akhir (TPA)', 'Landfill', 'Dibuang ke TPA', 1),
  ('recycling', 'Daur Ulang', 'Recycling', 'Didaur ulang', 2),
  ('incineration', 'Pembakaran', 'Incineration', 'Dibakar/diinsinerasi', 3),
  ('ocean', 'Laut (kehilangan tidak disengaja)', 'Ocean (accidental loss)', 'Terbuang ke laut secara tidak disengaja', 4)
ON CONFLICT (value) DO UPDATE SET
  label_id = EXCLUDED.label_id,
  label_en = EXCLUDED.label_en,
  description = EXCLUDED.description,
  display_order = EXCLUDED.display_order,
  updated_at = NOW();

-- ============================================
-- RLS POLICIES (Read-only for all authenticated users)
-- ============================================
ALTER TABLE waste_types_lookup ENABLE ROW LEVEL SECURITY;
ALTER TABLE disposal_methods_lookup ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active waste types" ON waste_types_lookup;
CREATE POLICY "Anyone can view active waste types"
  ON waste_types_lookup FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Anyone can view active disposal methods" ON disposal_methods_lookup;
CREATE POLICY "Anyone can view active disposal methods"
  ON disposal_methods_lookup FOR SELECT
  USING (is_active = true);

-- Note: Only admins can manage lookup data (future task, not in this migration)

