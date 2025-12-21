-- Migration: 075-expense-categories-lookup.sql
-- Description: Expense categories lookup table for frontend consumption
-- Date: 2025-01-27

-- ============================================
-- EXPENSE CATEGORIES LOOKUP TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS expense_categories (
  value VARCHAR(50) PRIMARY KEY, -- Maps to expense_category enum value
  label_id VARCHAR(100) NOT NULL, -- Indonesian label
  label_en VARCHAR(100), -- English label (for future i18n)
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  icon_name VARCHAR(50), -- Icon name for UI (optional)
  description TEXT, -- Description/help text (optional)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for ordering
CREATE INDEX IF NOT EXISTS idx_expense_categories_display_order ON expense_categories(display_order, is_active);

-- Updated_at trigger
CREATE TRIGGER update_expense_categories_updated_at
  BEFORE UPDATE ON expense_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- INSERT DEFAULT EXPENSE CATEGORIES
-- Maps to expense_category enum: fuel, food, ticket, transport, equipment, emergency, other
-- ============================================
INSERT INTO expense_categories (value, label_id, label_en, display_order, icon_name, description) VALUES
  ('fuel', 'BBM (Konsumsi BBM)', 'Fuel', 1, 'Fuel', 'Bahan bakar untuk kapal atau kendaraan'),
  ('food', 'Makan/Minum', 'Food & Beverage', 2, 'Coffee', 'Makanan dan minuman untuk trip'),
  ('ticket', 'Tiket Masuk', 'Entrance Ticket', 3, 'Ticket', 'Tiket masuk ke tempat wisata'),
  ('transport', 'Transportasi', 'Transportation', 4, 'Car', 'Biaya transportasi (ojek, grab, dll)'),
  ('equipment', 'Peralatan', 'Equipment', 5, 'Tool', 'Peralatan dan perlengkapan trip'),
  ('emergency', 'Medis/P3K', 'Medical/Emergency', 6, 'Heart', 'Biaya medis atau P3K'),
  ('other', 'Lainnya', 'Other', 7, 'MoreHorizontal', 'Biaya lain-lain')
ON CONFLICT (value) DO UPDATE SET
  label_id = EXCLUDED.label_id,
  label_en = EXCLUDED.label_en,
  display_order = EXCLUDED.display_order,
  icon_name = EXCLUDED.icon_name,
  description = EXCLUDED.description,
  updated_at = NOW();

-- ============================================
-- RLS POLICIES (Read-only for all authenticated users)
-- ============================================
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active expense categories" ON expense_categories;
CREATE POLICY "Anyone can view active expense categories"
  ON expense_categories FOR SELECT
  USING (is_active = true);

-- Note: Only admins can manage categories (future task, not in this migration)

