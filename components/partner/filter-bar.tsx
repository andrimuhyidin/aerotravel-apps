/**
 * Filter Bar Component
 * Standardized filter bar untuk search & filters
 */

'use client';

import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

export type FilterBarProps = {
  children: React.ReactNode;
  className?: string;
  sticky?: boolean;
};

export function FilterBar({ children, className, sticky = false }: FilterBarProps) {
  return (
    <Card
      className={cn(
        'border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
        sticky && 'sticky top-14 z-40',
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-2 p-4">{children}</div>
    </Card>
  );
}

