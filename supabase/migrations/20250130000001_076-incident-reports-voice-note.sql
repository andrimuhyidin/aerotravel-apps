-- Migration: 076-incident-reports-voice-note.sql
-- Description: Add voice_note_url column to incident_reports table
-- Created: 2025-01-30

-- ============================================
-- ADD VOICE NOTE URL COLUMN
-- ============================================

ALTER TABLE incident_reports
  ADD COLUMN IF NOT EXISTS voice_note_url TEXT;

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_incident_reports_voice_note ON incident_reports(voice_note_url) WHERE voice_note_url IS NOT NULL;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON COLUMN incident_reports.voice_note_url IS 'URL to voice note audio file from transcription (optional)';

