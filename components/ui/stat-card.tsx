/**
 * Stat Card Component
 * Standardized card untuk displaying statistics
 */

'use client';

import { Card, CardContent } from './card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

export type StatCardProps = {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: {
    value: number;
    label: string;
    isPositive: boolean;
  };
  className?: string;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
};

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  className,
  variant = 'default',
  size = 'md',
}: StatCardProps) {
  const variantStyles = {
    default: 'bg-background',
    primary: 'bg-primary/5 border-primary/20',
    success: 'bg-success/5 border-success/20',
    warning: 'bg-warning/5 border-warning/20',
    destructive: 'bg-destructive/5 border-destructive/20',
  };

  const sizeStyles = {
    sm: 'p-3',
    md: 'p-4 md:p-6',
    lg: 'p-6 md:p-8',
  };

  return (
    <Card
      className={cn(
        'transition-all-base hover-elevate-sm',
        variantStyles[variant],
        className
      )}
    >
      <CardContent className={cn(sizeStyles[size], 'space-y-2')}>
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-foreground/70">{label}</p>
          {Icon && (
            <div className={cn(
              'rounded-full p-2',
              variant === 'primary' && 'bg-primary/10',
              variant === 'success' && 'bg-success/10',
              variant === 'warning' && 'bg-warning/10',
              variant === 'destructive' && 'bg-destructive/10',
            )}>
              <Icon className={cn(
                'h-4 w-4',
                variant === 'primary' && 'text-primary',
                variant === 'success' && 'text-success',
                variant === 'warning' && 'text-warning',
                variant === 'destructive' && 'text-destructive',
              )} />
            </div>
          )}
        </div>
        <div className="space-y-1">
          <p className={cn(
            'font-semibold',
            size === 'sm' && 'text-lg',
            size === 'md' && 'text-xl',
            size === 'lg' && 'text-2xl',
          )}>
            {value}
          </p>
          {trend && (
            <p className={cn(
              'text-xs font-medium',
              trend.isPositive ? 'text-success' : 'text-destructive'
            )}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

