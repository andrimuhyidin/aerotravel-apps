/**
 * API: Admin Reward Analytics
 * GET /api/admin/rewards/analytics - Get reward system analytics (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { hasRole } from '@/lib/supabase/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async (request: NextRequest) => {
  // Check admin role
  const isAdmin = await hasRole(['super_admin', 'ops_admin', 'finance_manager']);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Get query parameters
  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || 'monthly'; // daily, weekly, monthly, yearly, lifetime

  const supabase = await createClient();
  const client = supabase as unknown as any;

  // Calculate date range based on period
  let startDate: Date;
  const endDate = new Date();

  switch (period) {
    case 'daily':
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'weekly':
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'monthly':
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case 'yearly':
      startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    default: // lifetime
      startDate = new Date(0);
      break;
  }

  try {
    // Total points awarded
    const { data: earnedTransactions, error: earnedError } = await client
      .from('guide_reward_transactions')
      .select('points')
      .eq('transaction_type', 'earn')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (earnedError) {
      logger.error('Failed to fetch earned transactions', earnedError);
    }

    // Total points redeemed
    const { data: redeemedTransactions, error: redeemedError } = await client
      .from('guide_reward_transactions')
      .select('points')
      .eq('transaction_type', 'redeem')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (redeemedError) {
      logger.error('Failed to fetch redeemed transactions', redeemedError);
    }

    // Total points expired
    const { data: expiredTransactions, error: expiredError } = await client
      .from('guide_reward_transactions')
      .select('points')
      .eq('transaction_type', 'expire')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (expiredError) {
      logger.error('Failed to fetch expired transactions', expiredError);
    }

    // Calculate totals
    const totalEarned = (earnedTransactions || []).reduce(
      (sum: number, t: { points: number }) => sum + (t.points || 0),
      0
    );
    const totalRedeemed = Math.abs(
      (redeemedTransactions || []).reduce(
        (sum: number, t: { points: number }) => sum + (t.points || 0),
        0
      )
    );
    const totalExpired = Math.abs(
      (expiredTransactions || []).reduce(
        (sum: number, t: { points: number }) => sum + (t.points || 0),
        0
      )
    );

    // Get total active guides with points
    const { data: activeGuides, error: guidesError } = await client
      .from('guide_reward_points')
      .select('guide_id, balance')
      .gt('balance', 0);

    if (guidesError) {
      logger.error('Failed to fetch active guides', guidesError);
    }

    // Get average points per guide
    const { data: allBalances, error: balanceError } = await client
      .from('guide_reward_points')
      .select('balance, lifetime_earned');

    if (balanceError) {
      logger.error('Failed to fetch balances', balanceError);
    }

    const avgBalance =
      (allBalances || []).length > 0
        ? (allBalances || []).reduce(
            (sum: number, b: { balance: number }) => sum + (b.balance || 0),
            0
          ) / (allBalances || []).length
        : 0;

    const avgLifetimeEarned =
      (allBalances || []).length > 0
        ? (allBalances || []).reduce(
            (sum: number, b: { lifetime_earned: number }) => sum + (b.lifetime_earned || 0),
            0
          ) / (allBalances || []).length
        : 0;

    // Get top earners
    const { data: topEarners, error: topEarnersError } = await client
      .from('guide_reward_points')
      .select(
        `
        guide_id,
        balance,
        lifetime_earned,
        users!inner(full_name)
      `
      )
      .order('lifetime_earned', { ascending: false })
      .limit(10);

    if (topEarnersError) {
      logger.error('Failed to fetch top earners', topEarnersError);
    }

    // Get most popular rewards (from redemptions)
    const { data: popularRewards, error: popularRewardsError } = await client
      .from('guide_reward_redemptions')
      .select(
        `
        catalog_id,
        guide_reward_catalog!inner(title, reward_type, points_cost)
      `
    )
      .eq('status', 'completed')
      .gte('completed_at', startDate.toISOString())
      .lte('completed_at', endDate.toISOString());

    if (popularRewardsError) {
      logger.error('Failed to fetch popular rewards', popularRewardsError);
    }

    // Count redemptions per reward
    const rewardCounts = new Map<string, { title: string; type: string; count: number }>();
    (popularRewards || []).forEach((r: any) => {
      const catalog = r.guide_reward_catalog;
      if (catalog) {
        const key = r.catalog_id;
        const existing = rewardCounts.get(key) || {
          title: catalog.title,
          type: catalog.reward_type,
          count: 0,
        };
        existing.count += 1;
        rewardCounts.set(key, existing);
      }
    });

    const topRewards = Array.from(rewardCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    logger.info('Reward analytics fetched', {
      period,
      totalEarned,
      totalRedeemed,
    });

    return NextResponse.json({
      period,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      summary: {
        totalEarned,
        totalRedeemed,
        totalExpired,
        netPoints: totalEarned - totalRedeemed - totalExpired,
        redemptionRate: totalEarned > 0 ? (totalRedeemed / totalEarned) * 100 : 0,
        expirationRate: totalEarned > 0 ? (totalExpired / totalEarned) * 100 : 0,
      },
      guides: {
        activeWithPoints: (activeGuides || []).length,
        totalGuides: (allBalances || []).length,
        averageBalance: Math.round(avgBalance),
        averageLifetimeEarned: Math.round(avgLifetimeEarned),
      },
      topEarners: (topEarners || []).map((e: any) => ({
        guideId: e.guide_id,
        guideName: e.users?.full_name || 'Unknown',
        balance: e.balance,
        lifetimeEarned: e.lifetime_earned,
      })),
      topRewards,
    });
  } catch (error) {
    logger.error('Exception fetching reward analytics', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
});

