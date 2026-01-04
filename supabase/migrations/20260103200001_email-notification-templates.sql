/**
 * Email & Notification Templates
 * Phase 3: Admin Configurable Settings
 * 
 * Tables for managing email and notification templates via Admin Console
 */

-- ============================================
-- EMAIL TEMPLATES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  subject_template TEXT NOT NULL,
  body_html_template TEXT NOT NULL,
  body_text_template TEXT,
  variables JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_email_templates_key ON email_templates(template_key);
CREATE INDEX IF NOT EXISTS idx_email_templates_active ON email_templates(is_active) WHERE is_active = true;

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_email_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_email_templates_updated_at();

-- RLS
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Super admin can do everything
CREATE POLICY "super_admin_email_templates_all"
  ON email_templates
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- Other admins can read
CREATE POLICY "admin_email_templates_read"
  ON email_templates
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('ops_admin', 'finance_manager', 'marketing')
    )
  );

-- ============================================
-- NOTIFICATION TEMPLATES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  message_template TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb,
  channel VARCHAR(20) NOT NULL DEFAULT 'whatsapp',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_channel CHECK (channel IN ('whatsapp', 'sms', 'push'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notification_templates_key ON notification_templates(template_key);
CREATE INDEX IF NOT EXISTS idx_notification_templates_channel ON notification_templates(channel);
CREATE INDEX IF NOT EXISTS idx_notification_templates_active ON notification_templates(is_active) WHERE is_active = true;

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_notification_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_notification_templates_updated_at
  BEFORE UPDATE ON notification_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_templates_updated_at();

-- RLS
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;

-- Super admin can do everything
CREATE POLICY "super_admin_notification_templates_all"
  ON notification_templates
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- Other admins can read
CREATE POLICY "admin_notification_templates_read"
  ON notification_templates
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('ops_admin', 'finance_manager', 'marketing')
    )
  );

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE email_templates IS 'Global email templates for system notifications';
COMMENT ON COLUMN email_templates.template_key IS 'Unique identifier for the template (e.g., booking_confirmation, license_expiry_alert)';
COMMENT ON COLUMN email_templates.subject_template IS 'Email subject with {{variable}} placeholders';
COMMENT ON COLUMN email_templates.body_html_template IS 'HTML email body with {{variable}} placeholders';
COMMENT ON COLUMN email_templates.variables IS 'JSON array of available variables for this template';

COMMENT ON TABLE notification_templates IS 'Templates for WhatsApp, SMS, and push notifications';
COMMENT ON COLUMN notification_templates.template_key IS 'Unique identifier for the template (e.g., sos_alert, guide_absence)';
COMMENT ON COLUMN notification_templates.message_template IS 'Message text with {{variable}} placeholders';
COMMENT ON COLUMN notification_templates.channel IS 'Notification channel: whatsapp, sms, or push';

