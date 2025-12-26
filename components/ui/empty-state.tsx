/**
 * Empty State Component
 * Standardized empty state UI for when data is not available
 * Enhanced version for Partner Apps redesign
 */

import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from './card';

export type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'subtle' | 'minimal';
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  variant = 'default',
}: EmptyStateProps) {
  const variants = {
    default: 'py-12',
    subtle: 'py-8',
    minimal: 'py-6',
  };

  if (variant === 'minimal') {
    return (
      <div className={cn('text-center', className)}>
        {Icon && (
          <Icon className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" aria-hidden="true" />
        )}
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {description && (
          <p className="mt-1 text-xs text-muted-foreground/70">{description}</p>
        )}
        {action && <div className="mt-3">{action}</div>}
      </div>
    );
  }

  return (
    <Card className={cn('border shadow-sm', className)}>
      <CardContent className={cn('flex flex-col items-center justify-center text-center', variants[variant])}>
        {Icon && (
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/50">
            <Icon className="h-8 w-8 text-muted-foreground/60" aria-hidden="true" />
          </div>
        )}
        <h3 className="mb-2 text-base font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">{description}</p>
        )}
        {action && <div className="mt-6">{action}</div>}
      </CardContent>
    </Card>
  );
}
