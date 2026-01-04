/**
 * API: Admin - Process Refund
 * POST /api/admin/finance/refunds/[id]/process - Approve, reject, or complete refund
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { hasRole } from '@/lib/session/active-role';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const processRefundSchema = z.object({
  action: z.enum(['approve', 'reject', 'complete', 'fail']),
  notes: z.string().optional(),
  rejectionReason: z.string().optional(),
  transactionReference: z.string().optional(),
}).refine(
  (data) => data.action !== 'reject' || (data.rejectionReason && data.rejectionReason.trim().length > 0),
  { message: 'Rejection reason is required when rejecting', path: ['rejectionReason'] }
);

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const POST = withErrorHandler(async (request: NextRequest, context: RouteContext) => {
  // Check authorization - only finance_manager and super_admin can process refunds
  const allowed = await hasRole(['super_admin', 'finance_manager']);
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id: refundId } = await context.params;

  // Get current user
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Parse and validate request body
  const body = await request.json();
  const parsed = processRefundSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { action, notes, rejectionReason, transactionReference } = parsed.data;
  const supabase = await createAdminClient();
  const now = new Date().toISOString();

  try {
    // Get current refund
    const { data: refund, error: fetchError } = await supabase
      .from('refunds')
      .select('id, status, booking_id, refund_amount')
      .eq('id', refundId)
      .single();

    if (fetchError || !refund) {
      return NextResponse.json(
        { error: 'Refund not found' },
        { status: 404 }
      );
    }

    // Validate status transitions
    const validTransitions: Record<string, string[]> = {
      pending: ['approved', 'rejected'],
      approved: ['processing', 'completed', 'failed'],
      processing: ['completed', 'failed'],
      completed: [],
      failed: ['processing', 'approved'],
      rejected: [],
    };

    const currentStatus = refund.status;
    const newStatus = action === 'approve' ? 'approved' :
                     action === 'reject' ? 'rejected' :
                     action === 'complete' ? 'completed' : 'failed';

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      return NextResponse.json(
        { error: `Cannot ${action} refund with status: ${currentStatus}` },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {
      status: newStatus,
      updated_at: now,
    };

    if (action === 'approve') {
      updateData.approved_by = user.id;
      updateData.approved_at = now;
      updateData.approval_notes = notes || null;
    } else if (action === 'reject') {
      updateData.rejected_by = user.id;
      updateData.rejected_at = now;
      updateData.rejection_reason = rejectionReason;
    } else if (action === 'complete') {
      updateData.completed_at = now;
      updateData.transaction_reference = transactionReference || null;
    }

    // Update refund
    const { error: updateError } = await supabase
      .from('refunds')
      .update(updateData)
      .eq('id', refundId);

    if (updateError) {
      logger.error('Failed to process refund', updateError);
      return NextResponse.json(
        { error: 'Failed to process refund' },
        { status: 500 }
      );
    }

    // TODO: Send notification to customer
    // await sendRefundStatusNotification(refund.booking_id, newStatus, refund.refund_amount);

    logger.info('Refund processed', {
      refundId,
      action,
      newStatus,
      processedBy: user.id,
    });

    return NextResponse.json({
      success: true,
      message: `Refund ${action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : action === 'complete' ? 'completed' : 'marked as failed'}`,
      refund: {
        id: refundId,
        status: newStatus,
      },
    });
  } catch (error) {
    logger.error('Unexpected error in process refund', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

