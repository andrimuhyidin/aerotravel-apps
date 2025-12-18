/**
 * GPS Helper Utilities
 * Helper functions for GPS accuracy, direction, and troubleshooting
 */

/**
 * Calculate bearing (direction) from point A to point B
 * @returns Bearing in degrees (0-360)
 */
export function calculateBearing(
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number },
): number {
  const lat1 = (from.latitude * Math.PI) / 180;
  const lat2 = (to.latitude * Math.PI) / 180;
  const dLon = ((to.longitude - from.longitude) * Math.PI) / 180;

  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

  let bearing = (Math.atan2(y, x) * 180) / Math.PI;
  bearing = (bearing + 360) % 360; // Normalize to 0-360

  return Math.round(bearing);
}

/**
 * Get accuracy status based on GPS accuracy value
 */
export function getAccuracyStatus(accuracy?: number): {
  level: 'high' | 'medium' | 'low' | 'unknown';
  color: string;
  label: string;
  description: string;
} {
  if (!accuracy) {
    return {
      level: 'unknown',
      color: 'slate',
      label: 'Tidak diketahui',
      description: 'Akurasi GPS tidak tersedia',
    };
  }

  if (accuracy <= 20) {
    return {
      level: 'high',
      color: 'emerald',
      label: 'Sangat Akurat',
      description: `Akurasi: ±${Math.round(accuracy)}m`,
    };
  } else if (accuracy <= 50) {
    return {
      level: 'medium',
      color: 'amber',
      label: 'Cukup Akurat',
      description: `Akurasi: ±${Math.round(accuracy)}m`,
    };
  } else {
    return {
      level: 'low',
      color: 'red',
      label: 'Kurang Akurat',
      description: `Akurasi: ±${Math.round(accuracy)}m`,
    };
  }
}

/**
 * Get compass direction name from bearing
 */
export function getCompassDirection(bearing: number): string {
  const directions = ['U', 'UT', 'T', 'TS', 'S', 'BD', 'B', 'BB'];
  const index = Math.round(bearing / 45) % 8;
  return directions[index] || 'T';
}

/**
 * Get full direction name in Indonesian
 */
export function getDirectionName(bearing: number): string {
  const directions: Record<number, string> = {
    0: 'Utara',
    22: 'Timur Laut',
    45: 'Timur Laut',
    67: 'Timur',
    90: 'Timur',
    112: 'Tenggara',
    135: 'Tenggara',
    157: 'Selatan',
    180: 'Selatan',
    202: 'Barat Daya',
    225: 'Barat Daya',
    247: 'Barat',
    270: 'Barat',
    292: 'Barat Laut',
    315: 'Barat Laut',
    337: 'Utara',
  };

  // Find closest direction
  const keys = Object.keys(directions).map(Number);
  const closest = keys.reduce((prev, curr) =>
    Math.abs(curr - bearing) < Math.abs(prev - bearing) ? curr : prev,
  );

  return directions[closest] || 'Tidak diketahui';
}
