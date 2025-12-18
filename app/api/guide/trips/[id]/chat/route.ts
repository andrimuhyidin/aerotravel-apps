/**
 * API: Trip Chat Messages
 * GET /api/guide/trips/[id]/chat - Get chat messages for a trip
 * POST /api/guide/trips/[id]/chat - Send a message in trip chat
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext, withBranchFilter } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const sendMessageSchema = z.object({
  messageText: z.string().min(1).max(1000),
  templateType: z.enum(['delay_guest', 'bad_weather', 'boat_equipment_issue', 'custom']).optional(),
});

export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { id: tripId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  // Get user role
  const { data: userProfile } = await withBranchFilter(
    client.from('users'),
    branchContext,
  )
    .select('role')
    .eq('id', user.id)
    .single();

  const userRole = (userProfile as { role: string } | null)?.role || 'guide';

  // Check if guide is assigned to trip (if not ops/admin)
  if (userRole === 'guide') {
    const { data: assignment } = await withBranchFilter(
      client.from('trip_guides'),
      branchContext,
    )
      .select('id')
      .eq('trip_id', tripId)
      .eq('guide_id', user.id)
      .maybeSingle();

    if (!assignment) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  // Get chat messages
  const { data: messages, error: messagesError } = await client
    .from('trip_chat_messages')
    .select('id, sender_id, sender_role, message_text, template_type, created_at, sender:users(full_name, avatar_url)')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: true });

  if (messagesError) {
    logger.error('Failed to fetch trip chat messages', messagesError, { tripId, guideId: user.id });
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }

  const formattedMessages = (messages || []).map((msg: any) => ({
    id: msg.id,
    senderId: msg.sender_id,
    senderRole: msg.sender_role,
    messageText: msg.message_text,
    templateType: msg.template_type,
    createdAt: msg.created_at,
    senderName: msg.sender?.full_name || 'Unknown',
    senderAvatar: msg.sender?.avatar_url || null,
  }));

  return NextResponse.json({ messages: formattedMessages });
});

export const POST = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { id: tripId } = await params;
  const supabase = await createClient();
  const payload = sendMessageSchema.parse(await request.json());

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  // Get user role
  const { data: userProfile } = await withBranchFilter(
    client.from('users'),
    branchContext,
  )
    .select('role')
    .eq('id', user.id)
    .single();

  const userRole = (userProfile as { role: string } | null)?.role || 'guide';

  // Determine sender role
  let senderRole: 'guide' | 'ops' | 'admin' = 'guide';
  if (userRole === 'ops' || userRole === 'admin' || userRole === 'super_admin') {
    senderRole = userRole === 'admin' || userRole === 'super_admin' ? 'admin' : 'ops';
  }

  // Check if guide is assigned to trip (if not ops/admin)
  if (senderRole === 'guide') {
    const { data: assignment } = await withBranchFilter(
      client.from('trip_guides'),
      branchContext,
    )
      .select('id')
      .eq('trip_id', tripId)
      .eq('guide_id', user.id)
      .maybeSingle();

    if (!assignment) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  // Insert message
  const { data: message, error: insertError } = await client
    .from('trip_chat_messages')
    .insert({
      trip_id: tripId,
      sender_id: user.id,
      sender_role: senderRole,
      message_text: payload.messageText,
      template_type: payload.templateType || 'custom',
      created_at: new Date().toISOString(),
    })
    .select('id, sender_id, sender_role, message_text, template_type, created_at')
    .single();

  if (insertError || !message) {
    logger.error('Failed to send trip chat message', insertError, { tripId, guideId: user.id });
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }

  logger.info('Trip chat message sent', {
    messageId: message.id,
    tripId,
    senderId: user.id,
    senderRole,
  });

  return NextResponse.json({
    success: true,
    message: {
      id: message.id,
      senderId: message.sender_id,
      senderRole: message.sender_role,
      messageText: message.message_text,
      templateType: message.template_type,
      createdAt: message.created_at,
    },
  });
});
