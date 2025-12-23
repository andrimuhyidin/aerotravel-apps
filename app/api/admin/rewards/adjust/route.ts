/**
 * API: Admin Reward Adjust
 * POST /api/admin/rewards/adjust - Adjust points balance (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { hasRole } from '@/lib/supabase/server';
import { awardPoints, redeemPoints } from '@/lib/guide/reward-points';
import { logger } from '@/lib/utils/logger';

const adjustSchema = z.object({
  guide_id: z.string().uuid(),
  points: z.number().int(), // Can be positive (add) or negative (deduct)
  reason: z.string().min(1),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  // Check admin role
  const isAdmin = await hasRole([
    'super_admin',
    'ops_admin',
    'finance_manager',
  ]);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Parse and validate request body
  const body = await request.json();
  const validated = adjustSchema.parse(body);

  let transactionId: string | null;

  if (validated.points > 0) {
    // Add points
    transactionId = await awardPoints(
      validated.guide_id,
      validated.points,
      'adjustment',
      undefined,
      `Adjustment: ${validated.reason}`,
      validated.metadata
    );
  } else if (validated.points < 0) {
    // Deduct points (use redeem function)
    transactionId = await redeemPoints(
      validated.guide_id,
      Math.abs(validated.points),
      `Adjustment: ${validated.reason}`,
      validated.metadata
    );
  } else {
    return NextResponse.json(
      { error: 'Points adjustment cannot be zero' },
      { status: 400 }
    );
  }

  if (!transactionId) {
    return NextResponse.json(
      { error: 'Failed to adjust points' },
      { status: 500 }
    );
  }

  logger.info('Points adjusted by admin', {
    guideId: validated.guide_id,
    points: validated.points,
    reason: validated.reason,
    transactionId,
  });

  return NextResponse.json({
    success: true,
    transactionId,
    message: `Successfully ${validated.points > 0 ? 'added' : 'deducted'} ${Math.abs(validated.points)} points`,
  });
});
