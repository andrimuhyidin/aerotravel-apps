/**
 * Cron Job: Certification Expiry Check
 * Schedule: Daily at 01:00 (1 AM)
 * Purpose: Check guide certification expiry and send alerts
 */

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { sendCertificationExpiryAlert } from '@/lib/notifications/email-alerts';

export async function checkCertificationExpiry() {
  logger.info('[CRON] Starting certification expiry check');

  const supabase = await createClient();
  const today = new Date();
  
  try {
    // Get all active certifications
    const { data: certifications, error } = await supabase
      .from('guide_certifications_tracker')
      .select(`
        *,
        users!inner (
          id,
          full_name,
          email,
          phone
        )
      `)
      .eq('is_active', true)
      .eq('status', 'verified')
      .not('expiry_date', 'is', null);

    if (error) {
      logger.error('[CRON] Failed to fetch certifications', error);
      return { success: false, error: error.message };
    }

    let alertsSent = 0;
    let expired = 0;
    let errors = 0;

    for (const cert of certifications || []) {
      const expiryDate = new Date(cert.expiry_date);
      const daysUntilExpiry = Math.ceil(
        (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Send alerts at 60, 30, 15, 7 days before expiry
      if ([60, 30, 15, 7].includes(daysUntilExpiry)) {
        try {
          const guide = cert.users as unknown as {
            full_name: string;
            email: string;
            phone: string;
          };

          await sendCertificationExpiryAlert({
            guideName: guide.full_name,
            guideEmail: guide.email,
            guidePhone: guide.phone,
            certificationType: cert.certification_type,
            certificationName: cert.certification_name,
            expiryDate: cert.expiry_date,
            daysUntilExpiry,
          });

          alertsSent++;
          logger.info('[CRON] Certification alert sent', {
            guideId: cert.guide_id,
            certificationType: cert.certification_type,
            daysUntilExpiry,
          });
        } catch (alertError) {
          logger.error('[CRON] Failed to send certification alert', alertError, {
            certificationId: cert.id,
          });
          errors++;
        }
      }

      // Mark as expired if past expiry date
      if (daysUntilExpiry < 0) {
        await supabase
          .from('guide_certifications_tracker')
          .update({ status: 'expired' })
          .eq('id', cert.id);

        expired++;
        logger.warn('[CRON] Certification marked as expired', {
          guideId: cert.guide_id,
          certificationType: cert.certification_type,
        });
      }
    }

    logger.info('[CRON] Certification expiry check completed', {
      totalCertifications: certifications?.length || 0,
      alertsSent,
      expired,
      errors,
    });

    return { success: true, alertsSent, expired, errors };
  } catch (error) {
    logger.error('[CRON] Fatal error in certification expiry check', error);
    return { success: false, error: String(error) };
  }
}

