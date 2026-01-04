/**
 * API: Risk Assessment Trends
 * GET /api/guide/risk-trends?guide_id=xxx&weeks=4 - Get risk trends for guide
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const guideId = searchParams.get('guide_id');
  const weeks = parseInt(searchParams.get('weeks') || '4', 10);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = supabase as unknown as any;

  // If guide_id not provided, use current user
  const targetGuideId = guideId || user.id;

  // Verify access (guide can only see own trends, admin can see all)
  if (targetGuideId !== user.id) {
    const { data: userProfile } = await client
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userProfile?.role !== 'super_admin' && userProfile?.role !== 'ops_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  // Get risk trends
  const { data: trends, error: trendsError } = await client.rpc('get_guide_risk_trends', {
    p_guide_id: targetGuideId,
    p_weeks: weeks,
  });

  if (trendsError) {
    logger.error('Failed to fetch risk trends', trendsError, { guideId: targetGuideId });
    return NextResponse.json(
      { error: 'Failed to fetch risk trends' },
      { status: 500 }
    );
  }

  // Get unsafe patterns
  const { data: patterns, error: patternsError } = await client.rpc('detect_unsafe_risk_patterns', {
    p_guide_id: targetGuideId,
    p_weeks: weeks,
  });

  if (patternsError) {
    logger.warn('Failed to detect unsafe patterns', { error: patternsError });
  }

  return NextResponse.json({
    success: true,
    trends: trends || [],
    unsafePatterns: patterns || [],
    weeks,
  });
});

