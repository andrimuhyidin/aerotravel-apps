'use client';

/**
 * Tide Information Component
 * Menampilkan informasi pasang surut untuk trip laut
 * Fetches data from WorldTides API
 */

import { useQuery } from '@tanstack/react-query';
import { TrendingDown, TrendingUp, Waves } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

type TideInformationProps = {
  lat: number;
  lng: number;
  currentDate?: Date;
};

type TideData = {
  highTides: Array<{ time: number; height: number; date: string }>;
  lowTides: Array<{ time: number; height: number; date: string }>;
  heights: Array<{ dt: number; date?: string; height: number }>;
};

const fetchTideData = async (
  lat: number,
  lng: number
): Promise<TideData | null> => {
  const worldTidesApiKey = 'd784ee1e-eb1d-4e3a-bbdc-5c58e7adc717';
  const response = await fetch(
    `https://www.worldtides.info/api/v2?heights&lat=${lat}&lon=${lng}&key=${worldTidesApiKey}&days=3`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch tide data');
  }

  const data = (await response.json()) as {
    status?: number;
    heights?: Array<{
      dt: number;
      date?: string;
      height: number;
    }>;
  };

  if (
    !data.heights ||
    !Array.isArray(data.heights) ||
    data.heights.length === 0
  ) {
    return null;
  }

  // Process tide data: identify high/low tides
  const heights = data.heights;
  const highTides: Array<{ time: number; height: number; date: string }> = [];
  const lowTides: Array<{ time: number; height: number; date: string }> = [];

  // Simple algorithm: find local maxima (high) and minima (low)
  for (let i = 1; i < heights.length - 1; i++) {
    const prevItem = heights[i - 1];
    const currItem = heights[i];
    const nextItem = heights[i + 1];

    if (!prevItem || !currItem || !nextItem) continue;

    const prev = prevItem.height;
    const curr = currItem.height;
    const next = nextItem.height;

    if (prev === undefined || curr === undefined || next === undefined)
      continue;

    if (curr > prev && curr > next) {
      // Local maximum (high tide)
      highTides.push({
        time: currItem.dt,
        height: curr,
        date: currItem.date ?? new Date().toISOString(),
      });
    } else if (curr < prev && curr < next) {
      // Local minimum (low tide)
      lowTides.push({
        time: currItem.dt,
        height: curr,
        date: currItem.date ?? new Date().toISOString(),
      });
    }
  }

  return {
    highTides: highTides.slice(0, 6), // Next 3 days (approx 2 per day)
    lowTides: lowTides.slice(0, 6),
    heights: heights.slice(0, 24), // First 24 hours
  };
};

export function TideInformation({
  lat,
  lng,
  currentDate = new Date(),
}: TideInformationProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    data: tideData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['tide-data', lat, lng],
    queryFn: () => fetchTideData(lat, lng),
    enabled: mounted && !!lat && !!lng,
    staleTime: 1000 * 60 * 30, // 30 minutes
    retry: 1,
  });

  if (!mounted) {
    return (
      <Card className="rounded-xl bg-slate-50 p-4">
        <CardContent className="p-0">
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="rounded-xl bg-slate-50 p-4">
        <CardContent className="p-0">
          <div className="mb-2 flex items-center gap-2 text-slate-600">
            <Waves className="h-4 w-4" />
            <span className="text-xs font-medium">Informasi Pasang Surut</span>
          </div>
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !tideData) {
    return (
      <Card className="rounded-xl bg-slate-50 p-4">
        <CardContent className="p-0">
          <div className="mb-2 flex items-center gap-2 text-slate-600">
            <Waves className="h-4 w-4" />
            <span className="text-xs font-medium">Informasi Pasang Surut</span>
          </div>
          <div className="text-xl font-bold text-slate-900">Tidak Tersedia</div>
          <p className="mt-1 text-xs text-slate-500">
            Data pasang surut tidak dapat dimuat saat ini.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Get next high and low tide
  const now = currentDate.getTime() / 1000;
  const nextHighTide =
    Array.isArray(tideData.highTides) && tideData.highTides.length > 0
      ? tideData.highTides.find((ht) => ht && ht.time && ht.time > now)
      : null;
  const nextLowTide =
    Array.isArray(tideData.lowTides) && tideData.lowTides.length > 0
      ? tideData.lowTides.find((lt) => lt && lt.time && lt.time > now)
      : null;

  return (
    <Card className="rounded-xl bg-slate-50 p-4">
      <CardContent className="p-0">
        <div className="mb-3 flex items-center gap-2 text-slate-600">
          <Waves className="h-4 w-4" />
          <span className="text-xs font-medium">Informasi Pasang Surut</span>
        </div>

        <div className="space-y-3">
          {nextHighTide && nextHighTide.time && (
            <div className="flex items-center justify-between rounded-lg bg-blue-50 p-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <div>
                  <div className="text-xs font-medium text-blue-900">
                    Pasang Tinggi
                  </div>
                  <div className="text-xs text-blue-700">
                    {(() => {
                      try {
                        return new Date(
                          nextHighTide.time * 1000
                        ).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        });
                      } catch {
                        return 'N/A';
                      }
                    })()}
                  </div>
                </div>
              </div>
              <div className="text-sm font-bold text-blue-900">
                {(nextHighTide.height ?? 0).toFixed(2)}m
              </div>
            </div>
          )}

          {nextLowTide && nextLowTide.time && (
            <div className="flex items-center justify-between rounded-lg bg-cyan-50 p-2">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-cyan-600" />
                <div>
                  <div className="text-xs font-medium text-cyan-900">
                    Pasang Rendah
                  </div>
                  <div className="text-xs text-cyan-700">
                    {(() => {
                      try {
                        return new Date(
                          nextLowTide.time * 1000
                        ).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        });
                      } catch {
                        return 'N/A';
                      }
                    })()}
                  </div>
                </div>
              </div>
              <div className="text-sm font-bold text-cyan-900">
                {(nextLowTide.height ?? 0).toFixed(2)}m
              </div>
            </div>
          )}

          {!nextHighTide && !nextLowTide && (
            <div className="text-sm text-slate-600">
              Tidak ada data pasang surut untuk hari ini
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
