/**
 * Skip Link Component
 * Allows keyboard users to skip to main content
 */

'use client';

import { cn } from '@/lib/utils';
import Link from 'next/link';

type SkipLinkProps = {
  href?: string;
  className?: string;
};

export function SkipLink({ href = '#main-content', className }: SkipLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100]',
        'focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground',
        'focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring',
        className
      )}
    >
      Skip to main content
    </Link>
  );
}

