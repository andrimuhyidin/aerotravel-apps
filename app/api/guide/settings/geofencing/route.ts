/**
 * GET /api/guide/settings/geofencing
 * Returns geofencing settings for client-side usage
 */

import { NextResponse } from 'next/server';

import { getSetting } from '@/lib/settings';
import { logger } from '@/lib/utils/logger';

const DEFAULT_GPS_TIMEOUT_MS = 10000;
const DEFAULT_GPS_MAX_AGE_MS = 0;
const DEFAULT_GPS_WATCH_MAX_AGE_MS = 5000;
const DEFAULT_GEOFENCE_RADIUS_METERS = 50;

export async function GET() {
  try {
    const [gpsTimeoutMs, gpsMaxAgeMs, gpsWatchMaxAgeMs, defaultRadiusMeters] =
      await Promise.all([
        getSetting('geofencing.gps_timeout_ms'),
        getSetting('geofencing.gps_max_age_ms'),
        getSetting('geofencing.gps_watch_max_age_ms'),
        getSetting('geofencing.default_radius_meters'),
      ]);

    return NextResponse.json({
      gpsTimeoutMs: (gpsTimeoutMs as number) ?? DEFAULT_GPS_TIMEOUT_MS,
      gpsMaxAgeMs: (gpsMaxAgeMs as number) ?? DEFAULT_GPS_MAX_AGE_MS,
      gpsWatchMaxAgeMs: (gpsWatchMaxAgeMs as number) ?? DEFAULT_GPS_WATCH_MAX_AGE_MS,
      defaultRadiusMeters: (defaultRadiusMeters as number) ?? DEFAULT_GEOFENCE_RADIUS_METERS,
    });
  } catch (error) {
    logger.error('Failed to fetch geofencing settings', error);
    
    // Return defaults on error
    return NextResponse.json({
      gpsTimeoutMs: DEFAULT_GPS_TIMEOUT_MS,
      gpsMaxAgeMs: DEFAULT_GPS_MAX_AGE_MS,
      gpsWatchMaxAgeMs: DEFAULT_GPS_WATCH_MAX_AGE_MS,
      defaultRadiusMeters: DEFAULT_GEOFENCE_RADIUS_METERS,
    });
  }
}

