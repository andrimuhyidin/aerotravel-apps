/**
 * API: Admin - Adjust Loyalty Points
 * POST /api/admin/crm/loyalty/adjust - Manually adjust customer loyalty points
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { hasRole } from '@/lib/session/active-role';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const adjustPointsSchema = z.object({
  customerId: z.string().uuid(),
  points: z.number().int(),
  adjustmentType: z.enum(['manual_add', 'manual_deduct', 'correction', 'expiry', 'promotion']),
  reason: z.string().min(5),
  referenceId: z.string().uuid().optional(),
  referenceType: z.string().optional(),
  expiryDate: z.string().optional(),
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  // Check authorization
  const allowed = await hasRole(['super_admin', 'finance_manager', 'marketing']);
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
  const parsed = adjustPointsSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.errors },
      { status: 400 }
    );
  }

  const {
    customerId,
    points,
    adjustmentType,
    reason,
    referenceId,
    referenceType,
    expiryDate,
  } = parsed.data;

  const supabase = await createAdminClient();

  try {
    // Get current customer loyalty balance
    const { data: customer, error: customerError } = await supabase
      .from('users')
      .select('id, full_name, loyalty_points')
      .eq('id', customerId)
      .single();

    if (customerError || !customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    const currentBalance = customer.loyalty_points || 0;
    const newBalance = currentBalance + points;

    // Validate deduction doesn't go negative
    if (newBalance < 0) {
      return NextResponse.json(
        { error: `Tidak bisa mengurangi ${Math.abs(points)} points. Balance saat ini: ${currentBalance}` },
        { status: 400 }
      );
    }

    // Update customer balance
    const { error: updateError } = await supabase
      .from('users')
      .update({
        loyalty_points: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq('id', customerId);

    if (updateError) {
      logger.error('Failed to update loyalty balance', updateError);
      return NextResponse.json(
        { error: 'Failed to update balance' },
        { status: 500 }
      );
    }

    // Create adjustment record
    const { error: adjustmentError } = await supabase
      .from('loyalty_points_adjustments')
      .insert({
        customer_id: customerId,
        points,
        adjustment_type: adjustmentType,
        reason,
        reference_id: referenceId || null,
        reference_type: referenceType || null,
        balance_before: currentBalance,
        balance_after: newBalance,
        expiry_date: expiryDate || null,
        created_by: user.id,
      });

    if (adjustmentError) {
      logger.error('Failed to create adjustment record', adjustmentError);
      // Don't fail - the balance is already updated
    }

    logger.info('Loyalty points adjusted', {
      customerId,
      customerName: customer.full_name,
      points,
      adjustmentType,
      balanceBefore: currentBalance,
      balanceAfter: newBalance,
      adjustedBy: user.id,
    });

    return NextResponse.json({
      success: true,
      message: points > 0 
        ? `Berhasil menambahkan ${points} points`
        : `Berhasil mengurangi ${Math.abs(points)} points`,
      adjustment: {
        customerId,
        customerName: customer.full_name,
        points,
        balanceBefore: currentBalance,
        balanceAfter: newBalance,
      },
    });
  } catch (error) {
    logger.error('Unexpected error in adjust points', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

