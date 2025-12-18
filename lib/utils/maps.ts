/**
 * Maps Utilities
 * Helper functions for Google Maps, Waze, and offline map features
 */

export type MapProvider = 'google' | 'waze';

export type LocationPoint = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  type: 'meeting_point' | 'snorkeling_spot' | 'backup_dock' | 'landmark';
  description?: string;
};

/**
 * Open location in Google Maps
 */
export function openInGoogleMaps(latitude: number, longitude: number, label?: string): void {
  const query = encodeURIComponent(label || `${latitude},${longitude}`);
  const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
  window.open(url, '_blank');
}

/**
 * Open location in Waze
 */
export function openInWaze(latitude: number, longitude: number, label?: string): void {
  const url = `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes&q=${encodeURIComponent(label || '')}`;
  window.open(url, '_blank');
}

/**
 * Open location with provider selection
 */
export function openLocation(
  latitude: number,
  longitude: number,
  provider: MapProvider,
  label?: string,
): void {
  if (provider === 'google') {
    openInGoogleMaps(latitude, longitude, label);
  } else {
    openInWaze(latitude, longitude, label);
  }
}

/**
 * Get offline map data for important locations
 * This would typically fetch from a cache or API
 */
export function getOfflineMapPoints(tripId?: string): LocationPoint[] {
  // In a real implementation, this would fetch from IndexedDB or API
  // For now, return empty array - will be populated from trip data
  return [];
}

/**
 * Store location point in offline cache (IndexedDB)
 */
export async function cacheLocationPoint(point: LocationPoint): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    // Use IndexedDB via idb library if available
    // For now, use localStorage as fallback
    const cached = localStorage.getItem('offline_map_points');
    const points: LocationPoint[] = cached ? JSON.parse(cached) : [];
    
    // Remove existing point with same id
    const filtered = points.filter((p) => p.id !== point.id);
    filtered.push(point);
    
    localStorage.setItem('offline_map_points', JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to cache location point:', error);
  }
}

/**
 * Get cached location points
 */
export function getCachedLocationPoints(): LocationPoint[] {
  if (typeof window === 'undefined') return [];

  try {
    const cached = localStorage.getItem('offline_map_points');
    return cached ? (JSON.parse(cached) as LocationPoint[]) : [];
  } catch (error) {
    console.error('Failed to get cached location points:', error);
    return [];
  }
}

/**
 * Clear cached location points
 */
export function clearCachedLocationPoints(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('offline_map_points');
}
