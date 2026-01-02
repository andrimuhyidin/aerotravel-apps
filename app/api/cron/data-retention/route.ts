/**
 * API: Cron - Data Retention Cleanup
 * Route: /api/cron/data-retention
 * Purpose: Execute data retention cleanup
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { runDataRetentionCleanup } from '@/lib/cron/data-retention-cleanup';
import { logger } from '@/lib/utils/logger';

/**
 * POST /api/cron/data-retention
 * Run data retention cleanup
 * Trigger: Daily at 02:00
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET || 'dev-secret-change-in-production';

  if (authHeader !== `Bearer ${cronSecret}`) {
    logger.warn('[CRON] Unauthorized cron job attempt');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  logger.info('[CRON] Data retention cleanup triggered');
  const result = await runDataRetentionCleanup();

  return NextResponse.json({
    success: result.success,
    job: 'data-retention-cleanup',
    timestamp: new Date().toISOString(),
    result,
  });
});
