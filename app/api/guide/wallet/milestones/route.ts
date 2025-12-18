/**
 * API: Guide Wallet Milestones
 * GET /api/guide/wallet/milestones - Get achieved milestones
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async () => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = supabase as unknown as any;

  try {
    // Check if table exists (graceful fallback if migration not applied)
    const { data: milestones, error } = await client
      .from('guide_wallet_milestones')
      .select('id, milestone_type, milestone_name, milestone_description, achieved_at, achievement_data')
      .eq('guide_id', user.id)
      .order('achieved_at', { ascending: false });

    if (error) {
      // If table doesn't exist, return empty array instead of error
      if (error.code === 'PGRST205' || error.message?.includes('does not exist')) {
        logger.warn('guide_wallet_milestones table not found. Migration may not be applied yet.', { guideId: user.id });
        return NextResponse.json({ milestones: [] });
      }
      logger.error('Failed to fetch milestones', error, { guideId: user.id });
      return NextResponse.json({ error: 'Failed to fetch milestones' }, { status: 500 });
    }

    const formattedMilestones = (milestones || []).map((m: {
      id: string;
      milestone_type: string;
      milestone_name: string;
      milestone_description: string | null;
      achieved_at: string;
      achievement_data: unknown;
    }) => ({
      id: m.id,
      type: m.milestone_type,
      name: m.milestone_name,
      description: m.milestone_description,
      achievedAt: m.achieved_at,
      data: m.achievement_data,
    }));

    return NextResponse.json({ milestones: formattedMilestones });
  } catch (error) {
    logger.error('Failed to fetch milestones', error, { guideId: user.id });
    return NextResponse.json({ error: 'Failed to fetch milestones' }, { status: 500 });
  }
});

