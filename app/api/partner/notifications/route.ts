/**
 * API: Partner Notifications
 * GET /api/partner/notifications - Get partner notifications
 * POST /api/partner/notifications/read - Mark as read
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { sanitizeSearchParams, verifyPartnerAccess } from '@/lib/api/partner-helpers';
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

  // Verify partner access
  const { isPartner, partnerId } = await verifyPartnerAccess(user.id);
  if (!isPartner || !partnerId) {
    return NextResponse.json(
      { error: 'User is not a partner' },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const sanitizedParams = sanitizeSearchParams(searchParams);
  const limit = Math.min(parseInt(sanitizedParams.limit || '50'), 100);
  const unreadOnly = sanitizedParams.unreadOnly === 'true';

  const client = supabase as unknown as any;

  try {
    let query = client
      .from('partner_notifications')
      .select('*')
      .eq('partner_id', partnerId) // Use verified partnerId
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

    // Get unread count using verified partnerId
    const { count: unreadCount } = await client
      .from('partner_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('partner_id', partnerId)
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

  // Verify partner access
  const { isPartner, partnerId } = await verifyPartnerAccess(user.id);
  if (!isPartner || !partnerId) {
    return NextResponse.json(
      { error: 'User is not a partner' },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const { notificationId, markAll } = body;

  const client = supabase as unknown as any;

  try {
    if (markAll) {
      // Mark all as read using verified partnerId
      const { error } = await client
        .from('partner_notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('partner_id', partnerId)
        .eq('is_read', false);

      if (error) throw error;

      return NextResponse.json({ success: true });
    } else if (notificationId) {
      // Mark single notification as read using verified partnerId
      const { error } = await client
        .from('partner_notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('id', notificationId)
        .eq('partner_id', partnerId);

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

