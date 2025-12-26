/**
 * Quick Stats Mini Component
 * Single unified widget dengan grid layout untuk quick glance metrics
 * Ultra-compact: Minimal padding, optimal space usage
 */

'use client';

import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

type QuickStatMini = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  href?: string;
};

type QuickStatsMiniProps = {
  stats: QuickStatMini[];
  loading?: boolean;
  className?: string;
};

export function QuickStatsMini({ stats, loading = false, className }: QuickStatsMiniProps) {
  if (loading) {
    return (
      <Card className={cn('mx-4 p-3', className)}>
        <div className="grid grid-cols-2 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-1">
              <Skeleton className="h-2 w-16" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn('mx-4 overflow-hidden border-0 shadow-sm', className)}>
      <div className="grid grid-cols-2 divide-x divide-y divide-border/50">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const content = (
            <>
              <div className="flex items-center gap-1.5 mb-1">
                <div
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-md',
                    stat.iconColor || 'bg-primary/10 text-primary'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide leading-none">
                  {stat.label}
                </span>
              </div>
              <p className="text-base font-bold text-foreground leading-none">{stat.value}</p>
            </>
          );

          const baseClasses = cn(
            'flex flex-col justify-center p-2.5 bg-background transition-all min-h-[60px]',
            // Remove borders for specific cells to create clean grid
            index === 0 && 'rounded-tl-lg', // Top-left
            index === 1 && 'rounded-tr-lg border-l-0', // Top-right
            index === 2 && 'rounded-bl-lg border-t-0', // Bottom-left
            index === 3 && 'rounded-br-lg border-t-0 border-l-0', // Bottom-right
            stat.href && 'cursor-pointer hover:bg-muted/50 active:scale-[0.98]'
          );

          if (stat.href) {
            return (
              <a
                key={index}
                href={stat.href}
                className={baseClasses}
              >
                {content}
              </a>
            );
          }

          return (
            <div key={index} className={baseClasses}>
              {content}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
