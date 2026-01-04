-- Migration: 004-bookings-payments.sql
-- Description: Sales, booking & payment tables
-- Created: 2025-12-17

-- ============================================
-- BOOKING STATUS ENUM
-- ============================================
DO $$ BEGIN
  CREATE TYPE booking_status AS ENUM (
    'draft',
    'pending_payment',
    'awaiting_full_payment', -- Split Bill mode
    'paid',
    'confirmed',
    'cancelled',
    'refunded',
    'completed'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE booking_source AS ENUM (
    'website',
    'admin',
    'mitra',
    'corporate',
    'whatsapp',
    'referral'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- BOOKINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES branches(id),
  package_id UUID NOT NULL REFERENCES packages(id),
  
  -- Booking Info
  booking_code VARCHAR(20) NOT NULL UNIQUE, -- BK-20251217-XXXX
  booking_date DATE NOT NULL DEFAULT CURRENT_DATE,
  trip_date DATE NOT NULL,
  
  -- Source & Attribution
  source booking_source NOT NULL DEFAULT 'website',
  mitra_id UUID REFERENCES users(id), -- If from mitra
  referral_code VARCHAR(50),
  
  -- Pax Count
  adult_pax INTEGER NOT NULL DEFAULT 1,
  child_pax INTEGER NOT NULL DEFAULT 0,
  infant_pax INTEGER NOT NULL DEFAULT 0,
  
  -- Pricing (snapshot at booking time)
  price_per_adult DECIMAL(12,2) NOT NULL,
  price_per_child DECIMAL(12,2) NOT NULL DEFAULT 0,
  subtotal DECIMAL(12,2) NOT NULL,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL,
  
  -- For Mitra (Shadow P&L)
  nta_price_per_adult DECIMAL(12,2),
  nta_total DECIMAL(12,2),
  
  -- Status
  status booking_status NOT NULL DEFAULT 'pending_payment',
  
  -- Customer Info (primary contact)
  customer_name VARCHAR(200) NOT NULL,
  customer_email VARCHAR(200),
  customer_phone VARCHAR(20) NOT NULL,
  
  -- Legal
  consent_agreed BOOLEAN DEFAULT false,
  consent_agreed_at TIMESTAMPTZ,
  
  -- Notes
  special_requests TEXT,
  internal_notes TEXT,
  
  -- Cancellation
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES users(id),
  cancellation_reason TEXT,
  
  -- Audit
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- ============================================
-- BOOKING PASSENGERS
-- ============================================
DO $$ BEGIN
  CREATE TYPE passenger_type AS ENUM (
    'adult',
    'child',
    'infant'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE id_type AS ENUM (
    'ktp',
    'passport',
    'sim',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS booking_passengers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  
  -- Passenger Info
  full_name VARCHAR(200) NOT NULL,
  passenger_type passenger_type NOT NULL DEFAULT 'adult',
  date_of_birth DATE,
  
  -- Identity
  id_type id_type DEFAULT 'ktp',
  id_number VARCHAR(30),
  id_card_url TEXT, -- Photo of ID (auto-delete after 30 days)
  id_verified BOOLEAN DEFAULT false,
  
  -- Contact (optional for non-primary)
  phone VARCHAR(20),
  email VARCHAR(200),
  
  -- Emergency Contact
  emergency_name VARCHAR(200),
  emergency_phone VARCHAR(20),
  
  -- Health & Dietary
  dietary_requirements TEXT,
  health_conditions TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PAYMENTS TABLE
-- ============================================
DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM (
    'pending',
    'processing',
    'paid',
    'failed',
    'expired',
    'refunded'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM (
    'xendit_invoice',
    'xendit_va',
    'xendit_qris',
    'xendit_ewallet',
    'xendit_card',
    'mitra_wallet',
    'manual_transfer',
    'cash'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  
  -- Payment Info
  payment_code VARCHAR(50) NOT NULL UNIQUE, -- From Xendit
  amount DECIMAL(12,2) NOT NULL,
  fee_amount DECIMAL(12,2) DEFAULT 0, -- Payment gateway fee
  net_amount DECIMAL(12,2), -- amount - fee
  
  -- Method
  payment_method payment_method NOT NULL,
  
  -- Status
  status payment_status NOT NULL DEFAULT 'pending',
  
  -- Xendit Response
  external_id VARCHAR(100), -- Xendit invoice ID
  payment_url TEXT, -- Checkout URL
  
  -- For Split Bill
  payer_name VARCHAR(200),
  payer_email VARCHAR(200),
  payer_phone VARCHAR(20),
  split_bill_id UUID, -- Reference to main booking if split
  
  -- OCR Verification (for manual transfer)
  proof_image_url TEXT,
  ocr_verified BOOLEAN DEFAULT false,
  ocr_verified_at TIMESTAMPTZ,
  ocr_data JSONB, -- Extracted data from OCR
  
  -- Manual Verification
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMPTZ,
  
  -- Timestamps
  paid_at TIMESTAMPTZ,
  expired_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MITRA WALLETS (Deposit System)
-- ============================================
CREATE TABLE IF NOT EXISTS mitra_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mitra_id UUID NOT NULL REFERENCES users(id) UNIQUE,
  
  -- Balance
  balance DECIMAL(14,2) NOT NULL DEFAULT 0,
  
  -- Limits
  credit_limit DECIMAL(14,2) DEFAULT 0,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MITRA WALLET TRANSACTIONS
-- ============================================
DO $$ BEGIN
  CREATE TYPE wallet_transaction_type AS ENUM (
    'topup',
    'booking_debit',
    'refund_credit',
    'adjustment'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS mitra_wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES mitra_wallets(id),
  
  -- Transaction
  transaction_type wallet_transaction_type NOT NULL,
  amount DECIMAL(14,2) NOT NULL, -- Positive for credit, negative for debit
  balance_before DECIMAL(14,2) NOT NULL,
  balance_after DECIMAL(14,2) NOT NULL,
  
  -- Reference
  booking_id UUID REFERENCES bookings(id),
  payment_id UUID REFERENCES payments(id),
  
  -- Notes
  description TEXT,
  
  -- Audit
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_bookings_branch_id ON bookings(branch_id);
CREATE INDEX IF NOT EXISTS idx_bookings_package_id ON bookings(package_id);
CREATE INDEX IF NOT EXISTS idx_bookings_mitra_id ON bookings(mitra_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_trip_date ON bookings(trip_date);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_code ON bookings(booking_code);
CREATE INDEX IF NOT EXISTS idx_booking_passengers_booking_id ON booking_passengers(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_external_id ON payments(external_id);
CREATE INDEX IF NOT EXISTS idx_mitra_wallet_transactions_wallet_id ON mitra_wallet_transactions(wallet_id);

-- ============================================
-- TRIGGERS
-- ============================================
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_booking_passengers_updated_at
  BEFORE UPDATE ON booking_passengers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mitra_wallets_updated_at
  BEFORE UPDATE ON mitra_wallets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNCTION: Generate Booking Code
-- ============================================
CREATE OR REPLACE FUNCTION generate_booking_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  today_str TEXT;
  seq_num INTEGER;
BEGIN
  today_str := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(booking_code FROM 13 FOR 4) AS INTEGER)
  ), 0) + 1
  INTO seq_num
  FROM bookings
  WHERE booking_code LIKE 'BK-' || today_str || '-%';
  
  new_code := 'BK-' || today_str || '-' || LPAD(seq_num::TEXT, 4, '0');
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;
