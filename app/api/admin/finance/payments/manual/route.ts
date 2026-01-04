/**
 * API: Admin - Manual Payment Entry
 * POST /api/admin/finance/payments/manual - Record manual payment
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { hasRole } from '@/lib/session/active-role';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const manualPaymentSchema = z.object({
  bookingId: z.string().uuid(),
  amount: z.number().min(1),
  paymentMethod: z.enum(['cash', 'manual_transfer', 'xendit_invoice', 'xendit_va', 'xendit_qris', 'xendit_ewallet', 'xendit_card', 'mitra_wallet']),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  referenceNumber: z.string().optional(),
  paidAt: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  // Check authorization
  const allowed = await hasRole(['super_admin', 'finance_manager', 'ops_admin']);
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Get current user
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Parse and validate request body
  const body = await request.json();
  const parsed = manualPaymentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.issues },
      { status: 400 }
    );
  }

  const {
    bookingId,
    amount,
    paymentMethod,
    bankName,
    accountNumber,
    referenceNumber,
    paidAt,
    notes,
  } = parsed.data;

  const supabase = await createAdminClient();
  const now = new Date().toISOString();

  try {
    // Verify booking exists
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, booking_code, total_amount, status')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Create payment record
    const paymentCode = `PAY-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        booking_id: bookingId,
        payment_code: paymentCode,
        amount,
        payment_method: paymentMethod,
        status: 'paid',
        verification_status: 'verified',
        verified_by: user.id,
        verified_at: now,
        verification_notes: notes || 'Manual payment entry',
        is_manual: true,
        manual_entry_by: user.id,
        bank_name: bankName || null,
        account_number: accountNumber || null,
        paid_at: paidAt || now,
      })
      .select('id')
      .single();

    if (paymentError || !payment) {
      logger.error('Failed to create manual payment', paymentError);
      return NextResponse.json(
        { error: 'Failed to create payment' },
        { status: 500 }
      );
    }

    // Update booking status if fully paid
    if (amount >= booking.total_amount) {
      await supabase
        .from('bookings')
        .update({
          status: 'confirmed',
          payment_status: 'paid',
          updated_at: now,
        })
        .eq('id', bookingId);
    } else {
      // Partial payment
      await supabase
        .from('bookings')
        .update({
          payment_status: 'partial',
          updated_at: now,
        })
        .eq('id', bookingId);
    }

    // Log the action
    await supabase.from('payment_verification_logs').insert({
      payment_id: payment.id,
      action: 'manual_entry',
      previous_status: 'none',
      new_status: 'verified',
      notes: `Manual payment entry: ${paymentMethod}${referenceNumber ? ` - Ref: ${referenceNumber}` : ''}`,
      performed_by: user.id,
    });

    logger.info('Manual payment created', {
      paymentId: payment.id,
      bookingId,
      bookingCode: booking.booking_code,
      amount,
      enteredBy: user.id,
    });

    return NextResponse.json({
      success: true,
      message: 'Pembayaran manual berhasil dicatat',
      payment: {
        id: payment.id,
        amount,
        bookingCode: booking.booking_code,
      },
    });
  } catch (error) {
    logger.error('Unexpected error in manual payment', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

