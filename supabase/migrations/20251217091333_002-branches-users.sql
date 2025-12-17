-- Migration: 002-branches-users.sql
-- Description: Branch & User management tables
-- Created: 2025-12-17

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- BRANCHES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(10) NOT NULL UNIQUE, -- LPG, DPS, LBJ
  name VARCHAR(100) NOT NULL,
  address TEXT,
  phone VARCHAR(20),
  email VARCHAR(100),
  timezone VARCHAR(50) DEFAULT 'Asia/Jakarta',
  currency VARCHAR(3) DEFAULT 'IDR',
  tax_inclusive BOOLEAN DEFAULT false,
  tax_rate DECIMAL(5,4) DEFAULT 0.11, -- 11% PPN
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- ============================================
-- USER ROLES ENUM
-- ============================================
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM (
    'super_admin',      -- Owner/Direktur
    'investor',         -- Komisaris (view only)
    'finance_manager',  -- Keuangan
    'marketing',        -- Marketing & CS (Aero Engine)
    'ops_admin',        -- Admin Operasional (Elang Engine)
    'guide',            -- Tour Guide
    'mitra',            -- B2B Agent
    'customer',         -- Public B2C
    'corporate'         -- B2B Enterprise
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- USERS TABLE (extends Supabase auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id),
  role user_role NOT NULL DEFAULT 'customer',
  
  -- Profile
  full_name VARCHAR(200) NOT NULL,
  phone VARCHAR(20),
  avatar_url TEXT,
  
  -- For Mitra
  company_name VARCHAR(200),
  company_address TEXT,
  npwp VARCHAR(30),
  
  -- For Guide
  nik VARCHAR(20),
  bank_name VARCHAR(50),
  bank_account_number VARCHAR(30),
  bank_account_name VARCHAR(100),
  
  -- Governance
  is_contract_signed BOOLEAN DEFAULT false,
  contract_signed_at TIMESTAMPTZ,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- ============================================
-- USER CONTRACTS (E-Contract/PKWT)
-- ============================================
DO $$ BEGIN
  CREATE TYPE contract_type AS ENUM (
    'pkwt',             -- Perjanjian Kerja Waktu Tertentu
    'pakta_integritas', -- Pakta Integritas
    'nda',              -- Non-Disclosure Agreement
    'mitra_agreement'   -- Perjanjian Kemitraan
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS user_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contract_type contract_type NOT NULL,
  
  -- Contract Details
  document_url TEXT, -- Link to PDF
  version VARCHAR(20) DEFAULT '1.0',
  
  -- Digital Signature
  signed_name VARCHAR(200) NOT NULL,
  signed_nik VARCHAR(20),
  signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  
  -- Validity
  valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_branch_id ON users(branch_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_user_contracts_user_id ON user_contracts(user_id);

-- ============================================
-- TRIGGERS FOR updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_branches_updated_at
  BEFORE UPDATE ON branches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED DATA: Default Branch
-- ============================================
INSERT INTO branches (code, name, address, timezone)
VALUES ('LPG', 'Lampung (HQ)', 'Lampung, Indonesia', 'Asia/Jakarta')
ON CONFLICT (code) DO NOTHING;
