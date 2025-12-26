-- Migration: 078-partner-whitelabel-settings.sql
-- Description: Create partner_whitelabel_settings table for invoice branding
-- Created: 2025-01-31

-- ============================================
-- PARTNER WHITELABEL SETTINGS
-- ============================================
CREATE TABLE IF NOT EXISTS partner_whitelabel_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  
  -- Company Info
  company_name VARCHAR(200),
  company_logo_url TEXT,
  company_address TEXT,
  company_phone VARCHAR(20),
  company_email VARCHAR(200),
  
  -- Branding Colors
  primary_color VARCHAR(7), -- Hex color (e.g., #3B82F6)
  secondary_color VARCHAR(7), -- Hex color
  
  -- Invoice Footer Text (optional)
  invoice_footer_text TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_partner_whitelabel_partner_id ON partner_whitelabel_settings(partner_id);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE partner_whitelabel_settings ENABLE ROW LEVEL SECURITY;

-- Partners can only view/edit their own settings
CREATE POLICY "Partners can view own whitelabel settings"
  ON partner_whitelabel_settings
  FOR SELECT
  USING (auth.uid() = partner_id);

CREATE POLICY "Partners can insert own whitelabel settings"
  ON partner_whitelabel_settings
  FOR INSERT
  WITH CHECK (auth.uid() = partner_id);

CREATE POLICY "Partners can update own whitelabel settings"
  ON partner_whitelabel_settings
  FOR UPDATE
  USING (auth.uid() = partner_id);

-- Admins can view all
CREATE POLICY "Admins can view all whitelabel settings"
  ON partner_whitelabel_settings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('super_admin', 'ops_admin')
    )
  );

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE partner_whitelabel_settings IS 'Whitelabel settings for partner invoice branding';
COMMENT ON COLUMN partner_whitelabel_settings.partner_id IS 'Partner user ID (mitra role)';
COMMENT ON COLUMN partner_whitelabel_settings.company_logo_url IS 'URL to company logo (Supabase Storage)';
COMMENT ON COLUMN partner_whitelabel_settings.primary_color IS 'Primary brand color in hex format';
COMMENT ON COLUMN partner_whitelabel_settings.secondary_color IS 'Secondary brand color in hex format';

