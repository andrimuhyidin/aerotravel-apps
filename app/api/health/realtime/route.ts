/**
 * API: Realtime Health Check
 * GET /api/health/realtime - Get Realtime health status
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getRealtimeHealth } from '@/lib/monitoring/realtime-health';
import { getCacheMetrics } from '@/lib/monitoring/cache-metrics';

export const GET = withErrorHandler(async (request: NextRequest) => {
  try {
    const realtimeHealth = await getRealtimeHealth();
    const cacheMetrics = getCacheMetrics();

    return NextResponse.json({
      realtime: realtimeHealth,
      cache: cacheMetrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        realtime: {
          enabled: false,
          tables: [],
          activeSubscriptions: 0,
          status: 'unhealthy',
          lastChecked: new Date().toISOString(),
        },
        cache: {
          hits: 0,
          misses: 0,
          sets: 0,
          invalidations: 0,
          errors: 0,
          hitRate: 0,
          totalRequests: 0,
        },
        timestamp: new Date().toISOString(),
        error: 'Failed to get health status',
      },
      { status: 500 }
    );
  }
});

