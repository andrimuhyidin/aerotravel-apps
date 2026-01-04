'use client';

/**
 * Phase Section Header Component
 * Reusable header untuk section grouping di trip timeline view
 */

import { LucideIcon } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';

type PhaseSectionHeaderProps = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  required?: boolean;
  className?: string;
};

export function PhaseSectionHeader({
  title,
  description,
  icon: Icon,
  required = false,
  className,
}: PhaseSectionHeaderProps) {
  return (
    <div className={cn('space-y-2 pt-4 border-t border-slate-200', className)}>
      <div className="flex items-center gap-2">
        {Icon && (
          <div className="flex h-5 w-5 items-center justify-center text-slate-600">
            <Icon className="h-5 w-5" />
          </div>
        )}
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
          {title}
        </h3>
        {required && (
          <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium">
            Wajib
          </span>
        )}
      </div>
      {description && (
        <p className="text-xs text-slate-600 leading-relaxed">{description}</p>
      )}
    </div>
  );
}

