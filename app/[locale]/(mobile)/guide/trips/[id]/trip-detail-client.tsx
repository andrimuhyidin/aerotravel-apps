'use client';

/**
 * Trip Detail Client Component
 * Menampilkan ringkasan trip dan manifest real-time
 */

import { ArrowLeft, Calendar, CheckCircle, ClipboardList, Link as LinkIcon, MapPin, MessageSquare, Users } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { MapNavigationButtons } from '@/components/guide/map-navigation-buttons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TripManifest, getTripManifest } from '@/lib/guide';
import type { LocationPoint } from '@/lib/utils/maps';
import { cacheLocationPoint } from '@/lib/utils/maps';

import { TripTasks } from './trip-tasks';

type TripDetailClientProps = {
  tripId: string;
  locale: string;
};

export function TripDetailClient({ tripId, locale }: TripDetailClientProps) {
  const [manifest, setManifest] = useState<TripManifest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meetingPoint, setMeetingPoint] = useState<{ lat: number; lng: number; name: string } | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
        const [manifestData, locationsData] = await Promise.all([
          getTripManifest(tripId),
          fetch(`/api/guide/trips/${tripId}/locations`).then((res) => res.json()),
        ]);

        if (!mounted) return;

        setManifest(manifestData);
        setError(null);

        // Cache locations and set meeting point
        if (locationsData.locations && Array.isArray(locationsData.locations)) {
          const locations = locationsData.locations as LocationPoint[];
          
          // Cache all locations
          for (const location of locations) {
            await cacheLocationPoint(location);
          }

          // Find meeting point
          const meetingPointLocation = locations.find((loc) => loc.type === 'meeting_point');
          if (meetingPointLocation) {
            setMeetingPoint({
              lat: meetingPointLocation.latitude,
              lng: meetingPointLocation.longitude,
              name: meetingPointLocation.name,
            });
          }
        }
      } catch (err) {
        if (!mounted) return;
        setError((err as Error).message ?? 'Gagal memuat detail trip');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      mounted = false;
    };
  }, [tripId]);

  if (loading && !manifest) {
    return (
      <div className="p-4 text-sm text-slate-500">
        Memuat detail trip...
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-3">
        <Link href={`/${locale}/guide/trips`} className="flex items-center gap-2 text-slate-500">
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali</span>
        </Link>
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>
      </div>
    );
  }

  if (!manifest) {
    return (
      <div className="space-y-3">
        <Link href={`/${locale}/guide/trips`} className="flex items-center gap-2 text-slate-500">
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali</span>
        </Link>
        <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
          Data trip tidak tersedia.
        </div>
      </div>
    );
  }

  const dateLabel = manifest.date
    ? new Date(manifest.date).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : '';

  const meetingPointName = 'Dermaga Ketapang';

  const checklist = [
    {
      label: 'Check-in di lokasi',
      done: (manifest.boardedCount ?? 0) + (manifest.returnedCount ?? 0) > 0,
    },
    {
      label: 'Upload dokumentasi wajib',
      done: Boolean(manifest.documentationUrl),
    },
    {
      label: 'Semua tamu kembali',
      done: manifest.returnedCount >= manifest.totalPax && manifest.totalPax > 0,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Back Button */}
      <Link href={`/${locale}/guide/trips`} className="flex items-center gap-2 text-slate-500">
        <ArrowLeft className="h-4 w-4" />
        <span>Kembali</span>
      </Link>

      {/* Trip Header */}
      <Card className="border-0 bg-emerald-600 text-white shadow-sm">
        <CardContent className="p-4">
          <h1 className="text-xl font-bold">{manifest.tripName}</h1>
          <div className="mt-2 flex flex-wrap gap-3 text-sm opacity-90">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {dateLabel || '-'}
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span>{meetingPoint?.name || meetingPointName}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {manifest.totalPax} tamu
            </div>
          </div>
        </CardContent>
        <div className="border-t border-emerald-500/20 px-4 pb-4 pt-3">
          <MapNavigationButtons
            latitude={meetingPoint?.lat ?? -8.1319}
            longitude={meetingPoint?.lng ?? 114.3656}
            label={meetingPoint?.name || meetingPointName}
            className="w-full justify-center"
          />
        </div>
      </Card>

      {/* Quick Actions - Chat with Ops */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-3">
          <Link
            href={`/${locale}/guide/trips/${tripId}/chat`}
            className="flex items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-100 active:scale-95"
          >
            <MessageSquare className="h-4 w-4" />
            <span>Chat dengan Ops</span>
          </Link>
        </CardContent>
      </Card>

      {/* Dokumentasi & Pengeluaran shortcuts */}
      <div className="grid grid-cols-2 gap-3">
        <Link href={`/${locale}/guide/trips/${tripId}/evidence`}>
          <Card className="border-0 shadow-sm">
            <CardContent className="flex items-center justify-between p-4 text-sm">
              <span>Dokumentasi Trip</span>
              {manifest.documentationUrl ? (
                <span className="flex items-center gap-1 text-emerald-600">
                  <LinkIcon className="h-4 w-4" />
                  Isi
                </span>
              ) : (
                <span className="text-xs text-amber-600">Belum diisi</span>
              )}
            </CardContent>
          </Card>
        </Link>
        <Link href={`/${locale}/guide/trips/${tripId}/expenses`}>
          <Card className="border-0 shadow-sm">
            <CardContent className="flex items-center justify-between p-4 text-sm">
              <span>Pengeluaran Lapangan</span>
              <span className="text-xs text-slate-500">Buka form</span>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Quick Actions */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-3">
          <div className="flex gap-2">
            <Link
              href={`/${locale}/guide/trips/${tripId}/chat`}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-100 active:scale-95"
            >
              <MessageSquare className="h-4 w-4" />
              <span>Chat dengan Ops</span>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Manifest / Guest List */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="h-5 w-5" />
              Manifest Tamu
            </CardTitle>
            <span className="text-sm text-slate-500">
              {manifest.boardedCount + manifest.returnedCount}/{manifest.totalPax} hadir
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {manifest.passengers.map((guest, index) => (
              <div key={guest.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-medium">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{guest.name}</p>
                    {guest.phone && (
                      <p className="text-xs text-slate-500">{guest.phone}</p>
                    )}
                  </div>
                </div>
                <span className="text-xs text-slate-500 capitalize">{guest.status}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Trip Tasks Checklist */}
      <TripTasks tripId={tripId} />

      {/* Legacy Completion Checklist (keeping for backward compatibility) */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Checklist Penyelesaian Trip</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {checklist.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between rounded-lg bg-slate-50 p-3 text-sm"
            >
              <span>{item.label}</span>
              {item.done ? (
                <CheckCircle className="h-5 w-5 text-emerald-500" />
              ) : (
                <span className="text-xs text-amber-500">Belum</span>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-2">
        <Button asChild className="flex-1 bg-emerald-600 hover:bg-emerald-700">
          <Link href={`/${locale}/guide/manifest?tripId=${tripId}`}>Buka Manifest Interaktif</Link>
        </Button>
        <Button asChild variant="outline" className="flex-1">
          <Link href={`/${locale}/guide/attendance`}>Buka Halaman Absensi</Link>
        </Button>
      </div>
    </div>
  );
}
