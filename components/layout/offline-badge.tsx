'use client';

import { Wifi, WifiOff } from 'lucide-react';

import { cn } from '@/lib/utils';

export type OfflineBadgeProps = {
  online: boolean;
  pending: number;
  size?: 'sm' | 'md';
};

export function OfflineBadge({ online, pending, size = 'sm' }: OfflineBadgeProps) {
  const hasPending = pending > 0;
  const baseClass =
    size === 'sm'
      ? 'rounded-full px-2 py-0.5 text-[10px] font-medium'
      : 'rounded-full px-3 py-1 text-xs font-medium';

  return (
    <span
      className={cn(
        baseClass,
        online ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700',
      )}
      suppressHydrationWarning
    >
      {online ? (
        <span className="inline-flex items-center gap-1">
          <Wifi className="h-3 w-3" aria-hidden="true" />
          <span>Online</span>
          {hasPending && <span>{`• ${pending} data menunggu terkirim`}</span>}
        </span>
      ) : (
        <span className="inline-flex items-center gap-1">
          <WifiOff className="h-3 w-3" aria-hidden="true" />
          <span>Offline, data akan terkirim saat ada sinyal</span>
          {hasPending && <span>{`• ${pending} data tersimpan`}</span>}
        </span>
      )}
    </span>
  );
}
