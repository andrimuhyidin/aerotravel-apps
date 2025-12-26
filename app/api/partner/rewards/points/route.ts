/**
 * API: Partner Reward Points
 * GET /api/partner/rewards/points - Get points balance & history
 * POST /api/partner/rewards/points - Manual award (admin only)
 */

import { withErrorHandler } from '@/lib/api/error-handler';
import {
  getPointsBalance,
  getPointsHistory,
  type RewardPointsBalance,
} from '@/lib/partner/reward-points';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

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

  const { searchParams } = new URL(request.url);
  const includeHistory = searchParams.get('includeHistory') === 'true';
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  try {
    // Get partner ID (could be direct partner or team member)
    const client = supabase as unknown as any;
    const { data: userProfile } = await client
      .from('users')
      .select('id, role')
      .eq('id', user.id)
      .maybeSingle();

    if (!userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    let partnerId = user.id;
    if (userProfile.role !== 'mitra') {
      const { data: partnerUser } = await client
        .from('partner_users')
        .select('partner_id')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .eq('is_active', true)
        .maybeSingle();

      if (partnerUser) {
        partnerId = partnerUser.partner_id;
      } else {
        return NextResponse.json({ error: 'Not a partner' }, { status: 403 });
      }
    }

    // Get balance
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
  const { partnerId, points, description } = manualAwardSchema.parse(body);

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

