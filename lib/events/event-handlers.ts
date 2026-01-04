/**
 * Event Handlers Registry
 * Pre-configured event handlers untuk common events
 */

import 'server-only';

import { createEventNotifications } from '@/lib/notifications/unified-notifications';
import { invalidateAvailabilityCache } from '@/lib/cache/package-availability-cache';
import { invalidateBookingCaches, invalidatePackageCaches } from '@/lib/cache/cache-invalidation';
import { logger } from '@/lib/utils/logger';

import { subscribeToEvent, type AppEvent } from './event-bus';

/**
 * Initialize default event handlers
 * Call this function saat app startup
 */
export function initializeEventHandlers(): void {
  // Booking event handlers
  subscribeToEvent('booking.created', handleBookingCreated);
  subscribeToEvent('booking.status_changed', handleBookingStatusChanged);
  subscribeToEvent('booking.cancelled', handleBookingCancelled);
  subscribeToEvent('booking.confirmed', handleBookingConfirmed);

  // Payment event handlers
  subscribeToEvent('payment.received', handlePaymentReceived);
  subscribeToEvent('payment.failed', handlePaymentFailed);

  // Trip event handlers
  subscribeToEvent('trip.assigned', handleTripAssigned);
  subscribeToEvent('trip.status_changed', handleTripStatusChanged);

  // Package event handlers
  subscribeToEvent('package.availability_changed', handlePackageAvailabilityChanged);

  // Wallet event handlers
  subscribeToEvent('wallet.balance_changed', handleWalletBalanceChanged);

  // Guide event handlers
  subscribeToEvent('guide.contract_signed', handleGuideContractSigned);
  subscribeToEvent('guide.contract_active', handleGuideContractActive);
  subscribeToEvent('guide.certification_expired', handleGuideCertificationExpired);
  subscribeToEvent('guide.assignment_confirmed', handleGuideAssignmentConfirmed);

  logger.info('[Event Handlers] Default handlers initialized');
}

/**
 * Handle booking.created event
 */
async function handleBookingCreated(event: AppEvent): Promise<void> {
  try {
    // Create notifications
    await createEventNotifications(
      'booking.created',
      event.data,
      'Booking Baru',
      `Booking baru telah dibuat: ${event.data.bookingCode || 'N/A'}`
    );

    // Invalidate caches
    if (event.data.bookingId) {
      await invalidateBookingCaches(event.data.bookingId as string);
    }

    if (event.data.packageId && event.data.tripDate) {
      await invalidateAvailabilityCache(
        event.data.packageId as string,
        event.data.tripDate as string
      );
    }
  } catch (error) {
    logger.error('[Event Handler] Failed to handle booking.created', error, { event });
  }
}

/**
 * Handle booking.status_changed event
 */
async function handleBookingStatusChanged(event: AppEvent): Promise<void> {
  try {
    const status = event.data.newStatus as string;
    const statusMessages: Record<string, string> = {
      paid: 'Pembayaran diterima',
      confirmed: 'Booking dikonfirmasi',
      cancelled: 'Booking dibatalkan',
      completed: 'Trip selesai',
    };

    const message = statusMessages[status] || `Status booking berubah menjadi ${status}`;

    // Create notifications
    await createEventNotifications(
      'booking.status_changed',
      event.data,
      'Status Booking Berubah',
      message
    );

    // Invalidate caches
    if (event.data.bookingId) {
      await invalidateBookingCaches(event.data.bookingId as string);
    }

    if (event.data.packageId && event.data.tripDate) {
      await invalidateAvailabilityCache(
        event.data.packageId as string,
        event.data.tripDate as string
      );
    }
  } catch (error) {
    logger.error('[Event Handler] Failed to handle booking.status_changed', error, { event });
  }
}

/**
 * Handle booking.cancelled event
 */
async function handleBookingCancelled(event: AppEvent): Promise<void> {
  try {
    // Create notifications
    await createEventNotifications(
      'booking.cancelled',
      event.data,
      'Booking Dibatalkan',
      `Booking ${event.data.bookingCode || 'N/A'} telah dibatalkan`
    );

    // Invalidate caches
    if (event.data.bookingId) {
      await invalidateBookingCaches(event.data.bookingId as string);
    }

    if (event.data.packageId && event.data.tripDate) {
      await invalidateAvailabilityCache(
        event.data.packageId as string,
        event.data.tripDate as string
      );
    }
  } catch (error) {
    logger.error('[Event Handler] Failed to handle booking.cancelled', error, { event });
  }
}

/**
 * Handle booking.confirmed event
 */
async function handleBookingConfirmed(event: AppEvent): Promise<void> {
  try {
    // Create notifications
    await createEventNotifications(
      'booking.confirmed',
      event.data,
      'Booking Dikonfirmasi',
      `Booking ${event.data.bookingCode || 'N/A'} telah dikonfirmasi`
    );

    // Invalidate caches
    if (event.data.bookingId) {
      await invalidateBookingCaches(event.data.bookingId as string);
    }
  } catch (error) {
    logger.error('[Event Handler] Failed to handle booking.confirmed', error, { event });
  }
}

/**
 * Handle payment.received event
 */
async function handlePaymentReceived(event: AppEvent): Promise<void> {
  try {
    // Create notifications
    await createEventNotifications(
      'payment.received',
      event.data,
      'Pembayaran Diterima',
      `Pembayaran untuk booking ${event.data.bookingCode || 'N/A'} telah diterima`
    );

    // Invalidate booking caches
    if (event.data.bookingId) {
      await invalidateBookingCaches(event.data.bookingId as string);
    }
  } catch (error) {
    logger.error('[Event Handler] Failed to handle payment.received', error, { event });
  }
}

/**
 * Handle payment.failed event
 */
async function handlePaymentFailed(event: AppEvent): Promise<void> {
  try {
    // Create notifications
    await createEventNotifications(
      'payment.failed',
      event.data,
      'Pembayaran Gagal',
      `Pembayaran untuk booking ${event.data.bookingCode || 'N/A'} gagal`
    );
  } catch (error) {
    logger.error('[Event Handler] Failed to handle payment.failed', error, { event });
  }
}

/**
 * Handle trip.assigned event
 */
async function handleTripAssigned(event: AppEvent): Promise<void> {
  try {
    // Create notifications
    await createEventNotifications(
      'trip.assigned',
      event.data,
      'Trip Assignment',
      `Anda telah ditugaskan untuk trip ${event.data.tripCode || 'N/A'}`
    );
  } catch (error) {
    logger.error('[Event Handler] Failed to handle trip.assigned', error, { event });
  }
}

/**
 * Handle trip.status_changed event
 */
async function handleTripStatusChanged(event: AppEvent): Promise<void> {
  try {
    // Create notifications
    await createEventNotifications(
      'trip.status_changed',
      event.data,
      'Status Trip Berubah',
      `Status trip ${event.data.tripCode || 'N/A'} telah berubah`
    );
  } catch (error) {
    logger.error('[Event Handler] Failed to handle trip.status_changed', error, { event });
  }
}

/**
 * Handle package.availability_changed event
 */
async function handlePackageAvailabilityChanged(event: AppEvent): Promise<void> {
  try {
    // Invalidate package availability cache
    if (event.data.packageId) {
      await invalidatePackageCaches(event.data.packageId as string, {
        invalidateAvailability: true,
        dateRange: event.data.dateRange as { start: string; end: string } | undefined,
      });
    }
  } catch (error) {
    logger.error('[Event Handler] Failed to handle package.availability_changed', error, {
      event,
    });
  }
}

/**
 * Handle wallet.balance_changed event
 */
async function handleWalletBalanceChanged(event: AppEvent): Promise<void> {
  try {
    // Create notifications
    await createEventNotifications(
      'wallet.balance_changed',
      event.data,
      'Saldo Wallet Berubah',
      `Saldo wallet Anda telah berubah`
    );
  } catch (error) {
    logger.error('[Event Handler] Failed to handle wallet.balance_changed', error, { event });
  }
}

/**
 * Handle guide.contract_signed event
 */
async function handleGuideContractSigned(event: AppEvent): Promise<void> {
  try {
    await createEventNotifications(
      'custom',
      event.data,
      'Kontrak Ditandatangani',
      `Kontrak ${event.data.contractNumber || 'N/A'} telah ditandatangani oleh guide`
    );
  } catch (error) {
    logger.error('[Event Handler] Failed to handle guide.contract_signed', error, { event });
  }
}

/**
 * Handle guide.contract_active event
 */
async function handleGuideContractActive(event: AppEvent): Promise<void> {
  try {
    await createEventNotifications(
      'custom',
      event.data,
      'Kontrak Aktif',
      `Kontrak ${event.data.contractNumber || 'N/A'} telah aktif dan berlaku`
    );
  } catch (error) {
    logger.error('[Event Handler] Failed to handle guide.contract_active', error, { event });
  }
}

/**
 * Handle guide.certification_expired event
 */
async function handleGuideCertificationExpired(event: AppEvent): Promise<void> {
  try {
    await createEventNotifications(
      'custom',
      event.data,
      'Sertifikasi Expired',
      `Sertifikasi ${event.data.certificationType || 'N/A'} telah expired. Harap perbarui segera.`
    );
  } catch (error) {
    logger.error('[Event Handler] Failed to handle guide.certification_expired', error, { event });
  }
}

/**
 * Handle guide.assignment_confirmed event
 */
async function handleGuideAssignmentConfirmed(event: AppEvent): Promise<void> {
  try {
    await createEventNotifications(
      'trip.assigned',
      event.data,
      'Assignment Dikonfirmasi',
      `Guide ${event.data.guideName || 'N/A'} telah mengkonfirmasi assignment untuk trip ${event.data.tripCode || 'N/A'}`
    );
  } catch (error) {
    logger.error('[Event Handler] Failed to handle guide.assignment_confirmed', error, { event });
  }
}

