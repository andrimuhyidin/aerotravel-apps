-- Migration: 003-packages-pricing.sql
-- Description: Product catalog & pricing tables
-- Created: 2025-12-17

-- ============================================
-- PACKAGE TYPES ENUM
-- ============================================
DO $$ BEGIN
  CREATE TYPE package_type AS ENUM (
    'open_trip',      -- Gabungan dengan peserta lain
    'private_trip',   -- Eksklusif satu grup
    'corporate',      -- Gathering perusahaan
    'kol_trip'        -- Trip dengan influencer
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE package_status AS ENUM (
    'draft',
    'published',
    'archived'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- PACKAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES branches(id),
  
  -- Basic Info
  code VARCHAR(20) NOT NULL, -- PKG-PHW-001
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) NOT NULL,
  description TEXT,
  short_description VARCHAR(500),
  
  -- Type & Status
  package_type package_type NOT NULL DEFAULT 'open_trip',
  status package_status NOT NULL DEFAULT 'draft',
  
  -- Location
  destination VARCHAR(200) NOT NULL,
  city VARCHAR(100),
  province VARCHAR(100),
  meeting_point TEXT,
  meeting_point_lat DECIMAL(10, 8),
  meeting_point_lng DECIMAL(11, 8),
  
  -- Duration
  duration_days INTEGER NOT NULL DEFAULT 1,
  duration_nights INTEGER NOT NULL DEFAULT 0,
  
  -- Capacity
  min_pax INTEGER NOT NULL DEFAULT 1,
  max_pax INTEGER NOT NULL DEFAULT 20,
  
  -- Inclusions
  inclusions TEXT[], -- Array of included items
  exclusions TEXT[], -- Array of excluded items
  itinerary JSONB, -- Day by day itinerary
  
  -- Media
  thumbnail_url TEXT,
  gallery_urls TEXT[],
  
  -- SEO
  meta_title VARCHAR(200),
  meta_description VARCHAR(500),
  
  -- Child Policy (from PRD 4.2)
  child_discount_percent DECIMAL(5,2) DEFAULT 50.00, -- 50% discount
  child_min_age INTEGER DEFAULT 2,
  child_max_age INTEGER DEFAULT 5,
  infant_max_age INTEGER DEFAULT 2, -- Free for infants
  
  -- Logistics Recipe (from PRD 4.4)
  fuel_per_pax_liter DECIMAL(5,2), -- BBM per pax
  water_per_pax_bottle INTEGER, -- Air mineral per pax
  
  -- Audit
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  UNIQUE(branch_id, slug)
);

-- ============================================
-- PACKAGE PRICES (Tiered Pricing)
-- ============================================
CREATE TABLE IF NOT EXISTS package_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  
  -- Tier Range (from PRD 4.2)
  min_pax INTEGER NOT NULL,
  max_pax INTEGER NOT NULL,
  
  -- Pricing
  price_publish DECIMAL(12,2) NOT NULL, -- Harga jual publik
  price_nta DECIMAL(12,2) NOT NULL, -- Harga modal mitra (Net To Agent)
  price_weekend DECIMAL(12,2), -- Weekend surcharge (optional)
  
  -- Internal Cost (for Shadow P&L)
  cost_internal DECIMAL(12,2), -- Biaya sewa aset internal
  cost_external DECIMAL(12,2), -- Biaya vendor luar
  
  -- Validity
  valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE,
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure no overlapping tiers
  CONSTRAINT unique_package_tier UNIQUE (package_id, min_pax, max_pax, valid_from)
);

-- ============================================
-- SEASON CALENDAR (High Season Pricing)
-- ============================================
DO $$ BEGIN
  CREATE TYPE season_type AS ENUM (
    'high_season',
    'peak_season',  -- Lebaran, Natal, Tahun Baru
    'low_season'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS season_calendar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES branches(id),
  
  -- Season Info
  name VARCHAR(100) NOT NULL, -- "Lebaran 2025"
  season_type season_type NOT NULL,
  
  -- Date Range
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  -- Price Modifier
  markup_type VARCHAR(10) DEFAULT 'percent', -- 'percent' or 'fixed'
  markup_value DECIMAL(12,2) NOT NULL, -- 20 for 20% or 100000 for fixed
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_packages_branch_id ON packages(branch_id);
CREATE INDEX IF NOT EXISTS idx_packages_slug ON packages(slug);
CREATE INDEX IF NOT EXISTS idx_packages_status ON packages(status);
CREATE INDEX IF NOT EXISTS idx_packages_destination ON packages(destination);
CREATE INDEX IF NOT EXISTS idx_package_prices_package_id ON package_prices(package_id);
CREATE INDEX IF NOT EXISTS idx_package_prices_pax_range ON package_prices(min_pax, max_pax);
CREATE INDEX IF NOT EXISTS idx_season_calendar_dates ON season_calendar(start_date, end_date);

-- ============================================
-- TRIGGERS
-- ============================================
CREATE TRIGGER update_packages_updated_at
  BEFORE UPDATE ON packages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_package_prices_updated_at
  BEFORE UPDATE ON package_prices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
