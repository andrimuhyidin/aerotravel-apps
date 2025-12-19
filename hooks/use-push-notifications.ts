/**
 * Hook: Web Push Notifications
 * Handles subscription and unsubscription to push notifications
 */

import { useEffect, useState } from 'react';

import { logger } from '@/lib/utils/logger';

type PushSubscription = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
};

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if push notifications are supported
    if (
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    ) {
      setIsSupported(true);
      checkSubscription();
    } else {
      setIsSupported(false);
      setIsLoading(false);
    }
  }, []);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();
      
      if (sub) {
        const subscriptionData: PushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: arrayBufferToBase64(sub.getKey('p256dh')!),
            auth: arrayBufferToBase64(sub.getKey('auth')!),
          },
        };
        setSubscription(subscriptionData);
        setIsSubscribed(true);
      } else {
        setIsSubscribed(false);
      }
    } catch (error) {
      logger.error('Failed to check push subscription', error);
    } finally {
      setIsLoading(false);
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  };

  const subscribe = async (): Promise<boolean> => {
    if (!isSupported) {
      logger.warn('Push notifications not supported');
      return false;
    }

    try {
      // Request permission
      const granted = await requestPermission();
      if (!granted) {
        logger.warn('Push notification permission denied');
        return false;
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Get VAPID public key from server
      const response = await fetch('/api/guide/push/vapid-key');
      const { publicKey } = (await response.json()) as { publicKey: string };

      if (!publicKey) {
        logger.error('VAPID public key not available');
        return false;
      }

      // Subscribe to push
      const applicationServerKey = urlBase64ToUint8Array(publicKey);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const browserSubscription = await (registration.pushManager as any).subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey,
      });

      if (!browserSubscription) {
        throw new Error('Failed to create push subscription');
      }

      // Convert browser PushSubscription to our custom type
      const p256dhKey = browserSubscription.getKey('p256dh');
      const authKey = browserSubscription.getKey('auth');

      if (!p256dhKey || !authKey) {
        throw new Error('Failed to get subscription keys');
      }

      const subscriptionData: PushSubscription = {
        endpoint: browserSubscription.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(p256dhKey),
          auth: arrayBufferToBase64(authKey),
        },
      };

      // Send subscription to server
      const subscribeResponse = await fetch('/api/guide/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscriptionData),
      });

      if (!subscribeResponse.ok) {
        throw new Error('Failed to save subscription');
      }

      setSubscription(subscriptionData);
      setIsSubscribed(true);
      return true;
    } catch (error) {
      logger.error('Failed to subscribe to push notifications', error);
      return false;
    }
  };

  const unsubscribe = async (): Promise<boolean> => {
    if (!subscription) return false;

    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();

      if (sub) {
        await sub.unsubscribe();
      }

      // Remove from server
      await fetch('/api/guide/push/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });

      setSubscription(null);
      setIsSubscribed(false);
      return true;
    } catch (error) {
      logger.error('Failed to unsubscribe from push notifications', error);
      return false;
    }
  };

  return {
    isSupported,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
  };
}

// Helper functions
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const length = bytes.byteLength ?? 0;
  for (let i = 0; i < length; i++) {
    binary += String.fromCharCode(bytes[i] ?? 0);
  }
  return btoa(binary);
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    const charCode = rawData.charCodeAt(i);
    if (typeof charCode === 'number') {
      outputArray[i] = charCode;
    }
  }
  return outputArray;
}

