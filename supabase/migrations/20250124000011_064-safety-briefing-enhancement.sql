-- Migration: 064-safety-briefing-enhancement.sql
-- Description: Enhance safety_briefings table with generated_at and language support
-- Created: 2025-01-24
--
-- NOTE: This migration adds columns to safety_briefings table, but the primary storage
-- for briefing points is in trips.briefing_points (JSONB column). The safety_briefings
-- table is kept for optional/legacy use or future enhancements.
-- All current code uses trips.briefing_points for consistency.

-- ============================================
-- ADD COLUMNS TO safety_briefings
-- ============================================
ALTER TABLE safety_briefings
ADD COLUMN IF NOT EXISTS generated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'id'; -- 'id', 'en', 'zh', 'ja'

-- ============================================
-- UPDATE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_safety_briefings_generated_at ON safety_briefings(generated_at);
CREATE INDEX IF NOT EXISTS idx_safety_briefings_language ON safety_briefings(language);

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON COLUMN safety_briefings.generated_at IS 'When briefing was generated';
COMMENT ON COLUMN safety_briefings.language IS 'Language of briefing: id (Indonesian), en (English), zh (Chinese), ja (Japanese)';
COMMENT ON TABLE safety_briefings IS 'Optional/legacy table for safety briefings. Primary storage is in trips.briefing_points (JSONB).';

