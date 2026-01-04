-- Migration: 005-assets-operations.sql
-- Description: Assets, trips & operations tables
-- Created: 2025-12-17

-- ============================================
-- ASSET TYPES ENUM
-- ============================================
DO $$ BEGIN
  CREATE TYPE asset_type AS ENUM (
    'boat',       -- Kapal
    'speedboat',  -- Speedboat
    'villa',      -- Villa
    'vehicle',    -- Kendaraan darat
    'equipment'   -- Peralatan
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE asset_status AS ENUM (
    'available',
    'in_use',
    'maintenance',
    'retired'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- ASSETS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES branches(id),
  
  -- Basic Info
  code VARCHAR(20) NOT NULL, -- AST-BOAT-001
  name VARCHAR(200) NOT NULL,
  asset_type asset_type NOT NULL,
  description TEXT,
  
  -- Specifications
  capacity INTEGER, -- Max pax
  specifications JSONB, -- Engine, size, etc
  
  -- Ownership
  is_owned BOOLEAN DEFAULT true, -- Own or rented
  owner_name VARCHAR(200), -- If rented
  owner_phone VARCHAR(20),
  
  -- Pricing (for internal transfer pricing)
  rental_price_per_trip DECIMAL(12,2),
  rental_price_per_day DECIMAL(12,2),
  
  -- Documents
  registration_number VARCHAR(50),
  registration_expiry DATE,
  insurance_number VARCHAR(50),
  insurance_expiry DATE,
  
  -- Status
  status asset_status NOT NULL DEFAULT 'available',
  
  -- Location
  current_location VARCHAR(200),
  home_base VARCHAR(200),
  
  -- Maintenance
  last_maintenance_date DATE,
  next_maintenance_date DATE,
  engine_hours DECIMAL(10,2), -- For boats
  
  -- Media
  photo_url TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  UNIQUE(branch_id, code)
);

-- ============================================
-- ASSET MAINTENANCE
-- ============================================
DO $$ BEGIN
  CREATE TYPE maintenance_type AS ENUM (
    'scheduled',   -- Rutin
    'emergency',   -- Darurat
    'inspection'   -- Inspeksi
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE maintenance_status AS ENUM (
    'scheduled',
    'in_progress',
    'completed',
    'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS asset_maintenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  
  -- Schedule
  maintenance_type maintenance_type NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  -- Details
  description TEXT NOT NULL,
  vendor_name VARCHAR(200),
  estimated_cost DECIMAL(12,2),
  actual_cost DECIMAL(12,2),
  
  -- Status
  status maintenance_status NOT NULL DEFAULT 'scheduled',
  
  -- Completion
  completed_at TIMESTAMPTZ,
  completion_notes TEXT,
  
  -- Audit
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_maintenance_dates CHECK (end_date >= start_date)
);

-- ============================================
-- VENDORS TABLE
-- ============================================
DO $$ BEGIN
  CREATE TYPE vendor_type AS ENUM (
    'boat_rental',
    'catering',
    'transport',
    'accommodation',
    'ticket',      -- Tiket masuk
    'equipment',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES branches(id),
  
  -- Basic Info
  name VARCHAR(200) NOT NULL,
  vendor_type vendor_type NOT NULL,
  description TEXT,
  
  -- Contact
  contact_person VARCHAR(200),
  phone VARCHAR(20),
  email VARCHAR(200),
  address TEXT,
  
  -- Banking
  bank_name VARCHAR(50),
  bank_account_number VARCHAR(30),
  bank_account_name VARCHAR(100),
  
  -- Pricing (locked prices from PRD 4.4)
  default_price DECIMAL(12,2),
  price_unit VARCHAR(50), -- per trip, per pax, per day
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- ============================================
-- TRIPS TABLE (Trip Execution)
-- ============================================
DO $$ BEGIN
  CREATE TYPE trip_status AS ENUM (
    'scheduled',
    'preparing',
    'on_the_way',   -- Menuju meeting point
    'on_trip',      -- Sedang berlangsung
    'completed',
    'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES branches(id),
  
  -- Trip Info
  trip_code VARCHAR(20) NOT NULL UNIQUE, -- TRP-20251217-001
  trip_date DATE NOT NULL,
  
  -- Package
  package_id UUID NOT NULL REFERENCES packages(id),
  
  -- Asset Assignment
  primary_asset_id UUID REFERENCES assets(id),
  secondary_asset_id UUID REFERENCES assets(id),
  
  -- Capacity
  total_pax INTEGER NOT NULL DEFAULT 0,
  
  -- Status
  status trip_status NOT NULL DEFAULT 'scheduled',
  
  -- Timing
  departure_time TIME,
  actual_departure_time TIME,
  return_time TIME,
  actual_return_time TIME,
  
  -- Documentation (from PRD 4.5 - Payroll Gatekeeper)
  documentation_url TEXT,
  documentation_uploaded_at TIMESTAMPTZ,
  
  -- Notes
  notes TEXT,
  
  -- Completion
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES users(id),
  
  -- Audit
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TRIP BOOKINGS (Many-to-Many)
-- ============================================
CREATE TABLE IF NOT EXISTS trip_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(trip_id, booking_id)
);

-- ============================================
-- TRIP GUIDES (Assignment)
-- ============================================
DO $$ BEGIN
  CREATE TYPE guide_role AS ENUM (
    'lead',       -- Lead guide
    'assistant',  -- Assistant guide
    'driver',     -- Driver
    'photographer'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS trip_guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  guide_id UUID NOT NULL REFERENCES users(id),
  
  -- Role
  guide_role guide_role NOT NULL DEFAULT 'lead',
  
  -- Fee
  fee_amount DECIMAL(10,2) NOT NULL,
  
  -- Attendance (GPS from PRD 4.1)
  check_in_at TIMESTAMPTZ,
  check_in_lat DECIMAL(10, 8),
  check_in_lng DECIMAL(11, 8),
  check_in_location TEXT, -- Reverse geocoded
  is_late BOOLEAN DEFAULT false,
  
  check_out_at TIMESTAMPTZ,
  check_out_lat DECIMAL(10, 8),
  check_out_lng DECIMAL(11, 8),
  
  -- Documentation
  documentation_uploaded BOOLEAN DEFAULT false,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(trip_id, guide_id)
);

-- ============================================
-- TRIP EXPENSES
-- ============================================
DO $$ BEGIN
  CREATE TYPE expense_category AS ENUM (
    'fuel',
    'food',
    'ticket',      -- Tiket masuk
    'transport',
    'equipment',
    'emergency',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS trip_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES vendors(id),
  
  -- Expense Info
  category expense_category NOT NULL,
  description TEXT NOT NULL,
  
  -- Amount
  quantity DECIMAL(10,2) DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  
  -- Receipt
  receipt_url TEXT,
  
  -- Anomaly Detection (from PRD 6.3)
  expected_amount DECIMAL(12,2), -- From package recipe
  variance_percent DECIMAL(5,2), -- Actual vs expected
  is_anomaly BOOLEAN DEFAULT false,
  
  -- Audit
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INVENTORY (Stock Tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES branches(id),
  
  -- Item Info
  name VARCHAR(200) NOT NULL,
  sku VARCHAR(50),
  unit VARCHAR(20) NOT NULL, -- liter, bottle, piece
  
  -- Stock
  current_stock DECIMAL(12,2) NOT NULL DEFAULT 0,
  min_stock DECIMAL(12,2) DEFAULT 0,
  
  -- Pricing
  unit_cost DECIMAL(10,2),
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(branch_id, sku)
);

-- ============================================
-- INVENTORY TRANSACTIONS
-- ============================================
DO $$ BEGIN
  CREATE TYPE inventory_transaction_type AS ENUM (
    'purchase',
    'usage',
    'adjustment',
    'transfer'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id UUID NOT NULL REFERENCES inventory(id),
  trip_id UUID REFERENCES trips(id),
  
  -- Transaction
  transaction_type inventory_transaction_type NOT NULL,
  quantity DECIMAL(12,2) NOT NULL, -- Positive for in, negative for out
  stock_before DECIMAL(12,2) NOT NULL,
  stock_after DECIMAL(12,2) NOT NULL,
  
  -- Notes
  notes TEXT,
  
  -- Audit
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_assets_branch_id ON assets(branch_id);
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_asset_maintenance_asset_id ON asset_maintenance(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_maintenance_dates ON asset_maintenance(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_vendors_branch_id ON vendors(branch_id);
CREATE INDEX IF NOT EXISTS idx_trips_branch_id ON trips(branch_id);
CREATE INDEX IF NOT EXISTS idx_trips_trip_date ON trips(trip_date);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
CREATE INDEX IF NOT EXISTS idx_trip_bookings_trip_id ON trip_bookings(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_bookings_booking_id ON trip_bookings(booking_id);
CREATE INDEX IF NOT EXISTS idx_trip_guides_trip_id ON trip_guides(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_guides_guide_id ON trip_guides(guide_id);
CREATE INDEX IF NOT EXISTS idx_trip_expenses_trip_id ON trip_expenses(trip_id);
CREATE INDEX IF NOT EXISTS idx_inventory_branch_id ON inventory(branch_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_inventory_id ON inventory_transactions(inventory_id);

-- ============================================
-- TRIGGERS
-- ============================================
CREATE TRIGGER update_assets_updated_at
  BEFORE UPDATE ON assets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asset_maintenance_updated_at
  BEFORE UPDATE ON asset_maintenance
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendors_updated_at
  BEFORE UPDATE ON vendors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trips_updated_at
  BEFORE UPDATE ON trips
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trip_guides_updated_at
  BEFORE UPDATE ON trip_guides
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trip_expenses_updated_at
  BEFORE UPDATE ON trip_expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at
  BEFORE UPDATE ON inventory
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
