'use client';

/**
 * Horizontal Date Picker Component
 * Scrollable date picker seperti tiket.com/traveloka
 *
 * Features:
 * - Horizontal scrollable dates (7 hari)
 * - Auto-scroll to today or selected date
 * - Highlight selected date
 * - Smooth scrolling
 * - Custom date picker dialog with calendar
 */

import { Calendar as CalendarIcon, MoreHorizontal } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import type { DateRange } from 'react-day-picker';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import 'react-day-picker/dist/style.css';

type DateOption = {
  value: string; // YYYY-MM-DD or 'all' or 'this_month' or 'next_month'
  label: string;
  date?: Date;
};

type HorizontalDatePickerProps = {
  value: string;
  onChange: (value: string) => void;
  options?: DateOption[];
  showAllOption?: boolean;
  className?: string;
};

export function HorizontalDatePicker({
  value,
  onChange,
  options,
  showAllOption = true,
  className,
}: HorizontalDatePickerProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);
  const [dates, setDates] = useState<DateOption[]>([]);
  const [customDateDialogOpen, setCustomDateDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [pickerMode, setPickerMode] = useState<'single' | 'range'>('single');

  // Generate date options if not provided
  useEffect(() => {
    if (options) {
      setDates(options);
      return;
    }

    const generatedDates: DateOption[] = [];

    // Add "All" option
    if (showAllOption) {
      generatedDates.push({
        value: 'all',
        label: 'Semua',
      });
    }

    // Generate dates: Hanya 7 hari (hari ini + 6 hari ke depan)
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Hanya generate 7 hari saja
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      const dayName = date.toLocaleDateString('id-ID', { weekday: 'short' });
      const dayNumber = date.getDate();
      const monthName = date.toLocaleDateString('id-ID', { month: 'short' });

      generatedDates.push({
        value: date.toISOString().split('T')[0] || '',
        label: `${dayName}, ${dayNumber} ${monthName}`,
        date,
      });
    }

    setDates(generatedDates);
  }, [options, showAllOption]);

  // Auto-scroll to selected date
  useEffect(() => {
    if (selectedRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const selected = selectedRef.current;

      const _containerRect = container.getBoundingClientRect();
      const _selectedRect = selected.getBoundingClientRect();

      const scrollLeft =
        selected.offsetLeft -
        container.offsetLeft -
        container.clientWidth / 2 +
        selected.clientWidth / 2;

      container.scrollTo({
        left: scrollLeft,
        behavior: 'smooth',
      });
    }
  }, [value, dates]);

  // Auto-scroll to today on mount
  useEffect(() => {
    if (scrollContainerRef.current && value === 'all') {
      // Find today's date
      const today = new Date().toISOString().split('T')[0];
      const todayIndex = dates.findIndex((d) => d.value === today);

      if (todayIndex > -1 && scrollContainerRef.current) {
        setTimeout(() => {
          const container = scrollContainerRef.current;
          if (container) {
            const todayButton = container.querySelector(
              `[data-date="${today}"]`
            ) as HTMLElement;
            if (todayButton) {
              const scrollLeft =
                todayButton.offsetLeft -
                container.offsetLeft -
                container.clientWidth / 2 +
                todayButton.clientWidth / 2;
              container.scrollTo({
                left: scrollLeft,
                behavior: 'smooth',
              });
            }
          }
        }, 100);
      }
    }
  }, [dates, value]);

  const isToday = (date?: Date): boolean => {
    if (!date) return false;
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  return (
    <div className={cn('relative', className)}>
      {/* Scrollable Date Container */}
      <div
        ref={scrollContainerRef}
        className="flex gap-2 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {dates.map((dateOption) => {
          const isSelected = value === dateOption.value;
          const isTodayDate = dateOption.date
            ? isToday(dateOption.date)
            : false;

          return (
            <button
              key={dateOption.value}
              ref={isSelected ? selectedRef : null}
              type="button"
              data-date={dateOption.value}
              onClick={() => onChange(dateOption.value)}
              className={cn(
                'flex-shrink-0 rounded-lg px-2.5 py-1.5 text-center transition-all duration-200 active:scale-95',
                'min-w-[65px]',
                isSelected
                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-md shadow-emerald-200/50'
                  : 'bg-white text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50 hover:ring-emerald-200',
                isTodayDate &&
                  !isSelected &&
                  'bg-emerald-50 ring-2 ring-emerald-300'
              )}
            >
              {dateOption.value === 'all' ? (
                <div className="flex flex-col items-center gap-0">
                  <CalendarIcon className="h-3.5 w-3.5" />
                  <span className="text-[9px] font-semibold leading-tight">
                    {dateOption.label}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-0">
                  <span className="text-[9px] font-medium uppercase leading-tight text-slate-500">
                    {dateOption.date?.toLocaleDateString('id-ID', {
                      weekday: 'short',
                    })}
                  </span>
                  <span className="text-sm font-bold leading-none">
                    {dateOption.date?.getDate()}
                  </span>
                  <span className="text-[9px] font-medium leading-tight text-slate-500">
                    {dateOption.date?.toLocaleDateString('id-ID', {
                      month: 'short',
                    })}
                  </span>
                  {isTodayDate && (
                    <span className="mt-0.5 text-[8px] font-semibold leading-tight text-emerald-600">
                      Hari Ini
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}

        {/* Lainnya Button */}
        <button
          type="button"
          onClick={() => setCustomDateDialogOpen(true)}
          className={cn(
            'flex-shrink-0 rounded-lg px-2.5 py-1.5 text-center transition-all duration-200 active:scale-95',
            'min-w-[65px]',
            value && !dates.some((d) => d.value === value) && value !== 'all'
              ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-md shadow-emerald-200/50'
              : 'bg-white text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50 hover:ring-emerald-200'
          )}
        >
          <div className="flex flex-col items-center gap-0">
            <MoreHorizontal className="h-3.5 w-3.5 text-slate-500" />
            <span className="text-[9px] font-semibold leading-tight">
              Lainnya
            </span>
          </div>
        </button>
      </div>

      {/* Gradient Fade on edges */}
      <div className="pointer-events-none absolute left-0 top-0 h-full w-8 bg-gradient-to-r from-white to-transparent" />
      <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-white to-transparent" />

      {/* Custom Date Picker Dialog */}
      <Dialog
        open={customDateDialogOpen}
        onOpenChange={setCustomDateDialogOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pilih Tanggal</DialogTitle>
            <DialogDescription>
              Pilih tanggal atau rentang tanggal untuk melihat trip
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {/* Mode Toggle */}
            <div className="mb-4 flex gap-2">
              <Button
                type="button"
                variant={pickerMode === 'single' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setPickerMode('single');
                  setDateRange(undefined);
                  setSelectedDate(undefined);
                }}
                className={cn(
                  'flex-1',
                  pickerMode === 'single' &&
                    'bg-emerald-600 hover:bg-emerald-700'
                )}
              >
                Tanggal Tunggal
              </Button>
              <Button
                type="button"
                variant={pickerMode === 'range' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setPickerMode('range');
                  setSelectedDate(undefined);
                  setDateRange({ from: undefined, to: undefined });
                }}
                className={cn(
                  'flex-1',
                  pickerMode === 'range' &&
                    'bg-emerald-600 hover:bg-emerald-700'
                )}
              >
                Rentang Tanggal
              </Button>
            </div>

            {/* Calendar */}
            <div className="flex justify-center">
              {pickerMode === 'single' ? (
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) =>
                    date < new Date(new Date().setHours(0, 0, 0, 0))
                  }
                  locale={id}
                  className="rounded-md border"
                />
              ) : (
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  disabled={(date) =>
                    date < new Date(new Date().setHours(0, 0, 0, 0))
                  }
                  locale={id}
                  numberOfMonths={1}
                  className="rounded-md border"
                />
              )}
            </div>

            {/* Selected Date Display */}
            <div className="mt-4 space-y-2">
              {pickerMode === 'single' && selectedDate && (
                <div className="rounded-lg bg-emerald-50 p-3 text-sm">
                  <span className="font-medium text-emerald-900">
                    Tanggal dipilih:{' '}
                    {format(selectedDate, 'EEEE, d MMMM yyyy', { locale: id })}
                  </span>
                </div>
              )}
              {pickerMode === 'range' && dateRange && (
                <div className="rounded-lg bg-emerald-50 p-3 text-sm">
                  {dateRange.from && (
                    <div className="font-medium text-emerald-900">
                      Dari:{' '}
                      {format(dateRange.from, 'EEEE, d MMMM yyyy', {
                        locale: id,
                      })}
                    </div>
                  )}
                  {dateRange.to && (
                    <div className="mt-1 font-medium text-emerald-900">
                      Sampai:{' '}
                      {format(dateRange.to, 'EEEE, d MMMM yyyy', {
                        locale: id,
                      })}
                    </div>
                  )}
                  {dateRange.from && !dateRange.to && (
                    <div className="mt-1 text-xs text-emerald-700">
                      Pilih tanggal akhir untuk menyelesaikan rentang
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCustomDateDialogOpen(false);
                setSelectedDate(undefined);
                setDateRange(undefined);
              }}
            >
              Batal
            </Button>
            <Button
              onClick={() => {
                if (pickerMode === 'single' && selectedDate) {
                  onChange(format(selectedDate, 'yyyy-MM-dd'));
                  setCustomDateDialogOpen(false);
                  setSelectedDate(undefined);
                } else if (
                  pickerMode === 'range' &&
                  dateRange?.from &&
                  dateRange?.to
                ) {
                  // For range, we'll use the start date as the filter value
                  // You might want to adjust this based on your filtering logic
                  onChange(format(dateRange.from, 'yyyy-MM-dd'));
                  setCustomDateDialogOpen(false);
                  setDateRange(undefined);
                }
              }}
              disabled={
                (pickerMode === 'single' && !selectedDate) ||
                (pickerMode === 'range' && (!dateRange?.from || !dateRange?.to))
              }
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Pilih
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
