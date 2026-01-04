'use client';

/**
 * Offline Map Client Component
 * Enhanced with danger zones & signal hotspots
 */

import { AlertTriangle, Download, MapPin, Radio, Wifi } from 'lucide-react';
import { useEffect, useState } from 'react';

import { MapNavigationButtons } from '@/components/guide/map-navigation-buttons';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/utils/logger';
import type { LocationPoint } from '@/lib/utils/maps';
import { getCachedLocationPoints } from '@/lib/utils/maps';
import { MapDownloadClient } from './map-download-client';

type OfflineMapClientProps = {
  locale: string;
};

const LOCATION_TYPE_LABELS: Record<LocationPoint['type'], string> = {
  meeting_point: 'Meeting Point',
  snorkeling_spot: 'Spot Snorkeling',
  backup_dock: 'Dermaga Cadangan',
  landmark: 'Landmark',
  activity: 'Aktivitas',
  island: 'Pulau',
  restaurant: 'Restoran',
};

const LOCATION_TYPE_COLORS: Record<LocationPoint['type'], string> = {
  meeting_point: 'bg-emerald-500',
  snorkeling_spot: 'bg-blue-500',
  backup_dock: 'bg-amber-500',
  landmark: 'bg-purple-500',
  activity: 'bg-orange-500',
  island: 'bg-teal-500',
  restaurant: 'bg-rose-500',
};

type DangerZone = {
  id: string;
  name: string;
  zone_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  distance_meters?: number;
};

type SignalHotspot = {
  id: string;
  name: string;
  signal_strength: 'weak' | 'medium' | 'strong' | 'excellent';
  network_type?: string;
  distance_meters?: number;
};

export function OfflineMapClient({ locale: _locale }: OfflineMapClientProps) {
  const [points, setPoints] = useState<LocationPoint[]>([]);
  const [dangerZones, setDangerZones] = useState<DangerZone[]>([]);
  const [signalHotspots, setSignalHotspots] = useState<SignalHotspot[]>([]);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [showZones, setShowZones] = useState(true);
  const [showHotspots, setShowHotspots] = useState(true);
  const [showDownloadSection, setShowDownloadSection] = useState(false);

  useEffect(() => {
    const cached = getCachedLocationPoints();
    setPoints(cached);
  }, []);

  // Get user location
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          logger.warn('GPS capture failed', {
            code: error.code,
            message: error.message,
            error: String(error),
          });
        },
        { enableHighAccuracy: true, timeout: 5000 },
      );
    }
  }, []);

  // Fetch danger zones & hotspots when location available
  useEffect(() => {
    if (userLocation) {
      // Fetch danger zones
      fetch(`/api/guide/maps/danger-zones?lat=${userLocation.latitude}&lng=${userLocation.longitude}&radius=5000`)
        .then((res) => res.json())
        .then((data) => setDangerZones(data.zones || []))
        .catch((err) => {
          logger.error('Failed to fetch danger zones', err, { 
            latitude: userLocation.latitude, 
            longitude: userLocation.longitude 
          });
          setDangerZones([]);
        });

      // Fetch signal hotspots
      fetch(`/api/guide/maps/signal-hotspots?lat=${userLocation.latitude}&lng=${userLocation.longitude}&radius=10000`)
        .then((res) => res.json())
        .then((data) => setSignalHotspots(data.hotspots || []))
        .catch((err) => {
          logger.error('Failed to fetch hotspots', err, { 
            latitude: userLocation.latitude, 
            longitude: userLocation.longitude 
          });
          setSignalHotspots([]);
        });
    }
  }, [userLocation]);

  if (points.length === 0) {
    return (
      <EmptyState
        icon={MapPin}
        title="Belum ada lokasi tersimpan"
        description="Lokasi penting dari trip akan otomatis tersimpan di sini"
        variant="default"
      />
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

  const ZONE_TYPE_LABELS = {
    coral_reef: 'Karang',
    shallow_water: 'Perairan Dangkal',
    strong_current: 'Arus Kuat',
    restricted_area: 'Area Terbatas',
    other: 'Lainnya',
  };

  const SEVERITY_COLORS = {
    low: 'bg-blue-100 text-blue-800 border-blue-200',
    medium: 'bg-amber-100 text-amber-800 border-amber-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    critical: 'bg-red-100 text-red-800 border-red-200',
  };

  const SIGNAL_STRENGTH_COLORS = {
    weak: 'bg-red-100 text-red-800',
    medium: 'bg-amber-100 text-amber-800',
    strong: 'bg-emerald-100 text-emerald-800',
    excellent: 'bg-blue-100 text-blue-800',
  };

  return (
    <div className="space-y-4 pb-6">
      {/* View Toggle */}
      <div className="flex gap-2">
        <Button
          variant={!showDownloadSection ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowDownloadSection(false)}
          className="flex-1"
        >
          <MapPin className="mr-2 h-4 w-4" />
          View Map
        </Button>
        <Button
          variant={showDownloadSection ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowDownloadSection(true)}
          className="flex-1"
        >
          <Download className="mr-2 h-4 w-4" />
          Download Maps
        </Button>
      </div>

      {/* Download Section */}
      {showDownloadSection && <MapDownloadClient />}

      {/* Map View Section */}
      {!showDownloadSection && (
        <>
          {/* Toggle Buttons */}
          <div className="flex gap-2">
            <Button
              variant={showZones ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowZones(!showZones)}
            >
              <AlertTriangle className="mr-2 h-4 w-4" />
              Danger Zones ({dangerZones.length})
            </Button>
            <Button
              variant={showHotspots ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowHotspots(!showHotspots)}
            >
              <Radio className="mr-2 h-4 w-4" />
              Signal Hotspots ({signalHotspots.length})
            </Button>
          </div>

      {/* Danger Zones */}
      {showZones && dangerZones.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-2.5">
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                Danger Zones
              </h2>
            </div>
            <div className="divide-y divide-slate-100">
              {dangerZones.map((zone) => (
                <div key={zone.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">{zone.name}</h3>
                      <p className="mt-1 text-xs text-slate-600">
                        {ZONE_TYPE_LABELS[zone.zone_type as keyof typeof ZONE_TYPE_LABELS] || zone.zone_type}
                      </p>
                      {zone.distance_meters && (
                        <p className="mt-1 text-xs text-slate-500">
                          Jarak: {Math.round(zone.distance_meters)}m
                        </p>
                      )}
                    </div>
                    <span
                      className={cn(
                        'px-2 py-1 rounded-full text-xs font-medium border',
                        SEVERITY_COLORS[zone.severity],
                      )}
                    >
                      {zone.severity.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Signal Hotspots */}
      {showHotspots && signalHotspots.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-2.5">
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Radio className="h-4 w-4 text-blue-600" />
                Signal Hotspots
              </h2>
            </div>
            <div className="divide-y divide-slate-100">
              {signalHotspots.map((hotspot) => (
                <div key={hotspot.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">{hotspot.name}</h3>
                      <div className="mt-1 flex items-center gap-2 text-xs text-slate-600">
                        {hotspot.network_type && (
                          <span className="flex items-center gap-1">
                            <Wifi className="h-3 w-3" />
                            {hotspot.network_type.toUpperCase()}
                          </span>
                        )}
                        {hotspot.distance_meters && (
                          <span>• {Math.round(hotspot.distance_meters)}m</span>
                        )}
                      </div>
                    </div>
                    <span
                      className={cn(
                        'px-2 py-1 rounded-full text-xs font-medium',
                        SIGNAL_STRENGTH_COLORS[hotspot.signal_strength],
                      )}
                    >
                      {hotspot.signal_strength.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Location Points */}
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
        </>
      )}
    </div>
  );
}
