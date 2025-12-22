'use client';

/**
 * Live Tracking Client Component
 * Real-time GPS tracking with map visualization
 */

import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, MapPin, Navigation, Route } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
    Coordinates,
    DEFAULT_MEETING_POINTS,
    validateCheckIn,
    watchPosition,
} from '@/lib/guide/geofencing';

// Dynamically import map component (no SSR)
const MapComponent = dynamic(() => import('./map-component'), { ssr: false });

type TrackingClientProps = {
  locale: string;
  tripId: string;
  tripCode: string;
};

import { queueMutation } from '@/lib/guide';

export function TrackingClient({ locale, tripId, tripCode }: TrackingClientProps) {
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [validation, setValidation] = useState<ReturnType<typeof validateCheckIn> | null>(null);
  const [showBreadcrumb, setShowBreadcrumb] = useState(true);
  const [breadcrumbHours, setBreadcrumbHours] = useState(24);

  useEffect(() => {
    // Check online status
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!isTracking) return;

    const stopWatch = watchPosition(
      (coords) => {
        setLocation(coords);
        setError(null);
        // Validate against meeting points
        const result = validateCheckIn(coords, undefined, DEFAULT_MEETING_POINTS);
        setValidation(result);

        // Kirim ping ke server / antre ke offline queue
        const payload = {
          tripId,
          latitude: coords.latitude,
          longitude: coords.longitude,
        };

        (async () => {
          try {
            if (navigator.onLine) {
              const response = await fetch('/api/guide/tracking', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
              });

              if (!response.ok) {
                await queueMutation('TRACK_POSITION', payload);
              }
            } else {
              await queueMutation('TRACK_POSITION', payload);
            }
          } catch {
            await queueMutation('TRACK_POSITION', payload);
          }
        })();
      },
      (err) => {
        setError(err.message);
      }
    );

    return () => stopWatch();
  }, [isTracking]);

  // Fetch position history for breadcrumb trail
  const { data: positionHistory } = useQuery<{
    positions: Array<{
      latitude: number;
      longitude: number;
      timestamp: string;
      accuracy?: number;
      speed?: number;
      heading?: number;
    }>;
    count: number;
  }>({
    queryKey: ['tracking-history', tripId, breadcrumbHours],
    queryFn: async () => {
      const res = await fetch(`/api/guide/tracking/history?tripId=${tripId}&hours=${breadcrumbHours}`);
      if (!res.ok) return { positions: [], count: 0 };
      return res.json();
    },
    enabled: showBreadcrumb && !!tripId,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const toggleTracking = () => {
    if (!isTracking) {
      setIsTracking(true);
    } else {
      setIsTracking(false);
      setLocation(null);
      setValidation(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold">Live Tracking</h1>
      </div>

      {/* Status Card */}
      {validation && (
        <Card className={`border-0 shadow-sm ${validation.allowed ? 'bg-emerald-50' : 'bg-amber-50'}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              {validation.allowed ? (
                <MapPin className="h-6 w-6 text-emerald-600" />
              ) : (
                <AlertTriangle className="h-6 w-6 text-amber-600" />
              )}
              <div>
                <p className="font-medium">{validation.message}</p>
                <p className="text-sm text-slate-500">
                  Jarak: {validation.distanceMeters}m dari titik kumpul
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {error && (
        <Card className="border-0 bg-red-50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <p className="text-red-700">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Map */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Posisi Anda (Trip {tripCode})</CardTitle>
            <div className="flex items-center gap-2">
              <Label htmlFor="breadcrumb-toggle" className="text-xs text-slate-600 flex items-center gap-1">
                <Route className="h-3 w-3" />
                Breadcrumb
              </Label>
              <Switch
                id="breadcrumb-toggle"
                checked={showBreadcrumb}
                onCheckedChange={setShowBreadcrumb}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64 overflow-hidden rounded-lg bg-slate-100">
            {location ? (
              <MapComponent
                center={location}
                guideLocation={location}
                meetingPoints={DEFAULT_MEETING_POINTS}
                breadcrumbTrail={positionHistory?.positions || []}
                showBreadcrumb={showBreadcrumb}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-slate-400">
                <div className="text-center">
                  <Navigation className="mx-auto h-8 w-8" />
                  <p className="mt-2 text-sm">
                    {isTracking ? 'Mendapatkan lokasi...' : 'Aktifkan tracking untuk melihat peta'}
                  </p>
                </div>
              </div>
            )}
          </div>
          {showBreadcrumb && positionHistory && positionHistory.count > 0 && (
            <div className="mt-2 text-xs text-slate-500">
              Breadcrumb trail: {positionHistory.count} titik (last {breadcrumbHours}h)
            </div>
          )}
        </CardContent>
      </Card>

      {/* Coordinates */}
      {location && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500">Latitude</p>
                <p className="font-mono font-medium">{location.latitude.toFixed(6)}</p>
              </div>
              <div>
                <p className="text-slate-500">Longitude</p>
                <p className="font-mono font-medium">{location.longitude.toFixed(6)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Meeting Points */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Titik Kumpul Terdaftar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {DEFAULT_MEETING_POINTS.map((point) => (
            <div key={point.id} className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-medium">{point.name}</span>
              </div>
              <span className="text-xs text-slate-500">Radius {point.radiusMeters}m</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Toggle Button */}
      <Button
        className={`w-full ${isTracking ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-600 hover:bg-emerald-700'}`}
        onClick={toggleTracking}
      >
        <Navigation className="mr-2 h-4 w-4" />
        {isTracking ? 'Stop Tracking' : 'Mulai Tracking'}
      </Button>
    </div>
  );
}
