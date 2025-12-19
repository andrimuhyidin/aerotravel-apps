/**
 * API: Web Push Subscription
 * POST /api/guide/push/subscribe - Subscribe to push notifications
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = subscribeSchema.parse(await request.json());
  const client = supabase as unknown as any;

  // Store subscription in database (create table if needed)
  // For now, store in a simple table
  const { error } = await client
    .from('guide_push_subscriptions')
    .upsert({
      guide_id: user.id,
      endpoint: payload.endpoint,
      p256dh_key: payload.keys.p256dh,
      auth_key: payload.keys.auth,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'guide_id,endpoint',
    })
    .catch(async () => {
      // Table might not exist, create it first
      await client.query(`
        CREATE TABLE IF NOT EXISTS guide_push_subscriptions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          guide_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          endpoint TEXT NOT NULL,
          p256dh_key TEXT NOT NULL,
          auth_key TEXT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(guide_id, endpoint)
        );
      `).catch(() => {
        // Ignore if already exists
      });
      
      // Retry insert
      return client
        .from('guide_push_subscriptions')
        .upsert({
          guide_id: user.id,
          endpoint: payload.endpoint,
          p256dh_key: payload.keys.p256dh,
          auth_key: payload.keys.auth,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'guide_id,endpoint',
        });
    });

  if (error) {
    logger.error('Failed to save push subscription', error, { guideId: user.id });
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
});

