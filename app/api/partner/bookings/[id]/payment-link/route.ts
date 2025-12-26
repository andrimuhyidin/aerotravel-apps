/**
 * API: Get Payment Link for Booking
 * GET /api/partner/bookings/[id]/payment-link
 * 
 * Returns payment link for external payment bookings
 */

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { NextRequest, NextResponse } from 'next/server';

type Params = Promise<{ id: string }>;

export const GET = withErrorHandler(async (
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

  const client = supabase as unknown as any;

  try {
    // Get booking and verify ownership
    const { data: booking, error: bookingError } = await client
      .from('bookings')
      .select('id, booking_code, status, mitra_id, total_amount')
      .eq('id', bookingId)
      .eq('mitra_id', user.id)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Check if booking is pending payment
    if (booking.status !== 'pending_payment') {
      return NextResponse.json(
        { error: 'Booking is not pending payment' },
        { status: 400 }
      );
    }

    // Get payment record
    const { data: payment, error: paymentError } = await client
      .from('payments')
      .select('id, payment_url, status, external_id')
      .eq('booking_id', bookingId)
      .maybeSingle();

    if (payment && payment.payment_url) {
      // Return existing payment link
      return NextResponse.json({
        paymentLink: payment.payment_url,
        status: payment.status,
      });
    }

    // If no payment record exists, generate new payment link
    // This should not happen if booking was created correctly, but handle it
    return NextResponse.json(
      { error: 'Payment link not found. Please contact support.' },
      { status: 404 }
    );
  } catch (error) {
    logger.error('Failed to get payment link', error, {
      bookingId,
      userId: user.id,
    });
    throw error;
  }
});

