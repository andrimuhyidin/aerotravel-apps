/**
 * API: Partner Support Tickets
 * GET /api/partner/support/tickets - List support tickets
 * POST /api/partner/support/tickets - Create new ticket
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { sanitizeRequestBody, sanitizeSearchParams, verifyPartnerAccess } from '@/lib/api/partner-helpers';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const createTicketSchema = z.object({
  subject: z.string().min(5, 'Subject minimal 5 karakter'),
  description: z.string().min(10, 'Description minimal 10 karakter'),
  category: z.string().optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
});

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
  const status = sanitizedParams.status || null;
  const category = sanitizedParams.category || null;
  const priority = sanitizedParams.priority || null;
  const page = parseInt(sanitizedParams.page || '1');
  const limit = Math.min(parseInt(sanitizedParams.limit || '20'), 100);
  const offset = (page - 1) * limit;

  const client = supabase as unknown as any;

  try {
    let query = client
      .from('partner_support_tickets')
      .select('*', { count: 'exact' })
      .eq('partner_id', partnerId); // Use verified partnerId

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

  // Verify partner access
  const { isPartner, partnerId } = await verifyPartnerAccess(user.id);
  if (!isPartner || !partnerId) {
    return NextResponse.json(
      { error: 'User is not a partner' },
      { status: 403 }
    );
  }

  const body = await request.json();
  const validation = createTicketSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error.errors[0]?.message || 'Validation failed' },
      { status: 400 }
    );
  }

  // Sanitize validated data
  const sanitizedData = sanitizeRequestBody(validation.data, {
    strings: ['subject', 'description', 'category'],
  });

  const { subject, description, category, priority } = sanitizedData;

  const client = supabase as unknown as any;

  try {
    const { data: ticket, error } = await client
      .from('partner_support_tickets')
      .insert({
        partner_id: partnerId, // Use verified partnerId
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

