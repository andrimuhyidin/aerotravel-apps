/**
 * API: Partner Refund Details
 * GET /api/partner/refunds/[id] - Get refund details
 * PUT /api/partner/refunds/[id] - Update refund (Super Admin override only)
 */

import { withErrorHandler } from '@/lib/api/error-handler';
import { verifyPartnerAccess } from '@/lib/api/partner-helpers';
import { createClient, hasRole } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

type Params = Promise<{ id: string }>;

const overrideSchema = z.object({
  refundAmount: z.number().min(0),
  overrideReason: z.string().min(10).max(500),
});

export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Params }
) => {
  const { id: refundId } = await params;
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

  const client = supabase as unknown as any;

  try {
    // Get refund with booking details
    const { data: refund, error: refundError } = await client
      .from('refunds')
      .select(
        `
        *,
        booking:bookings!refunds_booking_id_fkey(
          id,
          booking_code,
          trip_date,
          customer_name,
          customer_phone,
          customer_email,
          total_amount,
          nta_total,
          status,
          mitra_id,
          package:packages(id, name, destination)
        )
      `
      )
      .eq('id', refundId)
      .single();

    if (refundError || !refund) {
      return NextResponse.json(
        { error: 'Refund not found' },
        { status: 404 }
      );
    }

    // Verify ownership (refund belongs to partner's booking)
    if (refund.booking?.mitra_id !== partnerId) {
      return NextResponse.json(
        { error: 'Unauthorized access to refund' },
        { status: 403 }
      );
    }

    // Transform refund data
    const transformedRefund = {
      id: refund.id,
      bookingId: refund.booking_id,
      paymentId: refund.payment_id,
      bookingCode: refund.booking?.booking_code || null,
      tripDate: refund.booking?.trip_date || null,
      customerName: refund.booking?.customer_name || null,
      customerPhone: refund.booking?.customer_phone || null,
      customerEmail: refund.booking?.customer_email || null,
      packageName: refund.booking?.package?.name || null,
      packageDestination: refund.booking?.package?.destination || null,
      originalAmount: Number(refund.original_amount || 0),
      refundPercent: Number(refund.refund_percent || 0),
      adminFee: Number(refund.admin_fee || 0),
      refundAmount: Number(refund.refund_amount || 0),
      daysBeforeTrip: refund.days_before_trip || 0,
      policyApplied: refund.policy_applied || null,
      status: refund.status,
      refundTo: refund.refund_to || 'wallet',
      bankName: refund.bank_name || null,
      bankAccountNumber: refund.bank_account_number || null,
      bankAccountName: refund.bank_account_name || null,
      isOverride: refund.is_override || false,
      overrideReason: refund.override_reason || null,
      approvedBy: refund.approved_by || null,
      approvedAt: refund.approved_at || null,
      processedAt: refund.processed_at || null,
      completedAt: refund.completed_at || null,
      disbursementId: refund.disbursement_id || null,
      requestedBy: refund.requested_by || null,
      createdAt: refund.created_at,
      updatedAt: refund.updated_at,
    };

    return NextResponse.json({ refund: transformedRefund });
  } catch (error) {
    logger.error('Failed to fetch refund details', error, {
      refundId,
      userId: user.id,
    });
    throw error;
  }
});

/**
 * PRD 4.5.C: Super Admin Override - Update refund amount manually
 */
export const PUT = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Params }
) => {
  const { id: refundId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // PRD 4.5.C: Only Super Admin can override
  const allowed = await hasRole(['super_admin']);
  if (!allowed) {
    return NextResponse.json(
      { error: 'Forbidden - Only Super Admin can override refund amount' },
      { status: 403 }
    );
  }

  const body = await request.json();
  const { refundAmount, overrideReason } = overrideSchema.parse(body);

  const client = supabase as unknown as any;

  try {
    // Get refund details
    const { data: refund, error: refundError } = await client
      .from('refunds')
      .select('id, booking_id, original_amount, refund_amount')
      .eq('id', refundId)
      .single();

    if (refundError || !refund) {
      return NextResponse.json(
        { error: 'Refund not found' },
        { status: 404 }
      );
    }

    // Validate override amount (should not exceed original amount)
    const originalAmount = Number(refund.original_amount || 0);
    if (refundAmount > originalAmount) {
      return NextResponse.json(
        { error: 'Refund amount tidak boleh melebihi original amount' },
        { status: 400 }
      );
    }

    // Calculate override percentage
    const overridePercent = originalAmount > 0
      ? Math.round((refundAmount / originalAmount) * 100 * 100) / 100
      : 0;

    // Update refund with override
    const { error: updateError } = await client
      .from('refunds')
      .update({
        refund_amount: refundAmount,
        refund_percent: overridePercent,
        is_override: true,
        override_reason: overrideReason,
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', refundId);

    if (updateError) {
      logger.error('Failed to override refund', updateError, {
        refundId,
        adminId: user.id,
      });
      return NextResponse.json(
        { error: 'Failed to update refund' },
        { status: 500 }
      );
    }

    logger.info('Refund amount overridden by Super Admin', {
      refundId,
      adminId: user.id,
      originalAmount,
      newRefundAmount: refundAmount,
      overrideReason,
    });

    return NextResponse.json({
      success: true,
      message: 'Refund amount berhasil di-override',
      refund: {
        id: refundId,
        refundAmount,
        refundPercent: overridePercent,
        isOverride: true,
        overrideReason,
        approvedBy: user.id,
        approvedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    logger.error('Failed to override refund', error, {
      refundId,
      userId: user.id,
    });
    throw error;
  }
});

