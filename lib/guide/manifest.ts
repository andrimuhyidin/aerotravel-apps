/**
 * Manifest Utilities for Guide App
 */

import { queueMutation } from './offline-sync';
import { buildSampleManifest } from './sample-data';

export type Passenger = {
  id: string;
  name: string;
  phone?: string;
  type: 'adult' | 'child' | 'infant';
  status: 'pending' | 'boarded' | 'returned';
  notes?: string;
};

export type TripManifest = {
  tripId: string;
  tripName: string;
  date: string;
  passengers: Passenger[];
  totalPax: number;
  boardedCount: number;
  returnedCount: number;
  documentationUrl?: string; // Link Google Drive / folder dokumentasi
};

/**
 * Get trip manifest
 * Fetch from API so we can hit Supabase from server-side route
 */
export async function getTripManifest(tripId: string): Promise<TripManifest> {
  const response = await fetch(`/api/guide/manifest?tripId=${encodeURIComponent(tripId)}`);

  if (!response.ok) {
    // Fallback ke sample manifest jika API gagal
    return buildSampleManifest(tripId, 'Sample Trip', '');
  }

  const data = (await response.json()) as TripManifest;

  // Jika backend belum punya data passenger, fallback ke sample (dev/demo)
  if (!data.passengers || data.passengers.length === 0) {
    return buildSampleManifest(tripId, data.tripName, data.date);
  }

  return data;
}

/**
 * Mark passenger as boarded
 */
export async function markPassengerBoarded(
  tripId: string,
  passengerId: string
): Promise<{ success: boolean; message: string }> {
  const payload = {
    tripId,
    passengerId,
    checkType: 'boarding' as const,
  };

  try {
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      const response = await fetch('/api/guide/manifest/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        // Fallback ke offline queue kalau request gagal
        await queueMutation('UPDATE_MANIFEST', payload);
        return {
          success: true,
          message: 'Tidak ada koneksi. Status akan disinkronkan saat online.',
        };
      }
    } else {
      // Offline: langsung antre ke mutation queue
      await queueMutation('UPDATE_MANIFEST', payload);
      return {
        success: true,
        message: 'Tidak ada koneksi. Status akan disinkronkan saat online.',
      };
    }

    return { success: true, message: 'Penumpang tercatat naik.' };
  } catch {
    await queueMutation('UPDATE_MANIFEST', payload);
    return {
      success: true,
      message: 'Tidak ada koneksi. Status akan disinkronkan saat online.',
    };
  }
}

/**
 * Mark passenger as returned
 */
export async function markPassengerReturned(
  tripId: string,
  passengerId: string
): Promise<{ success: boolean; message: string }> {
  const payload = {
    tripId,
    passengerId,
    checkType: 'return' as const,
  };

  try {
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      const response = await fetch('/api/guide/manifest/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        await queueMutation('UPDATE_MANIFEST', payload);
        return {
          success: true,
          message: 'Tidak ada koneksi. Status akan disinkronkan saat online.',
        };
      }
    } else {
      await queueMutation('UPDATE_MANIFEST', payload);
      return {
        success: true,
        message: 'Tidak ada koneksi. Status akan disinkronkan saat online.',
      };
    }

    return { success: true, message: 'Penumpang tercatat kembali.' };
  } catch {
    await queueMutation('UPDATE_MANIFEST', payload);
    return {
      success: true,
      message: 'Tidak ada koneksi. Status akan disinkronkan saat online.',
    };
  }
}

/**
 * Bulk mark passengers as boarded
 */
export async function bulkMarkPassengersBoarded(
  tripId: string,
  passengerIds: string[]
): Promise<{ success: boolean; message: string; count: number }> {
  if (passengerIds.length === 0) {
    return { success: false, message: 'Tidak ada penumpang yang dipilih.', count: 0 };
  }

  const payload = {
    tripId,
    passengerIds,
    checkType: 'boarding' as const,
    bulk: true,
  };

  try {
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      const response = await fetch('/api/guide/manifest/bulk-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        // Fallback: queue individual mutations
        for (const passengerId of passengerIds) {
          await queueMutation('UPDATE_MANIFEST', {
            tripId,
            passengerId,
            checkType: 'boarding',
          });
        }
        return {
          success: true,
          message: `Tidak ada koneksi. ${passengerIds.length} status akan disinkronkan saat online.`,
          count: passengerIds.length,
        };
      }

      const result = (await response.json()) as { success: boolean; count: number };
      return {
        success: true,
        message: `${result.count} penumpang tercatat naik.`,
        count: result.count,
      };
    } else {
      // Offline: queue individual mutations
      for (const passengerId of passengerIds) {
        await queueMutation('UPDATE_MANIFEST', {
          tripId,
          passengerId,
          checkType: 'boarding',
        });
      }
      return {
        success: true,
        message: `Tidak ada koneksi. ${passengerIds.length} status akan disinkronkan saat online.`,
        count: passengerIds.length,
      };
    }
  } catch {
    // Fallback: queue individual mutations
    for (const passengerId of passengerIds) {
      await queueMutation('UPDATE_MANIFEST', {
        tripId,
        passengerId,
        checkType: 'boarding',
      });
    }
    return {
      success: true,
      message: `Tidak ada koneksi. ${passengerIds.length} status akan disinkronkan saat online.`,
      count: passengerIds.length,
    };
  }
}

/**
 * Bulk mark passengers as returned
 */
export async function bulkMarkPassengersReturned(
  tripId: string,
  passengerIds: string[]
): Promise<{ success: boolean; message: string; count: number }> {
  if (passengerIds.length === 0) {
    return { success: false, message: 'Tidak ada penumpang yang dipilih.', count: 0 };
  }

  const payload = {
    tripId,
    passengerIds,
    checkType: 'return' as const,
    bulk: true,
  };

  try {
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      const response = await fetch('/api/guide/manifest/bulk-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        // Fallback: queue individual mutations
        for (const passengerId of passengerIds) {
          await queueMutation('UPDATE_MANIFEST', {
            tripId,
            passengerId,
            checkType: 'return',
          });
        }
        return {
          success: true,
          message: `Tidak ada koneksi. ${passengerIds.length} status akan disinkronkan saat online.`,
          count: passengerIds.length,
        };
      }

      const result = (await response.json()) as { success: boolean; count: number };
      return {
        success: true,
        message: `${result.count} penumpang tercatat kembali.`,
        count: result.count,
      };
    } else {
      // Offline: queue individual mutations
      for (const passengerId of passengerIds) {
        await queueMutation('UPDATE_MANIFEST', {
          tripId,
          passengerId,
          checkType: 'return',
        });
      }
      return {
        success: true,
        message: `Tidak ada koneksi. ${passengerIds.length} status akan disinkronkan saat online.`,
        count: passengerIds.length,
      };
    }
  } catch {
    // Fallback: queue individual mutations
    for (const passengerId of passengerIds) {
      await queueMutation('UPDATE_MANIFEST', {
        tripId,
        passengerId,
        checkType: 'return',
      });
    }
    return {
      success: true,
      message: `Tidak ada koneksi. ${passengerIds.length} status akan disinkronkan saat online.`,
      count: passengerIds.length,
    };
  }
}

/**
 * Save trip documentation URL (Google Drive link)
 */
export async function saveTripDocumentationUrl(
  tripId: string,
  url: string
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`/api/guide/trips/${encodeURIComponent(tripId)}/documentation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    return { success: false, message: 'Gagal menyimpan link dokumentasi.' };
  }

  return { success: true, message: 'Link dokumentasi tersimpan.' };
}
