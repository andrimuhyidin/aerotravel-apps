-- Migration: 057-absence-detection.sql
-- Description: Guide Absence Detection (H+15) - Auto-detect guides who haven't checked in 15 minutes after meeting time
-- Created: 2025-01-24
-- 
-- Features:
-- - Detect guides who haven't checked in 15 minutes after meeting time
-- - Update trip_guides status to ABSENT
-- - Notify admin via notification system
-- - Cron job ready (to be configured in Supabase)

-- ============================================
-- FUNCTION: detect_guide_absence()
-- ============================================
CREATE OR REPLACE FUNCTION detect_guide_absence()
RETURNS TABLE (
  trip_id UUID,
  guide_id UUID,
  guide_name TEXT,
  trip_code TEXT,
  meeting_time TIMESTAMPTZ,
  minutes_late INTEGER,
  notified BOOLEAN
) AS $$
DECLARE
  absent_record RECORD;
  notification_sent BOOLEAN;
  ops_phone TEXT;
  whatsapp_message TEXT;
BEGIN
  -- Get Ops Admin phone from environment (will be passed via config or stored in settings)
  -- For now, we'll use a notification table approach
  
  -- Find trips with guides who haven't checked in 15 minutes after meeting time
  FOR absent_record IN
    SELECT DISTINCT
      tg.trip_id,
      tg.guide_id,
      u.full_name AS guide_name,
      t.trip_code,
      t.meeting_time,
      EXTRACT(EPOCH FROM (NOW() - t.meeting_time)) / 60 AS minutes_late
    FROM trip_guides tg
    INNER JOIN trips t ON t.id = tg.trip_id
    INNER JOIN users u ON u.id = tg.guide_id
    WHERE t.status IN ('confirmed', 'scheduled')
      AND t.meeting_time IS NOT NULL
      AND t.meeting_time < NOW() - INTERVAL '15 minutes'
      AND tg.check_in_at IS NULL
      AND tg.assignment_status IN ('confirmed', 'pending_confirmation')
      AND NOT EXISTS (
        -- Exclude if already marked as absent in last 1 hour
        SELECT 1 FROM guide_absence_logs gal
        WHERE gal.trip_id = tg.trip_id
          AND gal.guide_id = tg.guide_id
          AND gal.detected_at > NOW() - INTERVAL '1 hour'
      )
  LOOP
    -- Update trip_guides status to ABSENT
    UPDATE trip_guides
    SET assignment_status = 'ABSENT',
        updated_at = NOW()
    WHERE trip_id = absent_record.trip_id
      AND guide_id = absent_record.guide_id
      AND check_in_at IS NULL;

    -- Log absence detection
    INSERT INTO guide_absence_logs (
      trip_id,
      guide_id,
      guide_name,
      trip_code,
      meeting_time,
      minutes_late,
      detected_at
    ) VALUES (
      absent_record.trip_id,
      absent_record.guide_id,
      absent_record.guide_name,
      absent_record.trip_code,
      absent_record.meeting_time,
      absent_record.minutes_late::INTEGER,
      NOW()
    )
    ON CONFLICT (trip_id, guide_id, detected_at::DATE) DO NOTHING;

    -- Queue notification (will be processed by notification system)
    INSERT INTO guide_absence_notifications (
      trip_id,
      guide_id,
      guide_name,
      trip_code,
      meeting_time,
      minutes_late,
      status,
      created_at
    ) VALUES (
      absent_record.trip_id,
      absent_record.guide_id,
      absent_record.guide_name,
      absent_record.trip_code,
      absent_record.meeting_time,
      absent_record.minutes_late::INTEGER,
      'pending',
      NOW()
    )
    ON CONFLICT (trip_id, guide_id, created_at::DATE) DO NOTHING;

    -- Return result
    RETURN QUERY SELECT
      absent_record.trip_id,
      absent_record.guide_id,
      absent_record.guide_name,
      absent_record.trip_code,
      absent_record.meeting_time,
      absent_record.minutes_late::INTEGER,
      true AS notified;
  END LOOP;

  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TABLE: guide_absence_logs
-- ============================================
CREATE TABLE IF NOT EXISTS guide_absence_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id),
  guide_id UUID NOT NULL REFERENCES users(id),
  
  -- Absence Info
  guide_name TEXT,
  trip_code TEXT,
  meeting_time TIMESTAMPTZ NOT NULL,
  minutes_late INTEGER NOT NULL,
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Resolution
  resolved_at TIMESTAMPTZ,
  resolution_note TEXT,
  resolved_by UUID REFERENCES users(id),
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate logs for same day
  UNIQUE(trip_id, guide_id, detected_at::DATE)
);

CREATE INDEX IF NOT EXISTS idx_guide_absence_logs_trip_id ON guide_absence_logs(trip_id);
CREATE INDEX IF NOT EXISTS idx_guide_absence_logs_guide_id ON guide_absence_logs(guide_id);
CREATE INDEX IF NOT EXISTS idx_guide_absence_logs_detected_at ON guide_absence_logs(detected_at);

-- ============================================
-- TABLE: guide_absence_notifications
-- ============================================
CREATE TABLE IF NOT EXISTS guide_absence_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id),
  guide_id UUID NOT NULL REFERENCES users(id),
  
  -- Absence Info
  guide_name TEXT,
  trip_code TEXT,
  meeting_time TIMESTAMPTZ NOT NULL,
  minutes_late INTEGER NOT NULL,
  
  -- Notification Status
  status VARCHAR(20) DEFAULT 'pending', -- pending, sent, failed
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate notifications for same day
  UNIQUE(trip_id, guide_id, created_at::DATE)
);

CREATE INDEX IF NOT EXISTS idx_guide_absence_notifications_status ON guide_absence_notifications(status);
CREATE INDEX IF NOT EXISTS idx_guide_absence_notifications_created_at ON guide_absence_notifications(created_at);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE guide_absence_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE guide_absence_notifications ENABLE ROW LEVEL SECURITY;

-- Allow guides to view their own absence logs
CREATE POLICY "Guides can view own absence logs"
  ON guide_absence_logs
  FOR SELECT
  USING (auth.uid() = guide_id);

-- Allow admins to view all absence logs
CREATE POLICY "Admins can view all absence logs"
  ON guide_absence_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
        AND role IN ('super_admin', 'ops_admin')
    )
  );

-- Allow admins to update absence logs (for resolution)
CREATE POLICY "Admins can update absence logs"
  ON guide_absence_logs
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
        AND role IN ('super_admin', 'ops_admin')
    )
  );

-- Allow admins to view all absence notifications
CREATE POLICY "Admins can view all absence notifications"
  ON guide_absence_notifications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
        AND role IN ('super_admin', 'ops_admin')
    )
  );

-- Allow system to insert/update notifications (via service role)
CREATE POLICY "System can manage absence notifications"
  ON guide_absence_notifications
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- CRON JOB SETUP (to be configured in Supabase Dashboard)
-- ============================================
-- Run every 15 minutes: */15 * * * *
-- SQL: SELECT detect_guide_absence();
--
-- To setup in Supabase:
-- 1. Go to Database > Extensions
-- 2. Enable pg_cron extension
-- 3. Run: SELECT cron.schedule('detect-absence', '*/15 * * * *', 'SELECT detect_guide_absence();');

COMMENT ON FUNCTION detect_guide_absence() IS 'Detects guides who have not checked in 15 minutes after meeting time and marks them as ABSENT';
COMMENT ON TABLE guide_absence_logs IS 'Logs of detected guide absences';
COMMENT ON TABLE guide_absence_notifications IS 'Queue for absence notifications to admins';

