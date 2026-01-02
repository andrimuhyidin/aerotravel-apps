/**
 * API: Partner Invoices
 * GET /api/partner/invoices - List invoices with filter & pagination
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { sanitizeSearchParams, verifyPartnerAccess } from '@/lib/api/partner-helpers';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

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
  const status = sanitizedParams.status || null; // paid, pending, overdue
  const from = sanitizedParams.from || null;
  const to = sanitizedParams.to || null;
  const search = sanitizedParams.search || null;
  const page = parseInt(sanitizedParams.page || '1');
  const limit = Math.min(parseInt(sanitizedParams.limit || '20'), 100); // Max 100
  const offset = (page - 1) * limit;

  const client = supabase as unknown as any;

  try {
    // Build query with payments join using verified partnerId
    let query = client
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
        customer_name,
        customer_phone,
        customer_email,
        created_at,
        package:packages(id, name, destination),
        payments(id, status, payment_method, paid_at, amount)
      `,
        { count: 'exact' }
      )
      .eq('mitra_id', partnerId);

    // Filter by payment status
    if (status && status !== 'all') {
      if (status === 'paid') {
        query = query.eq('status', 'paid');
      } else if (status === 'pending') {
        query = query.in('status', ['pending_payment', 'confirmed']);
      } else if (status === 'overdue') {
        // Overdue = pending_payment with trip_date < today
        const today = new Date().toISOString().split('T')[0];
        query = query
          .eq('status', 'pending_payment')
          .lt('trip_date', today);
      }
    }

    // Filter by date range (trip_date)
    if (from) {
      query = query.gte('trip_date', from);
    }
    if (to) {
      query = query.lte('trip_date', to);
    }

    // Search filter
    if (search) {
      query = query.or(
        `booking_code.ilike.%${search}%,customer_name.ilike.%${search}%,package:packages.name.ilike.%${search}%`
      );
    }

    // Order by created_at (newest first)
    query = query.order('created_at', { ascending: false });

    // Paginate
    const { data: bookings, error, count } = await query.range(offset, offset + limit - 1);

    if (error) {
      logger.error('Failed to fetch partner invoices', error, {
        userId: user.id,
        status,
        search,
      });
      return NextResponse.json(
        { error: 'Failed to fetch invoices', details: error.message },
        { status: 500 }
      );
    }

    // Transform to invoice format
    const invoices = (bookings || []).map((booking: any) => {
      // Get latest payment if exists
      const payments = booking.payments || [];
      const latestPayment =
        payments.length > 0
          ? payments.sort(
              (a: any, b: any) =>
                new Date(b.created_at || 0).getTime() -
                new Date(a.created_at || 0).getTime()
            )[0]
          : null;

      return {
        id: booking.id,
        bookingCode: booking.booking_code,
        tripDate: booking.trip_date,
        customerName: booking.customer_name,
        customerPhone: booking.customer_phone,
        customerEmail: booking.customer_email,
        packageName: booking.package?.name || null,
        packageDestination: booking.package?.destination || null,
        totalAmount: Number(booking.nta_total || booking.total_amount || 0),
        status: booking.status,
        paymentStatus: latestPayment?.status || 'pending',
        paymentMethod: latestPayment?.payment_method || null,
        paymentDate: latestPayment?.paid_at || null,
        createdAt: booking.created_at,
        adultPax: booking.adult_pax || 0,
        childPax: booking.child_pax || 0,
        infantPax: booking.infant_pax || 0,
      };
    });

    // Calculate summary
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // We need to fetch all bookings for current month to calculate summary
    const summaryQuery = client
      .from('bookings')
      .select('id, status, total_amount, nta_total')
      .eq('mitra_id', partnerId) // Use verified partnerId
      .gte('created_at', firstDayOfMonth.toISOString());

    const { data: allMonthBookings } = await summaryQuery;

    let totalInvoices = 0;
    let totalPaid = 0;
    let totalPending = 0;
    let totalAmount = 0;

    if (allMonthBookings) {
      totalInvoices = allMonthBookings.length;
      allMonthBookings.forEach((b: any) => {
        const amount = Number(b.nta_total || b.total_amount || 0);
        totalAmount += amount;
        if (b.status === 'paid') {
          totalPaid += 1;
        } else {
          totalPending += 1;
        }
      });
    }

    return NextResponse.json({
      invoices,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
      summary: {
        totalInvoices,
        totalPaid,
        totalPending,
        totalAmount,
      },
    });
  } catch (error) {
    logger.error('Failed to fetch partner invoices', error, {
      userId: user.id,
    });
    throw error;
  }
});

