'use client';

/**
 * Breadcrumb Component
 * Untuk navigasi hierarki halaman
 */

import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbProps = {
  items: BreadcrumbItem[];
  className?: string;
  showHome?: boolean;
  homeHref?: string;
};

export function Breadcrumb({
  items,
  className,
  showHome = true,
  homeHref = '/',
}: BreadcrumbProps) {
  const pathname = usePathname();

  const allItems: BreadcrumbItem[] = showHome
    ? [{ label: 'Home', href: homeHref }, ...items]
    : items;

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center gap-2 text-sm', className)}
    >
      <ol className="flex items-center gap-2">
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1;
          const isActive = item.href && pathname === item.href;

          return (
            <li key={index} className="flex items-center gap-2">
              {index > 0 && (
                <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              )}
              {isLast || !item.href ? (
                <span
                  className={cn(
                    'truncate',
                    isLast
                      ? 'font-medium text-foreground'
                      : 'text-foreground/70'
                  )}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="truncate text-foreground/70 hover:text-foreground transition-colors"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

