/**
 * API: Unified AI Insights Endpoint
 * GET /api/guide/ai/insights/unified
 *
 * Unified AI insights endpoint - replaces multiple redundant endpoints:
 * - /api/guide/insights/ai
 * - /api/guide/performance/insights
 * - /api/guide/performance/coach (AI part)
 *
 * Query params:
 * - include: comma-separated list of insights to include
 *   - performance, recommendations, predictions, coaching
 * - period: 'monthly' | 'weekly' | 'all' (default: 'monthly')
 * - includeCoaching: 'true' | 'false' (default: 'false')
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { cacheKeys, cacheTTL, getCached } from '@/lib/cache/redis-cache';
import {
  generateUnifiedAIInsights,
  type GuideContext,
} from '@/lib/guide/ai-insights-generator';
import { calculateUnifiedMetrics } from '@/lib/guide/metrics-calculator';
import { createClient } from '@/lib/supabase/server';
import type { AIInsightsGenerationOptions } from '@/types/ai-insights';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const includeParam = searchParams.get('include');
  const periodParam = searchParams.get('period') || 'monthly';
  const includeCoachingParam = searchParams.get('includeCoaching');

  // Parse include
  const include = includeParam
    ? (includeParam.split(',') as Array<
        'performance' | 'recommendations' | 'predictions' | 'coaching'
      >)
    : undefined;

  // Parse options
  const options: AIInsightsGenerationOptions = {
    include,
    includeCoaching: includeCoachingParam === 'true',
  };

  // Get metrics first (needed for AI insights)
  const now = new Date();
  let periodStart: Date;
  let periodEnd: Date;

  if (periodParam === 'weekly') {
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    periodStart = new Date(now.setDate(diff));
    periodStart.setHours(0, 0, 0, 0);
    periodEnd = new Date(periodStart);
    periodEnd.setDate(periodEnd.getDate() + 6);
    periodEnd.setHours(23, 59, 59, 999);
  } else {
    // Default to monthly
    periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    periodEnd = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );
  }

  const metrics = await calculateUnifiedMetrics(
    user.id,
    {
      start: periodStart,
      end: periodEnd,
      type: periodParam === 'weekly' ? 'weekly' : 'monthly',
    },
    {
      include: [
        'trips',
        'earnings',
        'ratings',
        'performance',
        'development',
        'customerSatisfaction',
        'efficiency',
        'financial',
        'quality',
        'growth',
        'comparative',
        'sustainability',
        'operations',
        'safety',
      ],
      calculateTrends: false,
      compareWithPrevious: true, // Needed for growth metrics
    }
  );

  // Get guide context
  const { data: userData } = await supabase
    .from('users')
    .select('id, full_name')
    .eq('id', user.id)
    .maybeSingle();

  const { data: skills } = await (supabase as any)
    .from('guide_skills')
    .select('skill:skills(name), level, certified')
    .eq('guide_id', user.id);

  const { data: reviews } = await (supabase as any)
    .from('reviews')
    .select('guide_rating, overall_rating, comment')
    .eq('guide_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10);

  const context: GuideContext = {
    guideId: user.id,
    guideName: userData?.full_name || undefined,
    skills:
      skills?.map((s: any) => ({
        name: s.skill?.name || 'Unknown',
        level: s.level || 1,
        certified: s.certified || false,
      })) || [],
    recentFeedback:
      reviews?.map((r: any) => ({
        rating: r.guide_rating || r.overall_rating || 0,
        comment: r.comment || '',
        category: 'general',
      })) || [],
  };

  // Use cache for expensive AI insights generation
  const cacheKey = cacheKeys.guide.unifiedAIInsights(
    user.id,
    `${periodParam}:${periodStart.toISOString().split('T')[0]}:${include?.join(',') || 'all'}`
  );

  const insights = await getCached(
    cacheKey,
    cacheTTL.unifiedAIInsights,
    async () => {
      return await generateUnifiedAIInsights(metrics, context, options);
    }
  );

  return NextResponse.json({
    insights,
  });
});
