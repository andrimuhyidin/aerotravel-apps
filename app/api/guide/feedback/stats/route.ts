/**
 * API: Guide Feedback Statistics
 * GET /api/guide/feedback/stats - Get feedback statistics (admin only)
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

  // Check if admin
  const client = supabase as unknown as any;
  const { data: userProfile } = await client
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  const isAdmin = ['super_admin', 'ops_admin', 'finance_manager'].includes(userProfile?.role || '');

  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const branchContext = await getBranchContext(user.id);

  // Build query
  let query = client.from('guide_feedbacks').select('*');

  if (!branchContext.isSuperAdmin && branchContext.branchId) {
    query = query.eq('branch_id', branchContext.branchId);
  }

  const { data: feedbacks, error } = await query;

  if (error) {
    logger.error('Failed to fetch feedbacks for stats', error);
    return NextResponse.json({ error: 'Failed to fetch feedbacks' }, { status: 500 });
  }

  const allFeedbacks = feedbacks || [];

  // Calculate stats
  type Feedback = { status: string; feedback_type: string; rating?: number | null };
  const total = allFeedbacks.length;
  const byStatus = allFeedbacks.reduce(
    (acc: Record<string, number>, fb: Feedback) => {
      acc[fb.status] = (acc[fb.status] || 0) + 1;
      return acc;
    },
    {}
  );

  const byType = allFeedbacks.reduce(
    (acc: Record<string, number>, fb: Feedback) => {
      acc[fb.feedback_type] = (acc[fb.feedback_type] || 0) + 1;
      return acc;
    },
    {}
  );

  // Calculate average rating and NPS
  const ratings = allFeedbacks.filter((fb: Feedback) => fb.rating).map((fb: Feedback) => fb.rating as number);
  const avgRating = ratings.length > 0 ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length : 0;

  // NPS Calculation (Promoters 9-10, Passives 7-8, Detractors 0-6)
  const promoters = ratings.filter((r: number) => r >= 9).length;
  const detractors = ratings.filter((r: number) => r <= 6).length;
  const totalRatings = ratings.length;
  const npsScore = totalRatings > 0 ? ((promoters - detractors) / totalRatings) * 100 : 0;

  return NextResponse.json({
    total,
    by_status: byStatus,
    by_type: byType,
    average_rating: Math.round(avgRating * 10) / 10,
    nps_score: Math.round(npsScore * 10) / 10,
    total_ratings: totalRatings,
    rating_distribution: {
      promoters: promoters,
      passives: ratings.filter((r: number) => r >= 7 && r <= 8).length,
      detractors: detractors,
    },
  });
});
