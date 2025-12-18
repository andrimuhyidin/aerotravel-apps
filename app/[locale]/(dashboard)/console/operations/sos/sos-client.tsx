'use client';

import { AlertTriangle, CheckCircle, MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type SOSAlert = {
  id: string;
  trip_id: string;
  guide_id: string;
  branch_id: string | null;
  alert_type: string;
  status: 'active' | 'acknowledged' | 'resolved';
  latitude: number | null;
  longitude: number | null;
  accuracy_meters: number | null;
  created_at: string;
  acknowledged_at: string | null;
  resolved_at: string | null;
  message: string | null;
  guide: { full_name: string | null; phone: string | null } | null;
  trip: { trip_code: string | null; trip_date: string | null } | null;
};

export function SOSClient() {
  const [alerts, setAlerts] = useState<SOSAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/sos');
      if (!res.ok) {
        throw new Error('Failed to load SOS alerts');
      }
      const data = (await res.json()) as { alerts: SOSAlert[] };
      setAlerts(data.alerts);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
    const interval = setInterval(loadAlerts, 15000);
    return () => clearInterval(interval);
  }, []);

  const updateAlert = async (id: string, action: 'acknowledge' | 'resolve') => {
    try {
      const res = await fetch('/api/admin/sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
      if (!res.ok) {
        throw new Error('Failed to update SOS alert');
      }
      await loadAlerts();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const activeAlerts = alerts.filter((a) => a.status !== 'resolved');

  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Ringkasan SOS</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span>{activeAlerts.length} SOS aktif / belum selesai</span>
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

      <div className="space-y-3">
        {alerts.map((a) => {
          const createdAt = new Date(a.created_at).toLocaleString('id-ID');
          const guideName = a.guide?.full_name ?? a.guide_id;
          const tripCode = a.trip?.trip_code ?? a.trip_id;

          const statusLabel =
            a.status === 'active'
              ? 'Aktif'
              : a.status === 'acknowledged'
                ? 'Diproses'
                : 'Selesai';

          const statusClass =
            a.status === 'active'
              ? 'bg-red-100 text-red-700'
              : a.status === 'acknowledged'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-emerald-100 text-emerald-700';

          return (
            <Card key={a.id} className="border-0 shadow-sm">
              <CardContent className="space-y-2 p-4 text-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <span className="font-medium">{a.alert_type.toUpperCase()}</span>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusClass}`}>
                    {statusLabel}
                  </span>
                </div>

                <div className="text-xs text-slate-500">
                  <p>
                    Trip: {tripCode} • Guide: {guideName}
                  </p>
                  <p>Dibuat: {createdAt}</p>
                </div>

                {a.message && <p className="text-xs text-slate-600">"{a.message}"</p>}

                {a.latitude !== null && a.longitude !== null && (
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <MapPin className="h-3 w-3" />
                    <span>
                      {a.latitude}, {a.longitude}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1 text-xs">
                  {a.status === 'active' && (
                    <button
                      type="button"
                      className="rounded-md bg-amber-100 px-2 py-1 font-medium text-amber-700 hover:bg-amber-200"
                      onClick={() => updateAlert(a.id, 'acknowledge')}
                    >
                      Tandai Diproses
                    </button>
                  )}
                  {a.status !== 'resolved' && (
                    <button
                      type="button"
                      className="rounded-md bg-emerald-100 px-2 py-1 font-medium text-emerald-700 hover:bg-emerald-200"
                      onClick={() => updateAlert(a.id, 'resolve')}
                    >
                      Tandai Selesai
                    </button>
                  )}
                  {a.status === 'resolved' && (
                    <div className="flex items-center gap-1 text-emerald-600">
                      <CheckCircle className="h-3 w-3" />
                      <span>Sudah diselesaikan</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
