/**
 * Info Card Component
 * Standardized card untuk menampilkan key-value info
 */

import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

export type InfoCardProps = {
  label: string;
  value: string | number | React.ReactNode;
  subValue?: string | number | React.ReactNode;
  icon?: LucideIcon;
  iconColor?: string;
  className?: string;
  valueClassName?: string;
  orientation?: 'vertical' | 'horizontal';
};

export function InfoCard({
  label,
  value,
  subValue,
  icon: Icon,
  iconColor = 'text-muted-foreground',
  className,
  valueClassName,
  orientation = 'vertical',
}: InfoCardProps) {
  if (orientation === 'horizontal') {
    return (
      <div className={cn('flex items-center justify-between gap-4', className)}>
        <div className="flex items-center gap-2">
          {Icon && <Icon className={cn('h-4 w-4', iconColor)} />}
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">{label}</span>
            {subValue && (
              <span className="text-xs text-muted-foreground/70">{subValue}</span>
            )}
          </div>
        </div>
        <span className={cn('text-sm font-semibold', valueClassName)}>{value}</span>
      </div>
    );
  }

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center gap-2">
        {Icon && <Icon className={cn('h-4 w-4', iconColor)} />}
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
      </div>
      <div>
        <p className={cn('text-sm font-semibold', valueClassName)}>{value}</p>
        {subValue && (
          <p className="text-xs text-muted-foreground">{subValue}</p>
        )}
      </div>
    </div>
  );
}
