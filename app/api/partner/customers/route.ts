/**
 * API: Partner Customers
 * GET /api/partner/customers - List partner customers
 * POST /api/partner/customers - Create new customer
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { sanitizeRequestBody, sanitizeSearchParams, verifyPartnerAccess } from '@/lib/api/partner-helpers';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const createCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email().optional().nullable(),
  phone: z.string().min(10).optional().nullable(),
  address: z.string().optional().nullable(),
  birthdate: z.string().optional().nullable(),
  segment: z.string().optional().nullable(),
  preferences: z.record(z.unknown()).optional(),
  special_notes: z.string().optional().nullable(),
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
  // Sanitize search params
  const sanitizedParams = sanitizeSearchParams(searchParams);
  const search = sanitizedParams.search || null;
  const segment = sanitizedParams.segment || null;
  const page = parseInt(sanitizedParams.page || '1');
  const limit = Math.min(parseInt(sanitizedParams.limit || '20'), 100); // Max 100
  const offset = (page - 1) * limit;

  const client = supabase as unknown as any;

  try {
    let query = client
      .from('partner_customers')
      .select('*', { count: 'exact' })
      .eq('partner_id', partnerId) // Use verified partnerId
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

  // Verify partner access
  const { isPartner, partnerId } = await verifyPartnerAccess(user.id);
  if (!isPartner || !partnerId) {
    return NextResponse.json(
      { error: 'User is not a partner' },
      { status: 403 }
    );
  }

  const body = await request.json();
  const validation = createCustomerSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error.errors[0]?.message || 'Validation failed' },
      { status: 400 }
    );
  }

  // Sanitize validated data
  const sanitizedData = sanitizeRequestBody(validation.data, {
    strings: ['name', 'address', 'segment', 'special_notes'],
    emails: ['email'],
    phones: ['phone'],
  });

  const {
    name,
    email,
    phone,
    address,
    birthdate,
    segment,
    preferences,
    special_notes,
  } = sanitizedData;

  const client = supabase as unknown as any;

  try {
    const { data: customer, error } = await client
      .from('partner_customers')
      .insert({
        partner_id: partnerId, // Use verified partnerId
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

