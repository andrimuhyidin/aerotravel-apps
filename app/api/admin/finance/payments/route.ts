/**
 * API: Admin - Payments List
 * GET /api/admin/finance/payments - List all payments with pagination and filters
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { hasRole } from '@/lib/session/active-role';
import { createAdminClient, getCurrentUser } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const paymentsListSchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  verificationStatus: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const GET = withErrorHandler(async (request: NextRequest) => {
  // Check authorization
  const allowed = await hasRole(['super_admin', 'finance_manager', 'ops_admin']);
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createAdminClient();

  // Get and validate query params
  const { searchParams } = new URL(request.url);
  const queryParams = Object.fromEntries(searchParams.entries());

  const validated = paymentsListSchema.safeParse(queryParams);
  if (!validated.success) {
    logger.warn('Invalid query params for payments list', { errors: validated.error.issues });
    return NextResponse.json(
      { error: 'Invalid query parameters', details: validated.error.issues },
      { status: 400 }
    );
  }

  const { search = '', status = 'all', verificationStatus = 'all', startDate = '', endDate = '', page, limit } = validated.data;
  const offset = (page - 1) * limit;

  logger.info('Fetching payments', { userId: user.id, filters: { search, status, verificationStatus, startDate, endDate, page, limit } });

  try {
    // Build query
    let query = supabase
      .from('payments')
      .select(
        `
        id,
        booking_id,
        amount,
        payment_method,
        status,
        proof_url,
        verification_status,
        verified_by,
        verified_at,
        verification_notes,
        paid_at,
        created_at,
        updated_at
      `,
        { count: 'exact' }
      );

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status as 'pending' | 'processing' | 'paid' | 'failed' | 'refunded' | 'expired');
    }

    if (verificationStatus && verificationStatus !== 'all') {
      query = query.eq('verification_status', verificationStatus);
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    // Search by booking code or customer name
    if (search) {
      query = query.or(
        `bookings.booking_code.ilike.%${search}%,bookings.customer_name.ilike.%${search}%`
      );
    }

    // Order and paginate
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: payments, error, count } = await query;

    if (error) {
      logger.error('Failed to fetch payments', error);
      return NextResponse.json(
        { error: 'Failed to fetch payments', details: error.message },
        { status: 500 }
      );
    }

    // Get booking details
    const bookingIds = [...new Set((payments || [])
      .map(p => p.booking_id)
      .filter(Boolean))];

    let bookingsMap: Record<string, { id: string; booking_code: string; customer_name: string; customer_email: string | null; customer_phone: string; total_amount: number }> = {};
    if (bookingIds.length > 0) {
      const { data: bookings } = await supabase
        .from('bookings')
        .select('id, booking_code, customer_name, customer_email, customer_phone, total_amount')
        .in('id', bookingIds);

      if (bookings) {
        bookingsMap = Object.fromEntries(
          bookings.map(b => [b.id, b])
        );
      }
    }

    // Get verifier details for verified payments
    const verifierIds = [...new Set((payments || [])
      .map(p => p.verified_by)
      .filter((id): id is string => id !== null && id !== undefined))];

    let verifiersMap: Record<string, { full_name: string }> = {};
    if (verifierIds.length > 0) {
      const { data: verifiers } = await supabase
        .from('users')
        .select('id, full_name')
        .in('id', verifierIds);

      if (verifiers) {
        verifiersMap = Object.fromEntries(
          verifiers.map(v => [v.id, { full_name: v.full_name }])
        );
      }
    }

    // Map payments with booking and verifier info
    const mappedPayments = (payments || []).map(payment => ({
      ...payment,
      bookings: payment.booking_id ? bookingsMap[payment.booking_id] || null : null,
      verifier: payment.verified_by ? verifiersMap[payment.verified_by] || null : null,
    }));

    logger.info('Payments fetched successfully', { userId: user.id, count: mappedPayments.length, total: count });

    return NextResponse.json({
      payments: mappedPayments,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    logger.error('Unexpected error in payments API', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

