/**
 * Cron Job: License Expiry Check
 * Schedule: Daily at 00:00 (midnight)
 * Purpose: Check license expiry and send alerts
 */

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { sendLicenseExpiryAlert } from '@/lib/notifications/email-alerts';

export async function checkLicenseExpiry() {
  logger.info('[CRON] Starting license expiry check');

  const supabase = await createClient();
  const today = new Date();
  
  try {
    // Get all active licenses
    const { data: licenses, error } = await supabase
      .from('business_licenses')
      .select('*')
      .eq('status', 'valid')
      .not('expiry_date', 'is', null);

    if (error) {
      logger.error('[CRON] Failed to fetch licenses', error);
      return { success: false, error: error.message };
    }

    let alertsSent = 0;
    let errors = 0;

    for (const license of licenses || []) {
      const expiryDate = new Date(license.expiry_date);
      const daysUntilExpiry = Math.ceil(
        (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Check if we need to send alert
      const shouldAlert = 
        (daysUntilExpiry === 30 && !license.reminder_30d_sent) ||
        (daysUntilExpiry === 15 && !license.reminder_15d_sent) ||
        (daysUntilExpiry === 7 && !license.reminder_7d_sent) ||
        (daysUntilExpiry === 1 && !license.reminder_1d_sent);

      if (shouldAlert) {
        try {
          // Send alert
          await sendLicenseExpiryAlert({
            licenseType: license.license_type,
            licenseName: license.license_name,
            licenseNumber: license.license_number,
            expiryDate: license.expiry_date,
            daysUntilExpiry,
          });

          // Update reminder flag
          const updateField = 
            daysUntilExpiry === 30 ? 'reminder_30d_sent' :
            daysUntilExpiry === 15 ? 'reminder_15d_sent' :
            daysUntilExpiry === 7 ? 'reminder_7d_sent' :
            'reminder_1d_sent';

          await supabase
            .from('business_licenses')
            .update({ [updateField]: true })
            .eq('id', license.id);

          alertsSent++;
          logger.info('[CRON] License alert sent', {
            licenseType: license.license_type,
            daysUntilExpiry,
          });
        } catch (alertError) {
          logger.error('[CRON] Failed to send license alert', alertError, {
            licenseId: license.id,
          });
          errors++;
        }
      }

      // Update status if expired
      if (daysUntilExpiry < 0) {
        await supabase
          .from('business_licenses')
          .update({ status: 'expired' })
          .eq('id', license.id);

        logger.warn('[CRON] License marked as expired', {
          licenseType: license.license_type,
          licenseNumber: license.license_number,
        });
      }
    }

    logger.info('[CRON] License expiry check completed', {
      totalLicenses: licenses?.length || 0,
      alertsSent,
      errors,
    });

    return { success: true, alertsSent, errors };
  } catch (error) {
    logger.error('[CRON] Fatal error in license expiry check', error);
    return { success: false, error: String(error) };
  }
}

