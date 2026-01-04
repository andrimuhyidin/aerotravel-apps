/**
 * Cron Job: Data Retention Cleanup
 * Schedule: Daily at 02:00 (2 AM)
 * Purpose: Auto-delete sensitive data per retention policy
 */

import {
  cleanupKtpPhotos,
  cleanupLocationLogs,
  cleanupPassengerConsents,
  cleanupPassengerDocuments,
  cleanupTripManifests,
} from '@/lib/compliance/data-retention';
import { logger } from '@/lib/utils/logger';

export async function runDataRetentionCleanup() {
  logger.info('[CRON] Starting data retention cleanup');

  const startTime = Date.now();
  const results = {
    ktpPhotos: { success: false, deleted: 0, errors: 0 },
    passengerDocs: { success: false, deleted: 0, errors: 0 },
    tripManifests: { success: false, deleted: 0, errors: 0 },
    locationLogs: { success: false, deleted: 0, errors: 0 },
    passengerConsents: { success: false, deleted: 0, errors: 0 },
  };

  try {
    // 1. Cleanup KTP photos (30 days after trip)
    logger.info('[CRON] Cleaning up KTP photos...');
    const ktpResult = await cleanupKtpPhotos();
    results.ktpPhotos = {
      success: ktpResult.errors.length === 0,
      deleted: ktpResult.ktpPhotosDeleted,
      errors: ktpResult.errors.length,
    };

    // 2. Cleanup passenger documents
    logger.info('[CRON] Cleaning up passenger documents...');
    const docsResult = await cleanupPassengerDocuments();
    results.passengerDocs = {
      success: docsResult.errors.length === 0,
      deleted: docsResult.ktpPhotosDeleted,
      errors: docsResult.errors.length,
    };

    // 3. Cleanup trip manifests (H+72)
    logger.info('[CRON] Cleaning up trip manifests...');
    const manifestsResult = await cleanupTripManifests();
    results.tripManifests = {
      success: manifestsResult.errors.length === 0,
      deleted: manifestsResult.bookingsUpdated,
      errors: manifestsResult.errors.length,
    };

    // 4. Cleanup location logs (90 days)
    logger.info('[CRON] Cleaning up location logs...');
    const logsResult = await cleanupLocationLogs();
    results.locationLogs = {
      success: logsResult.errors.length === 0,
      deleted: logsResult.bookingsUpdated,
      errors: logsResult.errors.length,
    };

    // 5. Cleanup passenger consents (1 year)
    logger.info('[CRON] Cleaning up passenger consents...');
    const consentsResult = await cleanupPassengerConsents();
    results.passengerConsents = {
      success: consentsResult.errors.length === 0,
      deleted: consentsResult.bookingsUpdated,
      errors: consentsResult.errors.length,
    };

    const duration = Date.now() - startTime;
    const totalDeleted = 
      results.ktpPhotos.deleted +
      results.passengerDocs.deleted +
      results.tripManifests.deleted +
      results.locationLogs.deleted +
      results.passengerConsents.deleted;

    logger.info('[CRON] Data retention cleanup completed', {
      duration: `${duration}ms`,
      totalDeleted,
      results,
    });

    return { success: true, results, duration };
  } catch (error) {
    logger.error('[CRON] Fatal error in data retention cleanup', error);
    return { success: false, error: String(error), results };
  }
}

