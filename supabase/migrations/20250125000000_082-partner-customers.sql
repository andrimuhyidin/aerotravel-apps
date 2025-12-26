-- Migration: 082-partner-customers.sql
-- Description: Create partner_customers table for Customer Management (CRM)
-- Created: 2025-01-25
-- Reference: Partner Portal Phase 1 Implementation Plan

-- ============================================
-- PARTNER CUSTOMERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS partner_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Customer Info
  name VARCHAR(200) NOT NULL,
  email VARCHAR(200),
  phone VARCHAR(20),
  address TEXT,
  birthdate DATE,
  
  -- Segmentation
  segment VARCHAR(50), -- individual/family/corporate/honeymoon/school
  
  -- Preferences (JSONB)
  preferences JSONB DEFAULT '{}', -- preferred_destination, budget_range, travel_date_pattern
  
  -- Special Notes
  special_notes TEXT,
  
  -- Stats (computed via triggers or queries)
  booking_count INTEGER DEFAULT 0,
  total_spent DECIMAL(14,2) DEFAULT 0,
  last_trip_date DATE,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_partner_customers_partner_id ON partner_customers(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_customers_email ON partner_customers(email);
CREATE INDEX IF NOT EXISTS idx_partner_customers_phone ON partner_customers(phone);
CREATE INDEX IF NOT EXISTS idx_partner_customers_segment ON partner_customers(segment);
CREATE INDEX IF NOT EXISTS idx_partner_customers_deleted_at ON partner_customers(deleted_at) WHERE deleted_at IS NULL;

-- ============================================
-- TRIGGERS
-- ============================================
CREATE TRIGGER update_partner_customers_updated_at
  BEFORE UPDATE ON partner_customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE partner_customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners can view own customers"
  ON partner_customers FOR SELECT
  USING (auth.uid() = partner_id);

CREATE POLICY "Partners can insert own customers"
  ON partner_customers FOR INSERT
  WITH CHECK (auth.uid() = partner_id);

CREATE POLICY "Partners can update own customers"
  ON partner_customers FOR UPDATE
  USING (auth.uid() = partner_id);

-- Admins can view all
CREATE POLICY "Admins can view all partner customers"
  ON partner_customers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'ops_admin', 'marketing')
      AND users.is_active = true
    )
  );

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE partner_customers IS 'Customer database per partner for CRM functionality';
COMMENT ON COLUMN partner_customers.segment IS 'Customer segment: individual/family/corporate/honeymoon/school';
COMMENT ON COLUMN partner_customers.preferences IS 'JSONB object storing customer preferences (destination, budget, travel pattern)';
COMMENT ON COLUMN partner_customers.booking_count IS 'Total number of bookings for this customer (computed)';
COMMENT ON COLUMN partner_customers.total_spent IS 'Total amount spent by this customer (computed)';
COMMENT ON COLUMN partner_customers.last_trip_date IS 'Date of last trip booked for this customer (computed)';

