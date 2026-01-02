/**
 * API: Partner Customer Detail
 * GET /api/partner/customers/[id] - Get customer detail
 * PUT /api/partner/customers/[id] - Update customer
 * DELETE /api/partner/customers/[id] - Delete customer (soft delete)
 */

import { withErrorHandler } from '@/lib/api/error-handler';
import { verifyPartnerAccess, sanitizeRequestBody } from '@/lib/api/partner-helpers';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { NextRequest, NextResponse } from 'next/server';

type Params = Promise<{ id: string }>;

export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Params }
) => {
  const { id: customerId } = await params;
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

  const client = supabase as unknown as any;

  try {
    // Get customer
    const { data: customer, error: customerError } = await client
      .from('partner_customers')
      .select('*')
      .eq('id', customerId)
      .eq('partner_id', partnerId)
      .is('deleted_at', null)
      .single();

    if (customerError || !customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Get booking history for this customer
    let bookingsQuery = client
      .from('bookings')
      .select(
        `
        id,
        booking_code,
        trip_date,
        adult_pax,
        child_pax,
        infant_pax,
        total_amount,
        nta_total,
        status,
        created_at,
        package:packages(
          id,
          name,
          destination
        )
      `
      )
      .eq('mitra_id', partnerId);

    // Build OR condition safely
    const conditions: string[] = [];
    if (customer.email) {
      conditions.push(`customer_email.eq.${customer.email}`);
    }
    if (customer.phone) {
      conditions.push(`customer_phone.eq.${customer.phone}`);
    }

    let bookings: Array<{
      id: string;
      booking_code: string;
      trip_date: string;
      adult_pax: number;
      child_pax: number;
      infant_pax: number;
      total_amount: number;
      nta_total: number | null;
      status: string;
      created_at: string;
      package: {
        id: string;
        name: string;
        destination: string | null;
      } | null;
    }> = [];
    let bookingsError: Error | null = null;

    if (conditions.length > 0) {
      const result = await bookingsQuery
        .or(conditions.join(','))
        .order('trip_date', { ascending: false })
        .limit(50);
      bookings = (result.data as typeof bookings) || [];
      bookingsError = (result.error as Error) || null;
    }

    if (bookingsError) {
      logger.warn('Failed to fetch customer bookings', {
        customerId,
        userId: user.id,
        error: bookingsError instanceof Error ? bookingsError.message : String(bookingsError),
      });
    }

    // Calculate stats
    const bookingCount = bookings?.length || 0;
    const totalSpent =
      bookings?.reduce((sum: number, b: { total_amount: number }) => {
        return sum + Number(b.total_amount || 0);
      }, 0) || 0;
    const lastTripDate =
      bookings && bookings.length > 0 && bookings[0]
        ? bookings[0].trip_date
        : customer.last_trip_date;

    // Update customer stats if needed
    if (
      bookingCount !== customer.booking_count ||
      totalSpent !== Number(customer.total_spent) ||
      lastTripDate !== customer.last_trip_date
    ) {
      await client
        .from('partner_customers')
        .update({
          booking_count: bookingCount,
          total_spent: totalSpent,
          last_trip_date: lastTripDate,
        })
        .eq('id', customerId);
    }

    return NextResponse.json({
      customer: {
        ...customer,
        booking_count: bookingCount,
        total_spent: totalSpent,
        last_trip_date: lastTripDate,
      },
      bookings: bookings || [],
    });
  } catch (error) {
    logger.error('Failed to fetch customer detail', error, {
      customerId,
      userId: user.id,
    });
    throw error;
  }
});

export const PUT = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Params }
) => {
  const { id: customerId } = await params;
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
  
  // Sanitize input
  const sanitizedBody = sanitizeRequestBody(body, {
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
  } = sanitizedBody;

  const client = supabase as unknown as any;

  try {
    // Check if customer exists and belongs to partner
    const { data: existingCustomer, error: checkError } = await client
      .from('partner_customers')
      .select('id')
      .eq('id', customerId)
      .eq('partner_id', partnerId)
      .is('deleted_at', null)
      .single();

    if (checkError || !existingCustomer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Update customer
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email || null;
    if (phone !== undefined) updateData.phone = phone || null;
    if (address !== undefined) updateData.address = address || null;
    if (birthdate !== undefined) updateData.birthdate = birthdate || null;
    if (segment !== undefined) updateData.segment = segment || null;
    if (preferences !== undefined) updateData.preferences = preferences || {};
    if (special_notes !== undefined)
      updateData.special_notes = special_notes || null;

    const { data: customer, error } = await client
      .from('partner_customers')
      .update(updateData)
      .eq('id', customerId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update customer', error, {
        customerId,
        userId: user.id,
      });
      return NextResponse.json(
        { error: 'Failed to update customer', details: error.message },
        { status: 500 }
      );
    }

    logger.info('Customer updated', {
      customerId,
      userId: user.id,
    });

    return NextResponse.json({ customer });
  } catch (error) {
    logger.error('Failed to update customer', error, {
      customerId,
      userId: user.id,
    });
    throw error;
  }
});

export const DELETE = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Params }
) => {
  const { id: customerId } = await params;
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

  const client = supabase as unknown as any;

  try {
    // Check if customer exists and belongs to partner
    const { data: existingCustomer, error: checkError } = await client
      .from('partner_customers')
      .select('id')
      .eq('id', customerId)
      .eq('partner_id', partnerId)
      .is('deleted_at', null)
      .single();

    if (checkError || !existingCustomer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Soft delete
    const { error } = await client
      .from('partner_customers')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', customerId);

    if (error) {
      logger.error('Failed to delete customer', error, {
        customerId,
        userId: user.id,
      });
      return NextResponse.json(
        { error: 'Failed to delete customer', details: error.message },
        { status: 500 }
      );
    }

    logger.info('Customer deleted', {
      customerId,
      userId: user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Failed to delete customer', error, {
      customerId,
      userId: user.id,
    });
    throw error;
  }
});

