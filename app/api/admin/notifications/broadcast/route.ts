/**
 * API: Admin - Broadcast Notifications
 * GET /api/admin/notifications/broadcast - List broadcast notifications
 * POST /api/admin/notifications/broadcast - Create & send broadcast
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { hasRole } from '@/lib/session/active-role';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { sendBroadcast } from '@/lib/notifications/broadcast-sender';
import { logger } from '@/lib/utils/logger';

const createBroadcastSchema = z.object({
  title: z.string().min(3).max(200),
  message: z.string().min(10).max(5000),
  targetRoles: z.array(z.string()).min(1),
  targetBranches: z.array(z.string().uuid()).optional(),
  deliveryMethods: z.array(z.enum(['in_app', 'email', 'push', 'sms', 'whatsapp'])).min(1),
  scheduledFor: z.string().datetime().optional(),
  sendNow: z.boolean().default(true),
});

export const GET = withErrorHandler(async (request: NextRequest) => {
  // Check authorization
  const allowed = await hasRole(['super_admin', 'ops_admin', 'marketing']);
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const supabase = await createAdminClient();
  const { searchParams } = new URL(request.url);

  const status = searchParams.get('status') || 'all';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const offset = (page - 1) * limit;

  try {
    let query = supabase
      .from('broadcast_notifications')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: broadcasts, error, count } = await query;

    if (error) {
      logger.error('Failed to fetch broadcast notifications', error);
      return NextResponse.json(
        { error: 'Failed to fetch broadcasts' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      broadcasts: broadcasts || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    logger.error('Unexpected error in broadcasts API', error);
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
  const parsed = createBroadcastSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.errors },
      { status: 400 }
    );
  }

  const {
    title,
    message,
    targetRoles,
    targetBranches,
    deliveryMethods,
    scheduledFor,
    sendNow,
  } = parsed.data;

  const supabase = await createAdminClient();

  try {
    // Create broadcast record
    const { data: broadcast, error: createError } = await supabase
      .from('broadcast_notifications')
      .insert({
        title,
        message,
        sent_by: user.id,
        target_roles: targetRoles,
        target_branches: targetBranches || null,
        delivery_method: deliveryMethods,
        scheduled_for: scheduledFor || null,
        status: sendNow ? 'sending' : 'scheduled',
      })
      .select('id')
      .single();

    if (createError || !broadcast) {
      logger.error('Failed to create broadcast', createError);
      return NextResponse.json(
        { error: 'Failed to create broadcast' },
        { status: 500 }
      );
    }

    // Send immediately if requested
    if (sendNow) {
      // Send in background
      const sendResult = await sendBroadcast({
        id: broadcast.id,
        title,
        message,
        targetRoles,
        targetBranches,
        deliveryMethods,
      });

      logger.info('Broadcast sent', {
        broadcastId: broadcast.id,
        ...sendResult,
      });

      return NextResponse.json({
        success: true,
        message: `Broadcast sent to ${sendResult.totalRecipients} recipients`,
        broadcast: {
          id: broadcast.id,
          ...sendResult,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Broadcast scheduled successfully',
      broadcast: {
        id: broadcast.id,
        scheduledFor,
      },
    });
  } catch (error) {
    logger.error('Unexpected error in create broadcast', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

