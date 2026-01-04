/**
 * API: Estimate Points from Booking Value
 * POST /api/user/loyalty/estimate
 *
 * Calculates how many points a customer will earn from a booking
 * Body: { bookingValue: number }
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { estimatePointsFromBooking, getPointsBalance } from '@/lib/customers/aeropoints';
import { createClient } from '@/lib/supabase/server';

const estimateSchema = z.object({
  bookingValue: z.number().min(0, 'Booking value must be positive'),
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Allow unauthenticated users to estimate (for marketing)
  // But include balance info only for authenticated users

  try {
    const body = await request.json();
    const parsed = estimateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { bookingValue } = parsed.data;
    const estimate = await estimatePointsFromBooking(bookingValue);

    const response: {
      pointsToEarn: number;
      valueInRupiah: number;
      bookingValue: number;
      currentBalance?: number;
      balanceAfter?: number;
    } = {
      pointsToEarn: estimate.points,
      valueInRupiah: estimate.value,
      bookingValue,
    };

    // Include balance info for authenticated users
    if (user) {
      const balance = await getPointsBalance(user.id);
      if (balance) {
        response.currentBalance = balance.balance;
        response.balanceAfter = balance.balance + estimate.points;
      }
    }

    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to estimate points' },
      { status: 500 }
    );
  }
});

