/**
 * API: Admin - Bookings List
 * GET /api/admin/bookings - List all bookings with pagination and filters
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const bookingListSchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  packageId: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

export const GET = withErrorHandler(async (request: NextRequest) => {
  try {
    // Use regular client for auth
    const authClient = await createClient();

    const {
      data: { user },
    } = await authClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check authorization using user metadata (bypasses RLS issues)
    const userRole = user.user_metadata?.role as string;
    const allowedRoles = ['super_admin', 'ops_admin', 'finance_manager', 'marketing'];
    if (!userRole || !allowedRoles.includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Use admin client for data queries (bypasses RLS - already authorized above)
    const supabase = await createAdminClient();

    // Get and validate query params
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    
    const validated = bookingListSchema.safeParse(queryParams);
    if (!validated.success) {
      logger.warn('Invalid query params for bookings list', { errors: validated.error.issues });
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validated.error.issues },
        { status: 400 }
      );
    }

    const { search = '', status = 'all', startDate = '', endDate = '', packageId = 'all', page, limit } = validated.data;
    const offset = (page - 1) * limit;

    logger.info('Fetching bookings', { userId: user.id, filters: { search, status, startDate, endDate, packageId, page, limit } });

    // Simple query without branch filter
    let query = supabase
      .from('bookings')
      .select(
        `
        id,
        booking_code,
        trip_date,
        customer_name,
        customer_phone,
        customer_email,
        adult_pax,
        child_pax,
        infant_pax,
        total_amount,
        discount_amount,
        status,
        created_at,
        package_id
      `,
        { count: 'exact' }
      );

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status as 'pending_payment' | 'awaiting_full_payment' | 'paid' | 'confirmed' | 'ongoing' | 'completed' | 'cancelled' | 'refunded' | 'draft');
    }

    if (startDate) {
      query = query.gte('trip_date', startDate);
    }

    if (endDate) {
      query = query.lte('trip_date', endDate);
    }

    if (packageId && packageId !== 'all') {
      query = query.eq('package_id', packageId);
    }

    // Search filter
    if (search) {
      query = query.or(
        `booking_code.ilike.%${search}%,customer_name.ilike.%${search}%`
      );
    }

    // Order and paginate
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: bookingsRaw, error, count } = await query;

    if (error) {
      logger.error('Supabase error fetching bookings', error, { userId: user.id });
      return NextResponse.json(
        { error: 'Failed to fetch bookings', details: error.message },
        { status: 500 }
      );
    }

    // Fetch packages separately to avoid join issues
    const packageIds = [...new Set((bookingsRaw || []).map(b => b.package_id).filter(Boolean))];
    let packagesMap: Record<string, { name: string; destination: string }> = {};
    
    if (packageIds.length > 0) {
      const { data: packages } = await supabase
        .from('packages')
        .select('id, name, destination')
        .in('id', packageIds);
      
      if (packages) {
        packagesMap = Object.fromEntries(
          packages.map(p => [p.id, { name: p.name, destination: p.destination }])
        );
      }
    }

    // Map bookings with packages
    const bookings = (bookingsRaw || []).map(booking => ({
      ...booking,
      packages: booking.package_id ? packagesMap[booking.package_id] || null : null,
    }));

    logger.info('Bookings fetched successfully', { userId: user.id, count: bookings.length, total: count });

    return NextResponse.json({
      bookings,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    logger.error('Unexpected error in bookings API', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
});
