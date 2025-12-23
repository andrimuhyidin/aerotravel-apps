'use client';

import 'leaflet/dist/leaflet.css';

import { AlertTriangle, CheckCircle, MapPin, Navigation } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Dynamic import untuk map component
const MapComponent = dynamic(
  () => import('@/app/[locale]/(mobile)/guide/tracking/map-component'),
  {
    ssr: false,
  }
);

type SOSAlert = {
  id: string;
  guide_id: string;
  guide_name: string;
  trip_id: string | null;
  trip_code: string | null;
  latitude: number | null;
  longitude: number | null;
  last_location_update: string | null;
  streaming_active: boolean;
  created_at: string;
  location_history_count: number;
  locationHistory?: Array<{
    latitude: number;
    longitude: number;
    recorded_at: string;
  }>;
};

export function SOSClient() {
  const [alerts, setAlerts] = useState<SOSAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<SOSAlert | null>(null);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/sos/live-map');
      if (!res.ok) {
        throw new Error('Failed to load SOS alerts');
      }
      const data = (await res.json()) as { alerts: SOSAlert[]; count: number };
      setAlerts(data.alerts);

      // Auto-select first active alert if none selected
      if (!selectedAlert && data.alerts.length > 0) {
        setSelectedAlert(data.alerts[0] || null);
      } else if (selectedAlert) {
        // Update selected alert with latest data
        const updated = data.alerts.find((a) => a.id === selectedAlert.id);
        if (updated) {
          setSelectedAlert(updated);
        }
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
    // Update every 10 seconds untuk real-time GPS streaming
    const interval = setInterval(loadAlerts, 10000);
    return () => clearInterval(interval);
  }, []);

  const resolveAlert = async (sosAlertId: string) => {
    try {
      const res = await fetch('/api/admin/sos/live-map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sos_alert_id: sosAlertId,
          resolution_notes: 'Resolved by admin',
        }),
      });
      if (!res.ok) {
        throw new Error('Failed to resolve SOS alert');
      }
      await loadAlerts();
      if (selectedAlert?.id === sosAlertId) {
        setSelectedAlert(null);
      }
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const activeAlerts = alerts.filter(
    (a) => a.streaming_active || a.latitude !== null
  );

  const selectedAlertWithLocation =
    selectedAlert && selectedAlert.latitude && selectedAlert.longitude
      ? selectedAlert
      : null;

  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Ringkasan SOS</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span>{activeAlerts.length} SOS aktif dengan GPS streaming</span>
          </div>
          {activeAlerts.length > 0 && (
            <div className="ml-auto flex items-center gap-2 text-xs text-slate-500">
              <Navigation className="h-4 w-4 animate-pulse text-red-600" />
              <span>Real-time tracking aktif</span>
            </div>
          )}
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

      {/* Live Map */}
      {selectedAlertWithLocation && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Live Map - {selectedAlertWithLocation.guide_name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96 overflow-hidden rounded-lg bg-slate-100">
              <MapComponent
                center={{
                  latitude: selectedAlertWithLocation.latitude!,
                  longitude: selectedAlertWithLocation.longitude!,
                }}
                guideLocation={{
                  latitude: selectedAlertWithLocation.latitude!,
                  longitude: selectedAlertWithLocation.longitude!,
                }}
                meetingPoints={[]}
              />
            </div>
            {selectedAlertWithLocation.locationHistory &&
              selectedAlertWithLocation.locationHistory.length > 1 && (
                <div className="mt-2 text-xs text-slate-500">
                  <MapPin className="mr-1 inline h-3 w-3" />
                  Trajectory: {
                    selectedAlertWithLocation.locationHistory.length
                  }{' '}
                  location points recorded
                </div>
              )}
            {selectedAlertWithLocation.last_location_update && (
              <div className="mt-1 text-xs text-slate-500">
                Last update:{' '}
                {new Date(
                  selectedAlertWithLocation.last_location_update
                ).toLocaleString('id-ID')}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Alert List */}
      <div className="space-y-3">
        {alerts.map((a) => {
          const createdAt = new Date(a.created_at).toLocaleString('id-ID');
          const guideName = a.guide_name || a.guide_id;
          const tripCode = a.trip_code || a.trip_id || 'No Trip';

          return (
            <Card
              key={a.id}
              className={`border-0 shadow-sm transition-colors ${
                selectedAlert?.id === a.id ? 'border-2 border-blue-500' : ''
              }`}
            >
              <CardContent className="space-y-2 p-4 text-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <span className="font-medium">SOS Alert</span>
                    {a.streaming_active && (
                      <span className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                        <Navigation className="h-3 w-3 animate-pulse" />
                        Streaming
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-xs text-slate-500">
                  <p>
                    Trip: {tripCode} • Guide: {guideName}
                  </p>
                  <p>Dibuat: {createdAt}</p>
                  {a.location_history_count > 0 && (
                    <p>Location history: {a.location_history_count} points</p>
                  )}
                </div>

                {a.latitude !== null && a.longitude !== null && (
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <MapPin className="h-3 w-3" />
                    <span>
                      {a.latitude.toFixed(6)}, {a.longitude.toFixed(6)}
                    </span>
                    <a
                      href={`https://www.google.com/maps?q=${a.latitude},${a.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-blue-600 hover:underline"
                    >
                      Buka di Maps
                    </a>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1 text-xs">
                  {a.latitude && a.longitude && (
                    <button
                      type="button"
                      className={`rounded-md px-2 py-1 font-medium ${
                        selectedAlert?.id === a.id
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                      onClick={() => setSelectedAlert(a)}
                    >
                      Tampilkan di Peta
                    </button>
                  )}
                  {a.streaming_active && (
                    <button
                      type="button"
                      className="rounded-md bg-emerald-100 px-2 py-1 font-medium text-emerald-700 hover:bg-emerald-200"
                      onClick={() => resolveAlert(a.id)}
                    >
                      Resolve SOS
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {alerts.length === 0 && !loading && (
        <Card className="border-0 shadow-sm">
          <CardContent className="flex items-center justify-center p-8 text-slate-500">
            <div className="text-center">
              <CheckCircle className="mx-auto h-8 w-8 text-emerald-500" />
              <p className="mt-2 text-sm">Tidak ada SOS alert aktif</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
