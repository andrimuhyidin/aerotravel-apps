'use client';

/**
 * App Header - Super Apps Style
 * Search di header + User menu dropdown (seperti Gojek/Traveloka)
 */

import { Plane, Search, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { cn } from '@/lib/utils';

type AppHeaderProps = {
  locale: string;
  user?: {
    name?: string;
    avatar?: string;
    role?: string;
  } | null;
  variant?: 'default' | 'transparent';
  onSearchClick?: () => void;
};

export function AppHeader({
  locale,
  user,
  variant = 'default',
  onSearchClick,
}: AppHeaderProps) {
  const router = useRouter();

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full',
        variant === 'default' && 'border-b bg-background',
        variant === 'transparent' && 'border-transparent bg-transparent'
      )}
    >
      <div className="flex h-14 items-center gap-3 px-4">
        {/* Logo */}
        <Link href={`/${locale}`} className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
            <Plane className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-bold">AeroTravel</span>
        </Link>

        {/* Search Bar - Central (Gojek/Traveloka style) */}
        <button
          onClick={onSearchClick || (() => router.push(`/${locale}/packages`))}
          className="flex flex-1 items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 transition-colors active:bg-slate-200 dark:bg-slate-800 dark:active:bg-slate-700"
        >
          <Search className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            Cari destinasi...
          </span>
        </button>

        {/* User Avatar - Link to Account Page */}
        {user ? (
          <Link
            href={`/${locale}/account`}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-blue-600 text-xs font-bold text-white ring-2 ring-background active:scale-95"
          >
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              user.name?.charAt(0).toUpperCase() || 'U'
            )}
          </Link>
        ) : (
          <Link
            href={`/${locale}/login`}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 active:bg-slate-200 dark:bg-slate-800"
          >
            <User className="h-4 w-4 text-muted-foreground" />
          </Link>
        )}
      </div>
    </header>
  );
}
