/**
 * API: Mark All Notifications as Read
 * PUT /api/notifications/read-all - Mark all notifications as read
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { markAllNotificationsAsRead } from '@/lib/notifications/unified-notifications';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

import type { AppType } from '@/lib/notifications/notification-types';

export const PUT = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const app = searchParams.get('app') as AppType | null;

  try {
    const success = await markAllNotificationsAsRead(user.id, app || undefined);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to mark all notifications as read' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('[Notification API] Failed to mark all as read', error, {
      userId: user.id,
      app,
    });
    throw error;
  }
});

