-- Migration: 031-trip-confirmation-cron.sql
-- Description: Cron job untuk auto-reassign expired trip assignments
-- Created: 2025-12-20

-- ============================================
-- ENABLE PG_CRON EXTENSION (if not exists)
-- ============================================
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================
-- CRON JOB: Auto-Reassign Expired Assignments
-- ============================================
-- Run every 15 minutes to check for expired assignments
-- Calls the API endpoint via HTTP

-- Note: This requires Supabase Edge Function or external cron service
-- For now, we'll create a SQL function that can be called manually or via cron

-- Function to mark expired assignments (called by cron)
CREATE OR REPLACE FUNCTION process_expired_trip_assignments()
RETURNS TABLE(
  processed_count INTEGER,
  trip_ids UUID[]
) AS $$
DECLARE
  v_expired_record RECORD;
  v_processed_count INTEGER := 0;
  v_trip_ids UUID[] := ARRAY[]::UUID[];
BEGIN
  -- Mark expired assignments (actual reassignment handled by API)
  FOR v_expired_record IN
    SELECT 
      tg.id,
      tg.trip_id,
      tg.guide_id
    FROM trip_guides tg
    JOIN trips t ON t.id = tg.trip_id
    WHERE tg.assignment_status = 'pending_confirmation'
      AND tg.confirmation_deadline < NOW()
      AND t.status IN ('scheduled', 'confirmed')
    ORDER BY tg.confirmation_deadline ASC
    LIMIT 50
  LOOP
    -- Mark as expired (API will handle reassignment)
    UPDATE trip_guides
    SET assignment_status = 'expired',
        auto_reassigned_at = NOW()
    WHERE id = v_expired_record.id
      AND assignment_status = 'pending_confirmation'; -- Double check to avoid race condition
    
    v_processed_count := v_processed_count + 1;
    v_trip_ids := array_append(v_trip_ids, v_expired_record.trip_id);
  END LOOP;
  
  RETURN QUERY SELECT v_processed_count, v_trip_ids;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- CRON JOB SCHEDULE
-- ============================================
-- Schedule job to run every 15 minutes
-- Note: Uncomment and adjust URL when ready to use
/*
SELECT cron.schedule(
  'auto-reassign-expired-trips',
  '*/15 * * * *', -- Every 15 minutes
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/reassign-expired-trips',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  );
  $$
);
*/

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON FUNCTION process_expired_trip_assignments() IS 
  'Marks expired trip assignments. Actual reassignment is handled by API endpoint /api/admin/trips/reassign-expired';
