/**
 * Admin CRM Customers API
 * GET /api/admin/crm/customers - List customers with search/filter
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient, hasRole } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

type CustomerRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
  bookings: Array<{
    id: string;
    booking_code: string;
    total_amount: number;
    status: string;
    trip_date: string;
  }>;
};

export const GET = withErrorHandler(async (request: NextRequest) => {
  logger.info('GET /api/admin/crm/customers');

  const allowed = await hasRole(['super_admin', 'marketing', 'cs']);
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get query params
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const segment = searchParams.get('segment') || 'all'; // all, vip, repeat, new
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const offset = (page - 1) * limit;

  try {
    // Build query for customers (users with customer bookings)
    let query = supabase
      .from('users')
      .select(
        `
        id,
        full_name,
        email,
        phone,
        created_at,
        bookings!bookings_user_id_fkey (
          id,
          booking_code,
          total_amount,
          status,
          trip_date
        )
      `,
        { count: 'exact' }
      )
      .not('bookings', 'is', null)
      .order('created_at', { ascending: false });

    // Apply search filter
    if (search) {
      query = query.or(
        `full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`
      );
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: customers, error, count } = await query;

    if (error) {
      logger.error('Failed to fetch customers', error);
      throw error;
    }

    // Process customers to add segments and stats
    const processedCustomers = (customers || []).map((customer: CustomerRow) => {
      const bookings = customer.bookings || [];
      const completedBookings = bookings.filter(
        (b) => b.status === 'completed' || b.status === 'confirmed'
      );
      const totalSpent = completedBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
      const bookingCount = completedBookings.length;

      // Determine segment
      let customerSegment = 'new';
      if (totalSpent >= 10000000 || bookingCount >= 5) {
        customerSegment = 'vip';
      } else if (bookingCount >= 2) {
        customerSegment = 'repeat';
      }

      // Last booking date
      const sortedBookings = [...bookings].sort(
        (a, b) => new Date(b.trip_date).getTime() - new Date(a.trip_date).getTime()
      );
      const lastBooking = sortedBookings[0];

      return {
        id: customer.id,
        fullName: customer.full_name || 'Unknown',
        email: customer.email || '',
        phone: customer.phone || '',
        createdAt: customer.created_at,
        segment: customerSegment,
        totalBookings: bookingCount,
        totalSpent,
        lastBookingDate: lastBooking?.trip_date || null,
        lastBookingStatus: lastBooking?.status || null,
      };
    });

    // Filter by segment if specified
    let filteredCustomers = processedCustomers;
    if (segment !== 'all') {
      filteredCustomers = processedCustomers.filter((c) => c.segment === segment);
    }

    // Calculate segment stats
    const allCustomersForStats = processedCustomers;
    const segmentStats = {
      all: allCustomersForStats.length,
      vip: allCustomersForStats.filter((c) => c.segment === 'vip').length,
      repeat: allCustomersForStats.filter((c) => c.segment === 'repeat').length,
      new: allCustomersForStats.filter((c) => c.segment === 'new').length,
    };

    return NextResponse.json({
      customers: filteredCustomers,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
      segmentStats,
    });
  } catch (error) {
    logger.error('CRM customers error', error);
    throw error;
  }
});

