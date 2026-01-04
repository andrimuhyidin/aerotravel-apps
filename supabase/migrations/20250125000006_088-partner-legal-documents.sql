-- Migration: 088-partner-legal-documents.sql
-- Description: Create partner_legal_documents table for legal document management
-- Created: 2025-01-25
-- Reference: Partner Portal Onboarding & Profile Management Implementation Plan

-- ============================================
-- PARTNER LEGAL DOCUMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS partner_legal_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Document Info
  document_type VARCHAR(50) NOT NULL, -- siup/npwp/akta/other
  document_number VARCHAR(100), -- Extracted from OCR
  document_url TEXT NOT NULL, -- File URL in storage
  
  -- OCR Data
  ocr_data JSONB DEFAULT '{}', -- OCR extraction results
  ocr_confidence DECIMAL(5,2), -- OCR confidence score (0-100)
  
  -- Verification
  is_verified BOOLEAN DEFAULT false, -- Admin verification status
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMPTZ,
  verification_notes TEXT, -- Admin notes on verification
  
  -- Metadata
  file_name VARCHAR(255),
  file_size BIGINT, -- File size in bytes
  mime_type VARCHAR(100),
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_partner_legal_documents_partner_id ON partner_legal_documents(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_legal_documents_document_type ON partner_legal_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_partner_legal_documents_document_number ON partner_legal_documents(document_number) WHERE document_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_partner_legal_documents_is_verified ON partner_legal_documents(is_verified);
CREATE INDEX IF NOT EXISTS idx_partner_legal_documents_deleted_at ON partner_legal_documents(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_partner_legal_documents_partner_type ON partner_legal_documents(partner_id, document_type) WHERE deleted_at IS NULL;

-- ============================================
-- TRIGGERS
-- ============================================
CREATE TRIGGER update_partner_legal_documents_updated_at
  BEFORE UPDATE ON partner_legal_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE partner_legal_documents ENABLE ROW LEVEL SECURITY;

-- Partners can view their own documents
CREATE POLICY "partner_legal_documents_select_own"
  ON partner_legal_documents
  FOR SELECT
  TO authenticated
  USING (
    partner_id IN (
      SELECT id FROM users WHERE id = auth.uid()
    )
  );

-- Partners can insert their own documents
CREATE POLICY "partner_legal_documents_insert_own"
  ON partner_legal_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    partner_id IN (
      SELECT id FROM users WHERE id = auth.uid()
    )
  );

-- Partners can update their own documents (before verification)
CREATE POLICY "partner_legal_documents_update_own"
  ON partner_legal_documents
  FOR UPDATE
  TO authenticated
  USING (
    partner_id IN (
      SELECT id FROM users WHERE id = auth.uid()
    ) AND is_verified = false
  );

-- Admins can view all documents
CREATE POLICY "partner_legal_documents_select_admin"
  ON partner_legal_documents
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'ops_admin', 'finance_manager')
    )
  );

-- Admins can update all documents (for verification)
CREATE POLICY "partner_legal_documents_update_admin"
  ON partner_legal_documents
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'ops_admin', 'finance_manager')
    )
  );

-- Comments
COMMENT ON TABLE partner_legal_documents IS 'Legal documents uploaded by partners (SIUP, NPWP, Akta, etc.)';
COMMENT ON COLUMN partner_legal_documents.document_type IS 'Type of document: siup, npwp, akta, other';
COMMENT ON COLUMN partner_legal_documents.document_number IS 'Document number extracted from OCR';
COMMENT ON COLUMN partner_legal_documents.ocr_data IS 'Full OCR extraction results in JSON format';
COMMENT ON COLUMN partner_legal_documents.ocr_confidence IS 'OCR confidence score (0-100)';
COMMENT ON COLUMN partner_legal_documents.is_verified IS 'Whether document has been verified by admin';

