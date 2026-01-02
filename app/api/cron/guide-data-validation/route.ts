/**
 * API: Guide Data Validation Cron Job
 * GET /api/cron/guide-data-validation
 * 
 * This endpoint should be called by Vercel Cron or external cron service
 * Schedule: Daily at 02:00 AM
 * 
 * Runs comprehensive data validation checks and logs results
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { sendAdminAlert } from '@/lib/notifications/admin-alerts';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

// Verify cron secret to prevent unauthorized access
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    logger.warn('CRON_SECRET not configured, allowing request');
    return true; // Allow if not configured (for development)
  }

  return authHeader === `Bearer ${cronSecret}`;
}

export const GET = withErrorHandler(async (request: NextRequest) => {
  // Verify cron secret
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();
  const client = supabase as unknown as any;

  try {
    logger.info('[Cron] Starting guide data validation check');

    // Run daily validation check (calls database function)
    const { data: logId, error: validationError } = await client.rpc('run_daily_validation_check');

    if (validationError) {
      logger.error('[Cron] Failed to run validation check', validationError);
      return NextResponse.json(
        {
          error: 'Failed to run validation check',
          details: validationError.message,
        },
        { status: 500 },
      );
    }

    // Get validation log details
    const { data: log, error: logError } = await client
      .from('validation_logs')
      .select('*')
      .eq('id', logId)
      .single();

    if (logError || !log) {
      logger.error('[Cron] Failed to fetch validation log', logError);
      return NextResponse.json(
        {
          error: 'Failed to fetch validation log',
          details: logError?.message,
        },
        { status: 500 },
      );
    }

    logger.info('[Cron] Validation check completed', {
      logId: log.id,
      status: log.status,
      totalChecks: log.total_checks,
      passed: log.passed,
      failed: log.failed,
      warnings: log.warnings,
      criticals: log.criticals,
    });

    // Check if critical issues found (for alerting)
    const hasCriticalIssues = log.criticals > 0;
    const needsAttention = hasCriticalIssues || log.warnings > 10;

    if (needsAttention) {
      logger.warn('[Cron] Validation check found issues that need attention', {
        criticals: log.criticals,
        warnings: log.warnings,
        logId: log.id,
      });

      // Send alert to admins for critical issues
      await sendAdminAlert({
        type: 'data_validation_failure',
        title: 'Guide Data Validation Alert',
        message: `Daily validation check found ${log.criticals} critical issue(s) and ${log.warnings} warning(s). Total checks: ${log.total_checks}, Passed: ${log.passed}, Failed: ${log.failed}. Please review the validation log for details.`,
        severity: hasCriticalIssues ? 'high' : 'medium',
        metadata: {
          logId: log.id,
          totalChecks: log.total_checks,
          passed: log.passed,
          failed: log.failed,
          warnings: log.warnings,
          criticals: log.criticals,
          runAt: log.run_at,
        },
      });
    }

    return NextResponse.json({
      success: true,
      logId: log.id,
      status: log.status,
      summary: {
        totalChecks: log.total_checks,
        passed: log.passed,
        failed: log.failed,
        warnings: log.warnings,
        criticals: log.criticals,
      },
      needsAttention,
      runAt: log.run_at,
    });
  } catch (error) {
    logger.error('[Cron] Fatal error in validation check', error);
    return NextResponse.json(
      {
        error: 'Fatal error in validation check',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
});

