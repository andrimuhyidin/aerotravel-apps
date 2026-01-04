/**
 * API: Cron - Certification Expiry Check
 * Route: /api/cron/certification-expiry
 * Purpose: Check certification expiry and send alerts
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { checkCertificationExpiry } from '@/lib/cron/certification-expiry-check';
import { logger } from '@/lib/utils/logger';

/**
 * POST /api/cron/certification-expiry
 * Check certification expiry
 * Trigger: Daily at 01:00
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET || 'dev-secret-change-in-production';

  if (authHeader !== `Bearer ${cronSecret}`) {
    logger.warn('[CRON] Unauthorized cron job attempt');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  logger.info('[CRON] Certification expiry check triggered');
  const result = await checkCertificationExpiry();

  return NextResponse.json({
    success: result.success,
    job: 'certification-expiry-check',
    timestamp: new Date().toISOString(),
    result,
  });
});

