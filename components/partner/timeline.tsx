/**
 * Timeline Component
 * Standardized timeline untuk menampilkan status progression
 */

import { cn } from '@/lib/utils';
import { Check, Circle } from 'lucide-react';

export type TimelineEvent = {
  status: 'completed' | 'active' | 'upcoming';
  label: string;
  date?: string;
  description?: string;
};

export type TimelineProps = {
  events: TimelineEvent[];
  className?: string;
};

export function Timeline({ events, className }: TimelineProps) {
  return (
    <div className={cn('space-y-0', className)}>
      {events.map((event, index) => {
        const isLast = index === events.length - 1;
        const isCompleted = event.status === 'completed';
        const isActive = event.status === 'active';
        const isUpcoming = event.status === 'upcoming';

        return (
          <div key={index} className="relative flex gap-3 pb-6">
            {/* Vertical Line */}
            {!isLast && (
              <div
                className={cn(
                  'absolute left-[11px] top-6 h-full w-0.5',
                  isCompleted ? 'bg-green-500' : 'bg-gray-200'
                )}
              />
            )}

            {/* Icon */}
            <div className="relative flex-shrink-0">
              {isCompleted && (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500">
                  <Check className="h-4 w-4 text-white" />
                </div>
              )}
              {isActive && (
                <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-blue-500 bg-white">
                  <Circle className="h-3 w-3 fill-blue-500 text-blue-500" />
                </div>
              )}
              {isUpcoming && (
                <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-gray-300 bg-white">
                  <Circle className="h-3 w-3 text-gray-300" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 space-y-0.5 pt-0.5">
              <div className="flex items-center justify-between gap-2">
                <p
                  className={cn(
                    'text-sm font-semibold',
                    isCompleted && 'text-foreground',
                    isActive && 'text-blue-600',
                    isUpcoming && 'text-muted-foreground'
                  )}
                >
                  {event.label}
                </p>
                {event.date && (
                  <span className="text-xs text-muted-foreground">
                    {event.date}
                  </span>
                )}
              </div>
              {event.description && (
                <p className="text-xs text-muted-foreground">
                  {event.description}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

