/**
 * API: Corporate Approval Detail
 * GET /api/partner/corporate/approvals/[id] - Get approval detail
 * PATCH /api/partner/corporate/approvals/[id] - Approve or reject
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import {
  approveBooking,
  cancelApprovalRequest,
  getApprovalById,
  getCorporateClient,
  rejectBooking,
} from '@/lib/corporate';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const updateApprovalSchema = z.object({
  action: z.enum(['approve', 'reject', 'cancel']),
  approvedAmount: z.number().positive().optional(),
  approverNotes: z.string().optional(),
  rejectionReason: z.string().optional(),
});

type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/partner/corporate/approvals/[id]
 * Get approval detail
 */
export const GET = withErrorHandler(
  async (request: NextRequest, { params }: RouteParams) => {
    const { id: approvalId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const corporate = await getCorporateClient(user.id);

      if (!corporate) {
        return NextResponse.json(
          { error: 'No corporate access' },
          { status: 403 }
        );
      }

      const approval = await getApprovalById(approvalId);

      if (!approval) {
        return NextResponse.json(
          { error: 'Approval not found' },
          { status: 404 }
        );
      }

      // Verify approval belongs to user's corporate
      if (approval.corporateId !== corporate.id) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }

      return NextResponse.json({ approval });
    } catch (error) {
      logger.error('Failed to get approval detail', error, {
        approvalId,
        userId: user.id,
      });
      return NextResponse.json(
        { error: 'Failed to get approval detail' },
        { status: 500 }
      );
    }
  }
);

/**
 * PATCH /api/partner/corporate/approvals/[id]
 * Approve, reject, or cancel an approval
 */
export const PATCH = withErrorHandler(
  async (request: NextRequest, { params }: RouteParams) => {
    const { id: approvalId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const corporate = await getCorporateClient(user.id);

      if (!corporate) {
        return NextResponse.json(
          { error: 'No corporate access' },
          { status: 403 }
        );
      }

      const body = await request.json();
      const parsed = updateApprovalSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Invalid data', details: parsed.error.flatten() },
          { status: 400 }
        );
      }

      const { action, approvedAmount, approverNotes, rejectionReason } = parsed.data;

      let result: { success: boolean; error?: string };

      switch (action) {
        case 'approve':
          // Only PIC can approve
          if (corporate.picId !== user.id) {
            return NextResponse.json(
              { error: 'Only PIC can approve bookings' },
              { status: 403 }
            );
          }
          result = await approveBooking(
            approvalId,
            user.id,
            approvedAmount,
            approverNotes
          );
          
          // Emit corporate.approval_approved event (non-blocking)
          if (result.success) {
            try {
              const { emitEvent } = await import('@/lib/events/event-bus');
              await emitEvent({
                type: 'corporate.approval_approved',
                app: 'corporate',
                userId: user.id,
                data: {
                  approvalId,
                  corporateId: corporate.id,
                  approvedAmount,
                  approverNotes,
                },
              }).catch((e) => logger.warn('Failed to emit approval event', { error: e instanceof Error ? e.message : String(e) }));
            } catch (e) {
              // Non-blocking
            }
          }
          break;

        case 'reject':
          // Only PIC can reject
          if (corporate.picId !== user.id) {
            return NextResponse.json(
              { error: 'Only PIC can reject bookings' },
              { status: 403 }
            );
          }
          if (!rejectionReason) {
            return NextResponse.json(
              { error: 'Rejection reason is required' },
              { status: 400 }
            );
          }
          result = await rejectBooking(approvalId, user.id, rejectionReason);
          
          // Emit corporate.approval_rejected event (non-blocking)
          if (result.success) {
            try {
              const { emitEvent } = await import('@/lib/events/event-bus');
              await emitEvent({
                type: 'corporate.approval_rejected',
                app: 'corporate',
                userId: user.id,
                data: {
                  approvalId,
                  corporateId: corporate.id,
                  rejectionReason,
                },
              }).catch((e) => logger.warn('Failed to emit rejection event', { error: e instanceof Error ? e.message : String(e) }));
            } catch (e) {
              // Non-blocking
            }
          }
          break;

        case 'cancel':
          // Employee can cancel their own request
          result = await cancelApprovalRequest(approvalId, user.id);
          break;

        default:
          return NextResponse.json(
            { error: 'Invalid action' },
            { status: 400 }
          );
      }

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Operation failed' },
          { status: 400 }
        );
      }

      logger.info('Approval action completed', {
        approvalId,
        action,
        userId: user.id,
      });

      return NextResponse.json({
        success: true,
        message:
          action === 'approve'
            ? 'Booking berhasil disetujui'
            : action === 'reject'
              ? 'Booking berhasil ditolak'
              : 'Permintaan berhasil dibatalkan',
      });
    } catch (error) {
      logger.error('Failed to process approval action', error, {
        approvalId,
        userId: user.id,
      });
      return NextResponse.json(
        { error: 'Failed to process approval action' },
        { status: 500 }
      );
    }
  }
);

