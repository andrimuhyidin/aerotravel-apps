/**
 * API: Guide Check-in
 * POST /api/guide/attendance/check-in
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext, withBranchFilter } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const guideCheckInSchema = z.object({
  tripId: z.string().min(1),
  latitude: z.number(),
  longitude: z.number(),
  accuracy: z.number().optional(),
  photoUrl: z.string().url(),
  happiness: z.number().int().min(1).max(5),
  description: z.string().min(1).max(500),
});

function calculateLatePenalty(now: Date): { isLate: boolean; penalty: number } {
  const threshold = new Date(now);
  threshold.setHours(7, 30, 0, 0);
  const isLate = now.getTime() > threshold.getTime();
  const penalty = isLate ? 25_000 : 0;
  return { isLate, penalty };
}

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const body = guideCheckInSchema.parse(await request.json());

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { tripId, latitude, longitude, accuracy, photoUrl, happiness, description } = body;

  const branchContext = await getBranchContext(user.id);

  const now = new Date();
  const checkInAt = now.toISOString();
  const { isLate, penalty } = calculateLatePenalty(now);

  const client = supabase as unknown as any;

  const updateData: Record<string, unknown> = {
    check_in_at: checkInAt,
    check_in_lat: latitude,
    check_in_lng: longitude,
    check_in_location: null,
    is_late: isLate,
    check_in_accuracy_meters: accuracy ?? null,
    check_in_photo_url: photoUrl,
    check_in_happiness: happiness,
    check_in_description: description.trim(),
    // Update assignment status if it was ABSENT (resolved by check-in)
    assignment_status: 'confirmed',
  };

  const { error: updateError } = await withBranchFilter(
    client.from('trip_guides'),
    branchContext,
  )
    .update(updateData)
    .eq('trip_id', tripId)
    .eq('guide_id', user.id);

  if (updateError) {
    logger.error('Check-in update failed', updateError, { tripId, guideId: user.id });
    return NextResponse.json(
      { error: 'Failed to update check-in' },
      { status: 500 },
    );
  }

  if (isLate && penalty > 0) {
    const { error: deductionError } = await withBranchFilter(
      client.from('salary_deductions'),
      branchContext,
    ).insert({
      guide_id: user.id,
      trip_id: tripId,
      deduction_type: 'late_penalty',
      amount: penalty,
      reason: 'Auto penalty for late check-in from Guide App',
      is_auto: true,
      created_by: user.id,
    });

    if (deductionError) {
      logger.error('Failed to create salary deduction', deductionError, {
        guideId: user.id,
        tripId,
      });
    } else {
      logger.info('Salary deduction created for late check-in', {
        guideId: user.id,
        tripId,
        amount: penalty,
      });
    }
  }

  logger.info('Guide check-in recorded', {
    tripId,
    guideId: user.id,
    isLate,
  });

  return NextResponse.json({ success: true, isLate, penaltyAmount: penalty });
});
