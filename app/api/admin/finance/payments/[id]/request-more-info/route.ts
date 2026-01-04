/**
 * API: Admin - Request More Info for Payment
 * POST /api/admin/finance/payments/[id]/request-more-info - Request additional proof
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { hasRole } from '@/lib/session/active-role';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const requestMoreInfoSchema = z.object({
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const POST = withErrorHandler(async (request: NextRequest, context: RouteContext) => {
  // Check authorization
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
  const parsed = requestMoreInfoSchema.safeParse(body);
  
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { reason } = parsed.data;
  const supabase = await createAdminClient();

  try {
    // Get current payment
    const { data: payment, error: fetchError } = await supabase
      .from('payments')
      .select('id, verification_status, booking_id')
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
        { error: `Cannot request more info - payment already ${payment.verification_status}` },
        { status: 400 }
      );
    }

    const previousStatus = payment.verification_status;
    const now = new Date().toISOString();

    // Update payment
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        verification_status: 'more_info_needed',
        more_info_requested: true,
        more_info_reason: reason,
        more_info_requested_at: now,
        updated_at: now,
      })
      .eq('id', paymentId);

    if (updateError) {
      logger.error('Failed to update payment', updateError);
      return NextResponse.json(
        { error: 'Failed to request more info' },
        { status: 500 }
      );
    }

    // Create verification log
    await supabase.from('payment_verification_logs').insert({
      payment_id: paymentId,
      action: 'more_info_requested',
      previous_status: previousStatus,
      new_status: 'more_info_needed',
      notes: reason,
      performed_by: user.id,
    });

    // TODO: Send notification to customer requesting additional proof
    // await sendMoreInfoRequestNotification(payment.booking_id, reason);

    logger.info('More info requested for payment', {
      paymentId,
      reason,
      requestedBy: user.id,
    });

    return NextResponse.json({
      success: true,
      message: 'More information requested from customer',
      payment: {
        id: paymentId,
        verification_status: 'more_info_needed',
      },
    });
  } catch (error) {
    logger.error('Unexpected error in request more info', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

