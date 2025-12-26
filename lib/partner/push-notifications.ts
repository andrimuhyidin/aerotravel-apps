/**
 * Partner Push Notifications Service
 * Handle push notifications for partner portal
 */

import { logger } from '@/lib/utils/logger';

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    logger.warn('Notifications not supported');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    logger.warn('Notification permission denied');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    logger.error('Failed to request notification permission', error);
    return false;
  }
}

/**
 * Register service worker for push notifications
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    logger.warn('Service workers not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    logger.info('Service worker registered', { scope: registration.scope });
    return registration;
  } catch (error) {
    logger.error('Service worker registration failed', error);
    return null;
  }
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPush(
  registration: ServiceWorkerRegistration
): Promise<PushSubscription | null> {
  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        ? urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY)
        : undefined,
    });

    logger.info('Push subscription created', {
      endpoint: subscription.endpoint,
    });

    return subscription;
  } catch (error) {
    logger.error('Failed to subscribe to push', error);
    return null;
  }
}

/**
 * Send subscription to server
 */
export async function sendSubscriptionToServer(
  subscription: PushSubscription,
  userId: string
): Promise<boolean> {
  try {
    const response = await fetch('/api/partner/notifications/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        userId,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send subscription to server');
    }

    logger.info('Subscription sent to server', { userId });
    return true;
  } catch (error) {
    logger.error('Failed to send subscription to server', error);
    return false;
  }
}

/**
 * Show local notification
 */
export function showNotification(
  title: string,
  options?: NotificationOptions
): void {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return;
  }

  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      ...options,
    });
  }
}

/**
 * Initialize push notifications
 */
export async function initializePushNotifications(
  userId: string
): Promise<boolean> {
  try {
    // Request permission
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      return false;
    }

    // Register service worker
    const registration = await registerServiceWorker();
    if (!registration) {
      return false;
    }

    // Subscribe to push
    const subscription = await subscribeToPush(registration);
    if (!subscription) {
      return false;
    }

    // Send to server
    const sent = await sendSubscriptionToServer(subscription, userId);
    return sent;
  } catch (error) {
    logger.error('Failed to initialize push notifications', error);
    return false;
  }
}

/**
 * Helper: Convert VAPID key
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

