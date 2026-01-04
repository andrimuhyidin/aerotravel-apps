-- Migration: 043-guide-documents.sql
-- Description: Guide documents table for storing required documents
-- Created: 2025-01-22

BEGIN;

-- ============================================
-- GUIDE DOCUMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS guide_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id),
  
  -- Document Info
  document_type VARCHAR(50) NOT NULL, -- 'ktp', 'skck', 'medical', 'photo', 'cv', 'certificate'
  document_name VARCHAR(255) NOT NULL, -- Display name: 'KTP', 'SKCK', etc.
  description TEXT,
  
  -- File Storage
  file_url TEXT NOT NULL, -- URL to document file
  file_name VARCHAR(255), -- Original filename
  file_size BIGINT, -- File size in bytes
  mime_type VARCHAR(100), -- MIME type
  
  -- Verification Status
  verification_status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'verified', 'rejected', 'needs_review'
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMPTZ,
  verification_notes TEXT,
  
  -- OCR/Extracted Data (if applicable)
  extracted_data JSONB, -- Data extracted from document (e.g., NIK from KTP)
  
  -- Expiry (for documents that expire)
  expiry_date DATE, -- For SKCK, Medical certificate, etc.
  
  -- Required Flag
  is_required BOOLEAN DEFAULT true, -- Required for license application
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_document_type CHECK (document_type IN ('ktp', 'skck', 'medical', 'photo', 'cv', 'certificate', 'other')),
  CONSTRAINT valid_verification_status CHECK (verification_status IN ('pending', 'verified', 'rejected', 'needs_review'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_guide_documents_guide_id ON guide_documents(guide_id);
CREATE INDEX IF NOT EXISTS idx_guide_documents_document_type ON guide_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_guide_documents_verification_status ON guide_documents(verification_status);
CREATE INDEX IF NOT EXISTS idx_guide_documents_is_required ON guide_documents(is_required);
CREATE INDEX IF NOT EXISTS idx_guide_documents_branch_id ON guide_documents(branch_id);

-- Unique constraint: one document per type per guide (latest version)
-- Note: We allow multiple versions, but we'll query the latest one
CREATE INDEX IF NOT EXISTS idx_guide_documents_guide_type_created ON guide_documents(guide_id, document_type, created_at DESC);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE guide_documents ENABLE ROW LEVEL SECURITY;

-- Guides can view their own documents
CREATE POLICY "guide_documents_own_select"
  ON guide_documents FOR SELECT
  TO authenticated
  USING (
    auth.uid() = guide_id AND
    (SELECT role FROM users WHERE id = auth.uid()) = 'guide'
  );

-- Guides can insert their own documents
CREATE POLICY "guide_documents_own_insert"
  ON guide_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = guide_id AND
    (SELECT role FROM users WHERE id = auth.uid()) = 'guide'
  );

-- Guides can update their own documents (only if not verified)
CREATE POLICY "guide_documents_own_update"
  ON guide_documents FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = guide_id AND
    (SELECT role FROM users WHERE id = auth.uid()) = 'guide' AND
    verification_status = 'pending' -- Can only update if not verified
  )
  WITH CHECK (
    auth.uid() = guide_id AND
    (SELECT role FROM users WHERE id = auth.uid()) = 'guide'
  );

-- Admins can view all documents in their branch
CREATE POLICY "guide_documents_admin_select"
  ON guide_documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'ops_admin')
      AND (
        branch_id IS NULL OR
        branch_id = (SELECT branch_id FROM users WHERE id = auth.uid())
      )
    )
  );

-- Admins can verify documents
CREATE POLICY "guide_documents_admin_update"
  ON guide_documents FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'ops_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'ops_admin')
    )
  );

-- ============================================
-- TRIGGERS
-- ============================================
-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_guide_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_guide_documents_updated_at
  BEFORE UPDATE ON guide_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_guide_documents_updated_at();

COMMIT;
