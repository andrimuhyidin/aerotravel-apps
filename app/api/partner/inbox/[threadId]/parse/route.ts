/**
 * API: Parse Inbox Message/Thread with AI
 * POST /api/partner/inbox/[threadId]/parse
 */

import { withErrorHandler } from '@/lib/api/error-handler';
import { parseBookingInquiry } from '@/lib/ai/inbox-parser';
import { aiChatRateLimit } from '@/lib/integrations/rate-limit';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const parseSchema = z.object({
  messageId: z.string().uuid().optional(),
  parseThread: z.boolean().optional().default(false),
});

type Params = Promise<{ threadId: string }>;

export const POST = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Params }
) => {
  const supabase = await createClient();
  const { threadId } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { messageId, parseThread } = parseSchema.parse(body);

  // Rate limiting
  const { success, limit, remaining } = await aiChatRateLimit.limit(user.id);
  if (!success) {
    return NextResponse.json(
      {
        error: 'Terlalu banyak request. Silakan tunggu sebentar.',
        limit,
        remaining,
      },
      { status: 429 }
    );
  }

  const client = supabase as unknown as any;

  try {
    let messageText = '';
    let targetMessageId: string | null = null;
    let targetThreadId: string | null = threadId;

    if (messageId) {
      // Parse specific message
      const { data: message, error: messageError } = await client
        .from('inbox_messages')
        .select('id, message_text, thread_id, partner_id')
        .eq('id', messageId)
        .eq('partner_id', user.id)
        .maybeSingle();

      if (messageError || !message) {
        return NextResponse.json(
          { error: 'Message not found' },
          { status: 404 }
        );
      }

      messageText = message.message_text || '';
      targetMessageId = message.id;
      targetThreadId = message.thread_id;
    } else if (parseThread) {
      // Parse thread (get latest message or combine all messages)
      const { data: messages, error: messagesError } = await client
        .from('inbox_messages')
        .select('id, message_text')
        .eq('thread_id', threadId)
        .eq('partner_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (messagesError || !messages || messages.length === 0) {
        return NextResponse.json(
          { error: 'No messages found in thread' },
          { status: 404 }
        );
      }

      // Combine recent messages
      messageText = messages
        .map((m: { message_text: string }) => m.message_text)
        .join('\n\n');
      targetMessageId = messages[0]?.id || null;
    } else {
      return NextResponse.json(
        { error: 'Either messageId or parseThread must be provided' },
        { status: 400 }
      );
    }

    if (!messageText.trim()) {
      return NextResponse.json(
        { error: 'Message text is empty' },
        { status: 400 }
      );
    }

    // Parse with AI
    const parsed = await parseBookingInquiry(messageText);

    // Store parsed data
    if (targetMessageId) {
      await client
        .from('inbox_messages')
        .update({
          parsed_data: parsed,
          parsing_status: 'parsed',
          parsing_confidence: parsed.confidence,
          parsed_at: new Date().toISOString(),
        })
        .eq('id', targetMessageId);
    }

    if (targetThreadId) {
      await client
        .from('inbox_threads')
        .update({
          parsed_data: parsed,
          parsing_status: 'parsed',
          parsing_confidence: parsed.confidence,
          parsed_at: new Date().toISOString(),
        })
        .eq('id', targetThreadId);
    }

    logger.info('Inbox message parsed', {
      userId: user.id,
      threadId: targetThreadId,
      messageId: targetMessageId,
      confidence: parsed.confidence,
    });

    return NextResponse.json({
      success: true,
      parsed,
      messageId: targetMessageId,
      threadId: targetThreadId,
    });
  } catch (error) {
    logger.error('Failed to parse inbox message', error, {
      userId: user.id,
      threadId,
    });

    // Update status to failed
    if (messageId) {
      await client
        .from('inbox_messages')
        .update({
          parsing_status: 'failed',
          parsed_at: new Date().toISOString(),
        })
        .eq('id', messageId)
        .catch(() => {
          // Non-critical
        });
    }

    throw error;
  }
});

