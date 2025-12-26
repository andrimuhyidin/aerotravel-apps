/**
 * Push Notification Initialization Component
 * Initialize push notifications on mount
 */

'use client';

import { useEffect, useState } from 'react';
import { initializePushNotifications } from '@/lib/partner/push-notifications';
import { usePartnerAuth } from '@/hooks/use-partner-auth';
import { Button } from '@/components/ui/button';
import { logger } from '@/lib/utils/logger';
import { Bell, X } from 'lucide-react';

const DISMISSED_KEY = 'partner_notification_prompt_dismissed';

export function PushNotificationInit() {
  const { partnerId } = usePartnerAuth();
  const [mounted, setMounted] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Set mounted state after client-side hydration
  useEffect(() => {
    setMounted(true);
    // Check if user has dismissed the prompt
    if (typeof window !== 'undefined') {
      const isDismissed = localStorage.getItem(DISMISSED_KEY) === 'true';
      setDismissed(isDismissed);
    }
  }, []);

  useEffect(() => {
    // Check if notifications are already enabled
    if (mounted && typeof window !== 'undefined' && 'Notification' in window) {
      setEnabled(Notification.permission === 'granted');
    }
  }, [mounted]);

  const handleEnable = async () => {
    if (!partnerId) return;

    setLoading(true);
    try {
      const success = await initializePushNotifications(partnerId);
      if (success) {
        setInitialized(true);
        setEnabled(true);
        // Remove dismissed flag when successfully enabled
        if (typeof window !== 'undefined') {
          localStorage.removeItem(DISMISSED_KEY);
        }
      } else {
        // If user denied permission, dismiss the prompt
        if (typeof window !== 'undefined' && Notification.permission === 'denied') {
          localStorage.setItem(DISMISSED_KEY, 'true');
          setDismissed(true);
        }
      }
    } catch (error) {
      logger.error('Failed to enable push notifications', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(DISMISSED_KEY, 'true');
      setDismissed(true);
    }
  };

  // Auto-initialize if permission already granted
  useEffect(() => {
    if (mounted && partnerId && enabled && !initialized) {
      initializePushNotifications(partnerId).then((success) => {
        if (success) {
          setInitialized(true);
        }
      });
    }
  }, [mounted, partnerId, enabled, initialized]);

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return null;
  }

  // Check if notifications are supported
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return null; // Not supported
  }

  // Don't show if already enabled or dismissed
  if (enabled || dismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-24 left-0 right-0 z-40 mx-auto w-full max-w-md px-4">
      <div className="rounded-lg border bg-background p-4 shadow-lg">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Aktifkan Notifikasi</p>
              <p className="text-xs text-muted-foreground mt-1">
                Dapatkan notifikasi booking, pembayaran, dan komisi secara real-time
              </p>
              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  onClick={handleEnable}
                  disabled={loading}
                >
                  {loading ? 'Memproses...' : 'Aktifkan'}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDismiss}
                  disabled={loading}
                >
                  Nanti Saja
                </Button>
              </div>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full hover:bg-muted"
            aria-label="Tutup"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
}

