'use client';

/**
 * Trip Info Widgets
 * Grid of information widgets untuk trip detail
 */

import { MapNavigationButtons } from '@/components/guide/map-navigation-buttons';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
    Calendar,
    MapPin,
    ThermometerSun,
    Users
} from 'lucide-react';

type TripInfoWidgetsProps = {
  date?: string;
  departureTime?: string | null;
  returnTime?: string | null;
  totalPax: number;
  boardedCount: number;
  returnedCount: number;
  meetingPoint?: { lat: number; lng: number; name: string } | null;
  meetingPointName?: string;
  weather?: { temp: number; description: string; hasAlert: boolean } | null;
};

export function TripInfoWidgets({
  date,
  departureTime,
  returnTime,
  totalPax,
  boardedCount,
  returnedCount,
  meetingPoint,
  meetingPointName = 'Dermaga Ketapang',
  weather,
}: TripInfoWidgetsProps) {
  const progress = totalPax > 0 ? ((boardedCount + returnedCount) / totalPax) * 100 : 0;

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Date & Time Widget */}
      <Card className="border-slate-200 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-600">Tanggal & Waktu</p>
              {date && (
                <p className="mt-1 text-sm font-bold text-slate-900">
                  {new Date(date).toLocaleDateString('id-ID', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  })}
                </p>
              )}
              {departureTime && (
                <p className="mt-1 text-xs text-slate-600">
                  Berangkat: {typeof departureTime === 'string' ? departureTime.slice(0, 5) : departureTime} WIB
                </p>
              )}
              {returnTime && (
                <p className="text-xs text-slate-600">
                  Kembali: ~{typeof returnTime === 'string' ? returnTime.slice(0, 5) : returnTime} WIB
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total Pax & Progress Widget */}
      <Card className="border-slate-200 bg-gradient-to-br from-emerald-50 to-teal-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-100">
              <Users className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-600">Total Tamu</p>
              <p className="mt-1 text-lg font-bold text-slate-900">{totalPax}</p>
              {totalPax > 0 && (boardedCount + returnedCount) > 0 && (
                <>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full bg-emerald-500 transition-all"
                      style={{ width: `${Math.min(100, progress)}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-xs font-semibold text-emerald-700">
                    {boardedCount + returnedCount}/{totalPax} checked-in
                  </p>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Meeting Point Widget */}
      <Card className="border-slate-200 bg-gradient-to-br from-purple-50 to-pink-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-purple-100">
              <MapPin className="h-5 w-5 text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-600">Meeting Point</p>
              <p className="mt-1 text-sm font-bold text-slate-900 line-clamp-2">
                {meetingPoint?.name || meetingPointName}
              </p>
              {meetingPoint && (
                <div className="mt-2">
                  <MapNavigationButtons
                    latitude={meetingPoint.lat}
                    longitude={meetingPoint.lng}
                    label={meetingPoint.name}
                    className="h-7 text-xs"
                  />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weather Widget */}
      <Card className={cn(
        'border-slate-200 bg-gradient-to-br',
        weather?.hasAlert
          ? 'from-amber-50 to-orange-50'
          : 'from-amber-50 to-yellow-50'
      )}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className={cn(
              'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg',
              weather?.hasAlert ? 'bg-amber-100' : 'bg-amber-100'
            )}>
              <ThermometerSun className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-600">Cuaca</p>
              {weather ? (
                <>
                  <p className="mt-1 text-lg font-bold text-slate-900">
                    {weather.temp}°C
                  </p>
                  <p className="mt-0.5 text-xs text-slate-600 line-clamp-1">
                    {weather.description}
                  </p>
                  {weather.hasAlert && (
                    <p className="mt-1 text-xs font-semibold text-amber-700">
                      ⚠️ Cuaca buruk
                    </p>
                  )}
                </>
              ) : (
                <p className="mt-1 text-sm text-slate-500">Tidak tersedia</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
