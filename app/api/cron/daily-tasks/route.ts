/**
 * API: Cron - Daily Tasks (Combined)
 * Route: /api/cron/daily-tasks
 * Purpose: Execute all daily scheduled tasks in a single cron job
 * Note: Vercel Hobby plan only allows 2 cron jobs with daily minimum schedule
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { logger } from '@/lib/utils/logger';

// Import all cron task functions
import { checkLicenseExpiry } from '@/lib/cron/license-expiry-check';
import { checkCertificationExpiry } from '@/lib/cron/certification-expiry-check';
import { runDataRetentionCleanup } from '@/lib/cron/data-retention-cleanup';

type TaskResult = {
  name: string;
  success: boolean;
  duration: number;
  error?: string;
};

/**
 * GET /api/cron/daily-tasks
 * Vercel Cron uses GET method
 * Trigger: Daily at 00:00 UTC
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  // Verify cron secret (Vercel sends this in Authorization header)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET || 'dev-secret-change-in-production';

  // Allow Vercel cron or direct call with secret
  const isVercelCron = request.headers.get('x-vercel-cron') === '1';
  const hasValidSecret = authHeader === `Bearer ${cronSecret}`;

  if (!isVercelCron && !hasValidSecret) {
    logger.warn('[CRON] Unauthorized daily-tasks attempt');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  logger.info('[CRON] Daily tasks triggered');
  const startTime = Date.now();
  const results: TaskResult[] = [];

  // Task 1: License Expiry Check
  try {
    const taskStart = Date.now();
    const result = await checkLicenseExpiry();
    results.push({
      name: 'license-expiry-check',
      success: result.success,
      duration: Date.now() - taskStart,
    });
  } catch (error) {
    results.push({
      name: 'license-expiry-check',
      success: false,
      duration: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  // Task 2: Certification Expiry Check
  try {
    const taskStart = Date.now();
    const result = await checkCertificationExpiry();
    results.push({
      name: 'certification-expiry-check',
      success: result.success,
      duration: Date.now() - taskStart,
    });
  } catch (error) {
    results.push({
      name: 'certification-expiry-check',
      success: false,
      duration: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  // Task 3: Data Retention Cleanup
  try {
    const taskStart = Date.now();
    const result = await runDataRetentionCleanup();
    results.push({
      name: 'data-retention-cleanup',
      success: result.success,
      duration: Date.now() - taskStart,
    });
  } catch (error) {
    results.push({
      name: 'data-retention-cleanup',
      success: false,
      duration: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  const totalDuration = Date.now() - startTime;
  const allSuccess = results.every((r) => r.success);

  logger.info('[CRON] Daily tasks completed', {
    success: allSuccess,
    totalDuration,
    tasksCompleted: results.filter((r) => r.success).length,
    tasksFailed: results.filter((r) => !r.success).length,
  });

  return NextResponse.json({
    success: allSuccess,
    job: 'daily-tasks',
    timestamp: new Date().toISOString(),
    totalDuration,
    results,
  });
});

/**
 * POST /api/cron/daily-tasks
 * Alternative method for manual trigger
 */
export const POST = GET;

