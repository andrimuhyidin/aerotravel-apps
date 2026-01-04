/**
 * API: Admin - Cancel Booking
 * POST /api/admin/bookings/[bookingId]/cancel - Cancel a booking with refund calculation
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { hasRole } from '@/lib/session/active-role';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { calculateRefund } from '@/lib/booking/refund-calculator';

const cancelBookingSchema = z.object({
  reason: z.string().min(5, 'Reason must be at least 5 characters'),
  processRefund: z.boolean().default(true),
  refundMethod: z.enum(['bank_transfer', 'wallet', 'credit']).optional(),
  bankName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankAccountName: z.string().optional(),
});

type RouteContext = {
  params: Promise<{ bookingId: string }>;
};

export const POST = withErrorHandler(async (request: NextRequest, context: RouteContext) => {
  // Check authorization
  const allowed = await hasRole(['super_admin', 'ops_admin', 'finance_manager']);
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { bookingId } = await context.params;

  // Get current user
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Parse and validate request body
  const body = await request.json();
  const parsed = cancelBookingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { 
    reason, 
    processRefund, 
    refundMethod,
    bankName,
    bankAccountNumber,
    bankAccountName,
  } = parsed.data;
  
  const supabase = await createAdminClient();
  const now = new Date().toISOString();

  try {
    // Get booking details
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select(`
        id,
        booking_code,
        trip_date,
        total_amount,
        status,
        customer_name,
        customer_email,
        customer_phone
      `)
      .eq('id', bookingId)
      .single();

    if (fetchError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Check if already cancelled
    if (booking.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Booking is already cancelled' },
        { status: 400 }
      );
    }

    // Calculate refund if requested
    let refundData = null;
    if (processRefund) {
      refundData = await calculateRefund(
        booking.total_amount,
        booking.trip_date,
        new Date()
      );
    }

    // Update booking status
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        cancelled_at: now,
        cancellation_reason: reason,
        cancelled_by: user.id,
        updated_at: now,
      })
      .eq('id', bookingId);

    if (updateError) {
      logger.error('Failed to cancel booking', updateError);
      return NextResponse.json(
        { error: 'Failed to cancel booking' },
        { status: 500 }
      );
    }

    // Create refund record if applicable
    let refundId = null;
    if (processRefund && refundData && refundData.refundAmount > 0) {
      // Get payment for this booking
      const { data: payment } = await supabase
        .from('payments')
        .select('id')
        .eq('booking_id', bookingId)
        .eq('status', 'paid')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const { data: refund, error: refundError } = await supabase
        .from('refunds')
        .insert({
          booking_id: bookingId,
          payment_id: payment?.id || null,
          refund_amount: refundData.refundAmount,
          original_amount: refundData.originalAmount,
          refund_percent: refundData.refundPercentage,
          policy_applied: `${refundData.appliedPolicy.name}: ${reason}`,
          refund_to: refundMethod || 'bank_transfer',
          status: 'pending',
          bank_name: bankName || null,
          bank_account_number: bankAccountNumber || null,
          bank_account_name: bankAccountName || null,
          requested_by: user.id,
          days_before_trip: refundData.appliedPolicy.days_before_trip || 0,
        })
        .select('id')
        .single();

      if (refundError) {
        logger.error('Failed to create refund record', refundError);
      } else {
        refundId = refund?.id;
      }
    }

    // Log the modification
    await supabase.from('booking_modifications').insert({
      booking_id: bookingId,
      modified_by: user.id,
      modification_type: 'cancellation',
      old_value: { status: booking.status },
      new_value: { 
        status: 'cancelled',
        cancellation_reason: reason,
        refund_amount: refundData?.refundAmount || 0,
      },
      reason,
    });

    // Audit log (non-blocking)
    try {
      const { logAuditEvent } = await import('@/lib/audit/cross-app-audit');
      await logAuditEvent(
        'admin',
        user.id,
        'cancel',
        'booking',
        bookingId,
        {
          bookingCode: booking.booking_code,
          customerName: booking.customer_name,
          oldStatus: booking.status,
          newStatus: 'cancelled',
          reason,
          refundAmount: refundData?.refundAmount || 0,
        },
        {
          ipAddress: request.headers.get('x-forwarded-for') || undefined,
          userAgent: request.headers.get('user-agent') || undefined,
        }
      );
    } catch (auditError) {
      logger.warn('Audit log error (non-critical)', auditError);
    }

    // Emit booking.cancelled event (non-blocking)
    try {
      const { emitEvent } = await import('@/lib/events/event-bus');
      await emitEvent(
        {
          type: 'booking.cancelled',
          app: 'admin',
          userId: user.id,
          data: {
            bookingId,
            bookingCode: booking.booking_code,
            customerName: booking.customer_name,
            reason,
            refundAmount: refundData?.refundAmount || 0,
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
      logger.warn('Event emission error (non-critical)', eventError);
    }

    // TODO: Send notification to customer
    // await sendCancellationNotification(booking, refundData);

    logger.info('Booking cancelled', {
      bookingId,
      bookingCode: booking.booking_code,
      cancelledBy: user.id,
      refundAmount: refundData?.refundAmount || 0,
    });

    return NextResponse.json({
      success: true,
      message: 'Booking berhasil dibatalkan',
      booking: {
        id: bookingId,
        booking_code: booking.booking_code,
        status: 'cancelled',
      },
      refund: refundData ? {
        id: refundId,
        amount: refundData.refundAmount,
        percentage: refundData.refundPercentage,
        policy: refundData.appliedPolicy.name,
        daysBeforeTrip: refundData.daysBeforeTrip,
      } : null,
    });
  } catch (error) {
    logger.error('Unexpected error in cancel booking', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

