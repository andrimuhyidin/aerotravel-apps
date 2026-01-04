/**
 * API: Admin - Scheduled Notifications
 * GET /api/admin/notifications/scheduled - List scheduled notifications
 * POST /api/admin/notifications/scheduled - Create scheduled notification
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { hasRole } from '@/lib/session/active-role';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const createScheduledNotificationSchema = z.object({
  notificationType: z.enum(['reminder', 'follow_up', 'birthday', 'anniversary', 'custom']),
  recipientId: z.string().uuid().optional(),
  recipientRole: z.string().optional(),
  recipientFilter: z.record(z.unknown()).optional(),
  title: z.string().min(3).max(200),
  message: z.string().min(10),
  deliveryMethod: z.enum(['in_app', 'email', 'push', 'sms', 'whatsapp']),
  scheduleTime: z.string(), // ISO date string
  repeatPattern: z.enum(['once', 'daily', 'weekly', 'monthly', 'yearly']).optional(),
  repeatUntil: z.string().optional(),
  maxRuns: z.number().int().positive().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const GET = withErrorHandler(async (request: NextRequest) => {
  // Check authorization
  const allowed = await hasRole(['super_admin', 'ops_admin', 'marketing']);
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const supabase = await createAdminClient();
  const { searchParams } = new URL(request.url);

  const status = searchParams.get('status');
  const notificationType = searchParams.get('type');
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const offset = (page - 1) * limit;

  try {
    let query = supabase
      .from('scheduled_notifications')
      .select(`
        id,
        notification_type,
        recipient_id,
        recipient_role,
        title,
        message,
        delivery_method,
        schedule_time,
        repeat_pattern,
        repeat_until,
        next_run_at,
        run_count,
        max_runs,
        status,
        created_by,
        created_at,
        updated_at
      `, { count: 'exact' })
      .order('schedule_time', { ascending: true })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    if (notificationType) {
      query = query.eq('notification_type', notificationType);
    }

    const { data: notifications, error, count } = await query;

    if (error) {
      logger.error('Failed to fetch scheduled notifications', error);
      return NextResponse.json(
        { error: 'Failed to fetch notifications' },
        { status: 500 }
      );
    }

    // Get creator names
    const creatorIds = [...new Set((notifications || []).map(n => n.created_by).filter(Boolean))];
    let creatorsMap: Record<string, string> = {};
    
    if (creatorIds.length > 0) {
      const { data: creators } = await supabase
        .from('users')
        .select('id, full_name, email')
        .in('id', creatorIds);
      
      if (creators) {
        creatorsMap = Object.fromEntries(
          creators.map(c => [c.id, c.full_name || c.email])
        );
      }
    }

    const mappedNotifications = (notifications || []).map(n => ({
      ...n,
      created_by_name: n.created_by ? creatorsMap[n.created_by] || 'Unknown' : 'System',
    }));

    return NextResponse.json({
      notifications: mappedNotifications,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    logger.error('Unexpected error in scheduled notifications API', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  // Check authorization
  const allowed = await hasRole(['super_admin', 'ops_admin', 'marketing']);
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Get current user
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Parse and validate request body
  const body = await request.json();
  const parsed = createScheduledNotificationSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.errors },
      { status: 400 }
    );
  }

  const {
    notificationType,
    recipientId,
    recipientRole,
    recipientFilter,
    title,
    message,
    deliveryMethod,
    scheduleTime,
    repeatPattern,
    repeatUntil,
    maxRuns,
    metadata,
  } = parsed.data;

  const supabase = await createAdminClient();
  const scheduleDate = new Date(scheduleTime);

  // Validate schedule time is in the future
  if (scheduleDate <= new Date()) {
    return NextResponse.json(
      { error: 'Schedule time must be in the future' },
      { status: 400 }
    );
  }

  try {
    const { data: notification, error: createError } = await supabase
      .from('scheduled_notifications')
      .insert({
        notification_type: notificationType,
        recipient_id: recipientId || null,
        recipient_role: recipientRole || null,
        recipient_filter: recipientFilter || null,
        title,
        message,
        delivery_method: deliveryMethod,
        schedule_time: scheduleTime,
        repeat_pattern: repeatPattern || 'once',
        repeat_until: repeatUntil || null,
        next_run_at: scheduleTime,
        max_runs: maxRuns || null,
        status: 'pending',
        metadata: metadata || null,
        created_by: user.id,
      })
      .select('id, title, schedule_time')
      .single();

    if (createError) {
      logger.error('Failed to create scheduled notification', createError);
      return NextResponse.json(
        { error: 'Failed to create notification' },
        { status: 500 }
      );
    }

    logger.info('Scheduled notification created', {
      notificationId: notification?.id,
      title,
      scheduleTime,
      createdBy: user.id,
    });

    return NextResponse.json({
      success: true,
      message: 'Notifikasi berhasil dijadwalkan',
      notification,
    });
  } catch (error) {
    logger.error('Unexpected error in create scheduled notification', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

