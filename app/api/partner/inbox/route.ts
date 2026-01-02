/**
 * API: Partner Inbox
 * GET /api/partner/inbox - List inbox threads/messages
 * POST /api/partner/inbox - Create new message/thread
 */

import { withErrorHandler } from '@/lib/api/error-handler';
import { verifyPartnerAccess, sanitizeRequestBody, sanitizeSearchParams } from '@/lib/api/partner-helpers';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const createMessageSchema = z.object({
  subject: z.string().optional(),
  messageText: z.string().min(1),
  parentMessageId: z.string().uuid().optional(),
  category: z.string().optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  attachments: z.array(z.string()).optional(),
});

export const GET = withErrorHandler(async (request: NextRequest) => {
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
    // Sanitize search params
    const searchParams = sanitizeSearchParams(request);
    const view = searchParams.get('view') || 'threads'; // 'threads' or 'all'
    const category = searchParams.get('category');
    const priority = searchParams.get('priority');
    const isRead = searchParams.get('isRead');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = (page - 1) * limit;

    if (view === 'threads') {
      // Get unique threads (root messages)
      let threadsQuery = client
        .from('partner_inbox_messages')
        .select('*')
        .eq('partner_id', partnerId)
        .is('parent_message_id', null)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (category) {
        threadsQuery = threadsQuery.eq('category', category);
      }
      if (priority) {
        threadsQuery = threadsQuery.eq('priority', priority);
      }

      const { data: threads, error: threadsError } = await threadsQuery;

      if (threadsError) {
        logger.error('Failed to fetch inbox threads', threadsError, {
          partnerId,
        });
        return NextResponse.json(
          { error: 'Failed to fetch threads', details: threadsError.message },
          { status: 500 }
        );
      }

      // Get unread count for each thread
      const threadsWithUnread = await Promise.all(
        (threads || []).map(async (thread) => {
          const { count } = await client
            .from('partner_inbox_messages')
            .select('*', { count: 'exact', head: true })
            .eq('thread_id', thread.thread_id)
            .eq('is_read', false)
            .eq('sender_type', 'aero_team');

          return {
            ...thread,
            unreadCount: count || 0,
          };
        })
      );

      // Get total count
      let countQuery = client
        .from('partner_inbox_messages')
        .select('*', { count: 'exact', head: true })
        .eq('partner_id', partnerId)
        .is('parent_message_id', null);

      if (category) {
        countQuery = countQuery.eq('category', category);
      }
      if (priority) {
        countQuery = countQuery.eq('priority', priority);
      }

      const { count } = await countQuery;

      return NextResponse.json({
        threads: threadsWithUnread,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      });
    } else {
      // Get all messages
      let messagesQuery = client
        .from('partner_inbox_messages')
        .select('*')
        .eq('partner_id', partnerId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (category) {
        messagesQuery = messagesQuery.eq('category', category);
      }
      if (priority) {
        messagesQuery = messagesQuery.eq('priority', priority);
      }
      if (isRead !== null && isRead !== undefined) {
        messagesQuery = messagesQuery.eq('is_read', isRead === 'true');
      }

      const { data: messages, error: messagesError } = await messagesQuery;

      if (messagesError) {
        logger.error('Failed to fetch inbox messages', messagesError, {
          partnerId,
        });
        return NextResponse.json(
          { error: 'Failed to fetch messages', details: messagesError.message },
          { status: 500 }
        );
      }

      // Get total count
      let countQuery = client
        .from('partner_inbox_messages')
        .select('*', { count: 'exact', head: true })
        .eq('partner_id', partnerId);

      if (category) {
        countQuery = countQuery.eq('category', category);
      }
      if (priority) {
        countQuery = countQuery.eq('priority', priority);
      }
      if (isRead !== null && isRead !== undefined) {
        countQuery = countQuery.eq('is_read', isRead === 'true');
      }

      const { count } = await countQuery;

      return NextResponse.json({
        messages: messages || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      });
    }
  } catch (error) {
    logger.error('Failed to fetch inbox', error, { userId: user.id });
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

  // Verify partner access using centralized helper
  const { isPartner, partnerId } = await verifyPartnerAccess(user.id);
  if (!isPartner || !partnerId) {
    return NextResponse.json({ error: 'User is not a partner' }, { status: 403 });
  }

  const client = supabase as unknown as any;

  try {
    const payload = await request.json();
    
    // Sanitize input
    const sanitizedPayload = sanitizeRequestBody(payload, {
      strings: ['subject', 'messageText', 'category'],
    });
    
    const validated = createMessageSchema.parse(sanitizedPayload);

    // Get user name for sender_name
    const { data: userProfile } = await client
      .from('users')
      .select('full_name, company_name')
      .eq('id', user.id)
      .single();

    const senderName =
      userProfile?.full_name || userProfile?.company_name || 'Partner';

    // If parent_message_id is provided, get thread_id from parent
    let threadId: string | null = null;
    if (validated.parentMessageId) {
      const { data: parentMessage } = await client
        .from('partner_inbox_messages')
        .select('thread_id')
        .eq('id', validated.parentMessageId)
        .single();

      if (parentMessage) {
        threadId = parentMessage.thread_id;
      }
    }

    // Insert message
    const { data: message, error: insertError } = await client
      .from('partner_inbox_messages')
      .insert({
        partner_id: partnerId,
        thread_id: threadId,
        parent_message_id: validated.parentMessageId || null,
        subject: validated.subject || null,
        message_text: validated.messageText,
        sender_id: user.id,
        sender_type: 'partner',
        sender_name: senderName,
        category: validated.category || null,
        priority: validated.priority || 'normal',
        attachments: validated.attachments || [],
      })
      .select()
      .single();

    if (insertError) {
      logger.error('Failed to create inbox message', insertError, {
        partnerId,
        userId: user.id,
      });
      return NextResponse.json(
        { error: 'Failed to create message', details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }
    logger.error('Failed to create inbox message', error, { userId: user.id });
    throw error;
  }
});

