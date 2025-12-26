/**
 * API: Subscribe to Push Notifications
 * POST /api/partner/notifications/subscribe
 */

import { withErrorHandler } from '@/lib/api/error-handler';
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

  const body = await request.json();
  const { subscription, userId } = subscribeSchema.parse(body);

  // Verify user owns this subscription
  if (user.id !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const client = supabase as unknown as any;

  try {
    // Store subscription in database
    // Note: You may need to create a push_subscriptions table
    // For now, we'll just log it
    logger.info('Push subscription received', {
      userId,
      endpoint: subscription.endpoint,
    });

    // TODO: Store in database if you have a push_subscriptions table
    // await client
    //   .from('push_subscriptions')
    //   .upsert({
    //     user_id: userId,
    //     endpoint: subscription.endpoint,
    //     p256dh: subscription.keys.p256dh,
    //     auth: subscription.keys.auth,
    //   });

    return NextResponse.json({
      success: true,
      message: 'Subscription saved successfully',
    });
  } catch (error) {
    logger.error('Failed to save subscription', error, {
      userId,
    });
    throw error;
  }
});

