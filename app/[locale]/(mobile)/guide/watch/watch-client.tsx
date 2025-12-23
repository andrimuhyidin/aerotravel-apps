/**
 * Smart Watch PWA Client Component
 * Optimized interface for smart watch companion app
 * Minimal UI, large touch targets, essential info only
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { Activity, Clock, MapPin, TrendingUp, Users } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';
import queryKeys from '@/lib/queries/query-keys';

type WatchClientProps = {
  locale: string;
};

export function WatchClient({ locale: _locale }: WatchClientProps) {
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds

  // Get current trip (if any)
  const {
    data: tripData,
    isLoading: tripLoading,
    error: tripError,
  } = useQuery({
    queryKey: ['guide', 'trips', 'current', 'watch'],
    queryFn: async () => {
      const res = await fetch('/api/guide/trips?status=ongoing&limit=1');
      if (!res.ok) throw new Error('Failed to fetch current trip');
      const data = await res.json();
      return data.trips?.[0] || null;
    },
    refetchInterval: refreshInterval,
  });

  // Get quick stats
  const { data: stats } = useQuery({
    queryKey: queryKeys.guide.stats(),
    queryFn: async () => {
      const res = await fetch('/api/guide/stats');
      if (!res.ok) throw new Error('Failed to fetch stats');
      return res.json();
    },
    refetchInterval: refreshInterval * 2, // Stats change less frequently
  });

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
            <p className="text-3xl font-bold">{tripData.guests || 0}</p>
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

        {stats && (
          <>
            <Card className="border-slate-800 bg-slate-900">
              <CardContent className="p-6 text-center">
                <TrendingUp className="mx-auto mb-2 h-8 w-8 text-amber-400" />
                <p className="text-3xl font-bold">{stats.totalTrips || 0}</p>
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

      {/* Essential Actions - Large buttons */}
      <div className="space-y-3">
        <Button
          size="lg"
          className="h-16 w-full bg-emerald-600 text-lg font-semibold hover:bg-emerald-700"
          onClick={() => {
            // Navigate to trip detail
            window.location.href = `/${_locale}/guide/trips/${tripData.code}`;
          }}
        >
          <MapPin className="mr-2 h-6 w-6" />
          View Trip Details
        </Button>

        <Button
          size="lg"
          variant="outline"
          className="h-16 w-full border-slate-700 text-lg font-semibold hover:bg-slate-800"
          onClick={() => {
            // Toggle refresh interval
            setRefreshInterval((prev) => (prev === 30000 ? 10000 : 30000));
          }}
        >
          <Activity className="mr-2 h-6 w-6" />
          {refreshInterval === 30000 ? 'Fast Refresh' : 'Normal Refresh'}
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
