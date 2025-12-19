'use client';

/**
 * Guide App Header
 * Mobile-first header untuk Guide App dengan branding emerald
 * SOS button di header untuk akses cepat darurat
 */

import { Bell } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { GuideSOSButton } from '@/components/layout/guide-sos-button';
import { OfflineBadge } from '@/components/layout/offline-badge';
import { RoleSwitcher } from '@/components/role-switcher';
import { Button } from '@/components/ui/button';
import { useOfflineStatus } from '@/hooks/use-offline-status';
import { cn } from '@/lib/utils';

type GuideHeaderProps = {
  locale: string;
  user?: {
    name?: string;
    avatar?: string;
  } | null;
};

export function GuideHeader({ locale }: GuideHeaderProps) {
  const { online, pending } = useOfflineStatus();

  // Fetch unread notifications count
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    let intervalId: number | null = null;

    const fetchUnreadCount = async () => {
      try {
        const res = await fetch('/api/guide/notifications?limit=1');
        if (!mounted || !res.ok) return;
        const json = (await res.json()) as { unreadCount?: number };
        if (mounted) {
          setUnreadCount(json.unreadCount ?? 0);
        }
      } catch (error) {
        console.error('Failed to fetch unread count:', error);
      }
    };

    // Initial fetch
    void fetchUnreadCount();

    // Refetch every 30 seconds
    intervalId = window.setInterval(fetchUnreadCount, 30000);

    return () => {
      mounted = false;
      if (intervalId !== null) {
        window.clearInterval(intervalId);
      }
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-emerald-700/20 bg-emerald-600 text-white shadow-sm">
      <div className="flex h-14 items-center justify-between px-4">
        {/* Logo / Brand */}
        <Link
          href={`/${locale}/guide`}
          className="flex min-h-[44px] items-center gap-2.5 transition-opacity active:opacity-80"
          aria-label="Guide App Home"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 shadow-sm ring-1 ring-white/10">
            <span className="text-lg font-bold">G</span>
          </div>
          <span className="font-semibold tracking-tight">Guide App</span>
        </Link>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5">
          {/* Role Switcher - Only show if user has multiple roles */}
          <div className="hidden sm:block">
            <RoleSwitcher size="sm" variant="ghost" className="text-white hover:bg-white/20" />
          </div>

          {/* Offline Status - Always visible, compact on mobile, clickable to sync status page */}
          <Link
            href={`/${locale}/guide/sync-status`}
            className="hidden sm:block transition-opacity active:opacity-80"
            aria-label="Status Sinkronisasi"
          >
            <OfflineBadge online={online} pending={pending} size="sm" />
          </Link>
          <Link
            href={`/${locale}/guide/sync-status`}
            className="block sm:hidden transition-opacity active:opacity-80"
            aria-label="Status Sinkronisasi"
          >
            <span
              className={cn(
                'flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-medium',
                online
                  ? 'bg-emerald-500/20 text-emerald-100'
                  : 'bg-red-500/20 text-red-100',
              )}
              title={
                online
                  ? `Online${pending > 0 ? ` • ${pending} data tertunda` : ''}`
                  : `Offline${pending > 0 ? ` • ${pending} data tersimpan` : ''}`
              }
            >
              {online ? '✓' : '!'}
            </span>
          </Link>

          {/* Notifications */}
          <Link href={`/${locale}/guide/notifications`} className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-white hover:bg-white/20 active:bg-white/30"
              aria-label="Notifikasi"
            >
              <Bell className="h-5 w-5" aria-hidden="true" />
              {unreadCount > 0 && (
                <span className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          </Link>

          {/* SOS Button - Prominent for emergency */}
          <GuideSOSButton locale={locale} />
        </div>
      </div>
    </header>
  );
}
