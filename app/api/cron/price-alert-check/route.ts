/**
 * CRON: Price Alert Check
 * POST /api/cron/price-alert-check - Check all active price alerts
 * 
 * Run daily to check if any package prices have hit alert thresholds
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

// Verify cron secret for security
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret) {
    logger.warn('CRON_SECRET not configured');
    return false;
  }
  
  return authHeader === `Bearer ${cronSecret}`;
}

export const GET = withErrorHandler(async (request: NextRequest) => {
  // Verify cron authentication
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();
  const client = supabase as unknown as any;

  try {
    // Get all active price alerts with package info
    const { data: alerts, error: alertsError } = await client
      .from('partner_price_alerts')
      .select(`
        id,
        partner_id,
        package_id,
        target_price,
        alert_type,
        package:packages(
          id,
          name,
          prices:package_prices(price_nta)
        ),
        partner:users(
          id,
          full_name,
          email
        )
      `)
      .eq('is_active', true)
      .is('triggered_at', null);

    if (alertsError) {
      logger.error('Failed to fetch active alerts', alertsError);
      throw alertsError;
    }

    if (!alerts || alerts.length === 0) {
      logger.info('No active price alerts to check');
      return NextResponse.json({ processed: 0, triggered: 0 });
    }

    let triggeredCount = 0;

    for (const alert of alerts) {
      const packagePrices = alert.package?.prices;
      if (!packagePrices || packagePrices.length === 0) continue;

      // Get the lowest NTA price
      const currentPrice = Math.min(
        ...packagePrices.map((p: { price_nta: number }) => Number(p.price_nta))
      );

      const targetPrice = Number(alert.target_price);
      let shouldTrigger = false;

      if (alert.alert_type === 'below' && currentPrice <= targetPrice) {
        shouldTrigger = true;
      } else if (alert.alert_type === 'above' && currentPrice >= targetPrice) {
        shouldTrigger = true;
      }

      if (shouldTrigger) {
        // Mark alert as triggered
        await client
          .from('partner_price_alerts')
          .update({ triggered_at: new Date().toISOString() })
          .eq('id', alert.id);

        // Create notification
        try {
          const { createPartnerNotification } = await import('@/lib/partner/notifications');
          await createPartnerNotification(
            alert.partner_id,
            'price_alert',
            'Price Alert Triggered!',
            `${alert.package?.name} is now ${alert.alert_type === 'below' ? 'below' : 'above'} your target price of Rp ${targetPrice.toLocaleString('id-ID')}. Current price: Rp ${currentPrice.toLocaleString('id-ID')}`,
            { packageId: alert.package_id, currentPrice, targetPrice }
          );
        } catch (notifError) {
          logger.warn('Failed to create price alert notification', {
            alertId: alert.id,
            error: notifError instanceof Error ? notifError.message : String(notifError),
          });
        }

        // Send email notification
        try {
          const { sendEmail } = await import('@/lib/integrations/resend');
          if (alert.partner?.email) {
            await sendEmail({
              to: alert.partner.email,
              subject: `🔔 Price Alert: ${alert.package?.name}`,
              html: `
                <h2>Price Alert Triggered!</h2>
                <p>Hi ${alert.partner.full_name},</p>
                <p>The price for <strong>${alert.package?.name}</strong> is now ${alert.alert_type === 'below' ? 'below' : 'above'} your target price.</p>
                <ul>
                  <li>Target Price: Rp ${targetPrice.toLocaleString('id-ID')}</li>
                  <li>Current Price: Rp ${currentPrice.toLocaleString('id-ID')}</li>
                </ul>
                <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/partner/packages/${alert.package_id}">View Package</a></p>
              `,
            });
          }
        } catch (emailError) {
          logger.warn('Failed to send price alert email', {
            alertId: alert.id,
            error: emailError instanceof Error ? emailError.message : String(emailError),
          });
        }

        triggeredCount++;
        logger.info('Price alert triggered', {
          alertId: alert.id,
          partnerId: alert.partner_id,
          packageId: alert.package_id,
          currentPrice,
          targetPrice,
        });
      }
    }

    logger.info('Price alert check completed', {
      processed: alerts.length,
      triggered: triggeredCount,
    });

    return NextResponse.json({
      processed: alerts.length,
      triggered: triggeredCount,
    });
  } catch (error) {
    logger.error('Price alert check failed', error);
    throw error;
  }
});

