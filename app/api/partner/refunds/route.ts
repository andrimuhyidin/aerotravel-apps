/**
 * API: Partner Refunds
 * GET /api/partner/refunds - List refunds for partner bookings
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
  const status = searchParams.get('status'); // Filter by refund status
  const from = searchParams.get('from'); // Date range start
  const to = searchParams.get('to'); // Date range end
  const search = searchParams.get('search'); // Search by booking code
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = (page - 1) * limit;

  const client = supabase as unknown as any;

  try {
    // First, get all booking IDs for this partner
    const { data: partnerBookings, error: bookingsError } = await client
      .from('bookings')
      .select('id')
      .eq('mitra_id', user.id);

    if (bookingsError) {
      logger.error('Failed to fetch partner bookings', bookingsError, { userId: user.id });
      return NextResponse.json(
        { error: 'Failed to fetch refunds', details: bookingsError.message },
        { status: 500 }
      );
    }

    const bookingIds = (partnerBookings || []).map((b: any) => b.id);

    if (bookingIds.length === 0) {
      return NextResponse.json({
        refunds: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      });
    }

    // Build query - filter refunds by booking IDs
    let query = client
      .from('refunds')
      .select(
        `
        id,
        booking_id,
        payment_id,
        original_amount,
        refund_percent,
        admin_fee,
        refund_amount,
        days_before_trip,
        policy_applied,
        status,
        refund_to,
        bank_name,
        bank_account_number,
        bank_account_name,
        is_override,
        override_reason,
        approved_by,
        approved_at,
        processed_at,
        completed_at,
        disbursement_id,
        requested_by,
        created_at,
        updated_at,
        booking:bookings!refunds_booking_id_fkey(
          id,
          booking_code,
          trip_date,
          customer_name,
          customer_phone,
          customer_email,
          total_amount,
          nta_total,
          status,
          mitra_id,
          package:packages(id, name, destination)
        )
      `,
        { count: 'exact' }
      )
      .in('booking_id', bookingIds); // Filter by partner's booking IDs

    // Filter by status
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Filter by date range (created_at)
    if (from) {
      query = query.gte('created_at', from);
    }
    if (to) {
      query = query.lte('created_at', to);
    }

    // Search by booking code
    if (search) {
      query = query.ilike('booking.booking_code', `%${search}%`);
    }

    // Order by created_at (newest first)
    query = query.order('created_at', { ascending: false });

    // Paginate
    const { data: refunds, error, count } = await query.range(offset, offset + limit - 1);

    if (error) {
      logger.error('Failed to fetch partner refunds', error, {
        userId: user.id,
        status,
        search,
      });
      return NextResponse.json(
        { error: 'Failed to fetch refunds', details: error.message },
        { status: 500 }
      );
    }

    // Transform refunds data
    const transformedRefunds = (refunds || []).map((refund: any) => ({
      id: refund.id,
      bookingId: refund.booking_id,
      bookingCode: refund.booking?.booking_code || null,
      tripDate: refund.booking?.trip_date || null,
      customerName: refund.booking?.customer_name || null,
      customerPhone: refund.booking?.customer_phone || null,
      customerEmail: refund.booking?.customer_email || null,
      packageName: refund.booking?.package?.name || null,
      packageDestination: refund.booking?.package?.destination || null,
      originalAmount: Number(refund.original_amount || 0),
      refundPercent: Number(refund.refund_percent || 0),
      adminFee: Number(refund.admin_fee || 0),
      refundAmount: Number(refund.refund_amount || 0),
      daysBeforeTrip: refund.days_before_trip || 0,
      policyApplied: refund.policy_applied || null,
      status: refund.status,
      refundTo: refund.refund_to || 'wallet',
      bankName: refund.bank_name || null,
      bankAccountNumber: refund.bank_account_number || null,
      bankAccountName: refund.bank_account_name || null,
      isOverride: refund.is_override || false,
      overrideReason: refund.override_reason || null,
      approvedBy: refund.approved_by || null,
      approvedAt: refund.approved_at || null,
      processedAt: refund.processed_at || null,
      completedAt: refund.completed_at || null,
      disbursementId: refund.disbursement_id || null,
      requestedBy: refund.requested_by || null,
      createdAt: refund.created_at,
      updatedAt: refund.updated_at,
    }));

    return NextResponse.json({
      refunds: transformedRefunds,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    logger.error('Failed to fetch partner refunds', error, {
      userId: user.id,
    });
    throw error;
  }
});

