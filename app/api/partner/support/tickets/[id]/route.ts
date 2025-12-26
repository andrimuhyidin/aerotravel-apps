/**
 * API: Partner Support Ticket Detail
 * GET /api/partner/support/tickets/[id] - Get ticket detail
 * PUT /api/partner/support/tickets/[id] - Update ticket
 */

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { NextRequest, NextResponse } from 'next/server';

type Params = Promise<{ id: string }>;

export const GET = withErrorHandler(async (
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

  const client = supabase as unknown as any;

  try {
    const { data: ticket, error } = await client
      .from('partner_support_tickets')
      .select('id, subject, description, category, status, priority, messages, submitted_at, first_response_at, resolved_at, response_sla_hours, created_at, updated_at')
      .eq('id', ticketId)
      .eq('partner_id', user.id)
      .single();

    if (error || !ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ ticket });
  } catch (error) {
    logger.error('Failed to fetch ticket detail', error, {
      ticketId,
      userId: user.id,
    });
    throw error;
  }
});

export const PUT = withErrorHandler(async (
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

  const body = await request.json();
  const { status, priority } = body;

  const client = supabase as unknown as any;

  try {
    // Check if ticket exists
    const { data: existingTicket } = await client
      .from('partner_support_tickets')
      .select('id, status')
      .eq('id', ticketId)
      .eq('partner_id', user.id)
      .single();

    if (!existingTicket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Update ticket
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (status !== undefined) {
      updateData.status = status;
      if (status === 'resolved' && !existingTicket.resolved_at) {
        updateData.resolved_at = new Date().toISOString();
      }
    }
    if (priority !== undefined) updateData.priority = priority;

    const { data: ticket, error } = await client
      .from('partner_support_tickets')
      .update(updateData)
      .eq('id', ticketId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update ticket', error, {
        ticketId,
        userId: user.id,
      });
      return NextResponse.json(
        { error: 'Failed to update ticket', details: error.message },
        { status: 500 }
      );
    }

    logger.info('Ticket updated', {
      ticketId,
      userId: user.id,
    });

    return NextResponse.json({ ticket });
  } catch (error) {
    logger.error('Failed to update ticket', error, {
      ticketId,
      userId: user.id,
    });
    throw error;
  }
});

