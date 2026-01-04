/**
 * API: Admin - Customer Communications
 * GET /api/admin/crm/customers/[id]/communications - Get customer's communication history
 * POST /api/admin/crm/customers/[id]/communications - Add new communication
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { hasRole } from '@/lib/session/active-role';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const addCommunicationSchema = z.object({
  communicationType: z.enum(['email', 'call', 'whatsapp', 'note', 'meeting', 'sms']),
  direction: z.enum(['inbound', 'outbound']).optional(),
  subject: z.string().optional(),
  content: z.string().min(1),
  outcome: z.string().optional(),
  followUpRequired: z.boolean().default(false),
  followUpDate: z.string().optional(),
  followUpNotes: z.string().optional(),
  bookingId: z.string().uuid().optional(),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const GET = withErrorHandler(async (request: NextRequest, context: RouteContext) => {
  // Check authorization
  const allowed = await hasRole(['super_admin', 'ops_admin', 'marketing']);
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id: customerId } = await context.params;
  const supabase = await createAdminClient();
  const { searchParams } = new URL(request.url);

  const type = searchParams.get('type');
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const offset = (page - 1) * limit;

  try {
    let query = supabase
      .from('customer_communications')
      .select(`
        id,
        communication_type,
        direction,
        subject,
        content,
        outcome,
        follow_up_required,
        follow_up_date,
        follow_up_notes,
        booking_id,
        created_by,
        created_at
      `, { count: 'exact' })
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (type) {
      query = query.eq('communication_type', type);
    }

    const { data: communications, error, count } = await query;

    if (error) {
      logger.error('Failed to fetch customer communications', error);
      return NextResponse.json(
        { error: 'Failed to fetch communications' },
        { status: 500 }
      );
    }

    // Get creator names
    const creatorIds = [...new Set((communications || []).map(c => c.created_by).filter(Boolean))];
    let creatorsMap: Record<string, string> = {};
    
    if (creatorIds.length > 0) {
      const { data: creators } = await supabase
        .from('users')
        .select('id, full_name')
        .in('id', creatorIds);
      
      if (creators) {
        creatorsMap = Object.fromEntries(creators.map(c => [c.id, c.full_name || 'Unknown']));
      }
    }

    const mappedComms = (communications || []).map(comm => ({
      ...comm,
      created_by_name: comm.created_by ? creatorsMap[comm.created_by] || 'Unknown' : 'System',
    }));

    return NextResponse.json({
      communications: mappedComms,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    logger.error('Unexpected error in communications API', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

export const POST = withErrorHandler(async (request: NextRequest, context: RouteContext) => {
  // Check authorization
  const allowed = await hasRole(['super_admin', 'ops_admin', 'marketing']);
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id: customerId } = await context.params;

  // Get current user
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Parse and validate request body
  const body = await request.json();
  const parsed = addCommunicationSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.errors },
      { status: 400 }
    );
  }

  const {
    communicationType,
    direction,
    subject,
    content,
    outcome,
    followUpRequired,
    followUpDate,
    followUpNotes,
    bookingId,
  } = parsed.data;

  const supabase = await createAdminClient();

  try {
    // Verify customer exists
    const { data: customer } = await supabase
      .from('users')
      .select('id')
      .eq('id', customerId)
      .single();

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Create communication record
    const { data: communication, error: createError } = await supabase
      .from('customer_communications')
      .insert({
        customer_id: customerId,
        communication_type: communicationType,
        direction: direction || null,
        subject: subject || null,
        content,
        outcome: outcome || null,
        follow_up_required: followUpRequired,
        follow_up_date: followUpDate || null,
        follow_up_notes: followUpNotes || null,
        booking_id: bookingId || null,
        created_by: user.id,
      })
      .select('id')
      .single();

    if (createError) {
      logger.error('Failed to create communication', createError);
      return NextResponse.json(
        { error: 'Failed to add communication' },
        { status: 500 }
      );
    }

    logger.info('Customer communication added', {
      communicationId: communication?.id,
      customerId,
      type: communicationType,
      createdBy: user.id,
    });

    return NextResponse.json({
      success: true,
      message: 'Communication added successfully',
      communication: { id: communication?.id },
    });
  } catch (error) {
    logger.error('Unexpected error in add communication', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

