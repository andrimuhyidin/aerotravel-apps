'use client';

/**
 * Guide Bottom Navigation
 * Mobile-first bottom navigation untuk Guide App dengan tema emerald
 * Touch-optimized dengan safe area support untuk iOS
 */

import { Calendar, Home, MapPin, MessageSquare, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  variant?: 'default' | 'danger';
};

type GuideBottomNavigationProps = {
  locale: string;
};

export function GuideBottomNavigation({ locale }: GuideBottomNavigationProps) {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    { href: `/${locale}/guide`, label: 'Home', icon: Home },
    { href: `/${locale}/guide/trips`, label: 'Trip', icon: Calendar },
    { href: `/${locale}/guide/attendance`, label: 'Absensi', icon: MapPin },
    { href: `/${locale}/guide/chat`, label: 'Chat', icon: MessageSquare },
    { href: `/${locale}/guide/profile`, label: 'Profil', icon: User },
  ];

  const isActive = (href: string) => {
    if (href === `/${locale}/guide`) {
      return pathname === href || pathname === `/${locale}/guide/`;
    }
    return pathname.startsWith(href);
  };

  return (
    <nav
      className="border-t border-slate-200 bg-background shadow-[0_-2px_10px_rgba(0,0,0,0.05)]"
      aria-label="Main navigation"
    >
      <div className="flex h-14 items-center justify-around px-1">
        {navItems.map((item) => {
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex min-h-[44px] flex-1 flex-col items-center justify-center gap-1 py-1.5 transition-all active:scale-95',
                active ? 'text-emerald-600' : 'text-muted-foreground',
              )}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
            >
              {/* Icon with background on active */}
              <div
                className={cn(
                  'relative flex h-8 w-10 items-center justify-center rounded-xl transition-all',
                  active && 'bg-emerald-600/10',
                )}
              >
                <item.icon
                  className={cn(
                    'h-5 w-5 transition-transform',
                    active && 'scale-110',
                  )}
                  aria-hidden="true"
                />
              </div>

              {/* Label */}
              <span
                className={cn(
                  'text-[10px] font-medium leading-tight',
                  active && 'font-semibold',
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
      {/* iOS Safe Area */}
      <div className="h-[env(safe-area-inset-bottom)] bg-background" />
    </nav>
  );
}
