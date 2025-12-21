/**
 * SOS GPS Streaming Service
 * Handles real-time GPS streaming for active SOS alerts
 */

import { logger } from '@/lib/utils/logger';

let streamingInterval: NodeJS.Timeout | null = null;
let currentSosAlertId: string | null = null;
let isStreaming = false;

/**
 * Start GPS streaming for SOS alert
 */
export function startSOSStreaming(sosAlertId: string): () => void {
  if (isStreaming && currentSosAlertId === sosAlertId) {
    // Already streaming for this alert
    return stopSOSStreaming;
  }

  // Stop any existing streaming
  if (streamingInterval) {
    clearInterval(streamingInterval);
  }

  currentSosAlertId = sosAlertId;
  isStreaming = true;

  // Stream GPS location every 10 seconds
  streamingInterval = setInterval(async () => {
    if (!currentSosAlertId) {
      stopSOSStreaming();
      return;
    }

    try {
      // Get current GPS position
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude, accuracy } = position.coords;

            try {
              const response = await fetch(`/api/guide/sos/${currentSosAlertId}/stream`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  latitude,
                  longitude,
                  accuracyMeters: accuracy || undefined,
                }),
              });

              if (!response.ok) {
                logger.warn('Failed to stream GPS location', {
                  sosAlertId: currentSosAlertId,
                  status: response.status,
                });
              }
            } catch (error) {
              logger.error('Failed to stream GPS location', error, {
                sosAlertId: currentSosAlertId,
              });
            }
          },
          (error) => {
            logger.warn('GPS access denied or failed', {
              error: error.message,
              code: error.code,
            });
          },
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0, // Always get fresh position
          }
        );
      }
    } catch (error) {
      logger.error('SOS streaming error', error, { sosAlertId: currentSosAlertId });
    }
  }, 10000); // Every 10 seconds

  logger.info('SOS GPS streaming started', { sosAlertId });

  return stopSOSStreaming;
}

/**
 * Stop GPS streaming
 */
export function stopSOSStreaming(): void {
  if (streamingInterval) {
    clearInterval(streamingInterval);
    streamingInterval = null;
  }

  if (currentSosAlertId) {
    // Notify server that streaming stopped by calling stop function
    fetch(`/api/guide/sos/${currentSosAlertId}/cancel`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reason: 'Streaming stopped by client',
      }),
    }).catch((error) => {
      logger.warn('Failed to notify server of streaming stop', { error });
    });
  }

  currentSosAlertId = null;
  isStreaming = false;

  logger.info('SOS GPS streaming stopped');
}

/**
 * Check if currently streaming
 */
export function isStreamingActive(): boolean {
  return isStreaming;
}

/**
 * Get current SOS alert ID being streamed
 */
export function getCurrentSOSAlertId(): string | null {
  return currentSosAlertId;
}

