/**
 * API: Admin Reward Award
 * POST /api/admin/rewards/award - Manually award points to a guide (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { hasRole } from '@/lib/supabase/server';
import { awardPoints } from '@/lib/guide/reward-points';
import { logger } from '@/lib/utils/logger';

const awardSchema = z.object({
  guide_id: z.string().uuid(),
  points: z.number().int().positive(),
  source_type: z.enum(['challenge', 'badge', 'performance', 'level_up', 'milestone', 'special', 'manual', 'adjustment']),
  source_id: z.string().uuid().optional().nullable(),
  description: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  // Check admin role
  const isAdmin = await hasRole(['super_admin', 'ops_admin', 'finance_manager']);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Parse and validate request body
  const body = await request.json();
  const validated = awardSchema.parse(body);

  // Award points
  const transactionId = await awardPoints(
    validated.guide_id,
    validated.points,
    validated.source_type,
    validated.source_id || undefined,
    validated.description || `Manual award by admin`,
    validated.metadata
  );

  if (!transactionId) {
    return NextResponse.json(
      { error: 'Failed to award points' },
      { status: 500 }
    );
  }

  logger.info('Points awarded by admin', {
    guideId: validated.guide_id,
    points: validated.points,
    sourceType: validated.source_type,
    transactionId,
  });

  return NextResponse.json({
    success: true,
    transactionId,
    message: `Successfully awarded ${validated.points} points`,
  });
});

