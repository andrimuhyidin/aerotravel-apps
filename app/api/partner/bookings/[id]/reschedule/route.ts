/**
 * API: Partner Booking Reschedule Request
 * POST /api/partner/bookings/[id]/reschedule - Create reschedule request
 */

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { NextRequest, NextResponse } from 'next/server';

type Params = Promise<{ id: string }>;

export const POST = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Params }
) => {
  const { id: bookingId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { requestedTripDate, reason } = body;

  if (!requestedTripDate) {
    return NextResponse.json(
      { error: 'Requested trip date is required' },
      { status: 400 }
    );
  }

  const client = supabase as unknown as any;

  try {
    // Check if booking exists and belongs to partner
    const { data: existingBooking } = await client
      .from('bookings')
      .select('id, status, trip_date')
      .eq('id', bookingId)
      .eq('mitra_id', user.id)
      .single();

    if (!existingBooking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Check if there's already a pending request
    const { data: existingRequest } = await client
      .from('booking_reschedule_requests')
      .select('id')
      .eq('booking_id', bookingId)
      .eq('status', 'pending')
      .single();

    if (existingRequest) {
      return NextResponse.json(
        { error: 'There is already a pending reschedule request for this booking' },
        { status: 400 }
      );
    }

    // Create reschedule request
    const { data: rescheduleRequest, error } = await client
      .from('booking_reschedule_requests')
      .insert({
        booking_id: bookingId,
        partner_id: user.id,
        requested_trip_date: requestedTripDate,
        reason: reason || null,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create reschedule request', error, {
        bookingId,
        userId: user.id,
      });
      return NextResponse.json(
        { error: 'Failed to create reschedule request', details: error.message },
        { status: 500 }
      );
    }

    logger.info('Reschedule request created', {
      bookingId,
      requestId: rescheduleRequest.id,
      userId: user.id,
    });

    return NextResponse.json({ rescheduleRequest }, { status: 201 });
  } catch (error) {
    logger.error('Failed to create reschedule request', error, {
      bookingId,
      userId: user.id,
    });
    throw error;
  }
});

