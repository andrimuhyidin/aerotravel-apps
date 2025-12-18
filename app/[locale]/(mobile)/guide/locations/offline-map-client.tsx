'use client';

/**
 * Offline Map Client Component
 * Simple offline map display for important locations
 */

import { MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';

import { MapNavigationButtons } from '@/components/guide/map-navigation-buttons';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { LocationPoint } from '@/lib/utils/maps';
import { getCachedLocationPoints } from '@/lib/utils/maps';

type OfflineMapClientProps = {
  locale: string;
};

const LOCATION_TYPE_LABELS: Record<LocationPoint['type'], string> = {
  meeting_point: 'Meeting Point',
  snorkeling_spot: 'Spot Snorkeling',
  backup_dock: 'Dermaga Cadangan',
  landmark: 'Landmark',
};

const LOCATION_TYPE_COLORS: Record<LocationPoint['type'], string> = {
  meeting_point: 'bg-emerald-500',
  snorkeling_spot: 'bg-blue-500',
  backup_dock: 'bg-amber-500',
  landmark: 'bg-purple-500',
};

export function OfflineMapClient({ locale: _locale }: OfflineMapClientProps) {
  const [points, setPoints] = useState<LocationPoint[]>([]);

  useEffect(() => {
    const cached = getCachedLocationPoints();
    setPoints(cached);
  }, []);

  if (points.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <MapPin className="mb-3 h-12 w-12 text-slate-300" />
          <p className="text-sm font-medium text-slate-600">Belum ada lokasi tersimpan</p>
          <p className="mt-1 text-xs text-slate-500">
            Lokasi penting dari trip akan otomatis tersimpan di sini
          </p>
        </CardContent>
      </Card>
    );
  }

  // Group by type
  const groupedPoints = points.reduce(
    (acc, point) => {
      if (!acc[point.type]) {
        acc[point.type] = [];
      }
      acc[point.type].push(point);
      return acc;
    },
    {} as Record<LocationPoint['type'], LocationPoint[]>,
  );

  return (
    <div className="space-y-4 pb-6">
      {Object.entries(groupedPoints).map(([type, typePoints]) => (
        <Card key={type} className="border-0 shadow-sm">
          <CardContent className="p-0">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-2.5">
              <h2 className="text-sm font-semibold text-slate-900">
                {LOCATION_TYPE_LABELS[type as LocationPoint['type']]}
              </h2>
            </div>
            <div className="divide-y divide-slate-100">
              {typePoints.map((point) => (
                <div key={point.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-white',
                        LOCATION_TYPE_COLORS[point.type],
                      )}
                    >
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-slate-900">{point.name}</h3>
                      {point.description && (
                        <p className="mt-1 text-sm text-slate-600">{point.description}</p>
                      )}
                      <p className="mt-2 text-xs text-slate-500">
                        {point.latitude.toFixed(6)}, {point.longitude.toFixed(6)}
                      </p>
                      <div className="mt-3">
                        <MapNavigationButtons
                          latitude={point.latitude}
                          longitude={point.longitude}
                          label={point.name}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
