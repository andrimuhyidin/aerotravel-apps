/**
 * API: Admin - Customer Communications
 * GET /api/admin/crm/communications - List all customer communications
 * POST /api/admin/crm/communications - Log new communication
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { hasRole } from '@/lib/session/active-role';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const logCommunicationSchema = z.object({
  customerId: z.string().uuid(),
  communicationType: z.enum(['email', 'phone', 'whatsapp', 'in_person', 'chat', 'sms']),
  direction: z.enum(['inbound', 'outbound']),
  subject: z.string().min(3).max(200),
  content: z.string().min(5),
  status: z.enum(['pending', 'completed', 'follow_up_needed']).default('completed'),
  followUpDate: z.string().optional(),
  relatedBookingId: z.string().uuid().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const GET = withErrorHandler(async (request: NextRequest) => {
  // Check authorization
  const allowed = await hasRole(['super_admin', 'marketing', 'ops_admin']);
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const supabase = await createAdminClient();
  const { searchParams } = new URL(request.url);

  const customerId = searchParams.get('customerId');
  const communicationType = searchParams.get('type');
  const status = searchParams.get('status');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const offset = (page - 1) * limit;

  try {
    let query = supabase
      .from('customer_communications')
      .select(`
        id,
        customer_id,
        communication_type,
        direction,
        subject,
        content,
        status,
        follow_up_date,
        related_booking_id,
        agent_id,
        created_at,
        updated_at
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (customerId) {
      query = query.eq('customer_id', customerId);
    }

    if (communicationType) {
      query = query.eq('communication_type', communicationType);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data: communications, error, count } = await query;

    if (error) {
      logger.error('Failed to fetch communications', error);
      return NextResponse.json(
        { error: 'Failed to fetch communications' },
        { status: 500 }
      );
    }

    // Get customer and agent names
    const customerIds = [...new Set((communications || []).map(c => c.customer_id))];
    const agentIds = [...new Set((communications || []).map(c => c.agent_id).filter(Boolean))];
    
    let customersMap: Record<string, { full_name: string; email: string }> = {};
    let agentsMap: Record<string, string> = {};
    
    if (customerIds.length > 0) {
      const { data: customers } = await supabase
        .from('users')
        .select('id, full_name, email')
        .in('id', customerIds);
      
      if (customers) {
        customersMap = Object.fromEntries(
          customers.map(c => [c.id, { full_name: c.full_name || 'Unknown', email: c.email }])
        );
      }
    }

    if (agentIds.length > 0) {
      const { data: agents } = await supabase
        .from('users')
        .select('id, full_name, email')
        .in('id', agentIds);
      
      if (agents) {
        agentsMap = Object.fromEntries(
          agents.map(a => [a.id, a.full_name || a.email])
        );
      }
    }

    const mappedCommunications = (communications || []).map(c => ({
      ...c,
      customer: customersMap[c.customer_id] || { full_name: 'Unknown', email: '' },
      agent_name: c.agent_id ? agentsMap[c.agent_id] || 'Unknown' : null,
    }));

    return NextResponse.json({
      communications: mappedCommunications,
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

export const POST = withErrorHandler(async (request: NextRequest) => {
  // Check authorization
  const allowed = await hasRole(['super_admin', 'marketing', 'ops_admin']);
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Get current user
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Parse and validate request body
  const body = await request.json();
  const parsed = logCommunicationSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.errors },
      { status: 400 }
    );
  }

  const {
    customerId,
    communicationType,
    direction,
    subject,
    content,
    status,
    followUpDate,
    relatedBookingId,
    metadata,
  } = parsed.data;

  const supabase = await createAdminClient();

  try {
    // Verify customer exists
    const { data: customer, error: customerError } = await supabase
      .from('users')
      .select('id, full_name')
      .eq('id', customerId)
      .single();

    if (customerError || !customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    const { data: communication, error: createError } = await supabase
      .from('customer_communications')
      .insert({
        customer_id: customerId,
        communication_type: communicationType,
        direction,
        subject,
        content,
        status,
        follow_up_date: followUpDate || null,
        related_booking_id: relatedBookingId || null,
        agent_id: user.id,
        metadata: metadata || null,
      })
      .select('id, subject')
      .single();

    if (createError) {
      logger.error('Failed to log communication', createError);
      return NextResponse.json(
        { error: 'Failed to log communication' },
        { status: 500 }
      );
    }

    logger.info('Communication logged', {
      communicationId: communication?.id,
      customerId,
      type: communicationType,
      agentId: user.id,
    });

    return NextResponse.json({
      success: true,
      message: 'Komunikasi berhasil dicatat',
      communication,
    });
  } catch (error) {
    logger.error('Unexpected error in log communication', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

