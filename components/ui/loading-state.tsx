/**
 * Standardized Loading State Component
 * Provides consistent loading patterns across the application
 */

'use client';

import { Card, CardContent, CardHeader } from './card';
import { Skeleton } from './skeleton';
import { cn } from '@/lib/utils';

type LoadingStateProps = {
  variant?: 'default' | 'card' | 'list' | 'table' | 'minimal' | 'spinner' | 'skeleton' | 'skeleton-card';
  className?: string;
  rows?: number;
  lines?: number; // Alias for rows
  message?: string;
};

export function LoadingState({ 
  variant = 'default', 
  className,
  rows = 3,
  lines,
  message
}: LoadingStateProps) {
  const rowCount = lines ?? rows;
  if (variant === 'minimal' || variant === 'spinner') {
    return (
      <div className={cn('flex items-center justify-center py-8', className)}>
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-foreground/70">{message || 'Memuat...'}</p>
        </div>
      </div>
    );
  }

  if (variant === 'skeleton') {
    return (
      <div className={cn('space-y-4', className)}>
        {Array.from({ length: rowCount }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (variant === 'skeleton-card') {
    return (
      <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4', className)}>
        {Array.from({ length: rowCount }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: rowCount }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (variant === 'list') {
    return (
      <div className={cn('space-y-4', className)}>
        {Array.from({ length: rowCount }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          {Array.from({ length: rowCount }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className={cn('space-y-6 py-6 px-4', className)}>
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: rows }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
