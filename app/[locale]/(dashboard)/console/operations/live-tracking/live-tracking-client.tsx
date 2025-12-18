'use client';

import { AlertTriangle, MapPin, Navigation, Signal } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const MapComponent = dynamic(() => import('@/app/[locale]/(mobile)/guide/tracking/map-component'), {
  ssr: false,
});

type GuideLocation = {
  guideId: string;
  name: string;
  phone: string;
  tripId: string | null;
  tripCode: string;
  latitude: number;
  longitude: number;
  accuracyMeters: number | null;
  isOnline: boolean;
  lastSeenAt: string;
  hasActiveSOS: boolean;
};

export function LiveTrackingClient() {
  const [guides, setGuides] = useState<GuideLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/admin/guide/live-tracking');
        if (!res.ok) {
          throw new Error('Failed to load tracking data');
        }
        const data = (await res.json()) as { guides: GuideLocation[] };
        setGuides(data.guides);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  const hasData = guides.length > 0;
  const center = hasData
    ? {
        latitude: guides[0] ? guides[0].latitude : -5.4294,
        longitude: guides[0] ? guides[0].longitude : 105.262,
      }
    : { latitude: -5.4294, longitude: 105.262 };

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Peta Posisi Guide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 overflow-hidden rounded-lg bg-slate-100">
            {loading ? (
              <div className="flex h-full items-center justify-center text-slate-400">
                <Navigation className="mr-2 h-5 w-5 animate-spin" />
                Memuat peta...
              </div>
            ) : !hasData ? (
              <div className="flex h-full items-center justify-center text-slate-400">
                <MapPin className="mr-2 h-5 w-5" />
                Belum ada lokasi guide yang aktif.
              </div>
            ) : (
              <MapComponent
                center={center}
                guideLocation={center}
                meetingPoints={[]}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-0 bg-red-50 shadow-sm">
          <CardContent className="flex items-center gap-3 p-4 text-sm text-red-700">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </CardContent>
        </Card>
      )}

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Daftar Guide Aktif</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {guides.map((g) => (
            <div
              key={`${g.guideId}-${g.tripId ?? 'none'}`}
              className="flex items-center justify-between rounded-lg bg-slate-50 p-3"
           >
              <div>
                <p className="font-medium">
                  {g.name || 'Guide Tanpa Nama'}{' '}
                  {g.hasActiveSOS && (
                    <span className="ml-2 inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                      SOS
                    </span>
                  )}
                </p>
                <p className="text-xs text-slate-500">
                  Trip: {g.tripCode || '-'} • {g.phone || 'No HP tidak tersedia'}
                </p>
              </div>
              <div className="text-right text-xs text-slate-500">
                <div className="flex items-center justify-end gap-1">
                  <Signal
                    className={g.isOnline ? 'h-3 w-3 text-emerald-500' : 'h-3 w-3 text-slate-400'}
                  />
                  {g.isOnline ? 'Online' : 'Offline'}
                </div>
                <p>{new Date(g.lastSeenAt).toLocaleTimeString('id-ID')}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
