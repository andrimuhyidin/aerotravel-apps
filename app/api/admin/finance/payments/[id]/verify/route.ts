/**
 * API: Admin - Verify Payment
 * POST /api/admin/finance/payments/[id]/verify - Approve or reject payment
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { hasRole } from '@/lib/session/active-role';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const verifyPaymentSchema = z.object({
  action: z.enum(['approve', 'reject']),
  notes: z.string().optional(),
  rejectionReason: z.string().optional(),
}).refine(
  (data) => data.action !== 'reject' || (data.rejectionReason && data.rejectionReason.trim().length > 0),
  { message: 'Rejection reason is required when rejecting', path: ['rejectionReason'] }
);

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const POST = withErrorHandler(async (request: NextRequest, context: RouteContext) => {
  // Check authorization - only super_admin and finance_manager can verify
  const allowed = await hasRole(['super_admin', 'finance_manager']);
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id: paymentId } = await context.params;
  
  // Get current user
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Parse and validate request body
  const body = await request.json();
  const parsed = verifyPaymentSchema.safeParse(body);
  
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { action, notes, rejectionReason } = parsed.data;
  const supabase = await createAdminClient();

  try {
    // Get current payment
    const { data: payment, error: fetchError } = await supabase
      .from('payments')
      .select('id, verification_status, booking_id, amount')
      .eq('id', paymentId)
      .single();

    if (fetchError || !payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Check if already verified/rejected
    if (payment.verification_status === 'verified' || payment.verification_status === 'rejected') {
      return NextResponse.json(
        { error: `Payment already ${payment.verification_status}` },
        { status: 400 }
      );
    }

    const previousStatus = payment.verification_status;
    const newStatus = action === 'approve' ? 'verified' : 'rejected';
    const now = new Date().toISOString();

    // Update payment
    const updateData: Record<string, unknown> = {
      verification_status: newStatus,
      verified_by: user.id,
      verified_at: now,
      verification_notes: notes || null,
      updated_at: now,
    };

    if (action === 'reject') {
      updateData.rejection_reason = rejectionReason;
    }

    if (action === 'approve') {
      // Also update payment status to 'paid' if approving
      updateData.status = 'paid';
      updateData.paid_at = now;
    }

    const { error: updateError } = await supabase
      .from('payments')
      .update(updateData)
      .eq('id', paymentId);

    if (updateError) {
      logger.error('Failed to update payment', updateError);
      return NextResponse.json(
        { error: 'Failed to verify payment' },
        { status: 500 }
      );
    }

    // If approved, update booking status to confirmed
    if (action === 'approve' && payment.booking_id) {
      await supabase
        .from('bookings')
        .update({
          status: 'confirmed',
          payment_status: 'paid',
          updated_at: now,
        })
        .eq('id', payment.booking_id);
    }

    // Create verification log
    await supabase.from('payment_verification_logs').insert({
      payment_id: paymentId,
      action: action === 'approve' ? 'verified' : 'rejected',
      previous_status: previousStatus,
      new_status: newStatus,
      notes: notes || null,
      rejection_reason: action === 'reject' ? rejectionReason : null,
      performed_by: user.id,
    });

    // TODO: Send notification to customer
    // await sendPaymentVerificationNotification(payment.booking_id, action, rejectionReason);

    logger.info('Payment verified', {
      paymentId,
      action,
      verifiedBy: user.id,
    });

    return NextResponse.json({
      success: true,
      message: action === 'approve' 
        ? 'Payment approved successfully' 
        : 'Payment rejected',
      payment: {
        id: paymentId,
        verification_status: newStatus,
      },
    });
  } catch (error) {
    logger.error('Unexpected error in payment verification', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

