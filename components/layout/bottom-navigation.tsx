'use client';

/**
 * Bottom Navigation - Super Apps Style
 * Home, Explore, Book, Pesan/Inbox (bukan Akun!)
 */

import { Calendar, Compass, Home, Inbox, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
};

type BottomNavigationProps = {
  locale: string;
};

export function BottomNavigation({ locale }: BottomNavigationProps) {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    { href: `/${locale}`, label: 'Home', icon: Home },
    { href: `/${locale}/packages`, label: 'Explore', icon: Compass },
    { href: `/${locale}/book`, label: 'Book', icon: Sparkles },
    { href: `/${locale}/my-trips`, label: 'Trip', icon: Calendar },
    { href: `/${locale}/inbox`, label: 'Inbox', icon: Inbox, badge: 0 },
  ];

  const isActive = (href: string) => {
    if (href === `/${locale}`) {
      return pathname === href || pathname === `/${locale}/`;
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="border-t bg-background">
      <div className="flex h-16 items-center justify-around px-1">
        {navItems.map((item) => {
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex flex-1 flex-col items-center justify-center gap-1 py-2 transition-colors active:scale-95',
                active ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              {/* Icon with background on active */}
              <div
                className={cn(
                  'relative flex h-7 w-14 items-center justify-center rounded-full transition-all',
                  active && 'bg-primary/10'
                )}
              >
                <item.icon
                  className={cn('h-[22px] w-[22px]', active && 'scale-110')}
                />
                {/* Badge for notifications */}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>

              {/* Label */}
              <span
                className={cn(
                  'text-[10px] font-medium',
                  active && 'font-semibold'
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
