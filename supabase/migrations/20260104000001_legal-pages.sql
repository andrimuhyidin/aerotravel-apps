/**
 * Legal Pages Table
 * CMS for managing Terms & Conditions, Privacy Policy, and DPO pages
 */

CREATE TABLE IF NOT EXISTS legal_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_type VARCHAR(50) UNIQUE NOT NULL, -- 'terms', 'privacy', 'dpo'
  title VARCHAR(200) NOT NULL,
  content_html TEXT NOT NULL,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_legal_pages_type ON legal_pages(page_type);
CREATE INDEX IF NOT EXISTS idx_legal_pages_active ON legal_pages(is_active);

-- RLS Policies
ALTER TABLE legal_pages ENABLE ROW LEVEL SECURITY;

-- Public can read active legal pages
CREATE POLICY "Public can read active legal pages"
  ON legal_pages FOR SELECT
  USING (is_active = true);

-- Admins can manage legal pages
CREATE POLICY "Admins can manage legal pages"
  ON legal_pages FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin'));

-- Comments
COMMENT ON TABLE legal_pages IS 'CMS table for managing legal pages (Terms, Privacy, DPO)';
COMMENT ON COLUMN legal_pages.page_type IS 'Type of legal page: terms, privacy, or dpo';
COMMENT ON COLUMN legal_pages.content_html IS 'HTML content of the legal page';

