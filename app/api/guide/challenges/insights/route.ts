/**
 * API: AI Challenge Insights
 * GET /api/guide/challenges/insights
 * 
 * Provides AI-powered insights for challenges
 */

import { NextRequest, NextResponse } from 'next/server';

import { getChallengeInsights, type Challenge } from '@/lib/ai/challenges-assistant';
import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext } from '@/lib/branch/branch-injection';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async (_request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  try {
    // Get challenges
    const challengesRes = await fetch(`${_request.nextUrl.origin}/api/guide/challenges`, {
      headers: {
        Cookie: _request.headers.get('cookie') || '',
      },
    });

    if (!challengesRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch challenges' }, { status: 500 });
    }

    const challengesData = await challengesRes.json();
    const challenges = (challengesData.challenges || []) as Challenge[];

    // Get guide stats for context
    const statsRes = await fetch(`${_request.nextUrl.origin}/api/guide/stats`, {
      headers: {
        Cookie: _request.headers.get('cookie') || '',
      },
    });

    let guideStats: {
      totalTrips?: number;
      averageRating?: number;
      totalRatings?: number;
      totalEarnings?: number;
    } | undefined;
    
    if (statsRes.ok) {
      const statsData = await statsRes.json();
      guideStats = {
        totalTrips: statsData.totalTrips || 0,
        averageRating: statsData.averageRating || 0,
        totalRatings: statsData.totalRatings || 0,
      };
    }

    // Get wallet balance for earnings context
    const { data: walletData } = await client
      .from('guide_wallets')
      .select('balance')
      .eq('guide_id', user.id)
      .maybeSingle();

    if (guideStats && walletData) {
      guideStats.totalEarnings = Number(walletData.balance || 0);
    }

    // Get AI insights
    const insights = await getChallengeInsights(challenges, guideStats);

    return NextResponse.json(insights);
  } catch (error) {
    logger.error('Failed to get challenge insights', error, { guideId: user.id });
    return NextResponse.json(
      { error: 'Gagal mendapatkan insights' },
      { status: 500 }
    );
  }
});
