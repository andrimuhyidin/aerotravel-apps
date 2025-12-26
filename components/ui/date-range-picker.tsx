/**
 * Date Range Picker Component
 * Allows selecting a date range for filtering
 */

'use client';

import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import type { DateRange } from 'react-day-picker';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

type DateRangePickerProps = {
  dateFrom: Date | null;
  dateTo: Date | null;
  onDateFromChange: (date: Date | null) => void;
  onDateToChange: (date: Date | null) => void;
  onClear: () => void;
  className?: string;
};

export function DateRangePicker({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  onClear,
  className,
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (range: DateRange | undefined) => {
    if (range?.from) {
      onDateFromChange(range.from);
    }
    if (range?.to) {
      onDateToChange(range.to);
    }
    // Close popover when both dates are selected
    if (range?.from && range?.to) {
      setOpen(false);
    }
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-full justify-start text-left font-normal',
              !dateFrom && !dateTo && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateFrom && dateTo ? (
              <>
                {format(dateFrom, 'dd MMM yyyy', { locale: id })} -{' '}
                {format(dateTo, 'dd MMM yyyy', { locale: id })}
              </>
            ) : dateFrom ? (
              format(dateFrom, 'dd MMM yyyy', { locale: id })
            ) : (
              <span>Pilih rentang tanggal</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={{
              from: dateFrom || undefined,
              to: dateTo || undefined,
            }}
            onSelect={handleSelect}
            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
            locale={id}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
      {(dateFrom || dateTo) && (
        <Button variant="ghost" size="sm" onClick={onClear}>
          Clear
        </Button>
      )}
    </div>
  );
}

