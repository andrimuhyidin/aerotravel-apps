/**
 * Availability Calendar Component
 * Interactive calendar showing package availability with month navigation
 */

'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay } from 'date-fns';
import { id } from 'date-fns/locale';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

type AvailabilityDate = {
  date: string;
  isAvailable: boolean;
  availableSlots?: number;
  currentPax?: number;
  maxCapacity?: number;
};

type AvailabilityCalendarProps = {
  availability: Record<string, boolean> | AvailabilityDate[];
  onDateSelect?: (date: string) => void;
  className?: string;
  daysToShow?: number;
};

export function AvailabilityCalendar({
  availability,
  onDateSelect,
  className,
  daysToShow = 30,
}: AvailabilityCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Convert availability to map if it's an array
  const availabilityMap: Record<string, AvailabilityDate> = {};
  if (Array.isArray(availability)) {
    availability.forEach((item) => {
      if (typeof item === 'object' && 'date' in item) {
        availabilityMap[item.date] = item as AvailabilityDate;
      }
    });
  } else {
    // Convert boolean map to AvailabilityDate format
    Object.entries(availability).forEach(([date, isAvailable]) => {
      availabilityMap[date] = {
        date,
        isAvailable: Boolean(isAvailable),
      };
    });
  }

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const getAvailabilityForDate = (date: Date): AvailabilityDate | null => {
    const dateStr = date.toISOString().split('T')[0]!;
    return availabilityMap[dateStr] || null;
  };

  const handleDateClick = (date: Date) => {
    if (onDateSelect) {
      const dateStr = date.toISOString().split('T')[0]!;
      onDateSelect(dateStr);
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={prevMonth}
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-lg font-semibold">
          {format(currentMonth, 'MMMM yyyy', { locale: id })}
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={nextMonth}
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="space-y-2">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1">
          {['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].map(
            (day) => (
              <div
                key={day}
                className="text-center text-xs font-medium text-muted-foreground p-2"
              >
                {day.substring(0, 3)}
              </div>
            )
          )}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells for days before month start */}
          {Array.from({ length: monthStart.getDay() }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}

          {/* Days in month */}
          {daysInMonth.map((date) => {
            const avail = getAvailabilityForDate(date);
            const isAvailable = avail?.isAvailable ?? false;
            const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));
            const isCurrentMonth = isSameMonth(date, currentMonth);

            return (
              <TooltipProvider key={date.toISOString()}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => !isPast && handleDateClick(date)}
                      disabled={isPast}
                      className={cn(
                        'aspect-square p-2 text-xs rounded transition-all',
                        'hover:scale-105 disabled:cursor-not-allowed',
                        !isCurrentMonth && 'opacity-30',
                        isPast && 'opacity-50 cursor-not-allowed',
                        isToday(date) && 'ring-2 ring-primary ring-offset-2',
                        isAvailable
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-red-100 text-red-800 hover:bg-red-200',
                        onDateSelect && !isPast && 'cursor-pointer'
                      )}
                      aria-label={`${format(date, 'dd MMMM yyyy', { locale: id })} - ${isAvailable ? 'Available' : 'Not Available'}`}
                    >
                      {date.getDate()}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="space-y-1">
                      <p className="font-medium">
                        {format(date, 'dd MMMM yyyy', { locale: id })}
                      </p>
                      <p>
                        {isAvailable ? 'Available' : 'Not Available'}
                      </p>
                      {avail?.availableSlots !== undefined && (
                        <p className="text-xs">
                          Slots: {avail.availableSlots} / {avail.maxCapacity || 'N/A'}
                        </p>
                      )}
                      {avail?.currentPax !== undefined && (
                        <p className="text-xs">
                          Current: {avail.currentPax} pax
                        </p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground pt-2 border-t">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-100 rounded" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-100 rounded" />
          <span>Not Available</span>
        </div>
        {isToday(currentMonth) && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 ring-2 ring-primary rounded" />
            <span>Today</span>
          </div>
        )}
      </div>
    </div>
  );
}

