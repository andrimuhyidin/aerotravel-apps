/**
 * API: Web Push Unsubscribe
 * POST /api/guide/push/unsubscribe - Unsubscribe from push notifications
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const unsubscribeSchema = z.object({
  endpoint: z.string().url(),
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = unsubscribeSchema.parse(await request.json());
  const client = supabase as unknown as any;

  const { error } = await client
    .from('guide_push_subscriptions')
    .delete()
    .eq('guide_id', user.id)
    .eq('endpoint', payload.endpoint);

  if (error) {
    logger.error('Failed to unsubscribe', error, { guideId: user.id });
    return NextResponse.json({ error: 'Failed to unsubscribe' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
});

