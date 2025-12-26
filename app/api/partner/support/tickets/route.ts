/**
 * API: Partner Support Tickets
 * GET /api/partner/support/tickets - List support tickets
 * POST /api/partner/support/tickets - Create new ticket
 */

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { NextRequest, NextResponse } from 'next/server';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const category = searchParams.get('category');
  const priority = searchParams.get('priority');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = (page - 1) * limit;

  const client = supabase as unknown as any;

  try {
    let query = client
      .from('partner_support_tickets')
      .select('*', { count: 'exact' })
      .eq('partner_id', user.id);

    if (status) {
      query = query.eq('status', status);
    }
    if (category) {
      query = query.eq('category', category);
    }
    if (priority) {
      query = query.eq('priority', priority);
    }

    query = query.order('created_at', { ascending: false });
    const { data: tickets, error, count } = await query.range(
      offset,
      offset + limit - 1
    );

    if (error) {
      logger.error('Failed to fetch support tickets', error, {
        userId: user.id,
      });
      return NextResponse.json(
        { error: 'Failed to fetch tickets', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      tickets: tickets || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    logger.error('Failed to fetch support tickets', error, {
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

  const body = await request.json();
  const { subject, description, category, priority } = body;

  if (!subject || !description) {
    return NextResponse.json(
      { error: 'Subject and description are required' },
      { status: 400 }
    );
  }

  const client = supabase as unknown as any;

  try {
    const { data: ticket, error } = await client
      .from('partner_support_tickets')
      .insert({
        partner_id: user.id,
        user_id: user.id,
        subject,
        description,
        category: category || 'other',
        priority: priority || 'normal',
        status: 'submitted',
        messages: [
          {
            user_id: user.id,
            message: description,
            created_at: new Date().toISOString(),
            is_internal: false,
          },
        ],
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create ticket', error, {
        userId: user.id,
        subject,
      });
      return NextResponse.json(
        { error: 'Failed to create ticket', details: error.message },
        { status: 500 }
      );
    }

    logger.info('Support ticket created', {
      userId: user.id,
      ticketId: ticket.id,
      subject,
    });

    return NextResponse.json({ ticket }, { status: 201 });
  } catch (error) {
    logger.error('Failed to create ticket', error, {
      userId: user.id,
    });
    throw error;
  }
});

