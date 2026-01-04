/**
 * FAQs Table
 * CMS for managing Frequently Asked Questions across different apps
 */

CREATE TABLE IF NOT EXISTS faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_type VARCHAR(20), -- 'public', 'guide', 'partner', 'corporate', 'package'
  package_id UUID REFERENCES packages(id) ON DELETE CASCADE, -- nullable for global FAQs
  category VARCHAR(50), -- 'payment', 'cancellation', 'itinerary', 'documents', 'general'
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_faqs_app_type ON faqs(app_type);
CREATE INDEX IF NOT EXISTS idx_faqs_package_id ON faqs(package_id);
CREATE INDEX IF NOT EXISTS idx_faqs_category ON faqs(category);
CREATE INDEX IF NOT EXISTS idx_faqs_active ON faqs(is_active);
CREATE INDEX IF NOT EXISTS idx_faqs_display_order ON faqs(display_order);

-- RLS Policies
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

-- Public can read active FAQs
CREATE POLICY "Public can read active FAQs"
  ON faqs FOR SELECT
  USING (is_active = true);

-- Admins can manage FAQs
CREATE POLICY "Admins can manage FAQs"
  ON faqs FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin'));

-- Comments
COMMENT ON TABLE faqs IS 'CMS table for managing FAQs across different apps and packages';
COMMENT ON COLUMN faqs.app_type IS 'App type: public, guide, partner, corporate, or package';
COMMENT ON COLUMN faqs.package_id IS 'Optional package ID for package-specific FAQs';
COMMENT ON COLUMN faqs.category IS 'FAQ category for filtering';

