/**
 * API: Admin - Scheduled Notification Detail
 * GET /api/admin/notifications/scheduled/[id] - Get notification detail
 * PATCH /api/admin/notifications/scheduled/[id] - Update notification (pause/resume/cancel)
 * DELETE /api/admin/notifications/scheduled/[id] - Delete notification
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { hasRole } from '@/lib/session/active-role';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

type RouteContext = {
  params: Promise<{ id: string }>;
};

const updateNotificationSchema = z.object({
  action: z.enum(['pause', 'resume', 'cancel']).optional(),
  title: z.string().min(3).max(200).optional(),
  message: z.string().min(10).optional(),
  scheduleTime: z.string().optional(),
  status: z.enum(['pending', 'active', 'paused', 'completed', 'cancelled']).optional(),
});

export const GET = withErrorHandler(async (_request: NextRequest, context: RouteContext) => {
  // Check authorization
  const allowed = await hasRole(['super_admin', 'ops_admin', 'marketing']);
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await context.params;
  const supabase = await createAdminClient();

  try {
    const { data: notification, error } = await supabase
      .from('scheduled_notifications')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ notification });
  } catch (error) {
    logger.error('Unexpected error in notification detail API', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

export const PATCH = withErrorHandler(async (request: NextRequest, context: RouteContext) => {
  // Check authorization
  const allowed = await hasRole(['super_admin', 'ops_admin', 'marketing']);
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await context.params;

  // Get current user
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Parse and validate request body
  const body = await request.json();
  const parsed = updateNotificationSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.errors },
      { status: 400 }
    );
  }

  const supabase = await createAdminClient();
  const now = new Date().toISOString();

  try {
    // Get current notification
    const { data: notification, error: fetchError } = await supabase
      .from('scheduled_notifications')
      .select('id, status')
      .eq('id', id)
      .single();

    if (fetchError || !notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    // Handle action-based updates
    const updateData: Record<string, unknown> = {
      updated_at: now,
    };

    if (parsed.data.action) {
      switch (parsed.data.action) {
        case 'pause':
          if (notification.status !== 'active') {
            return NextResponse.json(
              { error: 'Can only pause active notifications' },
              { status: 400 }
            );
          }
          updateData.status = 'paused';
          break;
        case 'resume':
          if (notification.status !== 'paused') {
            return NextResponse.json(
              { error: 'Can only resume paused notifications' },
              { status: 400 }
            );
          }
          updateData.status = 'active';
          break;
        case 'cancel':
          if (['completed', 'cancelled'].includes(notification.status)) {
            return NextResponse.json(
              { error: 'Cannot cancel completed or already cancelled notifications' },
              { status: 400 }
            );
          }
          updateData.status = 'cancelled';
          break;
      }
    }

    // Handle direct field updates
    if (parsed.data.title) updateData.title = parsed.data.title;
    if (parsed.data.message) updateData.message = parsed.data.message;
    if (parsed.data.scheduleTime) {
      updateData.schedule_time = parsed.data.scheduleTime;
      updateData.next_run_at = parsed.data.scheduleTime;
    }
    if (parsed.data.status) updateData.status = parsed.data.status;

    const { error: updateError } = await supabase
      .from('scheduled_notifications')
      .update(updateData)
      .eq('id', id);

    if (updateError) {
      logger.error('Failed to update notification', updateError);
      return NextResponse.json(
        { error: 'Failed to update notification' },
        { status: 500 }
      );
    }

    logger.info('Scheduled notification updated', {
      notificationId: id,
      updatedBy: user.id,
      changes: parsed.data,
    });

    return NextResponse.json({
      success: true,
      message: 'Notification updated',
    });
  } catch (error) {
    logger.error('Unexpected error in update notification', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

export const DELETE = withErrorHandler(async (_request: NextRequest, context: RouteContext) => {
  // Check authorization
  const allowed = await hasRole(['super_admin', 'ops_admin']);
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await context.params;

  // Get current user
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createAdminClient();

  try {
    const { error } = await supabase
      .from('scheduled_notifications')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error('Failed to delete notification', error);
      return NextResponse.json(
        { error: 'Failed to delete notification' },
        { status: 500 }
      );
    }

    logger.info('Scheduled notification deleted', {
      notificationId: id,
      deletedBy: user.id,
    });

    return NextResponse.json({
      success: true,
      message: 'Notification deleted',
    });
  } catch (error) {
    logger.error('Unexpected error in delete notification', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

