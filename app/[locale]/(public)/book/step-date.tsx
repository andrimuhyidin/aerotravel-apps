/**
 * Step 2: Date Selection for Public Booking
 */

'use client';

import { addDays, format, isBefore, startOfDay } from 'date-fns';
import { id } from 'date-fns/locale';
import { AlertCircle, Calendar, Check, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { logger } from '@/lib/utils/logger';
import { cn } from '@/lib/utils';

type AvailabilitySlot = {
  date: string;
  available: boolean;
  remainingSlots: number;
  status: 'available' | 'limited' | 'full';
};

type StepDatePublicProps = {
  packageId: string;
  selectedDate?: Date | null;
  onDateSelect: (date: Date) => void;
};

export function StepDatePublic({
  packageId,
  selectedDate,
  onDateSelect,
}: StepDatePublicProps) {
  const [loading, setLoading] = useState(false);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const today = startOfDay(new Date());
  const minDate = addDays(today, 3); // Minimum 3 days in advance

  useEffect(() => {
    if (packageId) {
      loadAvailability();
    }
  }, [packageId]);

  const loadAvailability = async () => {
    setLoading(true);
    try {
      const fromDate = format(minDate, 'yyyy-MM-dd');
      const toDate = format(addDays(today, 90), 'yyyy-MM-dd'); // 90 days ahead
      
      const res = await fetch(
        `/api/public/packages/${packageId}/availability?from=${fromDate}&to=${toDate}`
      );
      
      if (!res.ok) throw new Error('Failed to load availability');
      
      const data = await res.json();
      setAvailability(data.availability || []);
    } catch (error) {
      logger.error('Failed to load availability', error, { packageId });
    } finally {
      setLoading(false);
    }
  };

  // Quick date options
  const quickDates = [
    { label: 'Minggu ini', date: addDays(today, 7 - today.getDay()) },
    { label: 'Sabtu Depan', date: addDays(today, 13 - today.getDay()) },
    { label: '2 Minggu Lagi', date: addDays(today, 14) },
    { label: 'Bulan Depan', date: addDays(today, 30) },
  ].filter(d => !isBefore(d.date, minDate));

  // Check if date is available
  const isDateAvailable = (date: Date) => {
    if (isBefore(date, minDate)) return false;
    
    const dateStr = format(date, 'yyyy-MM-dd');
    const slot = availability.find((s) => s.date === dateStr);
    return slot ? slot.available : true; // Default to available if no data
  };

  // Get date status
  const getDateStatus = (date: Date): 'available' | 'limited' | 'full' | null => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const slot = availability.find((s) => s.date === dateStr);
    return slot?.status || null;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center py-2">
        <div className="h-12 w-12 mx-auto mb-2 rounded-full bg-primary/10 flex items-center justify-center">
          <Calendar className="h-6 w-6 text-primary" />
        </div>
        <h2 className="font-bold text-lg">Pilih Tanggal Keberangkatan</h2>
        <p className="text-sm text-muted-foreground">
          Booking minimal H-3 sebelum keberangkatan
        </p>
      </div>

      {/* Quick Date Buttons */}
      <div className="grid grid-cols-2 gap-2">
        {quickDates.slice(0, 4).map((item) => {
          const isSelected = selectedDate && 
            format(selectedDate, 'yyyy-MM-dd') === format(item.date, 'yyyy-MM-dd');
          const isAvailable = isDateAvailable(item.date);
          
          return (
            <Button
              key={item.label}
              variant={isSelected ? 'default' : 'outline'}
              className={cn(
                'h-auto py-3 flex flex-col items-start',
                !isAvailable && 'opacity-50 cursor-not-allowed'
              )}
              disabled={!isAvailable}
              onClick={() => onDateSelect(item.date)}
            >
              <span className="text-xs font-normal">{item.label}</span>
              <span className="font-semibold">
                {format(item.date, 'd MMM', { locale: id })}
              </span>
            </Button>
          );
        })}
      </div>

      {/* Calendar */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Pilih dari Kalender
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <CalendarComponent
              mode="single"
              selected={selectedDate || undefined}
              onSelect={(date) => date && onDateSelect(date)}
              disabled={(date) => !isDateAvailable(date)}
              fromDate={minDate}
              toDate={addDays(today, 365)}
              locale={id}
              className="rounded-md"
              modifiers={{
                limited: (date) => getDateStatus(date) === 'limited',
                full: (date) => getDateStatus(date) === 'full',
              }}
              modifiersStyles={{
                limited: { backgroundColor: 'rgb(254 243 199)' },
                full: { backgroundColor: 'rgb(254 226 226)', color: 'rgb(185 28 28)' },
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-full bg-primary" />
          <span>Tersedia</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-full bg-amber-200" />
          <span>Terbatas</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-full bg-red-200" />
          <span>Penuh</span>
        </div>
      </div>

      {/* Selected Date Display */}
      {selectedDate && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-green-700">Tanggal dipilih</p>
              <p className="font-bold text-green-800">
                {format(selectedDate, 'EEEE, d MMMM yyyy', { locale: id })}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info */}
      <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg text-xs text-blue-800">
        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
        <div>
          <p className="font-medium">Perlu diketahui:</p>
          <ul className="mt-1 space-y-0.5 text-blue-700">
            <li>• Jadwal keberangkatan bisa berubah tergantung cuaca</li>
            <li>• Konfirmasi final H-1 via WhatsApp</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

