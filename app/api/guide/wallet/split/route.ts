/**
 * API: Guide Wallet Split Earnings
 * GET /api/guide/wallet/split?tripId=xxx - Get split earnings for multi-guide trips
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const tripId = searchParams.get('tripId');

  if (!tripId) {
    return NextResponse.json({ error: 'tripId is required' }, { status: 400 });
  }

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  try {
    // Get all guides for this trip
    let tripGuidesQuery = client.from('trip_guides')
      .select('guide_id, guide_role, fee_amount, trip_id')
      .eq('trip_id', tripId);

    if (!branchContext.isSuperAdmin && branchContext.branchId) {
      const { data: trip } = await client
        .from('trips')
        .select('branch_id')
        .eq('id', tripId)
        .single();

      if (!trip || (trip as { branch_id: string }).branch_id !== branchContext.branchId) {
        return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
      }
    }

    const { data: tripGuides, error } = await tripGuidesQuery;

    if (error) {
      logger.error('Failed to fetch trip guides', error, { tripId });
      return NextResponse.json({ error: 'Failed to fetch split data' }, { status: 500 });
    }

    if (!tripGuides || tripGuides.length === 0) {
      return NextResponse.json({ split: [], total: 0 });
    }

    // Get guide names
    const guideIds = tripGuides.map((tg: { guide_id: string }) => tg.guide_id);
    const { data: guides } = await client
      .from('users')
      .select('id, full_name')
      .in('id', guideIds);

    const guideMap = new Map<string, string>();
    (guides || []).forEach((g: { id: string; full_name: string | null }) => {
      guideMap.set(g.id, g.full_name || 'Unknown');
    });

    // Calculate split percentages based on role
    const roleWeights: Record<string, number> = {
      lead: 0.6,
      assistant: 0.3,
      driver: 0.1,
      photographer: 0.1,
    };

    const totalWeight = tripGuides.reduce(
      (sum: number, tg: { guide_role: string }) => sum + (roleWeights[tg.guide_role] || 0),
      0,
    );

    // Calculate total fee
    const totalFee = tripGuides.reduce(
      (sum: number, tg: { fee_amount: number }) => sum + (Number(tg.fee_amount) || 0),
      0,
    );

    // Calculate split
    const split = tripGuides.map((tg: {
      guide_id: string;
      guide_role: string;
      fee_amount: number;
    }) => {
      const weight = roleWeights[tg.guide_role] || 0;
      const percentage = totalWeight > 0 ? (weight / totalWeight) * 100 : 0;
      const splitAmount = totalWeight > 0 ? (weight / totalWeight) * totalFee : Number(tg.fee_amount || 0);

      return {
        guideId: tg.guide_id,
        guideName: guideMap.get(tg.guide_id) || 'Unknown',
        role: tg.guide_role,
        baseFee: Number(tg.fee_amount || 0),
        splitPercentage: Math.round(percentage * 100) / 100,
        splitAmount: Math.round(splitAmount),
        isCurrentUser: tg.guide_id === user.id,
      };
    });

    return NextResponse.json({
      tripId,
      split,
      total: Math.round(totalFee),
    });
  } catch (error) {
    logger.error('Failed to calculate split earnings', error, { guideId: user.id, tripId });
    return NextResponse.json({ error: 'Failed to calculate split' }, { status: 500 });
  }
});

