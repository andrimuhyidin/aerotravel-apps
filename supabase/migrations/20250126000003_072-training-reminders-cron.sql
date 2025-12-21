-- Migration: 072-training-reminders-cron.sql
-- Description: Training Reminders Cron Job Setup
-- Created: 2025-01-26

-- ============================================
-- FUNCTION: Check Mandatory Training Reminders
-- ============================================
CREATE OR REPLACE FUNCTION check_mandatory_training_reminders()
RETURNS TABLE (
  assignment_id UUID,
  guide_id UUID,
  guide_phone TEXT,
  training_title TEXT,
  due_date DATE,
  days_until_due INTEGER,
  reminder_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH reminders AS (
    SELECT 
      gta.id AS assignment_id,
      gta.guide_id,
      u.phone AS guide_phone,
      mt.title AS training_title,
      gta.due_date,
      (gta.due_date - CURRENT_DATE)::INTEGER AS days_until_due,
      CASE
        WHEN (gta.due_date - CURRENT_DATE) = 7 THEN 'due_soon_7d'
        WHEN (gta.due_date - CURRENT_DATE) = 1 THEN 'due_soon_1d'
        WHEN gta.due_date < CURRENT_DATE THEN 'overdue'
        ELSE NULL
      END AS reminder_type
    FROM guide_mandatory_training_assignments gta
    JOIN mandatory_trainings mt ON mt.id = gta.mandatory_training_id
    JOIN users u ON u.id = gta.guide_id
    WHERE gta.status IN ('pending', 'overdue')
      AND mt.is_active = true
      AND (
        -- Due in 7 days (H-7)
        (gta.due_date - CURRENT_DATE) = 7
        -- Due in 1 day (H-1)
        OR (gta.due_date - CURRENT_DATE) = 1
        -- Overdue (check daily)
        OR (gta.due_date < CURRENT_DATE AND gta.last_reminder_sent_at IS NULL)
        OR (gta.due_date < CURRENT_DATE AND gta.last_reminder_sent_at < CURRENT_DATE - INTERVAL '1 day')
      )
      -- Don't send if reminder was sent today for this type
      AND (
        gta.last_reminder_sent_at IS NULL
        OR gta.last_reminder_sent_at < CURRENT_DATE
      )
  )
  SELECT * FROM reminders
  WHERE reminder_type IS NOT NULL
  ORDER BY gta.due_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Update Last Reminder Sent
-- ============================================
CREATE OR REPLACE FUNCTION update_last_reminder_sent(p_assignment_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE guide_mandatory_training_assignments
  SET last_reminder_sent_at = NOW()
  WHERE id = p_assignment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON FUNCTION check_mandatory_training_reminders IS 'Get guides who need training reminders (H-7, H-1, or overdue). Called by cron job daily at 08:00.';
COMMENT ON FUNCTION update_last_reminder_sent IS 'Update last_reminder_sent_at timestamp after sending reminder';

-- ============================================
-- CRON JOB SETUP (Manual - Run in Supabase SQL Editor)
-- ============================================
-- Note: This requires pg_cron extension to be enabled
-- Run these commands in Supabase SQL Editor:
--
-- SELECT cron.schedule(
--   'training-reminders-daily',
--   '0 8 * * *', -- Daily at 08:00 UTC
--   $$
--   SELECT check_mandatory_training_reminders();
--   $$
-- );
--
-- To verify cron job:
-- SELECT * FROM cron.job WHERE jobname = 'training-reminders-daily';
--
-- To unschedule:
-- SELECT cron.unschedule('training-reminders-daily');

