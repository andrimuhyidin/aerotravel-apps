/**
 * API: Partner Reward Points
 * GET /api/partner/rewards/points - Get points balance & history
 * POST /api/partner/rewards/points - Manual award (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { withErrorHandler } from '@/lib/api/error-handler';
import { sanitizeRequestBody, sanitizeSearchParams, verifyPartnerAccess } from '@/lib/api/partner-helpers';
import {
  getPointsBalance,
  getPointsHistory,
} from '@/lib/partner/reward-points';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

const manualAwardSchema = z.object({
  partnerId: z.string().uuid(),
  points: z.number().min(1),
  description: z.string().optional(),
});

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify partner access using helper
  const { isPartner, partnerId } = await verifyPartnerAccess(user.id);
  if (!isPartner || !partnerId) {
    return NextResponse.json({ error: 'Not a partner' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const sanitizedParams = sanitizeSearchParams(searchParams);
  const includeHistory = sanitizedParams.includeHistory === 'true';
  const limit = Math.min(parseInt(sanitizedParams.limit || '20', 10), 100);
  const offset = parseInt(sanitizedParams.offset || '0', 10);

  try {
    // Get balance using verified partnerId
    const balance = await getPointsBalance(partnerId);

    if (!balance) {
      return NextResponse.json({
        balance: {
          balance: 0,
          lifetimeEarned: 0,
          lifetimeRedeemed: 0,
          expiredPoints: 0,
        },
        history: [],
      });
    }

    // Get history if requested
    let history = [];
    if (includeHistory) {
      history = await getPointsHistory(partnerId, limit, offset);
    }

    return NextResponse.json({
      balance,
      history,
    });
  } catch (error) {
    logger.error('Failed to get reward points', error, {
      userId: user.id,
    });
    throw error;
  }
});

export const POST = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user is admin
  const client = supabase as unknown as any;
  const { data: userProfile } = await client
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!userProfile || !['super_admin', 'finance_manager'].includes(userProfile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const validated = manualAwardSchema.parse(body);

  // Sanitize validated data
  const sanitized = sanitizeRequestBody(validated, {
    strings: ['description'],
  });

  const { partnerId, points, description } = sanitized;

  try {
    const { awardPoints } = await import('@/lib/partner/reward-points');
    const transactionId = await awardPoints(
      partnerId,
      points,
      'manual',
      undefined,
      description || 'Manual points adjustment',
      { awardedBy: user.id }
    );

    if (!transactionId) {
      return NextResponse.json(
        { error: 'Failed to award points' },
        { status: 500 }
      );
    }

    logger.info('Manual points awarded', {
      partnerId,
      points,
      adminId: user.id,
    });

    return NextResponse.json({
      success: true,
      transactionId,
      message: 'Points awarded successfully',
    });
  } catch (error) {
    logger.error('Failed to award points manually', error, {
      partnerId,
      adminId: user.id,
    });
    throw error;
  }
});

