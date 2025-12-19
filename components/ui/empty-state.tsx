/**
 * Empty State Component
 * Standardized empty state UI for when data is not available
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
          <Icon className="mx-auto mb-2 h-8 w-8 text-slate-300" aria-hidden="true" />
        )}
        <p className="text-sm font-medium text-slate-600">{title}</p>
        {description && (
          <p className="mt-1 text-xs text-slate-500">{description}</p>
        )}
        {action && <div className="mt-3">{action}</div>}
      </div>
    );
  }

  return (
    <Card className={cn('border-0 shadow-sm', className)}>
      <CardContent className={cn('flex flex-col items-center justify-center text-center', variants[variant])}>
        {Icon && (
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
            <Icon className="h-8 w-8 text-slate-400" aria-hidden="true" />
          </div>
        )}
        <h3 className="mb-2 text-sm font-semibold text-slate-900">{title}</h3>
        {description && (
          <p className="text-xs text-slate-500 max-w-sm">{description}</p>
        )}
        {action && <div className="mt-4">{action}</div>}
      </CardContent>
    </Card>
  );
}
