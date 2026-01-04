/**
 * Data Retention Helper
 * GDPR/Privacy compliance utilities for automatic data cleanup
 */

import 'server-only';

import { deleteFile } from '@/lib/storage/supabase-storage';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export type RetentionConfig = {
  ktpRetentionDays: number; // Default: 30 days after trip completion
  signatureRetentionDays: number; // Default: 365 days (legal requirement)
  auditLogRetentionDays: number; // Default: 730 days (2 years)
};

const DEFAULT_CONFIG: RetentionConfig = {
  ktpRetentionDays: 30,
  signatureRetentionDays: 365,
  auditLogRetentionDays: 730,
};

export type CleanupResult = {
  ktpPhotosDeleted: number;
  bookingsUpdated: number;
  auditLogsCreated: number;
  errors: string[];
};

/**
 * Clean up KTP photos after retention period
 * Runs daily via CRON job
 */
export async function cleanupKtpPhotos(
  config: Partial<RetentionConfig> = {}
): Promise<CleanupResult> {
  const { ktpRetentionDays } = { ...DEFAULT_CONFIG, ...config };
  const supabase = await createClient();
  const result: CleanupResult = {
    ktpPhotosDeleted: 0,
    bookingsUpdated: 0,
    auditLogsCreated: 0,
    errors: [],
  };

  logger.info('[DataRetention] Starting KTP photo cleanup', { ktpRetentionDays });

  try {
    // Calculate cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - ktpRetentionDays);
    const cutoffDateStr = cutoffDate.toISOString().split('T')[0];

    // Find bookings with KTP photos that need cleanup
    // Criteria: trip completed, trip_date older than retention period
    const { data: bookings, error: fetchError } = await supabase
      .from('bookings')
      .select('id, code, ktp_photo_url, trip_date, user_id')
      .not('ktp_photo_url', 'is', null)
      .lt('trip_date', cutoffDateStr)
      .in('status', ['completed', 'cancelled']);

    if (fetchError) {
      logger.error('[DataRetention] Failed to fetch bookings', fetchError);
      result.errors.push(`Fetch error: ${fetchError.message}`);
      return result;
    }

    if (!bookings || bookings.length === 0) {
      logger.info('[DataRetention] No KTP photos to clean up');
      return result;
    }

    logger.info('[DataRetention] Found bookings for cleanup', {
      count: bookings.length,
    });

    // Process each booking
    for (const booking of bookings) {
      try {
        const ktpUrl = booking.ktp_photo_url as string | null;

        // Delete from storage if URL exists
        if (ktpUrl) {
          // Extract path from URL
          const pathMatch = ktpUrl.match(/\/documents\/(.+)$/);
          if (pathMatch?.[1]) {
            await deleteFile('documents', pathMatch[1]);
            result.ktpPhotosDeleted++;
          }
        }

        // Nullify KTP URL in database
        const { error: updateError } = await supabase
          .from('bookings')
          .update({ ktp_photo_url: null })
          .eq('id', booking.id);

        if (updateError) {
          result.errors.push(`Update error for ${booking.code}: ${updateError.message}`);
          continue;
        }

        result.bookingsUpdated++;

        // Create audit log
        const { error: auditError } = await supabase.from('audit_logs').insert({
          action: 'data_retention_cleanup',
          table_name: 'bookings',
          record_id: booking.id,
          old_data: { ktp_photo_url: '[REDACTED]' },
          new_data: { ktp_photo_url: null },
          user_id: null, // System action
          metadata: {
            reason: 'GDPR data retention policy',
            retention_days: ktpRetentionDays,
            trip_date: booking.trip_date,
          },
        });

        if (!auditError) {
          result.auditLogsCreated++;
        }

        logger.info('[DataRetention] Cleaned up KTP for booking', {
          bookingCode: booking.code,
          tripDate: booking.trip_date,
        });
      } catch (bookingError) {
        const message =
          bookingError instanceof Error ? bookingError.message : String(bookingError);
        result.errors.push(`Booking ${booking.code}: ${message}`);
        logger.error('[DataRetention] Error processing booking', bookingError, {
          bookingCode: booking.code,
        });
      }
    }

    logger.info('[DataRetention] KTP cleanup completed', result);
    return result;
  } catch (error) {
    logger.error('[DataRetention] Fatal error in cleanup', error);
    result.errors.push(error instanceof Error ? error.message : String(error));
    return result;
  }
}

/**
 * Clean up expired passenger documents
 * Similar to KTP cleanup but for booking_passengers table
 */
export async function cleanupPassengerDocuments(
  config: Partial<RetentionConfig> = {}
): Promise<CleanupResult> {
  const { ktpRetentionDays } = { ...DEFAULT_CONFIG, ...config };
  const supabase = await createClient();
  const result: CleanupResult = {
    ktpPhotosDeleted: 0,
    bookingsUpdated: 0,
    auditLogsCreated: 0,
    errors: [],
  };

  logger.info('[DataRetention] Starting passenger document cleanup', { ktpRetentionDays });

  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - ktpRetentionDays);
    const cutoffDateStr = cutoffDate.toISOString().split('T')[0];

    // Find passengers with KTP photos that need cleanup
    const { data: passengers, error: fetchError } = await supabase
      .from('booking_passengers')
      .select(`
        id,
        booking_id,
        full_name,
        ktp_photo_url,
        bookings!inner (
          id,
          code,
          trip_date,
          status
        )
      `)
      .not('ktp_photo_url', 'is', null);

    if (fetchError) {
      logger.error('[DataRetention] Failed to fetch passengers', fetchError);
      result.errors.push(`Fetch error: ${fetchError.message}`);
      return result;
    }

    // Filter passengers whose booking trip_date is past retention period
    const passengersToClean =
      passengers?.filter((p) => {
        const booking = p.bookings as unknown as {
          trip_date: string;
          status: string;
        };
        if (!booking) return false;

        const tripDate = booking.trip_date;
        const status = booking.status;

        return (
          tripDate < cutoffDateStr && (status === 'completed' || status === 'cancelled')
        );
      }) || [];

    if (passengersToClean.length === 0) {
      logger.info('[DataRetention] No passenger documents to clean up');
      return result;
    }

    logger.info('[DataRetention] Found passengers for cleanup', {
      count: passengersToClean.length,
    });

    // Process each passenger
    for (const passenger of passengersToClean) {
      try {
        const ktpUrl = passenger.ktp_photo_url as string | null;

        // Delete from storage
        if (ktpUrl) {
          const pathMatch = ktpUrl.match(/\/documents\/(.+)$/);
          if (pathMatch?.[1]) {
            await deleteFile('documents', pathMatch[1]);
            result.ktpPhotosDeleted++;
          }
        }

        // Nullify URL
        const { error: updateError } = await supabase
          .from('booking_passengers')
          .update({ ktp_photo_url: null })
          .eq('id', passenger.id);

        if (!updateError) {
          result.bookingsUpdated++;
        }
      } catch (passengerError) {
        const message =
          passengerError instanceof Error ? passengerError.message : String(passengerError);
        result.errors.push(`Passenger ${passenger.full_name}: ${message}`);
      }
    }

    logger.info('[DataRetention] Passenger document cleanup completed', result);
    return result;
  } catch (error) {
    logger.error('[DataRetention] Fatal error in passenger cleanup', error);
    result.errors.push(error instanceof Error ? error.message : String(error));
    return result;
  }
}

/**
 * Clean up trip manifests after H+72 (72 hours post-trip)
 * UU PDP requirement: delete passenger data after no longer needed
 */
export async function cleanupTripManifests(): Promise<CleanupResult> {
  const supabase = await createClient();
  const result: CleanupResult = {
    ktpPhotosDeleted: 0,
    bookingsUpdated: 0,
    auditLogsCreated: 0,
    errors: [],
  };

  logger.info('[DataRetention] Starting trip manifest cleanup');

  try {
    // Calculate cutoff: 72 hours (3 days) after trip completed
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - 72);

    // Find completed trips past retention period
    const { data: trips, error: fetchError } = await supabase
      .from('trips')
      .select('id, trip_code, completed_at, manifest_data')
      .eq('status', 'completed')
      .not('manifest_data', 'is', null)
      .lt('completed_at', cutoffDate.toISOString());

    if (fetchError) {
      logger.error('[DataRetention] Failed to fetch trips', fetchError);
      result.errors.push(`Fetch error: ${fetchError.message}`);
      return result;
    }

    if (!trips || trips.length === 0) {
      logger.info('[DataRetention] No manifests to clean up');
      return result;
    }

    logger.info('[DataRetention] Found manifests for cleanup', {
      count: trips.length,
    });

    // Process each trip
    for (const trip of trips) {
      try {
        // Nullify manifest data
        const { error: updateError } = await supabase
          .from('trips')
          .update({ manifest_data: null })
          .eq('id', trip.id);

        if (updateError) {
          result.errors.push(`Update error for ${trip.trip_code}: ${updateError.message}`);
          continue;
        }

        result.bookingsUpdated++;

        // Create audit log
        const { error: auditError } = await supabase.from('audit_logs').insert({
          action: 'data_retention_cleanup',
          table_name: 'trips',
          record_id: trip.id,
          old_data: { manifest_data: '[REDACTED]' },
          new_data: { manifest_data: null },
          user_id: null,
          metadata: {
            reason: 'UU PDP - H+72 manifest deletion',
            completed_at: trip.completed_at,
          },
        });

        if (!auditError) {
          result.auditLogsCreated++;
        }

        logger.info('[DataRetention] Cleaned up manifest for trip', {
          tripCode: trip.trip_code,
        });
      } catch (tripError) {
        const message = tripError instanceof Error ? tripError.message : String(tripError);
        result.errors.push(`Trip ${trip.trip_code}: ${message}`);
      }
    }

    logger.info('[DataRetention] Manifest cleanup completed', result);
    return result;
  } catch (error) {
    logger.error('[DataRetention] Fatal error in manifest cleanup', error);
    result.errors.push(error instanceof Error ? error.message : String(error));
    return result;
  }
}

/**
 * Clean up location tracking logs after 90 days
 */
export async function cleanupLocationLogs(): Promise<CleanupResult> {
  const supabase = await createClient();
  const result: CleanupResult = {
    ktpPhotosDeleted: 0,
    bookingsUpdated: 0,
    auditLogsCreated: 0,
    errors: [],
  };

  logger.info('[DataRetention] Starting location logs cleanup');

  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);

    // Delete old location logs
    const { error: deleteError, count } = await supabase
      .from('guide_location_logs')
      .delete()
      .lt('created_at', cutoffDate.toISOString());

    if (deleteError) {
      logger.error('[DataRetention] Failed to delete location logs', deleteError);
      result.errors.push(`Delete error: ${deleteError.message}`);
      return result;
    }

    result.bookingsUpdated = count || 0;

    logger.info('[DataRetention] Location logs cleanup completed', {
      deletedCount: count,
    });

    return result;
  } catch (error) {
    logger.error('[DataRetention] Fatal error in location logs cleanup', error);
    result.errors.push(error instanceof Error ? error.message : String(error));
    return result;
  }
}

/**
 * Clean up passenger consent records after 1 year
 */
export async function cleanupPassengerConsents(): Promise<CleanupResult> {
  const supabase = await createClient();
  const result: CleanupResult = {
    ktpPhotosDeleted: 0,
    bookingsUpdated: 0,
    auditLogsCreated: 0,
    errors: [],
  };

  logger.info('[DataRetention] Starting passenger consent cleanup');

  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 365); // 1 year

    // Find old passenger consents
    const { data: consents, error: fetchError } = await supabase
      .from('passenger_consents')
      .select('id, trip_id, created_at')
      .lt('created_at', cutoffDate.toISOString());

    if (fetchError) {
      logger.error('[DataRetention] Failed to fetch passenger consents', fetchError);
      result.errors.push(`Fetch error: ${fetchError.message}`);
      return result;
    }

    if (!consents || consents.length === 0) {
      logger.info('[DataRetention] No passenger consents to clean up');
      return result;
    }

    logger.info('[DataRetention] Found passenger consents for cleanup', {
      count: consents.length,
    });

    // Delete signature data (keep record for audit but remove PII)
    for (const consent of consents) {
      try {
        const { error: updateError } = await supabase
          .from('passenger_consents')
          .update({
            signature_data: null,
            notes: 'Signature data removed after retention period',
          })
          .eq('id', consent.id);

        if (!updateError) {
          result.bookingsUpdated++;
        }
      } catch (consentError) {
        const message = consentError instanceof Error ? consentError.message : String(consentError);
        result.errors.push(`Consent ${consent.id}: ${message}`);
      }
    }

    logger.info('[DataRetention] Passenger consent cleanup completed', result);
    return result;
  } catch (error) {
    logger.error('[DataRetention] Fatal error in passenger consent cleanup', error);
    result.errors.push(error instanceof Error ? error.message : String(error));
    return result;
  }
}

/**
 * Get data retention statistics
 */
export async function getRetentionStats(): Promise<{
  pendingKtpCleanup: number;
  pendingPassengerCleanup: number;
  lastCleanupAt: string | null;
  totalCleanedLast30Days: number;
}> {
  const supabase = await createClient();

  // Count pending KTP cleanups
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - DEFAULT_CONFIG.ktpRetentionDays);
  const cutoffDateStr = cutoffDate.toISOString().split('T')[0];

  const { count: pendingKtp } = await supabase
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .not('ktp_photo_url', 'is', null)
    .lt('trip_date', cutoffDateStr)
    .in('status', ['completed', 'cancelled']);

  // Get last cleanup time from audit logs
  const { data: lastCleanup } = await supabase
    .from('audit_logs')
    .select('created_at')
    .eq('action', 'data_retention_cleanup')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  // Count cleanups in last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { count: cleanedLast30Days } = await supabase
    .from('audit_logs')
    .select('id', { count: 'exact', head: true })
    .eq('action', 'data_retention_cleanup')
    .gte('created_at', thirtyDaysAgo.toISOString());

  return {
    pendingKtpCleanup: pendingKtp || 0,
    pendingPassengerCleanup: 0, // Implement similar query
    lastCleanupAt: lastCleanup?.created_at || null,
    totalCleanedLast30Days: cleanedLast30Days || 0,
  };
}

