/**
 * API: Mark Notification as Read
 * PUT /api/notifications/[id]/read - Mark notification as read
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { markNotificationAsRead } from '@/lib/notifications/unified-notifications';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

type Params = Promise<{ id: string }>;

export const PUT = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Params }
) => {
  const { id: notificationId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const success = await markNotificationAsRead(notificationId, user.id);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to mark notification as read' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('[Notification API] Failed to mark as read', error, {
      notificationId,
      userId: user.id,
    });
    throw error;
  }
});

