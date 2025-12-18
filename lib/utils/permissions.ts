/**
 * Browser Permissions Utilities
 * Helper functions for checking and requesting browser permissions
 */

export type PermissionState = 'granted' | 'denied' | 'prompt';

/**
 * Check geolocation permission status
 */
export async function checkGeolocationPermission(): Promise<PermissionState> {
  if (!navigator.permissions) {
    // Fallback for browsers that don't support Permissions API
    if (!navigator.geolocation) {
      return 'denied';
    }
    return 'prompt';
  }

  try {
    const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
    return result.state;
  } catch (error) {
    // Fallback: try to get current position
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve('denied');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        () => resolve('granted'),
        (err) => {
          if (err.code === err.PERMISSION_DENIED) {
            resolve('denied');
          } else {
            resolve('prompt');
          }
        },
        { timeout: 1000 },
      );
    });
  }
}

/**
 * Get permission status info for UI
 */
export function getPermissionStatusInfo(state: PermissionState): {
  label: string;
  description: string;
  color: string;
  icon: 'check' | 'x' | 'alert';
} {
  switch (state) {
    case 'granted':
      return {
        label: 'Izin Lokasi Diizinkan',
        description: 'GPS dapat digunakan untuk check-in',
        color: 'emerald',
        icon: 'check',
      };
    case 'denied':
      return {
        label: 'Izin Lokasi Ditolak',
        description: 'Aktifkan izin lokasi di pengaturan browser untuk check-in',
        color: 'red',
        icon: 'x',
      };
    case 'prompt':
    default:
      return {
        label: 'Izin Lokasi Belum Diatur',
        description: 'Browser akan meminta izin saat check-in',
        color: 'amber',
        icon: 'alert',
      };
  }
}

/**
 * Request geolocation permission by attempting to get position
 */
export async function requestGeolocationPermission(): Promise<{
  granted: boolean;
  error?: string;
}> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ granted: false, error: 'Geolocation tidak didukung' });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      () => resolve({ granted: true }),
      (error) => {
        let errorMessage = 'Gagal mendapatkan izin';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Izin lokasi ditolak';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Lokasi tidak tersedia';
            break;
          case error.TIMEOUT:
            errorMessage = 'Timeout mendapatkan lokasi';
            break;
        }
        resolve({ granted: false, error: errorMessage });
      },
      { timeout: 5000, enableHighAccuracy: true },
    );
  });
}
