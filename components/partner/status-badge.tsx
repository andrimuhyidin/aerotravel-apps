/**
 * Status Badge Component
 * Standardized status indicators dengan color coding
 * Updated with semantic tokens for Dark Mode support
 */

import { cn } from '@/lib/utils';
import { Circle } from 'lucide-react';

export type StatusBadgeVariant = 'dot' | 'pill';

export type StatusBadgeProps = {
  status:
    | 'pending'
    | 'pending_payment'
    | 'confirmed'
    | 'completed'
    | 'cancelled'
    | 'paid'
    | 'unpaid'
    | 'overdue'
    | 'active'
    | 'inactive'
    | 'open'
    | 'in_progress'
    | 'resolved'
    | 'closed';
  label?: string;
  variant?: StatusBadgeVariant;
  className?: string;
};

const statusConfig = {
  pending: {
    label: 'Pending',
    color: 'text-yellow-700 dark:text-yellow-400',
    bg: 'bg-yellow-500/15',
    border: 'border-yellow-200 dark:border-yellow-800',
    dot: 'bg-yellow-500',
  },
  pending_payment: {
    label: 'Menunggu Pembayaran',
    color: 'text-orange-700 dark:text-orange-400',
    bg: 'bg-orange-500/15',
    border: 'border-orange-200 dark:border-orange-800',
    dot: 'bg-orange-500',
  },
  confirmed: {
    label: 'Terkonfirmasi',
    color: 'text-blue-700 dark:text-blue-400',
    bg: 'bg-blue-500/15',
    border: 'border-blue-200 dark:border-blue-800',
    dot: 'bg-blue-500',
  },
  completed: {
    label: 'Selesai',
    color: 'text-green-700 dark:text-green-400',
    bg: 'bg-green-500/15',
    border: 'border-green-200 dark:border-green-800',
    dot: 'bg-green-500',
  },
  cancelled: {
    label: 'Dibatalkan',
    color: 'text-red-700 dark:text-red-400',
    bg: 'bg-red-500/15',
    border: 'border-red-200 dark:border-red-800',
    dot: 'bg-red-500',
  },
  paid: {
    label: 'Lunas',
    color: 'text-green-700 dark:text-green-400',
    bg: 'bg-green-500/15',
    border: 'border-green-200 dark:border-green-800',
    dot: 'bg-green-500',
  },
  unpaid: {
    label: 'Belum Dibayar',
    color: 'text-gray-700 dark:text-gray-400',
    bg: 'bg-gray-500/15',
    border: 'border-gray-200 dark:border-gray-800',
    dot: 'bg-gray-500',
  },
  overdue: {
    label: 'Terlambat',
    color: 'text-red-700 dark:text-red-400',
    bg: 'bg-red-500/15',
    border: 'border-red-200 dark:border-red-800',
    dot: 'bg-red-500',
  },
  active: {
    label: 'Aktif',
    color: 'text-green-700 dark:text-green-400',
    bg: 'bg-green-500/15',
    border: 'border-green-200 dark:border-green-800',
    dot: 'bg-green-500',
  },
  inactive: {
    label: 'Tidak Aktif',
    color: 'text-gray-700 dark:text-gray-400',
    bg: 'bg-gray-500/15',
    border: 'border-gray-200 dark:border-gray-800',
    dot: 'bg-gray-500',
  },
  open: {
    label: 'Open',
    color: 'text-blue-700 dark:text-blue-400',
    bg: 'bg-blue-500/15',
    border: 'border-blue-200 dark:border-blue-800',
    dot: 'bg-blue-500',
  },
  in_progress: {
    label: 'In Progress',
    color: 'text-yellow-700 dark:text-yellow-400',
    bg: 'bg-yellow-500/15',
    border: 'border-yellow-200 dark:border-yellow-800',
    dot: 'bg-yellow-500',
  },
  resolved: {
    label: 'Resolved',
    color: 'text-green-700 dark:text-green-400',
    bg: 'bg-green-500/15',
    border: 'border-green-200 dark:border-green-800',
    dot: 'bg-green-500',
  },
  closed: {
    label: 'Closed',
    color: 'text-gray-700 dark:text-gray-400',
    bg: 'bg-gray-500/15',
    border: 'border-gray-200 dark:border-gray-800',
    dot: 'bg-gray-500',
  },
};

export function StatusBadge({
  status,
  label,
  variant = 'pill',
  className,
}: StatusBadgeProps) {
  const config = statusConfig[status];
  const displayLabel = label || config.label;

  if (variant === 'dot') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Circle className={cn('h-2 w-2 fill-current', config.dot)} />
        <span className={cn('text-sm font-medium', config.color)}>
          {displayLabel}
        </span>
      </div>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-semibold',
        config.bg,
        config.color,
        config.border,
        className
      )}
    >
      {displayLabel}
    </span>
  );
}
