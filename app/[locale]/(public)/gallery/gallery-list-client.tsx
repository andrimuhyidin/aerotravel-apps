'use client';

/**
 * Gallery List Client Component
 * Display list of trips with photos for the user
 */

import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import {
  ArrowLeft,
  Calendar,
  Camera,
  ChevronRight,
  Image as ImageIcon,
  MapPin,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { logger } from '@/lib/utils/logger';

type TripWithPhotos = {
  id: string;
  code: string;
  tripDate: string;
  status: string;
  package: {
    name: string;
    destination: string;
  } | null;
  photoCount: number;
  thumbnailUrl: string | null;
};

type GalleryListClientProps = {
  locale: string;
};

export function GalleryListClient({ locale }: GalleryListClientProps) {
  const [trips, setTrips] = useState<TripWithPhotos[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTripsWithPhotos = async () => {
      try {
        // Fetch completed trips (most likely to have photos)
        const response = await fetch('/api/user/bookings?status=completed&limit=50');
        if (!response.ok) {
          throw new Error('Gagal memuat galeri');
        }
        const data = await response.json();
        
        // Transform bookings to trips format
        // Note: In a real implementation, we'd have a dedicated API that returns photo counts
        const tripsData: TripWithPhotos[] = (data.bookings || []).map((booking: {
          id: string;
          code: string;
          tripDate: string;
          status: string;
          package: { name: string; destination: string } | null;
        }) => ({
          id: booking.id,
          code: booking.code,
          tripDate: booking.tripDate,
          status: booking.status,
          package: booking.package,
          photoCount: Math.floor(Math.random() * 20), // Placeholder - would come from API
          thumbnailUrl: null,
        }));

        setTrips(tripsData);
      } catch (err) {
        logger.error('Failed to fetch trips with photos', err);
        setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
      } finally {
        setLoading(false);
      }
    };

    fetchTripsWithPhotos();
  }, []);

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          href={`/${locale}/account`}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 transition-colors hover:bg-slate-200 dark:bg-slate-800"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">Galeri Foto</h1>
          <p className="text-sm text-muted-foreground">Koleksi foto dari trip Anda</p>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-slate-800">
              <Skeleton className="aspect-video w-full" />
              <div className="space-y-2 p-4">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl bg-red-50 p-6 text-center dark:bg-red-950/20">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      ) : trips.length === 0 ? (
        <div className="rounded-2xl bg-slate-50 p-8 text-center dark:bg-slate-800">
          <Camera className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
          <p className="font-medium text-muted-foreground">Belum ada galeri</p>
          <p className="mt-1 text-sm text-muted-foreground/70">
            Foto trip akan muncul setelah trip selesai
          </p>
          <Link
            href={`/${locale}/my-trips`}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white"
          >
            <Calendar className="h-4 w-4" />
            Lihat Trip Saya
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {trips.map((trip) => (
            <Link
              key={trip.id}
              href={`/${locale}/gallery/${trip.id}`}
              className="group overflow-hidden rounded-2xl bg-white shadow-sm transition-all hover:shadow-md active:scale-[0.98] dark:bg-slate-800"
            >
              {/* Thumbnail */}
              <div className="relative aspect-video bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600">
                {trip.thumbnailUrl ? (
                  <img
                    src={trip.thumbnailUrl}
                    alt={trip.package?.name || 'Trip'}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-slate-300 dark:text-slate-500" />
                  </div>
                )}
                {/* Photo count badge */}
                <Badge className="absolute bottom-2 right-2 gap-1 bg-black/60 text-white">
                  <Camera className="h-3 w-3" />
                  {trip.photoCount} foto
                </Badge>
              </div>

              {/* Details */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-foreground">
                      {trip.package?.name || 'Trip'}
                    </p>
                    <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {trip.package?.destination || '-'}
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-1" />
                </div>

                <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(trip.tripDate), 'd MMMM yyyy', { locale: localeId })}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

