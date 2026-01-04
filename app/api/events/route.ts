/**
 * API: Event Bus
 * POST /api/events - Emit an event (admin/system only)
 * GET /api/events - Get event history (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { emitEvent, getEventHistory } from '@/lib/events/event-bus';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

import type { AppType, EventType } from '@/lib/events/event-types';

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user is admin or system (for emitting events)
  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const isAdmin =
    userProfile?.role === 'super_admin' ||
    userProfile?.role === 'ops_admin' ||
    userProfile?.role === 'marketing';

  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { type, app, userId, data, metadata } = body;

  // Validate required fields
  if (!type || !app || !userId || !data) {
    return NextResponse.json(
      { error: 'Missing required fields: type, app, userId, data' },
      { status: 400 }
    );
  }

  try {
    // Get IP address and user agent from request
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');
    const userAgent = request.headers.get('user-agent');

    await emitEvent(
      {
        type: type as EventType,
        app: app as AppType,
        userId: userId as string,
        data: data as Record<string, unknown>,
      },
      {
        ipAddress: ipAddress || undefined,
        userAgent: userAgent || undefined,
        correlationId: metadata?.correlationId,
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('[Event API] Failed to emit event', error, { body });
    throw error;
  }
});

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user is admin (for viewing event history)
  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const isAdmin =
    userProfile?.role === 'super_admin' ||
    userProfile?.role === 'ops_admin' ||
    userProfile?.role === 'marketing';

  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const app = searchParams.get('app');
  const userId = searchParams.get('userId');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  try {
    const { events, total } = await getEventHistory({
      eventType: type as EventType | undefined,
      app: app as AppType | undefined,
      userId: userId || undefined,
      limit,
      offset,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });

    return NextResponse.json({
      events,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    logger.error('[Event API] Failed to get event history', error);
    throw error;
  }
});

