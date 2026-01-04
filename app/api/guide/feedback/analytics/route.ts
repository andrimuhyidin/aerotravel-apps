/**
 * API: Guide Feedback Analytics
 * GET /api/guide/feedback/analytics - Get feedback analytics/trends (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext } from '@/lib/branch/branch-injection';
import { cacheKeys, cacheTTL, getCached } from '@/lib/cache/redis-cache';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

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

  // Get period
  const period = searchParams.get('period') || 'month';
  const startDate = searchParams.get('start_date');
  const endDate = searchParams.get('end_date');

  // Build cache key
  const cacheKey = cacheKeys.guide.feedbackAnalytics(
    branchContext.branchId || undefined,
    period + (startDate ? `:${startDate}` : '') + (endDate ? `:${endDate}` : '')
  );

  // Use cache for expensive analytics query - cache the processed result
  const analyticsResult = await getCached(
    cacheKey,
    cacheTTL.feedbackAnalytics,
    async () => {
      // Build query
      let query = client.from('guide_feedbacks').select('*');

      if (!branchContext.isSuperAdmin && branchContext.branchId) {
        query = query.eq('branch_id', branchContext.branchId);
      }

      // Date filter
      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      const { data: feedbacks, error } = await query;

      if (error) {
        logger.error('Failed to fetch feedbacks for analytics', error);
        throw error;
      }

      const allFeedbacks = feedbacks || [];

      // Process data
      // Group by date
      const trends = allFeedbacks.reduce((acc: Record<string, number>, fb: { created_at: string }) => {
        const date = new Date(fb.created_at).toISOString().split('T')[0] || '';
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {});

      // Convert to array format
      const trendsArray = Object.entries(trends)
        .map(([date, count]: [string, unknown]) => ({ date, count: count as number }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Calculate average response time
      type FeedbackWithResponse = { responded_at: string; created_at: string };
      const feedbacksWithResponse = allFeedbacks.filter(
        (fb: { responded_at?: string | null; created_at: string }) => fb.responded_at && fb.created_at
      ) as FeedbackWithResponse[];
      const totalResponseTime = feedbacksWithResponse.reduce((sum: number, fb: FeedbackWithResponse) => {
        const created = new Date(fb.created_at).getTime();
        const responded = new Date(fb.responded_at).getTime();
        return sum + (responded - created);
      }, 0);
      const averageResponseTime =
        feedbacksWithResponse.length > 0
          ? Math.round(totalResponseTime / feedbacksWithResponse.length / (1000 * 60 * 60)) // Convert to hours
          : 0;

      // Summary
      const summary = {
        total_feedbacks: allFeedbacks.length,
        pending: allFeedbacks.filter((fb: { status: string }) => fb.status === 'pending').length,
        resolved: allFeedbacks.filter((fb: { status: string }) => fb.status === 'resolved').length,
        average_response_time: averageResponseTime, // Hours
      };

      return {
        trends: trendsArray,
        summary,
        period,
      };
    }
  );

  return NextResponse.json(analyticsResult);
});
