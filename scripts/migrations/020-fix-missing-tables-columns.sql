-- Migration: Fix Missing Tables and Columns
-- Created: 2025-12-22
-- Description: Add missing tables and columns for guide features

-- Add fee_amount column to trip_crews
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'trip_crews' 
    AND column_name = 'fee_amount'
  ) THEN
    ALTER TABLE public.trip_crews 
    ADD COLUMN fee_amount DECIMAL(12, 2) DEFAULT 0;
  END IF;
END $$;

-- Create disposal_methods_lookup table
CREATE TABLE IF NOT EXISTS public.disposal_methods_lookup (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  method_name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  is_eco_friendly BOOLEAN DEFAULT false,
  icon VARCHAR(50),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default disposal methods
INSERT INTO public.disposal_methods_lookup (method_name, description, is_eco_friendly, icon, sort_order)
VALUES
  ('Recycle', 'Daur ulang melalui fasilitas daur ulang', true, '♻️', 1),
  ('Compost', 'Kompos untuk sampah organik', true, '🌱', 2),
  ('Proper Waste Bin', 'Buang ke tempat sampah yang sesuai', true, '🗑️', 3),
  ('Bring Back', 'Bawa kembali untuk disposal yang tepat', true, '📦', 4),
  ('Incinerate', 'Bakar di fasilitas yang sesuai', false, '🔥', 5),
  ('Landfill', 'Buang ke TPA', false, '⛰️', 6)
ON CONFLICT (method_name) DO NOTHING;

-- Create waste_types_lookup table
CREATE TABLE IF NOT EXISTS public.waste_types_lookup (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type_name VARCHAR(100) NOT NULL UNIQUE,
  category VARCHAR(50) NOT NULL, -- 'organic', 'inorganic', 'hazardous', 'recyclable'
  description TEXT,
  recommended_disposal VARCHAR(100),
  icon VARCHAR(50),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default waste types
INSERT INTO public.waste_types_lookup (type_name, category, description, recommended_disposal, icon, sort_order)
VALUES
  ('Plastic Bottles', 'recyclable', 'Botol plastik (PET, HDPE)', 'Recycle', '🍼', 1),
  ('Food Waste', 'organic', 'Sisa makanan organik', 'Compost', '🍽️', 2),
  ('Paper', 'recyclable', 'Kertas dan kardus', 'Recycle', '📄', 3),
  ('Glass', 'recyclable', 'Botol dan wadah kaca', 'Recycle', '🍾', 4),
  ('Metal Cans', 'recyclable', 'Kaleng aluminium dan besi', 'Recycle', '🥫', 5),
  ('Cigarette Butts', 'inorganic', 'Puntung rokok', 'Proper Waste Bin', '🚬', 6),
  ('Batteries', 'hazardous', 'Baterai bekas', 'Bring Back', '🔋', 7),
  ('Electronics', 'hazardous', 'Sampah elektronik', 'Bring Back', '📱', 8),
  ('Plastic Bags', 'inorganic', 'Kantong plastik', 'Recycle', '🛍️', 9),
  ('General Waste', 'inorganic', 'Sampah umum lainnya', 'Proper Waste Bin', '🗑️', 10)
ON CONFLICT (type_name) DO NOTHING;

-- Create expense_categories table
CREATE TABLE IF NOT EXISTS public.expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(50),
  requires_receipt BOOLEAN DEFAULT true,
  max_amount DECIMAL(12, 2),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default expense categories
INSERT INTO public.expense_categories (category_name, description, icon, requires_receipt, max_amount, sort_order)
VALUES
  ('Transportation', 'Biaya transportasi lokal', '🚗', true, 500000, 1),
  ('Meals', 'Makan dan minum', '🍽️', true, 200000, 2),
  ('Accommodation', 'Penginapan darurat', '🏨', true, 1000000, 3),
  ('Equipment', 'Peralatan dan perlengkapan', '🎒', true, 500000, 4),
  ('Communication', 'Pulsa dan internet', '📱', false, 100000, 5),
  ('Medical', 'Biaya medis darurat', '⚕️', true, NULL, 6),
  ('Emergency', 'Biaya darurat lainnya', '🚨', true, NULL, 7),
  ('Tips & Gratuity', 'Tips untuk pemandu lokal', '💰', false, 200000, 8),
  ('Miscellaneous', 'Lain-lain', '📝', true, 300000, 9)
ON CONFLICT (category_name) DO NOTHING;

-- Create inventory_handovers table
CREATE TABLE IF NOT EXISTS public.inventory_handovers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  guide_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  handover_type VARCHAR(50) NOT NULL, -- 'equipment', 'vehicle', 'supplies'
  item_name VARCHAR(200) NOT NULL,
  item_code VARCHAR(100),
  quantity INTEGER NOT NULL DEFAULT 1,
  condition VARCHAR(50), -- 'excellent', 'good', 'fair', 'poor', 'damaged'
  notes TEXT,
  handed_out_at TIMESTAMP WITH TIME ZONE,
  handed_out_by UUID REFERENCES auth.users(id),
  returned_at TIMESTAMP WITH TIME ZONE,
  returned_condition VARCHAR(50),
  return_notes TEXT,
  received_by UUID REFERENCES auth.users(id),
  photo_url TEXT,
  is_resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for inventory_handovers
CREATE INDEX IF NOT EXISTS idx_inventory_handovers_trip_id ON public.inventory_handovers(trip_id);
CREATE INDEX IF NOT EXISTS idx_inventory_handovers_guide_id ON public.inventory_handovers(guide_id);
CREATE INDEX IF NOT EXISTS idx_inventory_handovers_type ON public.inventory_handovers(handover_type);

-- Add RLS policies for inventory_handovers
ALTER TABLE public.inventory_handovers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Guides can view own handovers" ON public.inventory_handovers;
CREATE POLICY "Guides can view own handovers" ON public.inventory_handovers
  FOR SELECT
  USING (auth.uid() = guide_id);

DROP POLICY IF EXISTS "Guides can insert own handovers" ON public.inventory_handovers;
CREATE POLICY "Guides can insert own handovers" ON public.inventory_handovers
  FOR INSERT
  WITH CHECK (auth.uid() = guide_id);

DROP POLICY IF EXISTS "Guides can update own handovers" ON public.inventory_handovers;
CREATE POLICY "Guides can update own handovers" ON public.inventory_handovers
  FOR UPDATE
  USING (auth.uid() = guide_id)
  WITH CHECK (auth.uid() = guide_id);

DROP POLICY IF EXISTS "Ops/Admin can manage all handovers" ON public.inventory_handovers;
CREATE POLICY "Ops/Admin can manage all handovers" ON public.inventory_handovers
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('ops_admin', 'super_admin')
    )
  );

-- Add updated_at trigger for all new tables
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_disposal_methods_lookup_updated_at ON public.disposal_methods_lookup;
CREATE TRIGGER update_disposal_methods_lookup_updated_at
  BEFORE UPDATE ON public.disposal_methods_lookup
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_waste_types_lookup_updated_at ON public.waste_types_lookup;
CREATE TRIGGER update_waste_types_lookup_updated_at
  BEFORE UPDATE ON public.waste_types_lookup
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_expense_categories_updated_at ON public.expense_categories;
CREATE TRIGGER update_expense_categories_updated_at
  BEFORE UPDATE ON public.expense_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_inventory_handovers_updated_at ON public.inventory_handovers;
CREATE TRIGGER update_inventory_handovers_updated_at
  BEFORE UPDATE ON public.inventory_handovers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Comment migration
COMMENT ON TABLE public.disposal_methods_lookup IS 'Lookup table for waste disposal methods';
COMMENT ON TABLE public.waste_types_lookup IS 'Lookup table for waste types and categories';
COMMENT ON TABLE public.expense_categories IS 'Categories for guide expense claims';
COMMENT ON TABLE public.inventory_handovers IS 'Track equipment and inventory handover to guides';
COMMENT ON COLUMN public.trip_crews.fee_amount IS 'Fee amount for crew member on this trip';

