/**
 * API: Partner Notifications
 * GET /api/partner/notifications - Get partner notifications
 * POST /api/partner/notifications/read - Mark as read
 */

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { NextRequest, NextResponse } from 'next/server';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '50');
  const unreadOnly = searchParams.get('unreadOnly') === 'true';

  const client = supabase as unknown as any;

  try {
    let query = client
      .from('partner_notifications')
      .select('*')
      .eq('partner_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data: notifications, error } = await query;

    if (error) {
      logger.error('Failed to fetch notifications', error);
      throw error;
    }

    // Get unread count
    const { count: unreadCount } = await client
      .from('partner_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('partner_id', user.id)
      .eq('is_read', false);

    return NextResponse.json({
      notifications: notifications || [],
      unreadCount: unreadCount || 0,
    });
  } catch (error) {
    logger.error('Failed to get notifications', error, {
      userId: user.id,
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

  const body = await request.json().catch(() => ({}));
  const { notificationId, markAll } = body;

  const client = supabase as unknown as any;

  try {
    if (markAll) {
      // Mark all as read
      const { error } = await client
        .from('partner_notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('partner_id', user.id)
        .eq('is_read', false);

      if (error) throw error;

      return NextResponse.json({ success: true });
    } else if (notificationId) {
      // Mark single notification as read
      const { error } = await client
        .from('partner_notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('id', notificationId)
        .eq('partner_id', user.id);

      if (error) throw error;

      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'notificationId or markAll required' },
        { status: 400 }
      );
    }
  } catch (error) {
    logger.error('Failed to mark notification as read', error, {
      userId: user.id,
    });
    throw error;
  }
});

