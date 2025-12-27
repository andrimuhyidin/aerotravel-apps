/**
 * Date Quick Selector Component
 * Smart date picker with quick date shortcuts
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, Check } from 'lucide-react';
import { format, addDays, addWeeks, addMonths, startOfDay } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { cn } from '@/lib/utils';

type DateQuickSelectorProps = {
  value?: Date | null;
  onChange: (date: Date | null) => void;
};

const QUICK_DATES = [
  { label: 'Besok', getValue: () => addDays(new Date(), 1) },
  { label: '3 Hari', getValue: () => addDays(new Date(), 3) },
  { label: '1 Minggu', getValue: () => addWeeks(new Date(), 1) },
  { label: '2 Minggu', getValue: () => addWeeks(new Date(), 2) },
  { label: '1 Bulan', getValue: () => addMonths(new Date(), 1) },
];

export function DateQuickSelector({ value, onChange }: DateQuickSelectorProps) {
  const [open, setOpen] = useState(false);

  const handleQuickSelect = (date: Date) => {
    onChange(startOfDay(date));
    setOpen(false);
  };

  return (
    <div className="space-y-3">
      {/* Quick Date Buttons */}
      <div className="grid grid-cols-3 gap-2">
        {QUICK_DATES.map((quick) => {
          const quickDate = quick.getValue();
          const isSelected =
            value && startOfDay(value).getTime() === startOfDay(quickDate).getTime();

          return (
            <Button
              key={quick.label}
              type="button"
              variant={isSelected ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleQuickSelect(quickDate)}
              className={cn(
                'h-12 text-xs relative',
                isSelected && 'ring-2 ring-primary/50'
              )}
            >
              {isSelected && (
                <Check className="h-4 w-4 absolute top-1 right-1" />
              )}
              <div className="flex flex-col items-center gap-0.5">
                <span className="font-semibold">{quick.label}</span>
                <span className="text-[10px] opacity-80">
                  {format(quickDate, 'dd MMM', { locale: localeId })}
                </span>
              </div>
            </Button>
          );
        })}

        {/* Custom Date Picker */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant={value && !QUICK_DATES.some((q) => startOfDay(q.getValue()).getTime() === startOfDay(value).getTime()) ? 'default' : 'outline'}
              size="sm"
              className="h-12 text-xs"
            >
              <CalendarIcon className="h-4 w-4 mb-1" />
              <span className="font-semibold">Pilih Tanggal</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={value || undefined}
              onSelect={(date) => {
                if (date) {
                  onChange(startOfDay(date));
                  setOpen(false);
                }
              }}
              disabled={(date) => date < addDays(new Date(), -1)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Selected Date Display */}
      {value && (
        <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg text-center">
          <p className="text-sm text-muted-foreground mb-1">Tanggal Keberangkatan</p>
          <p className="font-bold text-primary">
            {format(value, 'EEEE, d MMMM yyyy', { locale: localeId })}
          </p>
        </div>
      )}
    </div>
  );
}
