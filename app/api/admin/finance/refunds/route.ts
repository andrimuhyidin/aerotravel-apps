/**
 * API: Admin - Refunds List
 * GET /api/admin/finance/refunds - List all refunds with pagination and filters
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { hasRole } from '@/lib/session/active-role';
import { createAdminClient, getCurrentUser } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const refundsListSchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
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

  const validated = refundsListSchema.safeParse(queryParams);
  if (!validated.success) {
    logger.warn('Invalid query params for refunds list', { errors: validated.error.issues });
    return NextResponse.json(
      { error: 'Invalid query parameters', details: validated.error.issues },
      { status: 400 }
    );
  }

  const { search = '', status = 'all', startDate = '', endDate = '', page, limit } = validated.data;
  const offset = (page - 1) * limit;

  logger.info('Fetching refunds', { userId: user.id, filters: { search, status, startDate, endDate, page, limit } });

  try {
    // Build query
    let query = supabase
      .from('refunds')
      .select(
        `
        id,
        booking_id,
        payment_id,
        refund_amount,
        original_amount,
        refund_percentage,
        refund_reason,
        cancellation_policy,
        refund_method,
        refund_status,
        bank_name,
        bank_account_number,
        bank_account_name,
        approved_by,
        approved_at,
        completed_at,
        transaction_reference,
        created_at,
        bookings!inner(
          id,
          booking_code,
          customer_name,
          customer_email,
          customer_phone,
          trip_date
        )
      `,
        { count: 'exact' }
      );

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('refund_status', status);
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

    const { data: refunds, error, count } = await query;

    if (error) {
      logger.error('Failed to fetch refunds', error);
      return NextResponse.json(
        { error: 'Failed to fetch refunds', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      refunds: refunds || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    logger.error('Unexpected error in refunds API', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

