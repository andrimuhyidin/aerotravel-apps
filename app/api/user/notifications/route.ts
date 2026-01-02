/**
 * User Notifications API
 * GET /api/user/notifications - Get user notifications
 * PATCH /api/user/notifications - Mark notifications as read
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient, getCurrentUser } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type'); // 'all', 'promo', 'trip', 'system'
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = parseInt(searchParams.get('offset') || '0');

  logger.info('GET /api/user/notifications', { type, limit, offset });

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const supabase = await createClient();

  // Build query
  let query = supabase
    .from('user_notifications')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (type && type !== 'all') {
    query = query.eq('type', type);
  }

  query = query.range(offset, offset + limit - 1);

  const { data: notifications, error, count } = await query;

  if (error) {
    logger.error('Failed to fetch notifications', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }

  // Get unread count
  const { count: unreadCount } = await supabase
    .from('user_notifications')
    .select('id', { count: 'exact' })
    .eq('user_id', user.id)
    .eq('is_read', false);

  return NextResponse.json({
    notifications: (notifications || []).map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      data: n.data,
      isRead: n.is_read,
      actionUrl: n.action_url,
      createdAt: n.created_at,
    })),
    total: count || 0,
    unreadCount: unreadCount || 0,
    hasMore: (count || 0) > offset + limit,
  });
});

export const PATCH = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json();
  const { notificationIds, markAllRead } = body;

  logger.info('PATCH /api/user/notifications', { notificationIds, markAllRead });

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const supabase = await createClient();

  if (markAllRead) {
    // Mark all as read
    const { error } = await supabase
      .from('user_notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (error) {
      logger.error('Failed to mark all as read', error);
      return NextResponse.json(
        { error: 'Failed to update notifications' },
        { status: 500 }
      );
    }
  } else if (notificationIds && Array.isArray(notificationIds)) {
    // Mark specific notifications as read
    const { error } = await supabase
      .from('user_notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .in('id', notificationIds);

    if (error) {
      logger.error('Failed to mark notifications as read', error);
      return NextResponse.json(
        { error: 'Failed to update notifications' },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ success: true });
});

