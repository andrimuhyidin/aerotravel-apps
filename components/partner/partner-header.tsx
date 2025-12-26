/**
 * Partner Portal Header - Redesigned
 * Clean, minimal, functional - Tiket.com B2B style
 * REMOVED redundant menu button (ada di bottom nav)
 */

'use client';

import { Bell, Search } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { logger } from '@/lib/utils/logger';
import { cn } from '@/lib/utils';

type PartnerHeaderProps = {
  user?: {
    name?: string;
    avatar?: string;
  } | null;
  variant?: 'default' | 'minimal';
};

export function PartnerHeader({
  user,
  variant = 'default',
}: PartnerHeaderProps) {
  const params = useParams();
  const locale = params.locale as string;
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    let intervalId: number | null = null;

    const fetchUnreadCount = async () => {
      try {
        const res = await fetch(
          '/api/notifications?app=partner&unreadOnly=true&limit=1'
        );
        if (!mounted || !res.ok) return;
        const json = (await res.json()) as { unreadCount?: number };
        if (mounted) {
          setUnreadCount(json.unreadCount ?? 0);
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          logger.error('Failed to fetch unread count', error);
        }
      }
    };

    void fetchUnreadCount();
    intervalId = window.setInterval(fetchUnreadCount, 30000);

    return () => {
      mounted = false;
      if (intervalId !== null) {
        window.clearInterval(intervalId);
      }
    };
  }, []);

  if (variant === 'minimal') {
    return (
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-between px-4">
          <Link
            href={`/${locale}/partner/dashboard`}
            className="text-lg font-bold text-foreground"
          >
            Partner
          </Link>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-background shadow-sm">
      <div className="flex h-14 items-center justify-between px-4">
        {/* Logo / Brand */}
        <Link
          href={`/${locale}/partner/dashboard`}
          className="flex min-h-[44px] items-center gap-2 transition-opacity active:opacity-80"
          aria-label="Partner Portal Home"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-blue-600 shadow-sm">
            <span className="text-base font-bold text-white">P</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold leading-none text-foreground">
              Partner
            </span>
            <span className="text-[10px] leading-none text-muted-foreground">
              Portal
            </span>
          </div>
        </Link>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <Link href={`/${locale}/partner/packages`}>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-foreground"
              aria-label="Cari paket"
            >
              <Search className="h-5 w-5" aria-hidden="true" />
            </Button>
          </Link>

          {/* Notifications */}
          <Link
            href={`/${locale}/partner/notifications`}
            className="relative"
            aria-label={
              unreadCount > 0
                ? `${unreadCount} notifikasi belum dibaca`
                : 'Notifikasi'
            }
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-foreground"
            >
              <Bell className="h-5 w-5" aria-hidden="true" />
              {unreadCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[10px] font-bold"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
