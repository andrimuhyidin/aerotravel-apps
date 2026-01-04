/**
 * API: Unified Metrics Endpoint
 * GET /api/guide/metrics/unified
 *
 * Unified metrics endpoint - replaces multiple redundant endpoints:
 * - /api/guide/insights/performance
 * - /api/guide/performance/metrics
 * - /api/guide/insights/monthly (metrics part)
 *
 * Query params:
 * - period: 'monthly' | 'weekly' | 'custom' (default: 'monthly')
 * - start: ISO date string (for custom period)
 * - end: ISO date string (for custom period)
 * - include: comma-separated list of metrics to include
 *   - trips, earnings, ratings, performance, development, trends
 * - calculateTrends: 'true' | 'false' (default: 'true')
 * - compareWithPrevious: 'true' | 'false' (default: 'false')
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { cacheKeys, cacheTTL, getCached } from '@/lib/cache/redis-cache';
import { calculateUnifiedMetrics } from '@/lib/guide/metrics-calculator';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import type { MetricsCalculationOptions } from '@/types/guide-metrics';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const periodParam = searchParams.get('period') || 'monthly';
  const startParam = searchParams.get('start');
  const endParam = searchParams.get('end');
  const includeParam = searchParams.get('include');
  const calculateTrendsParam = searchParams.get('calculateTrends');
  const compareWithPreviousParam = searchParams.get('compareWithPrevious');

  // Parse period
  let periodStart: Date;
  let periodEnd: Date;
  let periodType: 'monthly' | 'weekly' | 'custom';

  if (startParam && endParam) {
    periodStart = new Date(startParam);
    periodEnd = new Date(endParam);
    periodType = 'custom';
  } else if (periodParam === 'weekly') {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Monday
    periodStart = new Date(now.setDate(diff));
    periodStart.setHours(0, 0, 0, 0);
    periodEnd = new Date(periodStart);
    periodEnd.setDate(periodEnd.getDate() + 6);
    periodEnd.setHours(23, 59, 59, 999);
    periodType = 'weekly';
  } else {
    // Default to monthly
    const now = new Date();
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
    periodType = 'monthly';
  }

  // Parse include
  const include = includeParam
    ? (includeParam.split(',') as Array<
        | 'trips'
        | 'earnings'
        | 'ratings'
        | 'performance'
        | 'development'
        | 'trends'
        | 'customerSatisfaction'
        | 'efficiency'
        | 'financial'
        | 'quality'
        | 'growth'
        | 'comparative'
        | 'sustainability'
        | 'operations'
        | 'safety'
      >)
    : undefined;

  // Parse options
  const options: MetricsCalculationOptions = {
    include,
    calculateTrends: calculateTrendsParam !== 'false',
    compareWithPrevious: compareWithPreviousParam === 'true',
  };

  // Use cache for expensive calculations
  const includeKey = include ? include.sort().join(',') : 'all';
  const cacheKey = cacheKeys.guide.unifiedMetrics(
    user.id,
    `${periodType}:${periodStart.toISOString().split('T')[0]}:${periodEnd.toISOString().split('T')[0]}:${includeKey}:${compareWithPreviousParam === 'true' ? 'compare' : 'no-compare'}`
  );

  // Calculate metrics (with cache)
  const metrics = await getCached(
    cacheKey,
    cacheTTL.unifiedMetrics,
    async () => {
      logger.info('Calculating unified metrics (cache miss)', {
        guideId: user.id,
        period: periodType,
        include: options.include,
      });
      return await calculateUnifiedMetrics(
        user.id,
        {
          start: periodStart,
          end: periodEnd,
          type: periodType,
        },
        options
      );
    }
  );

  // Log metrics keys for debugging
  logger.info('Unified metrics response', {
    guideId: user.id,
    period: periodType,
    metricsKeys: Object.keys(metrics),
    hasSustainability: metrics.sustainability !== undefined,
    hasOperations: metrics.operations !== undefined,
    hasSafety: metrics.safety !== undefined,
    sustainabilityKeys: metrics.sustainability
      ? Object.keys(metrics.sustainability)
      : null,
    operationsKeys: metrics.operations ? Object.keys(metrics.operations) : null,
    safetyKeys: metrics.safety ? Object.keys(metrics.safety) : null,
  });

  return NextResponse.json({
    metrics,
  });
});
