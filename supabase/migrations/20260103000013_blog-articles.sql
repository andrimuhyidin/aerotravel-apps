-- Migration: 20260103000013_blog-articles.sql
-- Description: Blog articles table untuk SEO content hub
-- Created: 2026-01-03

-- ============================================
-- BLOG ARTICLE STATUS ENUM
-- ============================================
DO $$ BEGIN
  CREATE TYPE blog_article_status AS ENUM (
    'draft',
    'published',
    'archived'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- BLOG ARTICLES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS blog_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  
  -- Basic Info
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT, -- Plain text atau markdown, bisa diubah ke JSONB untuk rich content
  
  -- Media
  featured_image TEXT,
  
  -- Categorization
  category TEXT NOT NULL, -- From BLOG_CATEGORIES: tips-perjalanan, destinasi, packing-list, pengalaman, berita
  tags TEXT[] DEFAULT '{}',
  
  -- Author
  author_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Publishing
  status blog_article_status NOT NULL DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  
  -- Analytics
  views INTEGER DEFAULT 0,
  read_time INTEGER, -- Calculated from content length (in minutes)
  
  -- SEO
  meta_title VARCHAR(200),
  meta_description VARCHAR(500),
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  -- Constraints
  UNIQUE(branch_id, slug),
  CONSTRAINT valid_category CHECK (category IN ('tips-perjalanan', 'destinasi', 'packing-list', 'pengalaman', 'berita'))
);

-- ============================================
-- INDEXES
-- ============================================
-- Slug lookup (unique per branch)
CREATE INDEX IF NOT EXISTS idx_blog_articles_slug ON blog_articles(branch_id, slug) WHERE deleted_at IS NULL;

-- Category filtering
CREATE INDEX IF NOT EXISTS idx_blog_articles_category ON blog_articles(category, status) WHERE deleted_at IS NULL AND status = 'published';

-- Published date sorting
CREATE INDEX IF NOT EXISTS idx_blog_articles_published ON blog_articles(published_at DESC) WHERE deleted_at IS NULL AND status = 'published';

-- Views sorting untuk popular articles
CREATE INDEX IF NOT EXISTS idx_blog_articles_views ON blog_articles(views DESC) WHERE deleted_at IS NULL AND status = 'published';

-- Full-text search (title + excerpt + content)
CREATE INDEX IF NOT EXISTS idx_blog_articles_search ON blog_articles USING gin(to_tsvector('indonesian', coalesce(title, '') || ' ' || coalesce(excerpt, '') || ' ' || coalesce(content, '')));

-- Tags array search (GIN index)
CREATE INDEX IF NOT EXISTS idx_blog_articles_tags ON blog_articles USING gin(tags) WHERE deleted_at IS NULL;

-- Author lookup
CREATE INDEX IF NOT EXISTS idx_blog_articles_author ON blog_articles(author_id) WHERE deleted_at IS NULL;

-- Branch filtering
CREATE INDEX IF NOT EXISTS idx_blog_articles_branch ON blog_articles(branch_id) WHERE deleted_at IS NULL;

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE blog_articles ENABLE ROW LEVEL SECURITY;

-- Public can read published articles (no authentication required)
CREATE POLICY blog_articles_public_read ON blog_articles
  FOR SELECT
  TO anon, authenticated
  USING (
    deleted_at IS NULL 
    AND status = 'published'
  );

-- Authenticated users can read all articles in their branch
CREATE POLICY blog_articles_branch_read ON blog_articles
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      -- Can read if published (already covered by public_read, but for branch filtering)
      status = 'published'
      OR
      -- Can read draft/archived if same branch
      EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.branch_id = blog_articles.branch_id
      )
    )
  );

-- Users can insert articles in their branch
CREATE POLICY blog_articles_branch_insert ON blog_articles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.branch_id = blog_articles.branch_id
      AND users.role IN ('super_admin', 'marketing', 'ops_admin')
    )
  );

-- Users can update articles in their branch
CREATE POLICY blog_articles_branch_update ON blog_articles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.branch_id = blog_articles.branch_id
      AND users.role IN ('super_admin', 'marketing', 'ops_admin')
      -- Authors can update their own articles
      OR (author_id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.branch_id = blog_articles.branch_id
      AND users.role IN ('super_admin', 'marketing', 'ops_admin')
      OR (author_id = auth.uid())
    )
  );

-- Only super_admin can delete
CREATE POLICY blog_articles_branch_delete ON blog_articles
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'super_admin'
    )
  );

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to calculate read time from content (estimate: 200 words per minute)
CREATE OR REPLACE FUNCTION calculate_read_time(content_text TEXT)
RETURNS INTEGER AS $$
BEGIN
  IF content_text IS NULL OR length(trim(content_text)) = 0 THEN
    RETURN 1; -- Minimum 1 minute
  END IF;
  
  -- Estimate: ~200 words per minute, average word length ~5 characters
  RETURN GREATEST(1, CEIL(length(content_text) / 1000.0));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger to auto-update read_time
CREATE OR REPLACE FUNCTION update_blog_article_read_time()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.content IS DISTINCT FROM OLD.content THEN
    NEW.read_time = calculate_read_time(NEW.content);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER blog_articles_read_time_trigger
  BEFORE INSERT OR UPDATE ON blog_articles
  FOR EACH ROW
  EXECUTE FUNCTION update_blog_article_read_time();

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_blog_articles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER blog_articles_updated_at
  BEFORE UPDATE ON blog_articles
  FOR EACH ROW
  EXECUTE FUNCTION update_blog_articles_updated_at();

-- Function to increment views
CREATE OR REPLACE FUNCTION increment_blog_article_views(article_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE blog_articles
  SET views = views + 1
  WHERE id = article_id
  AND deleted_at IS NULL
  AND status = 'published';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE blog_articles IS 'Blog articles untuk SEO content hub';
COMMENT ON COLUMN blog_articles.category IS 'Kategori dari BLOG_CATEGORIES: tips-perjalanan, destinasi, packing-list, pengalaman, berita';
COMMENT ON COLUMN blog_articles.read_time IS 'Estimasi waktu baca dalam menit, dihitung otomatis dari panjang konten';
COMMENT ON COLUMN blog_articles.views IS 'Jumlah view artikel, untuk sorting popular articles';

