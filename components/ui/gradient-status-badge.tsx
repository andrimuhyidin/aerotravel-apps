/**
 * GradientStatusBadge Component
 * Status indicator with gradient background and optional pulse animation
 * Part of Future Minimalist 2026 design system
 */

'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export type StatusType = 'success' | 'warning' | 'error' | 'info' | 'pending' | 'default';

export type GradientStatusBadgeProps = {
  status: StatusType;
  label: string;
  size?: 'sm' | 'md';
  pulse?: boolean;
  className?: string;
};

const statusGradients: Record<StatusType, string> = {
  success: 'from-emerald-400 to-teal-500',
  warning: 'from-amber-400 to-orange-500',
  error: 'from-red-400 to-rose-500',
  info: 'from-blue-400 to-indigo-500',
  pending: 'from-gray-400 to-slate-500',
  default: 'from-gray-300 to-gray-400',
};

const sizeClasses = {
  sm: 'text-xs px-2.5 py-0.5',
  md: 'text-sm px-3 py-1',
};

const dotSizes = {
  sm: 'w-1.5 h-1.5',
  md: 'w-2 h-2',
};

export function GradientStatusBadge({
  status,
  label,
  size = 'sm',
  pulse = false,
  className,
}: GradientStatusBadgeProps) {
  const showPulse = pulse && (status === 'pending' || status === 'warning' || status === 'error');

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium text-white',
        'bg-gradient-to-r shadow-sm',
        statusGradients[status],
        sizeClasses[size],
        className
      )}
    >
      {/* Status dot */}
      <span
        className={cn(
          'rounded-full bg-white/80',
          dotSizes[size],
          showPulse && 'animate-pulse'
        )}
      />
      {label}
    </span>
  );
}

// Subtle variant - lighter background with gradient text
export function StatusBadgeSubtle({
  status,
  label,
  size = 'sm',
  className,
}: Omit<GradientStatusBadgeProps, 'pulse'>) {
  const subtleBackgrounds: Record<StatusType, string> = {
    success: 'bg-emerald-50 dark:bg-emerald-950/30',
    warning: 'bg-amber-50 dark:bg-amber-950/30',
    error: 'bg-red-50 dark:bg-red-950/30',
    info: 'bg-blue-50 dark:bg-blue-950/30',
    pending: 'bg-gray-100 dark:bg-gray-800/30',
    default: 'bg-gray-50 dark:bg-gray-900/30',
  };

  const textColors: Record<StatusType, string> = {
    success: 'text-emerald-700 dark:text-emerald-300',
    warning: 'text-amber-700 dark:text-amber-300',
    error: 'text-red-700 dark:text-red-300',
    info: 'text-blue-700 dark:text-blue-300',
    pending: 'text-gray-700 dark:text-gray-300',
    default: 'text-gray-600 dark:text-gray-400',
  };

  const dotColors: Record<StatusType, string> = {
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    pending: 'bg-gray-500',
    default: 'bg-gray-400',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        subtleBackgrounds[status],
        textColors[status],
        sizeClasses[size],
        className
      )}
    >
      <span
        className={cn(
          'rounded-full',
          dotColors[status],
          dotSizes[size]
        )}
      />
      {label}
    </span>
  );
}

// Outline variant - transparent with gradient border
export function StatusBadgeOutline({
  status,
  label,
  size = 'sm',
  className,
}: Omit<GradientStatusBadgeProps, 'pulse'>) {
  const borderColors: Record<StatusType, string> = {
    success: 'border-emerald-500 text-emerald-600 dark:text-emerald-400',
    warning: 'border-amber-500 text-amber-600 dark:text-amber-400',
    error: 'border-red-500 text-red-600 dark:text-red-400',
    info: 'border-blue-500 text-blue-600 dark:text-blue-400',
    pending: 'border-gray-400 text-gray-600 dark:text-gray-400',
    default: 'border-gray-300 text-gray-500 dark:text-gray-400',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        'border bg-transparent',
        borderColors[status],
        sizeClasses[size],
        className
      )}
    >
      {label}
    </span>
  );
}

