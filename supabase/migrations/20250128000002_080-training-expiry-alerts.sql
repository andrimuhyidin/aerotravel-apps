-- Migration: 080-training-expiry-alerts.sql
-- Description: Training H-30 Expiry Alerts - Daily cron job to check and notify expiring certifications
-- Created: 2025-01-28

-- ============================================
-- FUNCTION: Check and Send Expiry Alerts
-- ============================================
CREATE OR REPLACE FUNCTION check_expiring_certifications()
RETURNS void AS $$
DECLARE
  expiring_cert RECORD;
  guide_record RECORD;
  notification_count INTEGER := 0;
BEGIN
  -- Get all certifications expiring in 30 days
  FOR expiring_cert IN
    SELECT 
      gct.guide_id,
      gct.certification_type,
      gct.certification_name,
      gct.expiry_date,
      (gct.expiry_date - CURRENT_DATE)::INTEGER AS days_until_expiry,
      u.full_name,
      u.email,
      u.phone
    FROM guide_certifications_tracker gct
    INNER JOIN users u ON u.id = gct.guide_id
    WHERE gct.status = 'verified'
      AND gct.is_active = true
      AND gct.expiry_date >= CURRENT_DATE
      AND gct.expiry_date <= CURRENT_DATE + INTERVAL '30 days'
      -- Only send notification if not already sent today
      AND NOT EXISTS (
        SELECT 1 FROM notification_logs nl
        WHERE nl.user_id = gct.guide_id
          AND nl.entity_type = 'certification_expiry'
          AND nl.entity_id = gct.id::TEXT
          AND nl.sent_at::DATE = CURRENT_DATE
      )
  LOOP
    -- Create notification record
    INSERT INTO notification_logs (
      user_id,
      channel,
      entity_type,
      entity_id,
      subject,
      body,
      status,
      sent_at
    ) VALUES (
      expiring_cert.guide_id,
      'push',
      'certification_expiry',
      (SELECT id::TEXT FROM guide_certifications_tracker 
       WHERE guide_id = expiring_cert.guide_id 
       AND certification_type = expiring_cert.certification_type
       AND expiry_date = expiring_cert.expiry_date
       LIMIT 1),
      'Peringatan: Sertifikat Akan Berakhir',
      format(
        'Sertifikat %s Anda akan berakhir dalam %s hari (berakhir: %s). Silakan perpanjang segera.',
        expiring_cert.certification_name,
        expiring_cert.days_until_expiry,
        to_char(expiring_cert.expiry_date, 'DD/MM/YYYY')
      ),
      'pending',
      NOW()
    );

    notification_count := notification_count + 1;
  END LOOP;

  -- Log the result
  RAISE NOTICE 'Checked expiring certifications: % notifications created', notification_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PG_CRON JOB: Daily Check at 9 AM
-- ============================================
-- Note: pg_cron extension must be enabled in Supabase
-- This will run daily at 9 AM Jakarta time (UTC+7 = 2 AM UTC)
SELECT cron.schedule(
  'check-expiring-certs-daily',
  '0 2 * * *', -- 2 AM UTC = 9 AM WIB
  $$SELECT check_expiring_certifications()$$
);

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON FUNCTION check_expiring_certifications IS 'Check certifications expiring in 30 days and create notification records';
COMMENT ON TABLE notification_logs IS 'Notification logs for expiry alerts and other notifications';

