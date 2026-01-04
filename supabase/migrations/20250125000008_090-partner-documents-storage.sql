-- Migration: 090-partner-documents-storage.sql
-- Description: Setup storage bucket and policies for partner documents
-- Created: 2025-01-25
-- Reference: Partner Portal Onboarding & Profile Management Implementation Plan

-- ============================================
-- STORAGE BUCKET SETUP
-- ============================================

-- Note: We'll reuse existing 'partner-assets' bucket with subfolder structure
-- If bucket doesn't exist, it should be created via Supabase Dashboard or ensure-bucket.ts helper

-- ============================================
-- STORAGE POLICIES FOR PARTNER DOCUMENTS
-- ============================================

-- Allow authenticated users to upload documents to partner-assets/partner-documents/
-- This policy allows partners to upload their own documents
DROP POLICY IF EXISTS "partner_documents_upload" ON storage.objects;
CREATE POLICY "partner_documents_upload"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'partner-assets' AND
    (storage.foldername(name))[1] = 'partner-documents' AND
    (storage.foldername(name))[2] = auth.uid()::text
  );

-- Allow partners to read their own documents
DROP POLICY IF EXISTS "partner_documents_read_own" ON storage.objects;
CREATE POLICY "partner_documents_read_own"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'partner-assets' AND
    (storage.foldername(name))[1] = 'partner-documents' AND
    (storage.foldername(name))[2] = auth.uid()::text
  );

-- Allow admins to read all partner documents
DROP POLICY IF EXISTS "partner_documents_read_admin" ON storage.objects;
CREATE POLICY "partner_documents_read_admin"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'partner-assets' AND
    (storage.foldername(name))[1] = 'partner-documents' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'ops_admin', 'finance_manager')
    )
  );

-- Allow partners to update their own documents (before verification)
DROP POLICY IF EXISTS "partner_documents_update_own" ON storage.objects;
CREATE POLICY "partner_documents_update_own"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'partner-assets' AND
    (storage.foldername(name))[1] = 'partner-documents' AND
    (storage.foldername(name))[2] = auth.uid()::text
  );

-- Allow admins to update all partner documents
DROP POLICY IF EXISTS "partner_documents_update_admin" ON storage.objects;
CREATE POLICY "partner_documents_update_admin"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'partner-assets' AND
    (storage.foldername(name))[1] = 'partner-documents' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'ops_admin', 'finance_manager')
    )
  );

-- Allow partners to delete their own documents (before verification)
DROP POLICY IF EXISTS "partner_documents_delete_own" ON storage.objects;
CREATE POLICY "partner_documents_delete_own"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'partner-assets' AND
    (storage.foldername(name))[1] = 'partner-documents' AND
    (storage.foldername(name))[2] = auth.uid()::text
  );

-- Note: Bucket creation should be done via:
-- 1. Supabase Dashboard: Storage > New Bucket > partner-assets (if not exists)
-- 2. Or via lib/storage/ensure-bucket.ts helper in application code
-- 3. Bucket settings:
--    - Public: false (private)
--    - File size limit: 10MB
--    - Allowed MIME types: application/pdf, image/jpeg, image/png

