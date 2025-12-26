/**
 * Smart Watch PWA Client Component
 * Optimized interface for smart watch companion app
 * Minimal UI, large touch targets, essential info only
 */

'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Activity, AlertTriangle, CheckCircle2, Clock, Heart, MapPin, Phone, TrendingUp, Users } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';
import { Progress } from '@/components/ui/progress';
import { getCurrentPosition } from '@/lib/guide/geofencing';
import { triggerSOSAlert, startSOSStreaming } from '@/lib/guide';
import queryKeys from '@/lib/queries/query-keys';
import { logger } from '@/lib/utils/logger';

type WatchClientProps = {
  locale: string;
};

export function WatchClient({ locale: _locale }: WatchClientProps) {
  const queryClient = useQueryClient();
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds
  const [sosHoldProgress, setSosHoldProgress] = useState(0);
  const [sosActive, setSosActive] = useState(false);
  const [sosSending, setSosSending] = useState(false);
  const [checkInStatus, setCheckInStatus] = useState<'idle' | 'checking' | 'checked' | 'error'>('idle');
  const [heartRate, setHeartRate] = useState<number | null>(null);
  const [heartRateAvailable, setHeartRateAvailable] = useState(false);
  
  const sosHoldTimeoutRef = useRef<number | null>(null);
  const sosHoldProgressRef = useRef<number | null>(null);

  // Get watch status (lightweight endpoint optimized for watch)
  const {
    data: watchStatus,
    isLoading: tripLoading,
    error: tripError,
  } = useQuery({
    queryKey: ['guide', 'watch', 'status'],
    queryFn: async () => {
      const res = await fetch('/api/guide/watch/status');
      if (!res.ok) throw new Error('Failed to fetch watch status');
      return (await res.json()) as {
        status: 'on_trip' | 'standby';
        trip: {
          id: string;
          code: string;
          name: string;
          status: string;
          passengerCount: number;
          date: string;
          checkInStatus: string;
        } | null;
        sosActive: boolean;
        sosId: string | null;
        stats: {
          totalTrips: number;
        };
        timestamp: string;
      };
    },
    refetchInterval: refreshInterval,
  });

  const tripData = watchStatus?.trip || null;

  // Stats sudah termasuk dalam watchStatus, tapi tetap fetch full stats untuk detail lebih lengkap
  const { data: stats } = useQuery({
    queryKey: queryKeys.guide.stats(),
    queryFn: async () => {
      const res = await fetch('/api/guide/stats');
      if (!res.ok) throw new Error('Failed to fetch stats');
      return res.json();
    },
    refetchInterval: refreshInterval * 2, // Stats change less frequently
    enabled: !!watchStatus, // Only fetch if watch status loaded
  });

  // Check heart rate availability (experimental Web API)
  useEffect(() => {
    // Check if browser supports heart rate sensor
    // Note: This is experimental and may not be widely supported
    if ('sensors' in navigator && 'HeartRateSensor' in window) {
      setHeartRateAvailable(true);
      // TODO: Implement heart rate sensor reading if available
    }
  }, []);

  // Send periodic heartbeat to server (every 30 seconds when trip active)
  useEffect(() => {
    if (!tripData || !watchStatus) return;

    const heartbeatInterval = setInterval(async () => {
      try {
        await fetch('/api/guide/watch/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            batteryLevel: undefined, // Can be obtained from Battery API if available
            heartRate: heartRate || undefined,
            watchType: 'web', // 'apple' | 'wearos' | 'web'
            location: undefined, // Can include location if needed for tracking
          }),
        });
      } catch (error) {
        logger.error('Failed to send watch heartbeat', error);
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(heartbeatInterval);
  }, [tripData, watchStatus, heartRate]);

  // SOS button handlers
  const startSOSHold = () => {
    if (sosSending || sosActive) return;
    
    setSosHoldProgress(0);
    const startTime = Date.now();
    
    if (sosHoldProgressRef.current !== null) {
      window.clearInterval(sosHoldProgressRef.current);
    }
    if (sosHoldTimeoutRef.current !== null) {
      window.clearTimeout(sosHoldTimeoutRef.current);
    }

    // Animate progress
    sosHoldProgressRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / 3000) * 100, 100);
      setSosHoldProgress(progress);
    }, 50);

    sosHoldTimeoutRef.current = window.setTimeout(async () => {
      await handleSOS();
      if (sosHoldProgressRef.current !== null) {
        window.clearInterval(sosHoldProgressRef.current);
        sosHoldProgressRef.current = null;
      }
      setSosHoldProgress(100);
    }, 3000);
  };

  const cancelSOSHold = () => {
    if (sosHoldTimeoutRef.current !== null) {
      window.clearTimeout(sosHoldTimeoutRef.current);
      sosHoldTimeoutRef.current = null;
    }
    if (sosHoldProgressRef.current !== null) {
      window.clearInterval(sosHoldProgressRef.current);
      sosHoldProgressRef.current = null;
    }
    setSosHoldProgress(0);
  };

  const handleSOS = async () => {
    setSosSending(true);
    try {
      const location = await getCurrentPosition();
      const guideId = tripData?.id || '';
      const result = await triggerSOSAlert('other', guideId, location, tripData?.id);

      if (result.success && result.alertId) {
        setSosActive(true);
        startSOSStreaming(result.alertId);
        toast.success('SOS terkirim! Tim operasional akan segera menghubungi Anda.');
        
        // Invalidate watch status to update SOS state
        void queryClient.invalidateQueries({
          queryKey: ['guide', 'watch', 'status'],
        });
      } else {
        toast.error(result.message || 'Gagal mengirim SOS');
      }
    } catch (error) {
      logger.error('Failed to trigger SOS', error);
      toast.error('Gagal mengirim SOS. Periksa koneksi internet.');
    } finally {
      setSosSending(false);
    }
  };

  // Quick check-in handler - simplified for watch (navigate to full check-in page)
  const handleCheckIn = async () => {
    if (!tripData?.id) {
      toast.error('No active trip');
      return;
    }

    // Navigate to full check-in page for complete check-in flow
    window.location.href = `/${_locale}/guide/attendance?tripId=${tripData.id}`;
  };

  // Check if already checked in (from watchStatus or tripData)
  const isCheckedIn = watchStatus?.trip?.checkInStatus === 'checked_in';
  
  // Sync SOS active state with watchStatus
  useEffect(() => {
    if (watchStatus) {
      setSosActive(watchStatus.sosActive);
    }
  }, [watchStatus]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (sosHoldTimeoutRef.current !== null) {
        window.clearTimeout(sosHoldTimeoutRef.current);
      }
      if (sosHoldProgressRef.current !== null) {
        window.clearInterval(sosHoldProgressRef.current);
      }
    };
  }, []);

  if (tripLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-4">
        <LoadingState variant="spinner" message="Loading..." />
      </div>
    );
  }

  if (tripError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-4">
        <ErrorState
          message="Failed to load trip data"
          onRetry={() => window.location.reload()}
          variant="card"
        />
      </div>
    );
  }

  if (!tripData) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-4">
        <EmptyState
          icon={Activity}
          title="No Active Trip"
          description="No ongoing trip at the moment"
          variant="subtle"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-4 text-white">
      {/* Header - Large, minimal */}
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold">{tripData.code || 'Trip'}</h1>
        <p className="text-slate-400">
          {tripData.name || tripData.destination || 'Active Trip'}
        </p>
      </div>

      {/* Quick Stats Grid - Large touch targets */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        <Card className="border-slate-800 bg-slate-900">
          <CardContent className="p-6 text-center">
            <Users className="mx-auto mb-2 h-8 w-8 text-emerald-400" />
            <p className="text-3xl font-bold">{tripData.passengerCount || 0}</p>
            <p className="text-xs text-slate-400">Guests</p>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900">
          <CardContent className="p-6 text-center">
            <Clock className="mx-auto mb-2 h-8 w-8 text-blue-400" />
            <p className="text-xl font-bold">
              {new Date().toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
            <p className="text-xs text-slate-400">Time</p>
          </CardContent>
        </Card>

        {(stats || watchStatus?.stats) && (
          <>
            <Card className="border-slate-800 bg-slate-900">
              <CardContent className="p-6 text-center">
                <TrendingUp className="mx-auto mb-2 h-8 w-8 text-amber-400" />
                <p className="text-3xl font-bold">{stats?.totalTrips || watchStatus?.stats.totalTrips || 0}</p>
                <p className="text-xs text-slate-400">Total Trips</p>
              </CardContent>
            </Card>

            <Card className="border-slate-800 bg-slate-900">
              <CardContent className="p-6 text-center">
                <Activity className="mx-auto mb-2 h-8 w-8 text-purple-400" />
                <p className="text-3xl font-bold">
                  {stats.averageRating ? stats.averageRating.toFixed(1) : '0.0'}
                </p>
                <p className="text-xs text-slate-400">Rating</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Heart Rate Display (if available) */}
      {heartRateAvailable && (
        <Card className="border-slate-800 bg-slate-900">
          <CardContent className="p-4 text-center">
            <Heart className="mx-auto mb-2 h-6 w-6 text-red-400" />
            <p className="text-2xl font-bold">
              {heartRate ? `${heartRate} bpm` : 'Not available'}
            </p>
            <p className="text-xs text-slate-400">Heart Rate</p>
          </CardContent>
        </Card>
      )}

      {/* SOS Button - Large, prominent, red */}
      <Card className="border-0 bg-red-600">
        <CardContent className="p-0">
          <Button
            size="lg"
            className="h-20 w-full bg-red-600 text-xl font-bold hover:bg-red-700 active:bg-red-800"
            onTouchStart={startSOSHold}
            onTouchEnd={cancelSOSHold}
            onMouseDown={startSOSHold}
            onMouseUp={cancelSOSHold}
            onMouseLeave={cancelSOSHold}
            disabled={sosSending || sosActive}
          >
            <AlertTriangle className="mr-3 h-8 w-8" />
            {sosActive ? 'SOS ACTIVE' : sosSending ? 'SENDING...' : 'HOLD FOR SOS'}
          </Button>
          {sosHoldProgress > 0 && sosHoldProgress < 100 && (
            <div className="px-4 pb-4">
              <Progress value={sosHoldProgress} className="mt-2" />
              <p className="mt-1 text-center text-xs text-white/80">
                Hold for {Math.round((3000 - sosHoldProgress * 30) / 1000)}s
              </p>
            </div>
          )}
          {sosActive && (
            <div className="bg-red-700 px-4 py-2 text-center text-sm text-white">
              🔴 SOS Active - Location being tracked
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions - Grid 2x2 */}
      <div className="grid grid-cols-2 gap-3">
        {/* Check-in Button */}
        <Button
          size="lg"
          variant="outline"
          className="h-20 border-slate-700 text-base font-semibold hover:bg-slate-800"
          onClick={handleCheckIn}
          disabled={isCheckedIn || !tripData}
        >
          {isCheckedIn ? (
            <>
              <CheckCircle2 className="mr-2 h-6 w-6 text-emerald-400" />
              Checked In
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-6 w-6" />
              Check-in
            </>
          )}
        </Button>

        {/* View Trip Details */}
        <Button
          size="lg"
          variant="outline"
          className="h-20 border-slate-700 text-base font-semibold hover:bg-slate-800"
          onClick={() => {
            window.location.href = `/${_locale}/guide/trips/${tripData.code}`;
          }}
        >
          <MapPin className="mr-2 h-6 w-6" />
          Details
        </Button>

        {/* Emergency Contact */}
        <Button
          size="lg"
          variant="outline"
          className="h-20 border-slate-700 text-base font-semibold hover:bg-slate-800"
          onClick={() => {
            window.open(`tel:+6281234567890`, '_self'); // Replace with actual emergency number
          }}
        >
          <Phone className="mr-2 h-6 w-6" />
          Call Ops
        </Button>

        {/* Refresh Toggle */}
        <Button
          size="lg"
          variant="outline"
          className="h-20 border-slate-700 text-base font-semibold hover:bg-slate-800"
          onClick={() => {
            setRefreshInterval((prev) => (prev === 30000 ? 10000 : 30000));
            toast.info(refreshInterval === 30000 ? 'Fast refresh enabled' : 'Normal refresh');
          }}
        >
          <Activity className="mr-2 h-6 w-6" />
          Refresh
        </Button>
      </div>

      {/* Footer - Minimal info */}
      <div className="mt-8 text-center text-xs text-slate-500">
        <p>Watch Companion App</p>
        <p>Tap to refresh: {new Date().toLocaleTimeString('id-ID')}</p>
      </div>
    </div>
  );
}
