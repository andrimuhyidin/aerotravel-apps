/**
 * Partner Bottom Navigation - Optimized
 * 5 core features: Home, Packages, Bookings, Wallet, Account
 * Clean, industry-standard pattern (Shopee Seller, Tiket.com B2B)
 * 
 * Refactored to use central config from lib/config/partner-menu-config.ts
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';

// Import from central config
import { getBottomNavItems } from '@/lib/config/partner-menu-config';

type PartnerBottomNavigationProps = {
  locale: string;
};

export function PartnerBottomNavigation({
  locale,
}: PartnerBottomNavigationProps) {
  const pathname = usePathname();

  // Get nav items from central config
  const navItems = getBottomNavItems(locale);

  const isActive = (item: typeof navItems[0]) => {
    if (item.matchPattern) {
      return item.matchPattern.test(pathname);
    }
    return pathname === item.href;
  };

  return (
    <nav
      className="border-t bg-background shadow-[0_-2px_10px_rgba(0,0,0,0.05)] pb-[env(safe-area-inset-bottom)]"
      aria-label="Main navigation"
    >
      <div className="flex h-16 items-center justify-around px-1">
        {navItems.map((item) => {
          const active = isActive(item);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex min-h-[44px] flex-1 flex-col items-center justify-center gap-1 px-1 py-2 transition-all active:scale-95 touch-manipulation',
                active ? 'text-primary' : 'text-muted-foreground'
              )}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
            >
              {/* Icon with pill background on active */}
              <div
                className={cn(
                  'relative flex h-7 w-12 items-center justify-center rounded-full transition-all',
                  active && 'bg-primary/10'
                )}
              >
                <item.icon
                  className={cn(
                    'h-5 w-5 transition-transform',
                    active && 'scale-110'
                  )}
                  aria-hidden="true"
                />
              </div>

              {/* Label */}
              <span
                className={cn(
                  'text-[10px] font-medium leading-none',
                  active && 'font-semibold'
                )}
              >
                {item.label}
              </span>

              {/* Active indicator dot */}
              {active && (
                <div className="absolute bottom-1 h-1 w-1 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
