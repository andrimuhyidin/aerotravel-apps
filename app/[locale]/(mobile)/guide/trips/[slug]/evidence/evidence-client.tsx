'use client';

/**
 * Evidence Upload Client Component
 * Simpan link Google Drive dokumentasi trip (bukan upload file langsung)
 */

import { CheckCircle, Link as LinkIcon, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

import { saveTripDocumentationUrl, queueMutation } from '@/lib/guide';
import { logger } from '@/lib/utils/logger';

type EvidenceClientProps = {
  tripId: string;
  locale: string;
};

type EvidenceItem = {
  id: string;
  label: string;
  required: boolean;
  url: string;
};

type TripInfo = {
  trip_code: string | null;
  trip_date: string | null;
  total_pax: number | null;
  package?: {
    name: string | null;
  } | null;
};

export function EvidenceClient({ tripId }: EvidenceClientProps) {
  const [items, setItems] = useState<EvidenceItem[]>([
    { id: '1', label: 'Folder Utama Dokumentasi (Drive)', required: true, url: '' },
    { id: '2', label: 'Link Album Foto (opsional)', required: false, url: '' },
  ]);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tripInfo, setTripInfo] = useState<TripInfo | null>(null);
  const [loadingTrip, setLoadingTrip] = useState(true);

  // Fetch trip info on mount
  useEffect(() => {
    const fetchTripInfo = async () => {
      try {
        const res = await fetch(`/api/guide/trips/${tripId}`);
        if (res.ok) {
          const data = await res.json();
          setTripInfo(data.trip || null);
        }
      } catch (err) {
        logger.error('Failed to fetch trip info', err, { tripId });
      } finally {
        setLoadingTrip(false);
      }
    };
    fetchTripInfo();
  }, [tripId]);

  const requiredComplete = items
    .filter((i) => i.required)
    .every((i) => i.url.trim().length > 0);

  const handleChange = (id: string, value: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, url: value } : i)));
    setSaved(false);
    setError(null);
  };

  const handleSave = async () => {
    if (!requiredComplete) return;

    setSaving(true);
    setSaved(false);
    setError(null);

    const main = items[0];
    if (!main) {
      setSaving(false);
      return;
    }

    const url = main.url.trim();

    try {
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        const result = await saveTripDocumentationUrl(tripId, url);
        if (!result.success) {
          // Fallback ke offline queue jika API gagal
          await queueMutation('UPLOAD_EVIDENCE', { tripId, url });
          setSaved(true);
        } else {
          setSaved(true);
        }
      } else {
        // Offline: antre ke mutation queue
        await queueMutation('UPLOAD_EVIDENCE', { tripId, url });
        setSaved(true);
      }
    } catch {
      await queueMutation('UPLOAD_EVIDENCE', { tripId, url });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Status Card */}
      <Card className={`border-0 shadow-sm ${requiredComplete ? 'bg-emerald-50' : 'bg-amber-50'}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <CheckCircle
              className={`h-6 w-6 ${requiredComplete ? 'text-emerald-600' : 'text-amber-600'}`}
            />
            <div>
              <p className="font-medium">
                {requiredComplete
                  ? 'Link dokumentasi sudah terisi.'
                  : 'Isi minimal link folder dokumentasi utama.'}
              </p>
              <p className="text-sm text-slate-500">
                Rekomendasi: 1 folder Google Drive berisi semua foto & video trip.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trip Info */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            Trip #{tripInfo?.trip_code || tripId}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-500">
          {loadingTrip ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-40" />
            </div>
          ) : (
            <>
              <p>{tripInfo?.package?.name || 'Trip'}</p>
              <p>
                {tripInfo?.trip_date
                  ? format(new Date(tripInfo.trip_date), 'd MMMM yyyy', { locale: localeId })
                  : '-'}{' '}
                • {tripInfo?.total_pax || 0} tamu
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Link Inputs */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-500">LINK DOKUMENTASI</h2>

        {items.map((item) => (
          <Card key={item.id} className="border-0 shadow-sm">
            <CardContent className="space-y-2 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{item.label}</p>
                  <p className="text-xs text-slate-500">
                    {item.required ? 'Wajib' : 'Opsional'} • Contoh: https://drive.google.com/...
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Tempel link Google Drive di sini"
                  value={item.url}
                  onChange={(e) => handleChange(item.id, e.target.value)}
                />
                {item.url.trim() && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-10 items-center justify-center rounded-md border px-3 text-sm text-slate-600 hover:bg-slate-50"
                  >
                    <LinkIcon className="mr-1 h-4 w-4" />
                    Buka
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Error / Success */}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && !error && (
        <p className="text-sm text-emerald-600">Link dokumentasi tersimpan.</p>
      )}

      {/* Save Button */}
      <Button
        className="w-full bg-emerald-600 hover:bg-emerald-700"
        disabled={!requiredComplete || saving}
        onClick={handleSave}
      >
        {saving ? 'Menyimpan...' : 'Simpan Link Dokumentasi'}
      </Button>
    </div>
  );
}
