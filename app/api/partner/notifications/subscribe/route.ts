/**
 * API: Subscribe to Push Notifications
 * POST /api/partner/notifications/subscribe
 */

import { withErrorHandler } from '@/lib/api/error-handler';
import { verifyPartnerAccess } from '@/lib/api/partner-helpers';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const subscribeSchema = z.object({
  subscription: z.object({
    endpoint: z.string(),
    keys: z.object({
      p256dh: z.string(),
      auth: z.string(),
    }),
  }),
  userId: z.string().uuid(),
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify partner access
  const { isPartner, partnerId } = await verifyPartnerAccess(user.id);
  if (!isPartner) {
    return NextResponse.json({ error: 'Partner access required' }, { status: 403 });
  }

  const body = await request.json();
  const { subscription, userId } = subscribeSchema.parse(body);

  // Verify user owns this subscription
  if (user.id !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const client = supabase as unknown as any;

  // Get user agent for device detection
  const userAgent = request.headers.get('user-agent') || undefined;
  const deviceType = detectDeviceType(userAgent);

  try {
    // Store subscription in database using upsert
    const { error: upsertError } = await client
      .from('partner_push_subscriptions')
      .upsert(
        {
          user_id: userId,
          partner_id: partnerId,
          endpoint: subscription.endpoint,
          p256dh_key: subscription.keys.p256dh,
          auth_key: subscription.keys.auth,
          user_agent: userAgent,
          device_type: deviceType,
          is_active: true,
          last_used_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,endpoint',
          ignoreDuplicates: false,
        }
      );

    if (upsertError) {
      // If table doesn't exist yet, log and return success (graceful degradation)
      if (upsertError.code === '42P01') {
        logger.warn('partner_push_subscriptions table not found, subscription not saved', {
          userId,
          endpoint: subscription.endpoint,
        });
        return NextResponse.json({
          success: true,
          message: 'Subscription registered (pending database setup)',
          persisted: false,
        });
      }

      logger.error('Failed to save push subscription', { error: upsertError, userId });
      throw upsertError;
    }

    logger.info('Push subscription saved', {
      userId,
      partnerId,
      endpoint: subscription.endpoint.substring(0, 50) + '...',
      deviceType,
    });

    return NextResponse.json({
      success: true,
      message: 'Subscription saved successfully',
      persisted: true,
    });
  } catch (error) {
    logger.error('Failed to save subscription', error, {
      userId,
    });
    throw error;
  }
});

/**
 * Detect device type from user agent
 */
function detectDeviceType(userAgent?: string): string {
  if (!userAgent) return 'unknown';

  const ua = userAgent.toLowerCase();

  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    return 'mobile';
  }

  if (ua.includes('ipad') || ua.includes('tablet')) {
    return 'tablet';
  }

  return 'desktop';
}
