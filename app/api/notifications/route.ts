/**
 * API: Unified Notifications
 * GET /api/notifications - Get unified notifications
 * POST /api/notifications - Create notification (admin/system only)
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import {
  createNotification,
  getNotifications,
  getUnreadCount,
} from '@/lib/notifications/unified-notifications';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

import type { CreateNotificationInput, NotificationFilter } from '@/lib/notifications/notification-types';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const app = searchParams.get('app') as 'customer' | 'partner' | 'guide' | 'admin' | 'corporate' | null;
  const type = searchParams.get('type');
  const read = searchParams.get('read');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  const filter: NotificationFilter = {
    limit,
    offset,
  };

  if (app) {
    filter.app = app;
  }

  if (type) {
    filter.type = type as any;
  }

  if (read !== null) {
    filter.read = read === 'true';
  }

  try {
    const { notifications, total } = await getNotifications(user.id, filter);
    const unreadCount = await getUnreadCount(user.id, app || undefined);

    return NextResponse.json({
      notifications,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
      unreadCount,
    });
  } catch (error) {
    logger.error('[Notification API] Failed to get notifications', error, {
      userId: user.id,
      filter,
    });
    throw error;
  }
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user is admin or system (for creating notifications)
  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const isAdmin = userProfile?.role === 'super_admin' || userProfile?.role === 'ops_admin';

  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const input: CreateNotificationInput = {
    user_id: body.user_id || user.id,
    app: body.app,
    type: body.type,
    title: body.title,
    message: body.message,
    metadata: body.metadata || {},
  };

  // Validate required fields
  if (!input.app || !input.type || !input.title || !input.message) {
    return NextResponse.json(
      { error: 'Missing required fields: app, type, title, message' },
      { status: 400 }
    );
  }

  try {
    const notification = await createNotification(input);

    if (!notification) {
      return NextResponse.json(
        { error: 'Failed to create notification' },
        { status: 500 }
      );
    }

    return NextResponse.json({ notification }, { status: 201 });
  } catch (error) {
    logger.error('[Notification API] Failed to create notification', error, { input });
    throw error;
  }
});

