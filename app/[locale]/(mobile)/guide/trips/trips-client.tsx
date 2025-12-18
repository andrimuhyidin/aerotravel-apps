'use client';

/**
 * Guide Trips List Client
 * Menampilkan daftar trip dengan filter berdasarkan status
 */

import { useQuery } from '@tanstack/react-query';
import { Calendar, ChevronRight, Clock, Users } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import queryKeys from '@/lib/queries/query-keys';
import { cn } from '@/lib/utils';

type TripItem = {
  id: string;
  code: string;
  name: string;
  date: string;
  guests: number;
  status: 'ongoing' | 'upcoming' | 'completed' | 'cancelled';
};

type GuideTripsResponse = {
  trips: TripItem[];
};

type TripsClientProps = {
  locale: string;
};

type FilterStatus = 'all' | 'ongoing' | 'upcoming' | 'completed' | 'cancelled';

function getStatusLabel(status: TripItem['status']) {
  switch (status) {
    case 'ongoing':
      return {
        text: 'Berlangsung',
        className: 'bg-emerald-100 text-emerald-700',
        dot: 'bg-emerald-500',
      };
    case 'upcoming':
      return {
        text: 'Mendatang',
        className: 'bg-blue-100 text-blue-700',
        dot: 'bg-blue-500',
      };
    case 'completed':
      return {
        text: 'Selesai',
        className: 'bg-slate-100 text-slate-600',
        dot: 'bg-slate-400',
      };
    case 'cancelled':
      return {
        text: 'Dibatalkan',
        className: 'bg-red-100 text-red-600',
        dot: 'bg-red-500',
      };
  }
}

const filterOptions: { key: FilterStatus; label: string }[] = [
  { key: 'all', label: 'Semua' },
  { key: 'upcoming', label: 'Mendatang' },
  { key: 'ongoing', label: 'Berlangsung' },
  { key: 'completed', label: 'Selesai' },
  { key: 'cancelled', label: 'Dibatalkan' },
];

export function TripsClient({ locale }: TripsClientProps) {
  const [filter, setFilter] = useState<FilterStatus>('all');

  const { data, isLoading, error } = useQuery<GuideTripsResponse>({
    queryKey: queryKeys.guide.trips(),
    queryFn: async () => {
      const res = await fetch('/api/guide/trips');
      if (!res.ok) {
        throw new Error('Gagal memuat trip');
      }
      return (await res.json()) as GuideTripsResponse;
    },
  });

  const trips = data?.trips ?? [];

  const filteredTrips =
    filter === 'all'
      ? trips
      : trips.filter((trip) => trip.status === filter);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 animate-pulse rounded-xl bg-slate-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-slate-200" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-4">
          <p className="text-sm font-medium text-red-700">
            {(error as Error).message}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (trips.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Calendar className="mb-3 h-12 w-12 text-slate-300" />
          <p className="text-sm font-medium text-slate-600">Belum ada penugasan trip</p>
          <p className="mt-1 text-xs text-slate-500">
            Trip yang ditugaskan ke Anda akan muncul di sini
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {filterOptions.map((option) => {
          const isActive = filter === option.key;
          return (
            <button
              key={option.key}
              type="button"
              className={cn(
                'whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-medium transition-all active:scale-95',
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
              )}
              onClick={() => setFilter(option.key)}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {/* Trips List */}
      {filteredTrips.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Calendar className="mb-3 h-12 w-12 text-slate-300" />
            <p className="text-sm font-medium text-slate-600">
              Tidak ada trip dengan status ini
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Coba pilih filter lain untuk melihat trip lainnya
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTrips.map((trip) => {
            const status = getStatusLabel(trip.status);
            const tripDate = new Date(trip.date);
            const day = tripDate.getDate().toString().padStart(2, '0');
            const month = tripDate.toLocaleDateString('id-ID', { month: 'short' });
            const formattedDate = tripDate.toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            });

            return (
              <Link
                key={trip.id}
                href={`/${locale}/guide/trips/${trip.id}`}
                className="block transition-transform active:scale-[0.98]"
              >
                <Card className="border-0 shadow-sm transition-colors hover:shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Date Badge */}
                      <div className="flex h-14 w-14 flex-shrink-0 flex-col items-center justify-center rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100">
                        <span className="text-lg font-bold text-emerald-700">{day}</span>
                        <span className="text-[10px] font-medium uppercase text-emerald-600">
                          {month}
                        </span>
                      </div>

                      {/* Trip Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <h3 className="truncate font-semibold text-slate-900">
                              {trip.name}
                            </h3>
                            <p className="mt-0.5 text-xs text-slate-400">Kode: {trip.code}</p>
                          </div>
                          <span
                            className={cn(
                              'flex-shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium',
                              status.className,
                            )}
                          >
                            {status.text}
                          </span>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                            <span>{formattedDate}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5 flex-shrink-0" />
                            <span>{trip.guests} tamu</span>
                          </div>
                        </div>
                      </div>

                      {/* Chevron */}
                      <ChevronRight
                        className="h-5 w-5 flex-shrink-0 text-slate-400"
                        aria-hidden="true"
                      />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
