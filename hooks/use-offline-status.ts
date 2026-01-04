'use client';

import { useEffect, useState } from 'react';

import { getPendingCount, setupSyncListeners } from '@/lib/guide';

export function useOfflineStatus() {
  // Always start with true to match SSR default
  // This ensures server and client initial render match
  const [online, setOnline] = useState<boolean>(true);
  const [pending, setPending] = useState<number>(0);

  useEffect(() => {
    // Update online status after mount to match actual navigator state
    // This prevents hydration mismatch
    if (typeof navigator !== 'undefined') {
      setOnline(navigator.onLine);
    }

    let isActive = true;

    const loadPending = async () =>
      getPendingCount()
        .then((count) => {
          if (isActive) setPending(count);
        })
        .catch(() => {
          if (isActive) setPending(0);
        });

    loadPending();

    const handleOnline = () => {
      if (isActive) {
        setOnline(true);
        loadPending();
      }
    };
    const handleOffline = () => {
      if (isActive) setOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const detachSync = setupSyncListeners();

    const interval = window.setInterval(loadPending, 15000);

    return () => {
      isActive = false;
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      detachSync();
      window.clearInterval(interval);
    };
  }, []);

  // Alias for compatibility with PWA settings
  const isOnline = online;
  const isOfflineReady = typeof window !== 'undefined' && 'serviceWorker' in navigator;

  return { online, pending, isOnline, isOfflineReady };
}
