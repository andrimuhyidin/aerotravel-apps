'use client';

/**
 * Live GPS Tracker Component
 * Background GPS tracking during trip with breadcrumb trail
 */

import { Activity, MapPin, Navigation, Pause, Play } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getCurrentPosition, type Coordinates } from '@/lib/guide';
import { logger } from '@/lib/utils/logger';
import { cn } from '@/lib/utils';

type LiveGPSTrackerProps = {
  tripId: string;
  guideId: string;
  active: boolean; // True after check-in, false after check-out
  onTrackingUpdate?: (data: TrackingData) => void;
};

type TrackingData = {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
  speed?: number;
};

export function LiveGPSTracker({
  tripId,
  guideId,
  active,
  onTrackingUpdate,
}: LiveGPSTrackerProps) {
  const [tracking, setTracking] = useState(active);
  const [currentPosition, setCurrentPosition] = useState<Coordinates | null>(
    null
  );
  const [pingCount, setPingCount] = useState(0);
  const [lastPingTime, setLastPingTime] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const sendGPSPing = async (position: Coordinates) => {
    try {
      const response = await fetch('/api/guide/tracking/gps-ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId,
          guideId,
          latitude: position.latitude,
          longitude: position.longitude,
          accuracy: position.accuracy,
          speed: position.speed || null,
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        setPingCount((prev) => prev + 1);
        setLastPingTime(new Date());

        if (onTrackingUpdate) {
          onTrackingUpdate({
            latitude: position.latitude,
            longitude: position.longitude,
            accuracy: position.accuracy ?? 0,
            timestamp: new Date().toISOString(),
            speed: position.speed,
          });
        }
      }
    } catch (error) {
      logger.error('[GPS Tracker] Failed to send ping', error);
    }
  };

  const updatePosition = async () => {
    try {
      const position = await getCurrentPosition();
      setCurrentPosition(position);

      if (tracking) {
        await sendGPSPing(position);
      }
    } catch (error) {
      logger.error('[GPS Tracker] Failed to get position', error);
    }
  };

  useEffect(() => {
    if (tracking) {
      // Initial ping
      void updatePosition();

      // Set interval for regular pings (every 30 seconds)
      intervalRef.current = setInterval(() => {
        void updatePosition();
      }, 30000); // 30 seconds

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  }, [tracking]);

  // Auto-start/stop based on active prop
  useEffect(() => {
    setTracking(active);
  }, [active]);

  if (!active) return null;

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <Activity
              className={cn(
                'h-5 w-5',
                tracking ? 'animate-pulse text-emerald-600' : 'text-slate-400'
              )}
            />
            <span>Live GPS Tracking</span>
          </div>
          <Button
            size="sm"
            variant={tracking ? 'outline' : 'default'}
            onClick={() => setTracking(!tracking)}
            className={cn(
              tracking &&
                'border-emerald-600 text-emerald-600 hover:bg-emerald-50'
            )}
          >
            {tracking ? (
              <>
                <Pause className="mr-1 h-3 w-3" />
                Pause
              </>
            ) : (
              <>
                <Play className="mr-1 h-3 w-3" />
                Resume
              </>
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Status */}
        <div
          className={cn(
            'flex items-center gap-2 rounded-lg px-3 py-2',
            tracking ? 'bg-emerald-50' : 'bg-slate-50'
          )}
        >
          <div
            className={cn(
              'h-2 w-2 rounded-full',
              tracking ? 'animate-pulse bg-emerald-600' : 'bg-slate-400'
            )}
          />
          <span
            className={cn(
              'text-sm font-medium',
              tracking ? 'text-emerald-900' : 'text-slate-700'
            )}
          >
            {tracking ? 'Tracking Aktif' : 'Tracking Dihentikan'}
          </span>
        </div>

        {/* Current Position */}
        {currentPosition && (
          <div className="space-y-2 rounded-lg bg-slate-50 p-3">
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-600" />
              <div className="flex-1 text-xs">
                <p className="font-mono text-slate-700">
                  {currentPosition.latitude.toFixed(6)},{' '}
                  {currentPosition.longitude.toFixed(6)}
                </p>
                <p className="mt-1 text-slate-600">
                  Akurasi: ±{Math.round(currentPosition.accuracy ?? 0)}m
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-slate-50 px-3 py-2">
            <p className="text-xs text-slate-600">GPS Pings</p>
            <p className="text-lg font-bold text-slate-900">{pingCount}</p>
          </div>
          <div className="rounded-lg bg-slate-50 px-3 py-2">
            <p className="text-xs text-slate-600">Last Update</p>
            <p className="text-lg font-bold text-slate-900">
              {lastPingTime
                ? new Date(lastPingTime).toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '-'}
            </p>
          </div>
        </div>

        {/* Info */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-2">
          <p className="flex items-start gap-2 text-xs text-blue-700">
            <Navigation className="mt-0.5 h-3 w-3 flex-shrink-0" />
            <span>
              GPS tracking membantu monitoring real-time dan keamanan selama
              trip. Data disimpan untuk analisis rute.
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
