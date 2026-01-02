/**
 * API: Redeem AeroPoints for Discount
 * POST /api/user/loyalty/redeem
 *
 * Redeems points as a discount on a booking
 * Body: { points: number, bookingId: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import {
  canRedeemPoints,
  getPointsValue,
  redeemPoints,
} from '@/lib/customers/aeropoints';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const redeemSchema = z.object({
  points: z.number().min(1, 'Minimum 1 point required'),
  bookingId: z.string().uuid('Invalid booking ID'),
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = redeemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { points, bookingId } = parsed.data;

    // Verify booking belongs to user
    const { data: booking } = await supabase
      .from('bookings')
      .select('id, created_by, status')
      .eq('id', bookingId)
      .single();

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const bookingData = booking as {
      id: string;
      created_by: string | null;
      status: string;
    };

    if (bookingData.created_by !== user.id) {
      return NextResponse.json(
        { error: 'Not authorized to redeem points for this booking' },
        { status: 403 }
      );
    }

    // Check booking status - only allow redemption for pending/draft bookings
    if (!['draft', 'pending', 'awaiting_payment'].includes(bookingData.status)) {
      return NextResponse.json(
        { error: 'Points can only be redeemed for pending bookings' },
        { status: 400 }
      );
    }

    // Check if user can redeem
    const canRedeem = await canRedeemPoints(user.id, points);
    if (!canRedeem) {
      return NextResponse.json(
        { error: 'Insufficient points balance' },
        { status: 400 }
      );
    }

    // Redeem points
    const result = await redeemPoints(user.id, points, bookingId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Redemption failed' },
        { status: 400 }
      );
    }

    logger.info('Points redeemed via API', {
      userId: user.id,
      bookingId,
      points,
      discountAmount: result.discountAmount,
    });

    return NextResponse.json({
      success: true,
      pointsRedeemed: points,
      discountAmount: result.discountAmount,
      discountFormatted: `Rp ${result.discountAmount.toLocaleString('id-ID')}`,
    });
  } catch (error) {
    logger.error('Failed to redeem points', error, { userId: user.id });
    return NextResponse.json(
      { error: 'Failed to redeem points' },
      { status: 500 }
    );
  }
});

