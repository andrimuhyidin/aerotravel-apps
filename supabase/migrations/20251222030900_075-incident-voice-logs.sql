-- Migration: 075-incident-voice-logs.sql
-- Description: Create voice log audit table for compliance
-- Created: 2025-12-22

-- ============================================
-- TABLE: Incident Voice Logs
-- ============================================
CREATE TABLE IF NOT EXISTS incident_voice_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID REFERENCES incident_reports(id) ON DELETE SET NULL,
  guide_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id),
  audio_file_url TEXT,
  transcript TEXT,
  confidence_score DECIMAL(5, 2), -- 0.00 to 1.00
  language VARCHAR(10) DEFAULT 'id-ID',
  duration_seconds INTEGER,
  transcription_method VARCHAR(20) DEFAULT 'google_speech', -- 'google_speech', 'web_speech', 'manual'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_incident_voice_logs_incident_id ON incident_voice_logs(incident_id);
CREATE INDEX IF NOT EXISTS idx_incident_voice_logs_guide_id ON incident_voice_logs(guide_id);
CREATE INDEX IF NOT EXISTS idx_incident_voice_logs_created_at ON incident_voice_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_incident_voice_logs_branch_id ON incident_voice_logs(branch_id);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE incident_voice_logs ENABLE ROW LEVEL SECURITY;

-- Guides can view their own voice logs
CREATE POLICY "Guides can view own voice logs"
  ON incident_voice_logs
  FOR SELECT
  USING (auth.uid() = guide_id);

-- Guides can insert their own voice logs
CREATE POLICY "Guides can insert own voice logs"
  ON incident_voice_logs
  FOR INSERT
  WITH CHECK (auth.uid() = guide_id);

-- Admins can view all voice logs
CREATE POLICY "Admins can view all voice logs"
  ON incident_voice_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('super_admin', 'ops_admin')
    )
  );

-- ============================================
-- TRIGGERS
-- ============================================
CREATE TRIGGER update_incident_voice_logs_updated_at
  BEFORE UPDATE ON incident_voice_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RETENTION POLICY FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION cleanup_old_voice_logs()
RETURNS void AS $$
BEGIN
  -- Delete logs older than 1 year
  DELETE FROM incident_voice_logs
  WHERE created_at < NOW() - INTERVAL '1 year';
  
  RAISE NOTICE 'Cleaned up old voice logs';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule cleanup job (run monthly)
SELECT cron.schedule(
  'cleanup-old-voice-logs-monthly',
  '0 0 1 * *', -- First day of every month at midnight
  $$SELECT cleanup_old_voice_logs()$$
);

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE incident_voice_logs IS 'Audit log for voice transcription requests (compliance)';
COMMENT ON COLUMN incident_voice_logs.confidence_score IS 'Transcription confidence score (0.00 to 1.00)';
COMMENT ON COLUMN incident_voice_logs.transcription_method IS 'Method used: google_speech, web_speech, or manual';
COMMENT ON FUNCTION cleanup_old_voice_logs IS 'Delete voice logs older than 1 year for data retention compliance';

