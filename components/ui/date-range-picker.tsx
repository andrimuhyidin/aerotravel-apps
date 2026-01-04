/**
 * Date Range Picker Component
 * Advanced date range selection with presets
 */

'use client';

import { format, subDays, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { Calendar, ChevronDown } from 'lucide-react';
import * as React from 'react';
import { DateRange } from 'react-day-picker';

import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export type DateRangePreset = {
  label: string;
  value: string;
  getRange: () => DateRange;
};

const DEFAULT_PRESETS: DateRangePreset[] = [
  {
    label: 'Hari Ini',
    value: 'today',
    getRange: () => ({ from: new Date(), to: new Date() }),
  },
  {
    label: '7 Hari Terakhir',
    value: 'last7days',
    getRange: () => ({ from: subDays(new Date(), 7), to: new Date() }),
  },
  {
    label: '30 Hari Terakhir',
    value: 'last30days',
    getRange: () => ({ from: subDays(new Date(), 30), to: new Date() }),
  },
  {
    label: 'Bulan Ini',
    value: 'thisMonth',
    getRange: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }),
  },
  {
    label: 'Bulan Lalu',
    value: 'lastMonth',
    getRange: () => {
      const lastMonth = subMonths(new Date(), 1);
      return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
    },
  },
  {
    label: '3 Bulan Terakhir',
    value: 'last3months',
    getRange: () => ({ from: subMonths(new Date(), 3), to: new Date() }),
  },
  {
    label: 'Tahun Ini',
    value: 'thisYear',
    getRange: () => ({ from: startOfYear(new Date()), to: endOfYear(new Date()) }),
  },
  {
    label: 'Custom',
    value: 'custom',
    getRange: () => ({ from: undefined, to: undefined }),
  },
];

export type DateRangePickerProps = {
  value?: DateRange;
  onChange: (range: DateRange | undefined) => void;
  presets?: DateRangePreset[];
  className?: string;
  placeholder?: string;
  align?: 'start' | 'center' | 'end';
  showCompare?: boolean;
};

export function DateRangePicker({
  value,
  onChange,
  presets = DEFAULT_PRESETS,
  className,
  placeholder = 'Pilih rentang tanggal',
  align = 'start',
  showCompare = false,
}: DateRangePickerProps) {
  const [selectedPreset, setSelectedPreset] = React.useState<string>('custom');
  const [open, setOpen] = React.useState(false);

  const handlePresetSelect = (preset: DateRangePreset) => {
    setSelectedPreset(preset.value);
    if (preset.value !== 'custom') {
      const range = preset.getRange();
      onChange(range);
      setOpen(false);
    }
  };

  const handleCalendarSelect = (range: DateRange | undefined) => {
    setSelectedPreset('custom');
    onChange(range);
  };

  const formatDateRange = () => {
    if (!value?.from) return placeholder;
    if (!value.to) {
      return format(value.from, 'd MMM yyyy', { locale: localeId });
    }
    return `${format(value.from, 'd MMM yyyy', { locale: localeId })} - ${format(value.to, 'd MMM yyyy', { locale: localeId })}`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'justify-start text-left font-normal min-w-[240px]',
            !value && 'text-muted-foreground',
            className
          )}
        >
          <Calendar className="mr-2 h-4 w-4" />
          <span className="flex-1">{formatDateRange()}</span>
          <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align={align}>
        <div className="flex">
          {/* Presets */}
          <div className="border-r p-2 space-y-1 min-w-[140px]">
            <p className="px-2 py-1 text-xs font-medium text-muted-foreground">
              Preset
            </p>
            {presets.map((preset) => (
              <Button
                key={preset.value}
                variant={selectedPreset === preset.value ? 'secondary' : 'ghost'}
                size="sm"
                className="w-full justify-start text-xs"
                onClick={() => handlePresetSelect(preset)}
              >
                {preset.label}
              </Button>
            ))}
          </div>

          {/* Calendar */}
          <div className="p-3">
            <CalendarComponent
              mode="range"
              selected={value}
              onSelect={handleCalendarSelect}
              numberOfMonths={2}
              locale={localeId}
              initialFocus
            />

            {/* Compare Toggle */}
            {showCompare && (
              <div className="border-t mt-3 pt-3">
                <p className="text-xs text-muted-foreground">
                  Fitur perbandingan periode akan datang
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="border-t mt-3 pt-3 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onChange(undefined);
                  setSelectedPreset('custom');
                }}
              >
                Reset
              </Button>
              <Button size="sm" onClick={() => setOpen(false)}>
                Terapkan
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Export presets for reuse
export { DEFAULT_PRESETS };

