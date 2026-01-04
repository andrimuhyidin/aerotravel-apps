/**
 * API: Partner Support Ticket Messages
 * POST /api/partner/support/tickets/[id]/messages - Add message to ticket
 */

import { withErrorHandler } from '@/lib/api/error-handler';
import { verifyPartnerAccess, sanitizeRequestBody } from '@/lib/api/partner-helpers';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { NextRequest, NextResponse } from 'next/server';

type Params = Promise<{ id: string }>;

export const POST = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Params }
) => {
  const { id: ticketId } = await params;
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
    return NextResponse.json({ error: 'Partner access required' }, { status: 403 });
  }

  const body = await request.json();
  const sanitizedBody = sanitizeRequestBody(body, { strings: ['message'] });
  const { message, is_internal = false } = sanitizedBody;

  if (!message) {
    return NextResponse.json(
      { error: 'Message is required' },
      { status: 400 }
    );
  }

  const client = supabase as unknown as any;

  try {
    // Get current ticket
    const { data: ticket, error: ticketError } = await client
      .from('partner_support_tickets')
      .select('messages, first_response_at')
      .eq('id', ticketId)
      .eq('partner_id', partnerId)
      .single();

    if (ticketError || !ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Add new message
    const messages = (ticket.messages || []) as Array<{
      user_id: string;
      message: string;
      created_at: string;
      is_internal: boolean;
    }>;

    const newMessage = {
      user_id: user.id,
      message,
      created_at: new Date().toISOString(),
      is_internal: is_internal || false,
    };

    messages.push(newMessage);

    // Update first_response_at if this is the first response
    const updateData: Record<string, unknown> = {
      messages,
      updated_at: new Date().toISOString(),
    };

    if (!ticket.first_response_at) {
      updateData.first_response_at = new Date().toISOString();
    }

    const { data: updatedTicket, error } = await client
      .from('partner_support_tickets')
      .update(updateData)
      .eq('id', ticketId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to add message', error, {
        ticketId,
        userId: user.id,
      });
      return NextResponse.json(
        { error: 'Failed to add message', details: error.message },
        { status: 500 }
      );
    }

    logger.info('Message added to ticket', {
      ticketId,
      userId: user.id,
    });

    return NextResponse.json({ ticket: updatedTicket });
  } catch (error) {
    logger.error('Failed to add message', error, {
      ticketId,
      userId: user.id,
    });
    throw error;
  }
});

