/**
 * API: Partner Customers
 * GET /api/partner/customers - List partner customers
 * POST /api/partner/customers - Create new customer
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
  const search = searchParams.get('search');
  const segment = searchParams.get('segment');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = (page - 1) * limit;

  const client = supabase as unknown as any;

  try {
    let query = client
      .from('partner_customers')
      .select('*', { count: 'exact' })
      .eq('partner_id', user.id)
      .is('deleted_at', null);

    // Search filter
    if (search) {
      query = query.or(
        `name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`
      );
    }

    // Segment filter
    if (segment) {
      query = query.eq('segment', segment);
    }

    // Order and paginate
    query = query.order('created_at', { ascending: false });
    const { data: customers, error, count } = await query.range(
      offset,
      offset + limit - 1
    );

    if (error) {
      logger.error('Failed to fetch partner customers', error, {
        userId: user.id,
        search,
        segment,
      });
      return NextResponse.json(
        { error: 'Failed to fetch customers', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      customers: customers || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    logger.error('Failed to fetch partner customers', error, {
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
  const {
    name,
    email,
    phone,
    address,
    birthdate,
    segment,
    preferences,
    special_notes,
  } = body;

  if (!name) {
    return NextResponse.json(
      { error: 'Name is required' },
      { status: 400 }
    );
  }

  const client = supabase as unknown as any;

  try {
    const { data: customer, error } = await client
      .from('partner_customers')
      .insert({
        partner_id: user.id,
        name,
        email: email || null,
        phone: phone || null,
        address: address || null,
        birthdate: birthdate || null,
        segment: segment || null,
        preferences: preferences || {},
        special_notes: special_notes || null,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create customer', error, {
        userId: user.id,
        customerName: name,
      });
      return NextResponse.json(
        { error: 'Failed to create customer', details: error.message },
        { status: 500 }
      );
    }

    logger.info('Customer created', {
      userId: user.id,
      customerId: customer.id,
      customerName: name,
    });

    return NextResponse.json({ customer }, { status: 201 });
  } catch (error) {
    logger.error('Failed to create customer', error, {
      userId: user.id,
    });
    throw error;
  }
});

