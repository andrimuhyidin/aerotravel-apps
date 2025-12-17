-- Migration: 009-social-commerce.sql
-- Description: Split Bill, Travel Circle, KOL Trip (PRD 5.1)
-- Created: 2025-12-17

-- ============================================
-- SPLIT BILL (PRD 5.1.A)
-- ============================================
DO $$ BEGIN
  CREATE TYPE split_bill_status AS ENUM (
    'pending',
    'partial_paid',
    'fully_paid',
    'expired',
    'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS split_bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  
  -- Creator (Ketua Grup)
  creator_id UUID REFERENCES users(id),
  creator_name VARCHAR(200) NOT NULL,
  creator_phone VARCHAR(20) NOT NULL,
  
  -- Split Config
  total_amount DECIMAL(12,2) NOT NULL,
  split_count INTEGER NOT NULL, -- Jumlah pembagian
  amount_per_person DECIMAL(12,2) NOT NULL,
  
  -- Status
  status split_bill_status NOT NULL DEFAULT 'pending',
  paid_count INTEGER DEFAULT 0,
  
  -- Timer (24 hours hold)
  expires_at TIMESTAMPTZ NOT NULL,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Split Bill Participants
CREATE TABLE IF NOT EXISTS split_bill_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  split_bill_id UUID NOT NULL REFERENCES split_bills(id) ON DELETE CASCADE,
  
  -- Participant Info
  name VARCHAR(200) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(200),
  
  -- Amount (bisa custom per orang)
  amount DECIMAL(12,2) NOT NULL,
  
  -- Payment
  payment_id UUID REFERENCES payments(id),
  payment_url TEXT, -- Unique payment link
  is_paid BOOLEAN DEFAULT false,
  paid_at TIMESTAMPTZ,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TRAVEL CIRCLE / ARISAN (PRD 5.1.B)
-- ============================================
DO $$ BEGIN
  CREATE TYPE travel_circle_status AS ENUM (
    'active',
    'target_reached',
    'redeemed',
    'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS travel_circles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES branches(id),
  
  -- Circle Info
  name VARCHAR(200) NOT NULL, -- "Labuan Bajo 2026"
  description TEXT,
  
  -- Target
  target_amount DECIMAL(14,2) NOT NULL, -- Rp 50 Juta
  current_amount DECIMAL(14,2) DEFAULT 0,
  monthly_contribution DECIMAL(12,2) NOT NULL, -- Rp 500rb/orang
  
  -- Schedule
  contribution_day INTEGER DEFAULT 1, -- Tanggal 1 setiap bulan
  target_date DATE, -- Target trip date
  
  -- Admin
  admin_id UUID NOT NULL REFERENCES users(id),
  
  -- Status
  status travel_circle_status NOT NULL DEFAULT 'active',
  
  -- Virtual Account
  virtual_account_number VARCHAR(50),
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Circle Members
CREATE TABLE IF NOT EXISTS travel_circle_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id UUID NOT NULL REFERENCES travel_circles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  
  -- Member Info
  name VARCHAR(200) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(200),
  
  -- Contribution
  total_contributed DECIMAL(14,2) DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  joined_at TIMESTAMPTZ DEFAULT NOW()
);

-- Circle Contributions (Iuran)
DO $$ BEGIN
  CREATE TYPE contribution_status AS ENUM (
    'pending',
    'paid',
    'late',
    'missed'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS travel_circle_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id UUID NOT NULL REFERENCES travel_circles(id),
  member_id UUID NOT NULL REFERENCES travel_circle_members(id),
  
  -- Period
  period_month DATE NOT NULL, -- 2025-01-01 for January 2025
  
  -- Amount
  amount DECIMAL(12,2) NOT NULL,
  
  -- Status
  status contribution_status NOT NULL DEFAULT 'pending',
  
  -- Payment
  paid_at TIMESTAMPTZ,
  payment_reference VARCHAR(100),
  
  -- Reminder
  reminder_sent_at TIMESTAMPTZ,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(circle_id, member_id, period_month)
);

-- ============================================
-- KOL / INFLUENCER TRIPS (PRD 5.1.C)
-- ============================================
CREATE TABLE IF NOT EXISTS kol_trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES packages(id),
  
  -- KOL Info
  kol_name VARCHAR(200) NOT NULL,
  kol_handle VARCHAR(100), -- @username
  kol_platform VARCHAR(50), -- instagram, tiktok, youtube
  kol_photo_url TEXT,
  kol_bio TEXT,
  
  -- Trip Details
  trip_date DATE NOT NULL,
  max_participants INTEGER NOT NULL,
  current_participants INTEGER DEFAULT 0,
  
  -- Pricing (Premium)
  base_price DECIMAL(12,2) NOT NULL,
  kol_fee DECIMAL(12,2) DEFAULT 0,
  final_price DECIMAL(12,2) NOT NULL, -- base + markup + kol_fee
  
  -- Landing Page
  slug VARCHAR(200) NOT NULL UNIQUE,
  hero_image_url TEXT,
  video_url TEXT,
  
  -- Group Chat
  chat_group_id VARCHAR(100), -- WhatsApp/Telegram group ID
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CUSTOMER WALLETS (untuk refund ke wallet)
-- ============================================
CREATE TABLE IF NOT EXISTS customer_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) UNIQUE,
  
  -- Balance
  balance DECIMAL(14,2) NOT NULL DEFAULT 0,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$ BEGIN
  CREATE TYPE customer_wallet_transaction_type AS ENUM (
    'refund_credit',
    'booking_debit',
    'topup',
    'withdrawal',
    'adjustment'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS customer_wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES customer_wallets(id),
  
  -- Transaction
  transaction_type customer_wallet_transaction_type NOT NULL,
  amount DECIMAL(14,2) NOT NULL,
  balance_before DECIMAL(14,2) NOT NULL,
  balance_after DECIMAL(14,2) NOT NULL,
  
  -- Reference
  booking_id UUID REFERENCES bookings(id),
  refund_id UUID REFERENCES refunds(id),
  
  -- Notes
  description TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_split_bills_booking_id ON split_bills(booking_id);
CREATE INDEX IF NOT EXISTS idx_split_bills_status ON split_bills(status);
CREATE INDEX IF NOT EXISTS idx_split_bill_participants_split_bill_id ON split_bill_participants(split_bill_id);
CREATE INDEX IF NOT EXISTS idx_travel_circles_admin_id ON travel_circles(admin_id);
CREATE INDEX IF NOT EXISTS idx_travel_circle_members_circle_id ON travel_circle_members(circle_id);
CREATE INDEX IF NOT EXISTS idx_travel_circle_contributions_circle_id ON travel_circle_contributions(circle_id);
CREATE INDEX IF NOT EXISTS idx_kol_trips_slug ON kol_trips(slug);
CREATE INDEX IF NOT EXISTS idx_customer_wallets_user_id ON customer_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_wallet_transactions_wallet_id ON customer_wallet_transactions(wallet_id);

-- ============================================
-- TRIGGERS
-- ============================================
CREATE TRIGGER update_split_bills_updated_at
  BEFORE UPDATE ON split_bills
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_travel_circles_updated_at
  BEFORE UPDATE ON travel_circles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kol_trips_updated_at
  BEFORE UPDATE ON kol_trips
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_wallets_updated_at
  BEFORE UPDATE ON customer_wallets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
