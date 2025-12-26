/**
 * Metric Card Component
 * Standardized card untuk displaying metrics dengan trend indicators
 * Enhanced version for Partner Apps redesign
 */

'use client';

import { Card, CardContent } from './card';
import { cn } from '@/lib/utils';
import { ArrowDown, ArrowUp, LucideIcon, Minus, TrendingUp, TrendingDown } from 'lucide-react';

export type MetricCardProps = {
  title: string;
  value: string | number;
  change?: {
    value: number;
    period: string;
    isPositive?: boolean;
  };
  icon?: LucideIcon;
  iconColor?: 'primary' | 'success' | 'warning' | 'destructive' | 'default';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showTrend?: boolean;
  trend?: number; // Simplified trend prop: +25, -10, etc
  loading?: boolean;
};

export function MetricCard({
  title,
  value,
  change,
  icon: Icon,
  iconColor = 'default',
  className,
  size = 'md',
  showTrend = true,
  trend,
  loading = false,
}: MetricCardProps) {
  const iconColorStyles = {
    default: 'bg-muted text-muted-foreground',
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    destructive: 'bg-destructive/10 text-destructive',
  };

  const sizeStyles = {
    sm: {
      padding: 'p-3',
      valueSize: 'text-lg',
      titleSize: 'text-xs',
    },
    md: {
      padding: 'p-4 md:p-6',
      valueSize: 'text-xl md:text-2xl',
      titleSize: 'text-sm',
    },
    lg: {
      padding: 'p-6 md:p-8',
      valueSize: 'text-2xl md:text-3xl',
      titleSize: 'text-base',
    },
  };

  const currentSize = sizeStyles[size];

  if (loading) {
    return (
      <Card className={cn('transition-all-base', className)}>
        <CardContent className={cn(currentSize.padding, 'space-y-3')}>
          <div className="flex items-center justify-between">
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
          </div>
          <div className="space-y-2">
            <div className="h-8 w-32 animate-pulse rounded bg-muted" />
            <div className="h-3 w-20 animate-pulse rounded bg-muted" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('transition-all hover:shadow-md', className)}>
      <CardContent className={cn(currentSize.padding, 'space-y-3')}>
        <div className="flex items-center justify-between">
          <p className={cn('font-medium text-muted-foreground', currentSize.titleSize)}>
            {title}
          </p>
          {Icon && (
            <div className={cn(
              'rounded-xl p-2',
              iconColorStyles[iconColor]
            )}>
              <Icon className="h-4 w-4" />
            </div>
          )}
        </div>
        <div className="space-y-1">
          <p className={cn('font-bold text-foreground', currentSize.valueSize)}>
            {value}
          </p>
          {showTrend && (change || trend !== undefined) && (
            <div className="flex items-center gap-1">
              {(() => {
                const trendValue = trend !== undefined ? trend : change?.value ?? 0;
                if (trendValue > 0) {
                  return <TrendingUp className="h-3.5 w-3.5 text-green-600" />;
                } else if (trendValue < 0) {
                  return <TrendingDown className="h-3.5 w-3.5 text-red-600" />;
                } else {
                  return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
                }
              })()}
              <span className={cn(
                'text-xs font-medium',
                (trend !== undefined ? trend : change?.value ?? 0) > 0 && 'text-green-600',
                (trend !== undefined ? trend : change?.value ?? 0) < 0 && 'text-red-600',
                (trend !== undefined ? trend : change?.value ?? 0) === 0 && 'text-muted-foreground'
              )}>
                {trend !== undefined 
                  ? `${trend > 0 ? '+' : ''}${trend}%`
                  : change 
                    ? `${Math.abs(change.value)}% ${change.period}`
                    : '0%'
                }
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

