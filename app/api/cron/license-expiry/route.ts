/**
 * API: Cron Jobs Endpoint
 * Route: /api/cron/*
 * Purpose: Execute scheduled compliance tasks
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { checkLicenseExpiry } from '@/lib/cron/license-expiry-check';
import { logger } from '@/lib/utils/logger';

/**
 * POST /api/cron/license-expiry
 * Check license expiry and send alerts
 * Trigger: Daily at 00:00
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET || 'dev-secret-change-in-production';

  if (authHeader !== `Bearer ${cronSecret}`) {
    logger.warn('[CRON] Unauthorized cron job attempt');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  logger.info('[CRON] License expiry check triggered');
  const result = await checkLicenseExpiry();

  return NextResponse.json({
    success: result.success,
    job: 'license-expiry-check',
    timestamp: new Date().toISOString(),
    result,
  });
});

