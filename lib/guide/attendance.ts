/**
 * Attendance Utilities for Guide App
 */

import { logger } from '@/lib/utils/logger';

import { Coordinates, validateCheckIn } from './geofencing';
import { queueMutation } from './offline-sync';

export type GeoPosition = Coordinates;

export type CheckInResult = {
  success: boolean;
  message: string;
  timestamp?: string;
  location?: Coordinates;
};

export type AttendanceStatus = {
  checkedIn: boolean;
  checkedOut: boolean;
  checkInTime?: string;
  checkOutTime?: string;
  isLate: boolean;
  lateFine?: number;
};

/**
 * Format distance for display
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

/**
 * Get attendance status for a trip from Supabase
 */
export async function getAttendanceStatus(
  tripId: string,
  guideId: string
): Promise<AttendanceStatus> {
  try {
    if (typeof window === 'undefined') {
      // Server-side: return default
      return {
        checkedIn: false,
        checkedOut: false,
        isLate: false,
      };
    }

    const response = await fetch(
      `/api/guide/attendance/status?tripId=${encodeURIComponent(tripId)}&guideId=${encodeURIComponent(guideId)}`
    );

    if (!response.ok) {
      logger.error('[Attendance] Failed to fetch status', { tripId, guideId, status: response.status });
      return {
        checkedIn: false,
        checkedOut: false,
        isLate: false,
      };
    }

    const data = (await response.json()) as AttendanceStatus;
    return data;
  } catch (error) {
    logger.error('[Attendance] Error fetching status', error, { tripId, guideId });
    return {
      checkedIn: false,
      checkedOut: false,
      isLate: false,
    };
  }
}

/**
 * Perform check-in
 */
export async function performCheckIn(
  tripId: string,
  guideId: string,
  location: Coordinates,
  meetingPointId?: string,
  photoUrl?: string,
  happiness?: number,
  description?: string,
): Promise<CheckInResult> {
  // Validate location (geofencing)
  const validation = validateCheckIn(location);

  if (!validation.allowed) {
    return {
      success: false,
      message: validation.message,
    };
  }

  const payload: Record<string, unknown> = {
    tripId,
    guideId,
    latitude: location.latitude,
    longitude: location.longitude,
    accuracy: location.accuracy,
  };

  if (photoUrl) {
    payload.photoUrl = photoUrl;
  }
  if (happiness !== undefined && happiness !== null) {
    payload.happiness = happiness;
  }
  if (description) {
    payload.description = description;
  }

  try {
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      const response = await fetch('/api/guide/attendance/check-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        // Fallback ke offline queue jika API gagal
        await queueMutation('CHECK_IN', payload);
      } else {
        const result = (await response.json()) as {
          isLate?: boolean;
          penaltyAmount?: number;
        };
        return {
          success: true,
          message: result.isLate
            ? 'Check-in berhasil. Anda terlambat, potongan Rp 25.000 diterapkan.'
            : 'Check-in berhasil!',
          timestamp: new Date().toISOString(),
          location,
        };
      }
    } else {
      await queueMutation('CHECK_IN', payload);
    }
  } catch {
    await queueMutation('CHECK_IN', payload);
  }

  return {
    success: true,
    message: 'Check-in berhasil! (menunggu sinkron ke server)',
    timestamp: new Date().toISOString(),
    location,
  };
}

/**
 * Perform check-out
 */
export async function performCheckOut(
  tripId: string,
  guideId: string,
  location: Coordinates
): Promise<CheckInResult> {
  const clientTime = new Date();
  const timestamp = clientTime.toISOString();

  const payload = {
    tripId,
    guideId,
    latitude: location.latitude,
    longitude: location.longitude,
    timestamp,
  };

  try {
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      const response = await fetch('/api/guide/attendance/check-out', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        await queueMutation('CHECK_OUT', payload);
      }
    } else {
      await queueMutation('CHECK_OUT', payload);
    }
  } catch {
    await queueMutation('CHECK_OUT', payload);
  }

  return {
    success: true,
    message: 'Check-out berhasil! Trip selesai.',
    timestamp,
    location,
  };
}
