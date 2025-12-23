/**
 * Web Push Notifications Helper
 * Uses web-push library for sending push notifications
 */

import { logger } from '@/lib/utils/logger';

// VAPID keys (should be in env)
let vapidPublicKey: string | null = null;
let vapidPrivateKey: string | null = null;

export function getVAPIDKeys() {
  if (!vapidPublicKey || !vapidPrivateKey) {
    vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || null;
    vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || null;
  }
  return { publicKey: vapidPublicKey, privateKey: vapidPrivateKey };
}

/**
 * Send push notification to a subscription
 */
export async function sendPushNotification(
  subscription: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  },
  payload: {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    data?: Record<string, unknown>;
  }
): Promise<boolean> {
  try {
    const { privateKey } = getVAPIDKeys();

    if (!privateKey) {
      logger.warn('VAPID keys not configured, push notifications disabled');
      return false;
    }

    // Dynamic import web-push (optional dependency)

    const webpush = (await import('web-push').catch(() => null)) as
      | typeof import('web-push')
      | null;

    if (!webpush) {
      logger.warn('web-push package not installed');
      return false;
    }

    // Set VAPID details
    webpush.setVapidDetails(
      'mailto:support@aerotravel.co.id',
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
      privateKey
    );

    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/icon-192x192.png',
      badge: payload.badge || '/badge-72x72.png',
      data: payload.data || {},
    });

    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
      },
      notificationPayload
    );

    return true;
  } catch (error) {
    logger.error('Failed to send push notification', error);
    return false;
  }
}

/**
 * Send push notification to all guide subscriptions
 */
export async function sendPushToGuide(
  guideId: string,
  payload: {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    data?: Record<string, unknown>;
  }
): Promise<number> {
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  const client = supabase as any;

  try {
    const { data: subscriptions } = await client
      .from('guide_push_subscriptions')
      .select('endpoint, p256dh_key, auth_key')
      .eq('guide_id', guideId);

    if (!subscriptions || subscriptions.length === 0) {
      return 0;
    }

    let successCount = 0;
    for (const sub of subscriptions) {
      const success = await sendPushNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh_key,
            auth: sub.auth_key,
          },
        },
        payload
      );
      if (success) successCount++;
    }

    return successCount;
  } catch (error) {
    logger.error('Failed to send push to guide', error, { guideId });
    return 0;
  }
}
