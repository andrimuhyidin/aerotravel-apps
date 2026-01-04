-- Migration: 095-add-refund-policy-to-whitelabel.sql
-- Description: Add refund_policy field to partner_whitelabel_settings table
-- Created: 2025-01-31
-- Reference: Partner Portal Improvement Plan - Refund Policy Document Generator

-- ============================================
-- ADD REFUND POLICY FIELD
-- ============================================

ALTER TABLE partner_whitelabel_settings
ADD COLUMN IF NOT EXISTS refund_policy TEXT;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON COLUMN partner_whitelabel_settings.refund_policy IS 'Custom refund policy text for partner. If provided, will be included in refund policy PDF documents.';

