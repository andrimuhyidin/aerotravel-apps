-- Migration: 104-partner-faq-product-info.sql
-- Description: Create partner_faq and partner_product_info tables for knowledge base
-- Created: 2025-12-24
-- Reference: Partner Portal Missing Features Implementation Plan

-- ============================================
-- PARTNER FAQ TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS partner_faq (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- FAQ Content
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category VARCHAR(100), -- general, booking, payment, refund, etc.
  
  -- Display Order
  display_order INTEGER DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- ============================================
-- PARTNER PRODUCT INFO TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS partner_product_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Product Reference (optional - can be null for general info)
  package_id UUID REFERENCES packages(id) ON DELETE SET NULL,
  
  -- Content
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(100), -- overview, itinerary, inclusions, exclusions, terms, etc.
  
  -- Display Order
  display_order INTEGER DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_partner_faq_partner_id ON partner_faq(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_faq_category ON partner_faq(category);
CREATE INDEX IF NOT EXISTS idx_partner_faq_is_active ON partner_faq(is_active);
CREATE INDEX IF NOT EXISTS idx_partner_faq_display_order ON partner_faq(display_order);

CREATE INDEX IF NOT EXISTS idx_partner_product_info_partner_id ON partner_product_info(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_product_info_package_id ON partner_product_info(package_id);
CREATE INDEX IF NOT EXISTS idx_partner_product_info_category ON partner_product_info(category);
CREATE INDEX IF NOT EXISTS idx_partner_product_info_is_active ON partner_product_info(is_active);
CREATE INDEX IF NOT EXISTS idx_partner_product_info_display_order ON partner_product_info(display_order);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE partner_faq ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_product_info ENABLE ROW LEVEL SECURITY;

-- Partners can view their own FAQs
CREATE POLICY "Partners can view own FAQs"
  ON partner_faq FOR SELECT
  USING (
    auth.uid() = partner_id OR
    EXISTS (
      SELECT 1 FROM partner_users pu
      WHERE pu.user_id = auth.uid()
      AND pu.partner_id = partner_faq.partner_id
      AND pu.is_active = true
      AND pu.deleted_at IS NULL
    )
  );

-- Partners can insert their own FAQs (admin only via API)
CREATE POLICY "Partners can insert own FAQs"
  ON partner_faq FOR INSERT
  WITH CHECK (
    auth.uid() = partner_id OR
    EXISTS (
      SELECT 1 FROM partner_users pu
      WHERE pu.user_id = auth.uid()
      AND pu.partner_id = partner_faq.partner_id
      AND pu.is_active = true
      AND pu.deleted_at IS NULL
      AND pu.role IN ('admin', 'owner')
    )
  );

-- Partners can update their own FAQs (admin only via API)
CREATE POLICY "Partners can update own FAQs"
  ON partner_faq FOR UPDATE
  USING (
    auth.uid() = partner_id OR
    EXISTS (
      SELECT 1 FROM partner_users pu
      WHERE pu.user_id = auth.uid()
      AND pu.partner_id = partner_faq.partner_id
      AND pu.is_active = true
      AND pu.deleted_at IS NULL
      AND pu.role IN ('admin', 'owner')
    )
  );

-- Partners can delete their own FAQs (admin only via API)
CREATE POLICY "Partners can delete own FAQs"
  ON partner_faq FOR DELETE
  USING (
    auth.uid() = partner_id OR
    EXISTS (
      SELECT 1 FROM partner_users pu
      WHERE pu.user_id = auth.uid()
      AND pu.partner_id = partner_faq.partner_id
      AND pu.is_active = true
      AND pu.deleted_at IS NULL
      AND pu.role IN ('admin', 'owner')
    )
  );

-- Admins can view all FAQs
CREATE POLICY "Admins can view all FAQs"
  ON partner_faq FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'ops_admin', 'marketing')
      AND users.is_active = true
    )
  );

-- Partners can view their own product info
CREATE POLICY "Partners can view own product info"
  ON partner_product_info FOR SELECT
  USING (
    auth.uid() = partner_id OR
    EXISTS (
      SELECT 1 FROM partner_users pu
      WHERE pu.user_id = auth.uid()
      AND pu.partner_id = partner_product_info.partner_id
      AND pu.is_active = true
      AND pu.deleted_at IS NULL
    )
  );

-- Partners can insert their own product info (admin only via API)
CREATE POLICY "Partners can insert own product info"
  ON partner_product_info FOR INSERT
  WITH CHECK (
    auth.uid() = partner_id OR
    EXISTS (
      SELECT 1 FROM partner_users pu
      WHERE pu.user_id = auth.uid()
      AND pu.partner_id = partner_product_info.partner_id
      AND pu.is_active = true
      AND pu.deleted_at IS NULL
      AND pu.role IN ('admin', 'owner')
    )
  );

-- Partners can update their own product info (admin only via API)
CREATE POLICY "Partners can update own product info"
  ON partner_product_info FOR UPDATE
  USING (
    auth.uid() = partner_id OR
    EXISTS (
      SELECT 1 FROM partner_users pu
      WHERE pu.user_id = auth.uid()
      AND pu.partner_id = partner_product_info.partner_id
      AND pu.is_active = true
      AND pu.deleted_at IS NULL
      AND pu.role IN ('admin', 'owner')
    )
  );

-- Partners can delete their own product info (admin only via API)
CREATE POLICY "Partners can delete own product info"
  ON partner_product_info FOR DELETE
  USING (
    auth.uid() = partner_id OR
    EXISTS (
      SELECT 1 FROM partner_users pu
      WHERE pu.user_id = auth.uid()
      AND pu.partner_id = partner_product_info.partner_id
      AND pu.is_active = true
      AND pu.deleted_at IS NULL
      AND pu.role IN ('admin', 'owner')
    )
  );

-- Admins can view all product info
CREATE POLICY "Admins can view all product info"
  ON partner_product_info FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('super_admin', 'ops_admin', 'marketing')
      AND users.is_active = true
    )
  );

-- ============================================
-- TRIGGER: Update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_partner_faq_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_partner_faq_updated_at
  BEFORE UPDATE ON partner_faq
  FOR EACH ROW
  EXECUTE FUNCTION update_partner_faq_updated_at();

CREATE OR REPLACE FUNCTION update_partner_product_info_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_partner_product_info_updated_at
  BEFORE UPDATE ON partner_product_info
  FOR EACH ROW
  EXECUTE FUNCTION update_partner_product_info_updated_at();

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE partner_faq IS 'FAQ entries for partner knowledge base';
COMMENT ON COLUMN partner_faq.category IS 'Category: general, booking, payment, refund, cancellation, etc.';
COMMENT ON COLUMN partner_faq.display_order IS 'Order for display (lower number = higher priority)';

COMMENT ON TABLE partner_product_info IS 'Product information articles for partner knowledge base';
COMMENT ON COLUMN partner_product_info.package_id IS 'Optional: Link to specific package, or NULL for general info';
COMMENT ON COLUMN partner_product_info.category IS 'Category: overview, itinerary, inclusions, exclusions, terms, pricing, etc.';
COMMENT ON COLUMN partner_product_info.display_order IS 'Order for display (lower number = higher priority)';

