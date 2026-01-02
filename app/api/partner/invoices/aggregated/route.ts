/**
 * API: Partner Aggregated Invoices
 * GET /api/partner/invoices/aggregated - Get aggregated invoices for a period
 */

import { withErrorHandler } from '@/lib/api/error-handler';
import { verifyPartnerAccess, sanitizeSearchParams } from '@/lib/api/partner-helpers';
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

  // Verify partner access
  const { isPartner, partnerId } = await verifyPartnerAccess(user.id);
  if (!isPartner || !partnerId) {
    return NextResponse.json({ error: 'Partner access required' }, { status: 403 });
  }

  // Sanitize search params
  const searchParams = sanitizeSearchParams(request);
  const period = searchParams.get('period') || 'monthly'; // 'weekly' or 'monthly'
  const from = searchParams.get('from'); // YYYY-MM-DD
  const to = searchParams.get('to'); // YYYY-MM-DD
  const status = searchParams.get('status'); // Filter by booking status (paid, pending, all)

  const client = supabase as unknown as any;

  try {
    // Calculate date range based on period
    let startDate: Date;
    let endDate: Date;

    if (from && to) {
      startDate = new Date(from);
      endDate = new Date(to);
    } else if (period === 'weekly') {
      // Get current week (Monday to Sunday)
      const today = new Date();
      const dayOfWeek = today.getDay();
      const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust to Monday
      startDate = new Date(today.setDate(diff));
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6); // Sunday
      endDate.setHours(23, 59, 59, 999);
    } else {
      // Monthly - current month
      const today = new Date();
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      endDate.setHours(23, 59, 59, 999);
    }

    // Build query
    let query = client
      .from('bookings')
      .select(
        `
        id,
        booking_code,
        trip_date,
        created_at,
        adult_pax,
        child_pax,
        infant_pax,
        total_amount,
        nta_total,
        status,
        customer_name,
        package:packages(id, name, destination)
      `
      )
      .eq('mitra_id', partnerId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    // Filter by status
    if (status && status !== 'all') {
      if (status === 'paid') {
        query = query.eq('status', 'paid');
      } else if (status === 'pending') {
        query = query.in('status', ['pending_payment', 'confirmed']);
      }
    }

    // Order by created_at
    query = query.order('created_at', { ascending: true });

    const { data: bookings, error } = await query;

    if (error) {
      logger.error('Failed to fetch bookings for aggregated invoice', error, {
        userId: user.id,
        period,
        from,
        to,
      });
      return NextResponse.json(
        { error: 'Failed to fetch bookings', details: error.message },
        { status: 500 }
      );
    }

    const bookingsData = bookings || [];

    // Calculate totals
    const subtotal = bookingsData.reduce(
      (sum: number, booking: any) => sum + Number(booking.nta_total || booking.total_amount || 0),
      0
    );

    // Group bookings by period if needed (for multiple periods)
    const aggregatedData = {
      period,
      periodStart: startDate.toISOString().split('T')[0],
      periodEnd: endDate.toISOString().split('T')[0],
      totalBookings: bookingsData.length,
      subtotal,
      total: subtotal, // Can add tax if needed
      bookings: bookingsData.map((booking: any) => ({
        id: booking.id,
        bookingCode: booking.booking_code,
        tripDate: booking.trip_date,
        createdAt: booking.created_at,
        customerName: booking.customer_name,
        packageName: booking.package?.name || null,
        packageDestination: booking.package?.destination || null,
        adultPax: booking.adult_pax || 0,
        childPax: booking.child_pax || 0,
        infantPax: booking.infant_pax || 0,
        totalAmount: Number(booking.nta_total || booking.total_amount || 0),
        status: booking.status,
      })),
    };

    return NextResponse.json(aggregatedData);
  } catch (error) {
    logger.error('Failed to fetch aggregated invoices', error, {
      userId: user.id,
      period,
      from,
      to,
    });
    throw error;
  }
});

