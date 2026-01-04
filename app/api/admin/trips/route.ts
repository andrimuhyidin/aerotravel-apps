/**
 * API: Admin - Trips List
 * GET /api/admin/trips - List all trips with filters
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { hasRole } from '@/lib/session/active-role';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const tripsListSchema = z.object({
  status: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

export const GET = withErrorHandler(async (request: NextRequest) => {
  // Check authorization
  const allowed = await hasRole(['super_admin', 'ops_admin']);
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const authClient = await createClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get and validate query params
  const { searchParams } = new URL(request.url);
  const queryParams = Object.fromEntries(searchParams.entries());

  const validated = tripsListSchema.safeParse(queryParams);
  if (!validated.success) {
    logger.warn('Invalid query params for trips list', {
      errors: validated.error.issues,
    });
    return NextResponse.json(
      { error: 'Invalid query parameters', details: validated.error.issues },
      { status: 400 }
    );
  }

  const { status, startDate, endDate, page, limit } = validated.data;
  const offset = (page - 1) * limit;

  logger.info('Fetching trips', {
    userId: user.id,
    filters: { status, startDate, endDate, page, limit },
  });

  const supabase = await createClient();

  try {
    let query = supabase
      .from('trips')
      .select(
        `
        id,
        trip_code,
        trip_date,
        status,
        total_pax,
        package:packages(name)
      `,
        { count: 'exact' }
      );

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status as 'scheduled' | 'preparing' | 'on_the_way' | 'on_trip' | 'completed' | 'cancelled');
    }

    if (startDate) {
      query = query.gte('trip_date', startDate);
    }

    if (endDate) {
      query = query.lte('trip_date', endDate);
    }

    // Order and paginate
    query = query
      .order('trip_date', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: trips, error, count } = await query;

    if (error) {
      logger.error('Supabase error fetching trips', error, {
        userId: user.id,
      });
      return NextResponse.json(
        { error: 'Failed to fetch trips', details: error.message },
        { status: 500 }
      );
    }

    logger.info('Trips fetched successfully', {
      userId: user.id,
      count: trips?.length || 0,
      total: count,
    });

    return NextResponse.json({
      trips: trips || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    logger.error('Unexpected error in trips API', error, { userId: user.id });
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
});

