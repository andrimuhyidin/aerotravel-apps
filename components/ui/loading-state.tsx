/**
 * Loading State Component
 * Standardized loading state UI with skeleton loaders
 */

import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader } from './card';
import { Skeleton } from './skeleton';

export type LoadingStateProps = {
  variant?: 'spinner' | 'skeleton' | 'skeleton-card' | 'inline';
  lines?: number;
  className?: string;
  message?: string;
  showCard?: boolean;
};

export function LoadingState({
  variant = 'skeleton',
  lines = 3,
  className,
  message,
  showCard = false,
}: LoadingStateProps) {
  if (variant === 'spinner') {
    return (
      <div className={cn('flex items-center justify-center py-8', className)}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
          {message && (
            <p className="text-sm text-slate-500">{message}</p>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={cn('flex items-center gap-2 py-2', className)}>
        <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
        {message && (
          <p className="text-sm text-slate-500">{message}</p>
        )}
      </div>
    );
  }

  if (variant === 'skeleton-card' || showCard) {
    return (
      <Card className={cn('border-0 shadow-sm', className)}>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: lines }).map((_, i) => (
              <Skeleton
                key={i}
                className={cn('h-4', i === lines - 1 ? 'w-3/4' : 'w-full')}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default skeleton variant
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn('h-4', i === lines - 1 ? 'w-3/4' : 'w-full')}
        />
      ))}
    </div>
  );
}
