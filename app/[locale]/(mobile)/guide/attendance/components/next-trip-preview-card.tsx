'use client';

/**
 * Next Trip Preview Card Component
 * Show next trip after current trip check-out
 */

import { ArrowRight, Calendar, Clock, MapPin, Users } from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import queryKeys from '@/lib/queries/query-keys';

type NextTripPreviewCardProps = {
  currentTripId: string;
  guideId: string;
  locale?: string;
};

type NextTrip = {
  id: string;
  trip_code: string | null;
  trip_date: string;
  departure_time: string | null;
  total_pax: number | null;
  package: {
    name: string | null;
    destination: string | null;
    meeting_point: string | null;
  } | null;
  timeUntilDeparture: {
    hours: number;
    minutes: number;
    formatted: string;
  };
};

export function NextTripPreviewCard({
  currentTripId,
  guideId,
  locale = 'id',
}: NextTripPreviewCardProps) {
  const { data, isLoading } = useQuery<NextTrip | null>({
    queryKey: queryKeys.guide.attendance?.nextTrip?.(
      currentTripId,
      guideId
    ) || ['attendance', 'next-trip', currentTripId, guideId],
    queryFn: async () => {
      const res = await fetch(
        `/api/guide/attendance/next-trip?currentTripId=${currentTripId}&guideId=${guideId}`
      );
      if (!res.ok) throw new Error('Failed to fetch next trip');
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-100 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Calendar className="h-5 w-5 text-blue-600" />
          Trip Selanjutnya
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Trip Info */}
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-900">
                {data.package?.name || 'Trip Package'}
              </p>
              <p className="text-xs text-slate-600">
                {data.package?.destination || 'Destination'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-600" />
            <p className="text-xs text-slate-700">
              {new Date(data.trip_date).toLocaleDateString('id-ID', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-600" />
            <p className="text-xs text-slate-700">
              Berangkat: {data.departure_time || '07:30'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-600" />
            <p className="text-xs text-slate-700">
              {data.total_pax || 0} Penumpang
            </p>
          </div>
        </div>

        {/* Time Until Departure */}
        <div className="rounded-lg bg-white/80 px-4 py-3">
          <p className="text-xs text-slate-600">Waktu Tersisa</p>
          <p className="text-2xl font-bold text-blue-600">
            {data.timeUntilDeparture.formatted}
          </p>
        </div>

        {/* Action Button */}
        <Button className="w-full bg-blue-600 hover:bg-blue-700" asChild>
          <Link href={`/${locale}/guide/trips/${data.id}`}>
            Lihat Detail Trip
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
