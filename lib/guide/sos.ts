/**
 * SOS / Panic Button Utilities for Guide App
 */

import { logger } from '@/lib/utils/logger';
import { Coordinates } from './geofencing';

export type SOSAlertType = 'medical' | 'security' | 'weather' | 'accident' | 'other';

export type SOSAlert = {
  id: string;
  type: SOSAlertType;
  guideId: string;
  tripId?: string;
  location: Coordinates;
  message?: string;
  timestamp: string;
  status: 'active' | 'responded' | 'resolved';
};

/**
 * Trigger SOS alert
 */
export async function triggerSOSAlert(
  type: SOSAlertType,
  guideId: string,
  location: Coordinates,
  tripId?: string,
  message?: string
): Promise<{ success: boolean; alertId?: string; message: string }> {
  try {
    const response = await fetch('/api/guide/sos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tripId: tripId && tripId !== 'no-trip' ? tripId : undefined,
        guideId,
        alertType: type,
        latitude: location.latitude,
        longitude: location.longitude,
        message,
      }),
    });

    if (!response.ok) {
      let errorMessage = 'Gagal mengirim SOS ke server';
      try {
        const errorJson = (await response.json()) as { error?: string };
        errorMessage = errorJson.error || errorMessage;
      } catch {
        const text = await response.text();
        errorMessage = text || errorMessage;
      }
      
      logger.error('SOS API call failed', undefined, {
        status: response.status,
        errorMessage,
        guideId,
        tripId,
      });
      
      return {
        success: false,
        message: errorMessage || 'Gagal mengirim SOS ke server. Coba lagi atau hubungi ops via telepon.',
      };
    }

    const json = (await response.json()) as { alertId?: string };

    return {
      success: true,
      alertId: json.alertId,
      message: 'SOS Alert terkirim! Tim operasional akan segera menghubungi Anda.',
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('SOS Alert request error', error, { guideId, tripId, errorMessage });
    
    // More specific error messages
    if (errorMessage.includes('fetch')) {
      return {
        success: false,
        message: 'Gagal mengirim SOS. Periksa koneksi internet dan coba lagi.',
      };
    }
    
    return {
      success: false,
      message: `Gagal mengirim SOS: ${errorMessage}. Silakan coba lagi atau hubungi ops via telepon.`,
    };
  }
}

/**
 * Start emergency tracking (continuous GPS updates)
 */
export function startEmergencyTracking(
  guideId: string,
  onLocationUpdate: (location: Coordinates) => void
): () => void {
  if (!navigator.geolocation) {
    logger.error('Geolocation not supported for emergency tracking');
    return () => {};
  }

  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      const location: Coordinates = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      onLocationUpdate(location);
    },
    (error) => {
      logger.error('Emergency tracking error', error, { guideId });
    },
    {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
    }
  );

  return () => {
    navigator.geolocation.clearWatch(watchId);
  };
}

/**
 * Cancel SOS alert
 */
export async function cancelSOSAlert(
  alertId: string,
  reason?: string
): Promise<{ success: boolean; message: string }> {
  logger.info('SOS Alert cancelled (client)', { alertId, reason });

  return {
    success: true,
    message: 'SOS Alert dibatalkan.',
  };
}
