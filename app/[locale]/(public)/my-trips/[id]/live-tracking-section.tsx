/**
 * Live Tracking Section Component
 * Shows real-time guide location for customers
 */

'use client';

import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import {
  AlertCircle,
  Clock,
  Loader2,
  MapPin,
  Navigation,
  Phone,
  RefreshCw,
  Route,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/utils/logger';

// Dynamic import for map to avoid SSR issues
const DynamicMap = dynamic(
  () => import('@/components/map/dynamic-map').then((mod) => mod.DynamicMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-64 items-center justify-center rounded-lg bg-slate-100">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    ),
  }
);

type TrackingData = {
  guideLocation: {
    latitude: number;
    longitude: number;
    accuracy: number | null;
    lastUpdate: string;
  } | null;
  guideInfo: {
    name: string;
    phone: string;
  } | null;
  tripStatus: string;
  tripCode: string;
  meetingPoints: Array<{
    name: string;
    latitude: number;
    longitude: number;
    time: string;
  }>;
  breadcrumbTrail: Array<{
    latitude: number;
    longitude: number;
    timestamp: string;
  }>;
  eta: {
    minutes: number;
    distance: number;
  } | null;
  isLiveTrackingAvailable: boolean;
};

type LiveTrackingSectionProps = {
  tripId: string;
  tripDate: string;
};

export function LiveTrackingSection({ tripId, tripDate }: LiveTrackingSectionProps) {
  const [tracking, setTracking] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const supabase = createClient();

  // Check if tracking should be visible
  const tripDateTime = new Date(tripDate);
  const now = new Date();
  const oneHourBefore = new Date(tripDateTime.getTime() - 60 * 60 * 1000);
  const endOfDay = new Date(tripDateTime);
  endOfDay.setHours(23, 59, 59, 999);

  const shouldShowTracking = now >= oneHourBefore && now <= endOfDay;

  const fetchTracking = useCallback(async () => {
    try {
      const res = await fetch(`/api/user/trips/${tripId}/tracking`);
      if (!res.ok) {
        if (res.status === 404) {
          setError('Trip tidak ditemukan');
          return;
        }
        throw new Error('Failed to fetch tracking');
      }

      const data = await res.json();
      setTracking(data.tracking);
      setError(null);
    } catch (err) {
      logger.error('Failed to fetch tracking data', err);
      setError('Gagal memuat data tracking');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [tripId]);

  // Initial fetch
  useEffect(() => {
    if (shouldShowTracking) {
      void fetchTracking();
    } else {
      setLoading(false);
    }
  }, [shouldShowTracking, fetchTracking]);

  // Real-time subscription
  useEffect(() => {
    if (!shouldShowTracking) return;

    const channel = supabase
      .channel(`customer-tracking-${tripId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'guide_locations',
        },
        () => {
          logger.info('[Customer Tracking] Location update received');
          void fetchTracking();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'gps_pings',
        },
        () => {
          logger.info('[Customer Tracking] GPS ping received');
          void fetchTracking();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          logger.info('[Customer Tracking] Realtime subscription active');
        } else if (status === 'CHANNEL_ERROR') {
          logger.error('[Customer Tracking] Subscription error');
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, tripId, shouldShowTracking, fetchTracking]);

  // Auto-refresh every 30 seconds as fallback
  useEffect(() => {
    if (!shouldShowTracking) return;

    const interval = setInterval(() => {
      void fetchTracking();
    }, 30000);

    return () => clearInterval(interval);
  }, [shouldShowTracking, fetchTracking]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    void fetchTracking();
    toast.success('Memperbarui posisi...');
  };

  // Don't show if not in tracking window
  if (!shouldShowTracking) {
    return null;
  }

  if (loading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2 text-slate-500">Memuat live tracking...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-0 bg-red-50 shadow-sm">
        <CardContent className="flex items-center gap-3 p-4 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" />
          {error}
        </CardContent>
      </Card>
    );
  }

  if (!tracking) {
    return null;
  }

  // Prepare map data
  const mapCenter: [number, number] = tracking.guideLocation
    ? [tracking.guideLocation.latitude, tracking.guideLocation.longitude]
    : tracking.meetingPoints[0]
      ? [tracking.meetingPoints[0].latitude, tracking.meetingPoints[0].longitude]
      : [-5.4294, 105.262]; // Default center (Indonesia)

  const markers = [
    // Guide location
    ...(tracking.guideLocation
      ? [
          {
            lat: tracking.guideLocation.latitude,
            lng: tracking.guideLocation.longitude,
            name: `🚐 ${tracking.guideInfo?.name || 'Guide'}`,
            description: tracking.eta
              ? `ETA: ${tracking.eta.minutes} menit (${tracking.eta.distance} km)`
              : 'Sedang dalam perjalanan',
          },
        ]
      : []),
    // Meeting points
    ...tracking.meetingPoints.map((mp) => ({
      lat: mp.latitude,
      lng: mp.longitude,
      name: `📍 ${mp.name}`,
      description: `Jam: ${mp.time}`,
    })),
  ];

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Navigation className="h-4 w-4 text-primary" />
          Live Tracking
          {tracking.isLiveTrackingAvailable && (
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
              <span className="mr-1.5 h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              Live
            </Badge>
          )}
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="h-8 w-8 p-0"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Map */}
        <div className="overflow-hidden rounded-lg">
          <DynamicMap
            center={mapCenter}
            zoom={14}
            markers={markers}
            breadcrumbTrail={tracking.breadcrumbTrail}
            showBreadcrumb={tracking.breadcrumbTrail.length > 1}
            height="280px"
            className="rounded-lg"
          />
        </div>

        {/* Status Cards */}
        <div className="grid gap-3 sm:grid-cols-2">
          {/* ETA Card */}
          {tracking.eta && (
            <div className="flex items-center gap-3 rounded-lg bg-blue-50 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-blue-600">Estimasi Tiba</p>
                <p className="font-semibold text-blue-700">
                  {tracking.eta.minutes} menit
                </p>
                <p className="text-xs text-blue-500">{tracking.eta.distance} km</p>
              </div>
            </div>
          )}

          {/* Guide Info Card */}
          {tracking.guideInfo && (
            <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200">
                <MapPin className="h-5 w-5 text-slate-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-slate-500">Guide</p>
                <p className="font-medium text-slate-700">{tracking.guideInfo.name}</p>
                {tracking.guideInfo.phone && (
                  <a
                    href={`tel:${tracking.guideInfo.phone}`}
                    className="flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <Phone className="h-3 w-3" />
                    Hubungi
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Meeting Points */}
        {tracking.meetingPoints.length > 0 && (
          <div className="space-y-2">
            <p className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
              <Route className="h-4 w-4" />
              Titik Kumpul
            </p>
            <div className="space-y-2">
              {tracking.meetingPoints.map((mp, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-lg bg-amber-50 p-2 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-200 text-xs font-medium text-amber-700">
                      {idx + 1}
                    </span>
                    <span className="text-slate-700">{mp.name}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {mp.time}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Last Update */}
        {tracking.guideLocation && (
          <p className="text-center text-xs text-slate-400">
            Terakhir diperbarui:{' '}
            {format(new Date(tracking.guideLocation.lastUpdate), 'HH:mm:ss', {
              locale: localeId,
            })}
          </p>
        )}

        {/* No tracking available message */}
        {!tracking.isLiveTrackingAvailable && (
          <div className="rounded-lg bg-slate-50 p-4 text-center">
            <MapPin className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-2 text-sm text-slate-500">
              Guide belum memulai perjalanan
            </p>
            <p className="text-xs text-slate-400">
              Live tracking akan aktif saat guide mulai bergerak
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

