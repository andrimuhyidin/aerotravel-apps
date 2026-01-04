'use client';

import { Compass, Home, MapPin, Search, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

type MobileNavProps = {
  locale: string;
};

export function MobileNav({ locale }: MobileNavProps) {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    { href: `/${locale}`, label: 'Home', icon: Home },
    { href: `/${locale}/packages`, label: 'Explore', icon: Search },
    { href: `/${locale}/book`, label: 'Booking', icon: Compass },
    { href: `/${locale}/my-trips`, label: 'Trips', icon: MapPin },
    { href: `/${locale}/account`, label: 'Akun', icon: User },
  ];

  return (
    <nav className="border-t bg-background shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
      <div className="flex h-14 items-center justify-around">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== `/${locale}` && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-0.5 py-1',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <div
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full transition-all',
                  isActive && 'bg-primary/10'
                )}
              >
                <item.icon className={cn('h-5 w-5', isActive && 'scale-110')} />
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
      {/* iOS Safe Area */}
      <div className="h-[env(safe-area-inset-bottom)] bg-background" />
    </nav>
  );
}
