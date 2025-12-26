-- Migration: 080-partner-whitelabel-advanced.sql
-- Description: Add advanced whitelabel features (custom domain, email templates, widget)
-- Created: 2025-02-01
-- Reference: Partner Portal Complete Implementation Plan - Phase 5

BEGIN;

-- ============================================
-- ADD CUSTOM DOMAIN COLUMNS TO WHITELABEL SETTINGS
-- ============================================

ALTER TABLE partner_whitelabel_settings
  ADD COLUMN IF NOT EXISTS custom_domain VARCHAR(255),
  ADD COLUMN IF NOT EXISTS custom_domain_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS custom_domain_ssl_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS custom_domain_verification_token VARCHAR(64);

-- ============================================
-- ADD WIDGET COLUMNS TO WHITELABEL SETTINGS
-- ============================================

ALTER TABLE partner_whitelabel_settings
  ADD COLUMN IF NOT EXISTS widget_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS widget_api_key VARCHAR(64) UNIQUE,
  ADD COLUMN IF NOT EXISTS widget_config JSONB DEFAULT '{}'::jsonb;

-- Create index for widget_api_key lookup
CREATE INDEX IF NOT EXISTS idx_partner_whitelabel_widget_api_key 
  ON partner_whitelabel_settings(widget_api_key) 
  WHERE widget_api_key IS NOT NULL;

-- ============================================
-- EMAIL TEMPLATES TABLE
-- ============================================

DO $$ BEGIN
  CREATE TYPE email_template_type AS ENUM (
    'booking_confirmation',
    'invoice',
    'payment_receipt',
    'booking_reminder',
    'trip_cancellation'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS partner_email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Template Info
  template_type email_template_type NOT NULL,
  
  -- Content
  subject VARCHAR(500) NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  
  -- Variables (available variables for this template type)
  variables JSONB DEFAULT '[]'::jsonb,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint: one active template per type per partner
  UNIQUE(partner_id, template_type, is_active) DEFERRABLE INITIALLY DEFERRED
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_partner_email_templates_partner_id 
  ON partner_email_templates(partner_id);

CREATE INDEX IF NOT EXISTS idx_partner_email_templates_type 
  ON partner_email_templates(template_type);

CREATE INDEX IF NOT EXISTS idx_partner_email_templates_active 
  ON partner_email_templates(partner_id, template_type, is_active) 
  WHERE is_active = true;

-- Update trigger
CREATE OR REPLACE FUNCTION update_partner_email_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_partner_email_templates_updated_at
  BEFORE UPDATE ON partner_email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_partner_email_templates_updated_at();

-- ============================================
-- RLS POLICIES FOR EMAIL TEMPLATES
-- ============================================

ALTER TABLE partner_email_templates ENABLE ROW LEVEL SECURITY;

-- Partners can view their own email templates
CREATE POLICY "Partners can view own email templates"
  ON partner_email_templates
  FOR SELECT
  USING (auth.uid() = partner_id);

-- Partners can insert their own email templates
CREATE POLICY "Partners can insert own email templates"
  ON partner_email_templates
  FOR INSERT
  WITH CHECK (auth.uid() = partner_id);

-- Partners can update their own email templates
CREATE POLICY "Partners can update own email templates"
  ON partner_email_templates
  FOR UPDATE
  USING (auth.uid() = partner_id);

-- Admins can view all email templates
CREATE POLICY "Admins can view all email templates"
  ON partner_email_templates
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

COMMENT ON COLUMN partner_whitelabel_settings.custom_domain IS 'Custom domain for partner (e.g., booking.partner.com)';
COMMENT ON COLUMN partner_whitelabel_settings.custom_domain_verified IS 'Whether DNS verification is completed';
COMMENT ON COLUMN partner_whitelabel_settings.custom_domain_ssl_enabled IS 'Whether SSL certificate is enabled';
COMMENT ON COLUMN partner_whitelabel_settings.custom_domain_verification_token IS 'TXT record value for DNS verification';
COMMENT ON COLUMN partner_whitelabel_settings.widget_enabled IS 'Whether booking widget is enabled';
COMMENT ON COLUMN partner_whitelabel_settings.widget_api_key IS 'API key for widget authentication';
COMMENT ON COLUMN partner_whitelabel_settings.widget_config IS 'Widget configuration (colors, packages, etc.)';

COMMENT ON TABLE partner_email_templates IS 'Custom email templates for partners';
COMMENT ON COLUMN partner_email_templates.template_type IS 'Type of email template';
COMMENT ON COLUMN partner_email_templates.variables IS 'Available variables for this template type (e.g., {{customer_name}}, {{booking_code}})';
COMMENT ON COLUMN partner_email_templates.is_active IS 'Only one template per type can be active at a time';

COMMIT;

