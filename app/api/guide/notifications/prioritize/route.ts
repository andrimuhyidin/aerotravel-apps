/**
 * API: Smart Notification Prioritization
 * POST /api/guide/notifications/prioritize
 * 
 * Priority scoring, smart grouping, action suggestions
 * Rate Limited: 10 requests per minute per user
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { groupNotifications, prioritizeNotifications } from '@/lib/ai/notification-prioritizer';
import { withErrorHandler } from '@/lib/api/error-handler';
import { checkGuideRateLimit, createRateLimitHeaders, guideAiRateLimit } from '@/lib/rate-limit/guide-limits';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const prioritizeSchema = z.object({
  notificationIds: z.array(z.string()).optional(), // If provided, prioritize specific notifications
  group: z.boolean().default(false), // Whether to return grouped
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate limit check
  const rateLimit = await checkGuideRateLimit(guideAiRateLimit, user.id, 'prioritas notifikasi');
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: rateLimit.error },
      { status: 429, headers: createRateLimitHeaders(rateLimit.remaining, rateLimit.reset) }
    );
  }

  const payload = prioritizeSchema.parse(await request.json());
  const client = supabase as unknown as any;

  try {
    // Fetch notifications
    let query = client
      .from('guide_notifications')
      .select('id, type, title, message, created_at, read, metadata')
      .eq('guide_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (payload.notificationIds && payload.notificationIds.length > 0) {
      query = query.in('id', payload.notificationIds);
    }

    const { data: notifications } = await query;

    if (!notifications || notifications.length === 0) {
      return NextResponse.json({
        prioritized: [],
        grouped: {},
      });
    }

    // Get active trip for context
    const { data: activeTrip } = await client
      .from('trip_guides')
      .select('trip_id')
      .eq('guide_id', user.id)
      .eq('assignment_status', 'confirmed')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Prioritize
    const prioritized = await prioritizeNotifications(
      notifications.map((n: any) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        createdAt: n.created_at,
        read: n.read,
        metadata: n.metadata,
      })),
      {
        activeTripId: activeTrip?.trip_id,
        currentTime: new Date().toISOString(),
      }
    );

    // Group if requested
    let grouped = {};
    if (payload.group) {
      grouped = await groupNotifications(prioritized);
    }

    return NextResponse.json({
      prioritized,
      grouped,
    });
  } catch (error) {
    logger.error('Failed to prioritize notifications', error, {
      guideId: user.id,
    });
    return NextResponse.json(
      { error: 'Gagal memprioritaskan notifikasi' },
      { status: 500 }
    );
  }
});
