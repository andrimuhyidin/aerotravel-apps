-- Migration: Integration Settings
-- Purpose: Store third-party API configurations securely
-- Categories: WhatsApp, Payment, Email, Analytics

-- Create integration settings table
CREATE TABLE IF NOT EXISTS integration_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  category VARCHAR(50) NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  is_enabled BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique provider per branch
  UNIQUE(branch_id, provider)
);

-- Add indexes
CREATE INDEX idx_integration_settings_branch ON integration_settings(branch_id);
CREATE INDEX idx_integration_settings_category ON integration_settings(category);
CREATE INDEX idx_integration_settings_enabled ON integration_settings(is_enabled) WHERE is_enabled = true;

-- Add comments
COMMENT ON TABLE integration_settings IS 'Third-party API integration configurations';
COMMENT ON COLUMN integration_settings.provider IS 'Integration provider: fonnte, midtrans, xendit, resend, posthog, ga4';
COMMENT ON COLUMN integration_settings.category IS 'Category: whatsapp, payment, email, analytics';
COMMENT ON COLUMN integration_settings.config IS 'Encrypted configuration including API keys';

-- RLS Policies
ALTER TABLE integration_settings ENABLE ROW LEVEL SECURITY;

-- Only super_admin and branch admins can view
CREATE POLICY "Admins can view integrations" ON integration_settings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND (
        u.role = 'super_admin' 
        OR (
          u.role = 'ops_admin' 
          AND u.branch_id = integration_settings.branch_id
        )
      )
    )
  );

-- Only super_admin can insert/update/delete
CREATE POLICY "Super admin can manage integrations" ON integration_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role = 'super_admin'
    )
  );

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_integration_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_integration_settings_timestamp
  BEFORE UPDATE ON integration_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_integration_settings_timestamp();

-- Insert default integration templates (global/null branch_id)
INSERT INTO integration_settings (branch_id, provider, category, config, is_enabled)
VALUES
  (NULL, 'fonnte', 'whatsapp', '{"api_key": "", "device_token": "", "webhook_url": ""}', false),
  (NULL, 'midtrans', 'payment', '{"server_key": "", "client_key": "", "is_production": false}', false),
  (NULL, 'xendit', 'payment', '{"secret_key": "", "callback_token": "", "is_production": false}', false),
  (NULL, 'resend', 'email', '{"api_key": "", "from_email": "", "from_name": ""}', false),
  (NULL, 'posthog', 'analytics', '{"api_key": "", "host": "https://app.posthog.com"}', false),
  (NULL, 'ga4', 'analytics', '{"measurement_id": "", "api_secret": ""}', false)
ON CONFLICT (branch_id, provider) DO NOTHING;

