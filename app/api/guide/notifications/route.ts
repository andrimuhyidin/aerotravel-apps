/**
 * API: Guide Notifications
 * GET /api/guide/notifications - get notifications for current guide
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext, withBranchFilter } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  // Get notifications for this guide user
  // Note: notification_logs doesn't have branch_id, filter by user_id only
  const { data: notifications, error } = await client
    .from('notification_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    logger.error('Failed to fetch notifications', error, { userId: user.id });
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }

  // Count unread notifications (sent but not read)
  const { count: unreadCount } = await client
    .from('notification_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .in('status', ['sent', 'delivered'])
    .is('read_at', null);

  return NextResponse.json({
    notifications: notifications ?? [],
    unreadCount: unreadCount ?? 0,
    total: notifications?.length ?? 0,
  });
});
