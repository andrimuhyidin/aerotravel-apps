/**
 * Geofencing Utilities for Guide App
 * Validate guide location within radius of meeting point
 *
 * PRD Requirement: 50m radius from meeting point (Dermaga Ketapang)
 *
 * GPS settings are configurable via Admin Console (settings table)
 * Fallback to default constants if settings unavailable
 */

export type Coordinates = {
  latitude: number;
  longitude: number;
  accuracy?: number; // GPS accuracy in meters
  heading?: number; // Direction in degrees (0-360)
  speed?: number; // Speed in m/s
};

export type MeetingPoint = {
  id: string;
  name: string;
  coordinates: Coordinates;
  radiusMeters: number;
};

// ============================================
// DEFAULT VALUES (Fallback)
// ============================================

const DEFAULT_GPS_TIMEOUT_MS = 10000;
const DEFAULT_GPS_MAX_AGE_MS = 0;
const DEFAULT_GPS_WATCH_MAX_AGE_MS = 5000;
const DEFAULT_GEOFENCE_RADIUS_METERS = 50;

// Default meeting points (can be loaded from database)
export const DEFAULT_MEETING_POINTS: MeetingPoint[] = [
  {
    id: 'dermaga-ketapang',
    name: 'Dermaga Ketapang',
    coordinates: { latitude: -5.4667, longitude: 105.2833 }, // Lampung
    radiusMeters: DEFAULT_GEOFENCE_RADIUS_METERS,
  },
  {
    id: 'dermaga-merak',
    name: 'Dermaga Merak',
    coordinates: { latitude: -5.9333, longitude: 105.9833 },
    radiusMeters: DEFAULT_GEOFENCE_RADIUS_METERS,
  },
];

// ============================================
// SETTINGS TYPES
// ============================================

export interface GeofencingSettings {
  gpsTimeoutMs: number;
  gpsMaxAgeMs: number;
  gpsWatchMaxAgeMs: number;
  defaultRadiusMeters: number;
}

// ============================================
// SETTINGS FETCHER
// ============================================

/**
 * Get geofencing settings - client-safe version
 * Fetches from API to avoid server-only import chain in client components
 */
export async function getGeofencingSettings(): Promise<GeofencingSettings> {
  // Check if we're in browser context
  if (typeof window !== 'undefined') {
    // Client-side: fetch from API
    try {
      const response = await fetch('/api/guide/settings/geofencing');
      if (response.ok) {
        const data = await response.json();
        return {
          gpsTimeoutMs: data.gpsTimeoutMs ?? DEFAULT_GPS_TIMEOUT_MS,
          gpsMaxAgeMs: data.gpsMaxAgeMs ?? DEFAULT_GPS_MAX_AGE_MS,
          gpsWatchMaxAgeMs: data.gpsWatchMaxAgeMs ?? DEFAULT_GPS_WATCH_MAX_AGE_MS,
          defaultRadiusMeters: data.defaultRadiusMeters ?? DEFAULT_GEOFENCE_RADIUS_METERS,
        };
      }
    } catch {
      // Fall through to defaults
    }
    return {
      gpsTimeoutMs: DEFAULT_GPS_TIMEOUT_MS,
      gpsMaxAgeMs: DEFAULT_GPS_MAX_AGE_MS,
      gpsWatchMaxAgeMs: DEFAULT_GPS_WATCH_MAX_AGE_MS,
      defaultRadiusMeters: DEFAULT_GEOFENCE_RADIUS_METERS,
    };
  }

  // Server-side: import settings directly
  try {
    // @ts-expect-error - Dynamic import for server-only module
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getSetting } = await import(/* webpackIgnore: true */ '@/lib/settings');
    const [gpsTimeoutMs, gpsMaxAgeMs, gpsWatchMaxAgeMs, defaultRadiusMeters] =
      await Promise.all([
        getSetting('geofencing.gps_timeout_ms'),
        getSetting('geofencing.gps_max_age_ms'),
        getSetting('geofencing.gps_watch_max_age_ms'),
        getSetting('geofencing.default_radius_meters'),
      ]);

    return {
      gpsTimeoutMs: (gpsTimeoutMs as number) ?? DEFAULT_GPS_TIMEOUT_MS,
      gpsMaxAgeMs: (gpsMaxAgeMs as number) ?? DEFAULT_GPS_MAX_AGE_MS,
      gpsWatchMaxAgeMs:
        (gpsWatchMaxAgeMs as number) ?? DEFAULT_GPS_WATCH_MAX_AGE_MS,
      defaultRadiusMeters:
        (defaultRadiusMeters as number) ?? DEFAULT_GEOFENCE_RADIUS_METERS,
    };
  } catch {
    return {
      gpsTimeoutMs: DEFAULT_GPS_TIMEOUT_MS,
      gpsMaxAgeMs: DEFAULT_GPS_MAX_AGE_MS,
      gpsWatchMaxAgeMs: DEFAULT_GPS_WATCH_MAX_AGE_MS,
      defaultRadiusMeters: DEFAULT_GEOFENCE_RADIUS_METERS,
    };
  }
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @returns Distance in meters
 */
export function calculateDistance(
  point1: Coordinates,
  point2: Coordinates
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (point1.latitude * Math.PI) / 180;
  const φ2 = (point2.latitude * Math.PI) / 180;
  const Δφ = ((point2.latitude - point1.latitude) * Math.PI) / 180;
  const Δλ = ((point2.longitude - point1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Check if guide is within allowed radius of meeting point
 */
export function isWithinGeofence(
  guideLocation: Coordinates,
  meetingPoint: MeetingPoint
): boolean {
  const distance = calculateDistance(guideLocation, meetingPoint.coordinates);
  return distance <= meetingPoint.radiusMeters;
}

/**
 * Find nearest meeting point from guide's location
 */
export function findNearestMeetingPoint(
  guideLocation: Coordinates,
  meetingPoints: MeetingPoint[] = DEFAULT_MEETING_POINTS
): { meetingPoint: MeetingPoint; distanceMeters: number } | null {
  if (meetingPoints.length === 0) return null;

  let nearest = meetingPoints[0];
  let nearestDistance = calculateDistance(
    guideLocation,
    nearest?.coordinates ?? { latitude: 0, longitude: 0 }
  );

  for (const point of meetingPoints) {
    const distance = calculateDistance(guideLocation, point.coordinates);
    if (distance < nearestDistance) {
      nearest = point;
      nearestDistance = distance;
    }
  }

  return nearest ? { meetingPoint: nearest, distanceMeters: nearestDistance } : null;
}

/**
 * Validate check-in eligibility
 * Returns validation result with details
 */
export function validateCheckIn(
  guideLocation: Coordinates,
  targetMeetingPoint?: MeetingPoint,
  meetingPoints: MeetingPoint[] = DEFAULT_MEETING_POINTS
): {
  allowed: boolean;
  distanceMeters: number;
  meetingPoint: MeetingPoint | null;
  message: string;
} {
  // If specific meeting point is provided, validate against it
  if (targetMeetingPoint) {
    const distance = calculateDistance(guideLocation, targetMeetingPoint.coordinates);
    const allowed = distance <= targetMeetingPoint.radiusMeters;

    return {
      allowed,
      distanceMeters: Math.round(distance),
      meetingPoint: targetMeetingPoint,
      message: allowed
        ? `Check-in valid di ${targetMeetingPoint.name}`
        : `Anda ${Math.round(distance)}m dari ${targetMeetingPoint.name}. Maksimal ${targetMeetingPoint.radiusMeters}m.`,
    };
  }

  // Find nearest meeting point
  const nearest = findNearestMeetingPoint(guideLocation, meetingPoints);
  if (!nearest) {
    return {
      allowed: false,
      distanceMeters: 0,
      meetingPoint: null,
      message: 'Tidak ada titik kumpul terdaftar',
    };
  }

  const allowed = nearest.distanceMeters <= nearest.meetingPoint.radiusMeters;

  return {
    allowed,
    distanceMeters: Math.round(nearest.distanceMeters),
    meetingPoint: nearest.meetingPoint,
    message: allowed
      ? `Check-in valid di ${nearest.meetingPoint.name}`
      : `Anda ${Math.round(nearest.distanceMeters)}m dari ${nearest.meetingPoint.name}. Maksimal ${nearest.meetingPoint.radiusMeters}m.`,
  };
}

/**
 * Get current position using browser Geolocation API (sync - uses defaults)
 * @deprecated Use getCurrentPositionAsync() for dynamic settings
 */
export function getCurrentPosition(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation tidak didukung browser ini'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy ?? undefined,
          heading: position.coords.heading ?? undefined,
          speed: position.coords.speed ?? undefined,
        });
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(
              new Error('Akses lokasi ditolak. Aktifkan GPS untuk check-in.')
            );
            break;
          case error.POSITION_UNAVAILABLE:
            reject(new Error('Lokasi tidak tersedia. Coba lagi.'));
            break;
          case error.TIMEOUT:
            reject(new Error('Timeout mendapatkan lokasi. Coba lagi.'));
            break;
          default:
            reject(new Error('Gagal mendapatkan lokasi.'));
        }
      },
      {
        enableHighAccuracy: true,
        timeout: DEFAULT_GPS_TIMEOUT_MS,
        maximumAge: DEFAULT_GPS_MAX_AGE_MS,
      }
    );
  });
}

/**
 * Get current position using configurable GPS settings (async)
 */
export async function getCurrentPositionAsync(): Promise<Coordinates> {
  const settings = await getGeofencingSettings();

  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation tidak didukung browser ini'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy ?? undefined,
          heading: position.coords.heading ?? undefined,
          speed: position.coords.speed ?? undefined,
        });
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(
              new Error('Akses lokasi ditolak. Aktifkan GPS untuk check-in.')
            );
            break;
          case error.POSITION_UNAVAILABLE:
            reject(new Error('Lokasi tidak tersedia. Coba lagi.'));
            break;
          case error.TIMEOUT:
            reject(new Error('Timeout mendapatkan lokasi. Coba lagi.'));
            break;
          default:
            reject(new Error('Gagal mendapatkan lokasi.'));
        }
      },
      {
        enableHighAccuracy: true,
        timeout: settings.gpsTimeoutMs,
        maximumAge: settings.gpsMaxAgeMs,
      }
    );
  });
}

/**
 * Watch position for real-time tracking (sync - uses defaults)
 * @deprecated Use watchPositionAsync() for dynamic settings
 */
export function watchPosition(
  onUpdate: (coords: Coordinates) => void,
  onError: (error: Error) => void
): () => void {
  if (!navigator.geolocation) {
    onError(new Error('Geolocation tidak didukung'));
    return () => {};
  }

  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      onUpdate({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy ?? undefined,
        heading: position.coords.heading ?? undefined,
        speed: position.coords.speed ?? undefined,
      });
    },
    (error) => {
      onError(new Error(`GPS Error: ${error.message}`));
    },
    {
      enableHighAccuracy: true,
      timeout: DEFAULT_GPS_TIMEOUT_MS,
      maximumAge: DEFAULT_GPS_WATCH_MAX_AGE_MS,
    }
  );

  return () => navigator.geolocation.clearWatch(watchId);
}

/**
 * Watch position with configurable GPS settings (async setup, sync callback)
 */
export async function watchPositionAsync(
  onUpdate: (coords: Coordinates) => void,
  onError: (error: Error) => void
): Promise<() => void> {
  const settings = await getGeofencingSettings();

  if (!navigator.geolocation) {
    onError(new Error('Geolocation tidak didukung'));
    return () => {};
  }

  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      onUpdate({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy ?? undefined,
        heading: position.coords.heading ?? undefined,
        speed: position.coords.speed ?? undefined,
      });
    },
    (error) => {
      onError(new Error(`GPS Error: ${error.message}`));
    },
    {
      enableHighAccuracy: true,
      timeout: settings.gpsTimeoutMs,
      maximumAge: settings.gpsWatchMaxAgeMs,
    }
  );

  return () => navigator.geolocation.clearWatch(watchId);
}

/**
 * Get all geofencing settings (for admin display)
 */
export async function getAllGeofencingSettings(): Promise<GeofencingSettings> {
  return getGeofencingSettings();
}
