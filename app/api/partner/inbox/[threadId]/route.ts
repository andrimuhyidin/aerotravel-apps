/**
 * API: Partner Inbox Thread
 * GET /api/partner/inbox/[threadId] - Get thread with all messages
 * PUT /api/partner/inbox/[threadId]/read - Mark thread as read
 */

import { withErrorHandler } from '@/lib/api/error-handler';
import { verifyPartnerAccess } from '@/lib/api/partner-helpers';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { NextRequest, NextResponse } from 'next/server';

export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) => {
  const { threadId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify partner access using centralized helper
  const { isPartner, partnerId } = await verifyPartnerAccess(user.id);
  if (!isPartner || !partnerId) {
    return NextResponse.json({ error: 'User is not a partner' }, { status: 403 });
  }

  const client = supabase as unknown as any;

  try {
    // Get all messages in thread
    const { data: messages, error } = await client
      .from('partner_inbox_messages')
      .select('*')
      .eq('thread_id', threadId)
      .eq('partner_id', partnerId)
      .order('created_at', { ascending: true });

    if (error) {
      logger.error('Failed to fetch thread', error, { threadId, partnerId });
      return NextResponse.json(
        { error: 'Failed to fetch thread', details: error.message },
        { status: 500 }
      );
    }

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: 'Thread not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ messages: messages || [] });
  } catch (error) {
    logger.error('Failed to fetch thread', error, { userId: user.id });
    throw error;
  }
});

export const PUT = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) => {
  const { threadId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify partner access using centralized helper
  const { isPartner, partnerId } = await verifyPartnerAccess(user.id);
  if (!isPartner || !partnerId) {
    return NextResponse.json({ error: 'User is not a partner' }, { status: 403 });
  }

  const client = supabase as unknown as any;

  try {
    const { action } = await request.json();

    if (action === 'mark-read') {
      // Mark all unread messages in thread as read
      const { error: updateError } = await client
        .from('partner_inbox_messages')
        .update({ is_read: true })
        .eq('thread_id', threadId)
        .eq('partner_id', partnerId)
        .eq('is_read', false)
        .eq('sender_type', 'aero_team');

      if (updateError) {
        logger.error('Failed to mark thread as read', updateError, {
          threadId,
          partnerId,
        });
        return NextResponse.json(
          { error: 'Failed to mark thread as read', details: updateError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    logger.error('Failed to update thread', error, { userId: user.id });
    throw error;
  }
});

