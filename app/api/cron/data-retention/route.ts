/**
 * API: Data Retention CRON Job
 * GET /api/cron/data-retention
 *
 * GDPR/Privacy compliance - automatic cleanup of sensitive data
 * Schedule: Daily at 04:00 WIB (21:00 UTC previous day)
 *
 * Cleans up:
 * - KTP photos H+30 after trip completion
 * - Passenger document photos
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import {
  cleanupKtpPhotos,
  cleanupPassengerDocuments,
  getRetentionStats,
} from '@/lib/compliance/data-retention';
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

/**
 * GET /api/cron/data-retention
 * Run data retention cleanup
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  // Verify cron secret
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  logger.info('[Cron] Starting data retention cleanup');

  try {
    // Get current stats before cleanup
    const statsBefore = await getRetentionStats();
    logger.info('[Cron] Stats before cleanup', statsBefore);

    // Run KTP cleanup
    const ktpResult = await cleanupKtpPhotos();
    logger.info('[Cron] KTP cleanup completed', ktpResult);

    // Run passenger document cleanup
    const passengerResult = await cleanupPassengerDocuments();
    logger.info('[Cron] Passenger document cleanup completed', passengerResult);

    const duration = Date.now() - startTime;

    const summary = {
      success: true,
      duration_ms: duration,
      ktp_cleanup: {
        photos_deleted: ktpResult.ktpPhotosDeleted,
        bookings_updated: ktpResult.bookingsUpdated,
        audit_logs_created: ktpResult.auditLogsCreated,
        errors: ktpResult.errors.length,
      },
      passenger_cleanup: {
        photos_deleted: passengerResult.ktpPhotosDeleted,
        passengers_updated: passengerResult.bookingsUpdated,
        errors: passengerResult.errors.length,
      },
      total_cleaned: ktpResult.ktpPhotosDeleted + passengerResult.ktpPhotosDeleted,
      timestamp: new Date().toISOString(),
    };

    logger.info('[Cron] Data retention cleanup completed', summary);

    return NextResponse.json(summary);
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('[Cron] Fatal error in data retention', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration_ms: duration,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
});

/**
 * POST /api/cron/data-retention
 * Manual trigger with custom config (admin only)
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  // Verify cron secret for manual runs too
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as {
    ktpRetentionDays?: number;
    dryRun?: boolean;
  };

  logger.info('[Cron] Manual data retention trigger', body);

  if (body.dryRun) {
    // Just return stats without cleanup
    const stats = await getRetentionStats();
    return NextResponse.json({
      dryRun: true,
      stats,
      message: 'Dry run - no data was deleted',
    });
  }

  // Run cleanup with custom config
  const ktpResult = await cleanupKtpPhotos({
    ktpRetentionDays: body.ktpRetentionDays,
  });

  const passengerResult = await cleanupPassengerDocuments({
    ktpRetentionDays: body.ktpRetentionDays,
  });

  return NextResponse.json({
    success: true,
    ktpResult,
    passengerResult,
    timestamp: new Date().toISOString(),
  });
});

