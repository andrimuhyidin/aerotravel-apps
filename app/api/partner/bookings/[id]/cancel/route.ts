/**
 * API: Cancel Partner Booking
 * POST /api/partner/bookings/[id]/cancel
 * 
 * Cancels a booking with refund calculation and processing
 */

import { withErrorHandler } from '@/lib/api/error-handler';
import { verifyPartnerAccess, sanitizeRequestBody } from '@/lib/api/partner-helpers';
import { creditWallet } from '@/lib/partner/wallet';
import { canCancelBooking, calculateRefund } from '@/lib/partner/refund-calculator';
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

  // Verify partner access
  const { isPartner, partnerId } = await verifyPartnerAccess(user.id);
  if (!isPartner || !partnerId) {
    return NextResponse.json({ error: 'Partner access required' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const sanitizedBody = sanitizeRequestBody(body, { strings: ['reason'] });
  const { reason } = sanitizedBody;

  const client = supabase as unknown as any;

  try {
    // Get booking and verify ownership
    const { data: booking, error: bookingError } = await client
      .from('bookings')
      .select(`
        id,
        booking_code,
        trip_date,
        package_id,
        status,
        mitra_id,
        total_amount,
        nta_total,
        source
      `)
      .eq('id', bookingId)
      .eq('mitra_id', partnerId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Check if booking can be cancelled
    const cancelCheck = canCancelBooking(booking.trip_date, booking.status);
    if (!cancelCheck.canCancel) {
      return NextResponse.json(
        { error: cancelCheck.reason || 'Booking cannot be cancelled' },
        { status: 400 }
      );
    }

    // Calculate refund
    const refundCalculation = calculateRefund(
      booking.trip_date,
      booking.nta_total || booking.total_amount
    );

    // Get package_id and trip_date for cache invalidation
    const packageId = (booking as { package_id?: string }).package_id;
    const tripDate = booking.trip_date;

    // Update booking status
    const { error: updateError } = await client
      .from('bookings')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancelled_by: user.id,
        cancellation_reason: reason || refundCalculation.policy,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId);

    if (updateError) {
      logger.error('Failed to cancel booking', updateError, { bookingId });
      return NextResponse.json(
        { error: 'Failed to cancel booking' },
        { status: 500 }
      );
    }

    // Invalidate availability cache for this package and trip date
    if (packageId && tripDate) {
      try {
        const { invalidateAvailabilityCache } = await import('@/lib/cache/package-availability-cache');
        await invalidateAvailabilityCache(packageId, tripDate);
        logger.debug('Invalidated availability cache on cancel', { packageId, tripDate });
      } catch (cacheError) {
        // Non-critical - log but don't fail
        logger.warn('Failed to invalidate availability cache on cancel', cacheError, {
          packageId,
          tripDate,
        });
      }
    }

    // Emit booking.cancelled event (non-blocking)
    try {
      const { emitEvent } = await import('@/lib/events/event-bus');
      await emitEvent(
        {
          type: 'booking.cancelled',
          app: 'partner',
          userId: user.id,
          data: {
            bookingId: booking.id,
            bookingCode: booking.booking_code,
            packageId: packageId,
            tripDate: tripDate,
            refundAmount: refundCalculation.refundAmount,
            refundPercentage: refundCalculation.refundPercentage,
            cancellationReason: reason || refundCalculation.policy,
          },
        },
        {
          ipAddress: request.headers.get('x-forwarded-for') || undefined,
          userAgent: request.headers.get('user-agent') || undefined,
        }
      ).catch((eventError) => {
        logger.warn('Failed to emit booking.cancelled event', eventError);
      });
    } catch (eventError) {
      logger.warn('Event emission error (non-critical)', {
        error: eventError instanceof Error ? eventError.message : String(eventError),
      });
    }

    // Process refund if applicable
    if (refundCalculation.refundable && refundCalculation.refundAmount > 0) {
      // Check payment method to determine refund destination
      // If wallet payment, refund to wallet
      // If external payment, need to check payment status
      
      // Get payment record
      const { data: payment } = await client
        .from('payments')
        .select('id, status, payment_method')
        .eq('booking_id', bookingId)
        .maybeSingle();

      // Check if booking was paid via wallet (status was 'paid' immediately after creation)
      // or if there's no payment record (wallet was used)
      // For mitra bookings, if status is 'paid' and no payment record, it's wallet payment
      const isWalletPayment = !payment || (booking.status === 'paid' && booking.source === 'mitra');
      
      if (isWalletPayment) {
        const refundResult = await creditWallet(
          user.id,
          refundCalculation.refundAmount,
          'refund_credit',
          `Refund untuk pembatalan booking ${booking.booking_code}`,
          bookingId
        );

        if (!refundResult.success) {
          logger.error('Failed to credit wallet for refund', {
            bookingId,
            refundAmount: refundCalculation.refundAmount,
          });
          // Don't fail cancellation, but log error
        } else {
          logger.info('Refund credited to wallet', {
            bookingId,
            refundAmount: refundCalculation.refundAmount,
          });
        }
      } else {
        // External payment - mark payment for refund (manual processing may be needed)
        await client
          .from('payments')
          .update({
            status: 'refunded',
            refunded_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', payment.id)
          .catch((refundError: unknown) => {
            logger.warn('Failed to update payment status for refund', { error: refundError instanceof Error ? refundError.message : String(refundError) });
          });
      }
    }

    // Create in-app notification (non-blocking)
    try {
      const { createPartnerNotification } = await import('@/lib/partner/notifications');
      createPartnerNotification(
        user.id,
        'booking_cancelled',
        'Booking Dibatalkan',
        `Booking ${booking.booking_code} telah dibatalkan.${refundCalculation.refundable ? ` Refund ${refundCalculation.refundAmount.toLocaleString('id-ID')} telah dikreditkan ke wallet.` : ''}`,
        { bookingId: booking.id, bookingCode: booking.booking_code, refundAmount: refundCalculation.refundAmount }
      ).catch((notifError) => {
        logger.warn('Failed to create notification', notifError);
      });
    } catch (notifError) {
      logger.warn('Notification error (non-critical)', { error: notifError instanceof Error ? notifError.message : String(notifError) });
    }

    // Send cancellation email notification (non-blocking)
    try {
      const { sendBookingCancellationEmail } = await import('@/lib/partner/email-notifications');
      
      const { data: partnerProfile } = await client
        .from('users')
        .select('email, full_name')
        .eq('id', user.id)
        .single();

      if (partnerProfile?.email) {
        sendBookingCancellationEmail(
          partnerProfile.email,
          partnerProfile.full_name || 'Partner',
          booking.booking_code,
          refundCalculation.refundAmount,
          refundCalculation.refundPercentage
        ).catch((emailError) => {
          logger.warn('Failed to send cancellation email', emailError);
        });
      }
    } catch (emailError) {
      logger.warn('Email notification error (non-critical)', { error: emailError instanceof Error ? emailError.message : String(emailError) });
    }

    return NextResponse.json({
      success: true,
      data: {
        bookingId: booking.id,
        bookingCode: booking.booking_code,
        refund: refundCalculation,
      },
    });
  } catch (error) {
    logger.error('Failed to cancel booking', error, {
      bookingId,
      userId: user.id,
    });
    throw error;
  }
});

