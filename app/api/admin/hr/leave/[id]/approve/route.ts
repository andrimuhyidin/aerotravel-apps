/**
 * API: Admin - Approve/Reject Leave Request
 * POST /api/admin/hr/leave/[id]/approve - Approve or reject leave request
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { hasRole } from '@/lib/session/active-role';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const approveLeaveSchema = z.object({
  action: z.enum(['approve', 'reject']),
  notes: z.string().optional(),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const POST = withErrorHandler(async (request: NextRequest, context: RouteContext) => {
  // Check authorization
  const allowed = await hasRole(['super_admin', 'ops_admin']);
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id: leaveId } = await context.params;

  // Get current user
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Parse and validate request body
  const body = await request.json();
  const parsed = approveLeaveSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.errors },
      { status: 400 }
    );
  }

  const { action, notes } = parsed.data;
  const supabase = await createAdminClient();
  const now = new Date().toISOString();

  try {
    // Get leave request
    const { data: leaveRequest, error: fetchError } = await supabase
      .from('leave_requests')
      .select('id, employee_id, leave_type, days_count, status')
      .eq('id', leaveId)
      .single();

    if (fetchError || !leaveRequest) {
      return NextResponse.json(
        { error: 'Leave request not found' },
        { status: 404 }
      );
    }

    if (leaveRequest.status !== 'pending') {
      return NextResponse.json(
        { error: `Cannot ${action} - request already ${leaveRequest.status}` },
        { status: 400 }
      );
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    // Update leave request
    const { error: updateError } = await supabase
      .from('leave_requests')
      .update({
        status: newStatus,
        reviewed_by: user.id,
        reviewed_at: now,
        review_notes: notes || null,
        updated_at: now,
      })
      .eq('id', leaveId);

    if (updateError) {
      logger.error('Failed to update leave request', updateError);
      return NextResponse.json(
        { error: 'Failed to process leave request' },
        { status: 500 }
      );
    }

    // If approved, update leave balance
    if (action === 'approve') {
      const currentYear = new Date().getFullYear();
      
      // Try to update existing balance
      const { data: balance } = await supabase
        .from('leave_balances')
        .select('id, used_days, remaining_days')
        .eq('employee_id', leaveRequest.employee_id)
        .eq('year', currentYear)
        .eq('leave_type', leaveRequest.leave_type)
        .single();

      if (balance) {
        await supabase
          .from('leave_balances')
          .update({
            used_days: balance.used_days + leaveRequest.days_count,
            remaining_days: balance.remaining_days - leaveRequest.days_count,
            updated_at: now,
          })
          .eq('id', balance.id);
      }
    }

    // TODO: Send notification to employee

    logger.info('Leave request processed', {
      leaveRequestId: leaveId,
      action,
      processedBy: user.id,
    });

    return NextResponse.json({
      success: true,
      message: action === 'approve' 
        ? 'Leave request approved' 
        : 'Leave request rejected',
      leaveRequest: {
        id: leaveId,
        status: newStatus,
      },
    });
  } catch (error) {
    logger.error('Unexpected error in approve leave', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

