'use client';

/**
 * Sync Status Client Component
 * Menampilkan detail lengkap status sinkronisasi data offline
 */

import { useMutation, useQuery } from '@tanstack/react-query';
import {
    AlertCircle,
    CheckCircle2,
    Clock,
    RefreshCw,
    Wifi,
    WifiOff,
    XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    getSyncMode,
    getSyncStatus,
    setSyncMode,
    syncMutations,
    type SyncMode,
} from '@/lib/guide/offline-sync';
import { cn } from '@/lib/utils';

type SyncStatusClientProps = {
  locale: string;
};

type QueuedMutation = {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  timestamp: number;
  retryCount: number;
  status: 'pending' | 'syncing' | 'failed';
};

export function SyncStatusClient({ locale: _locale }: SyncStatusClientProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [syncMode, setSyncModeState] = useState<SyncMode>('normal');

  // Fetch sync status
  const { data: syncStatus, refetch: refetchSyncStatus } = useQuery({
    queryKey: ['sync-status'],
    queryFn: async () => {
      const status = await getSyncStatus();
      return status;
    },
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Force sync mutation
  const forceSyncMutation = useMutation({
    mutationFn: async () => {
      const result = await syncMutations();
      await refetchSyncStatus();
      return result;
    },
  });

  // Check online status
  useEffect(() => {
    const checkOnline = () => {
      setIsOnline(navigator.onLine);
    };

    checkOnline();
    window.addEventListener('online', checkOnline);
    window.addEventListener('offline', checkOnline);

    // Load sync mode
    const mode = getSyncMode();
    setSyncModeState(mode);

    return () => {
      window.removeEventListener('online', checkOnline);
      window.removeEventListener('offline', checkOnline);
    };
  }, []);

  const handleSyncModeChange = (mode: SyncMode) => {
    setSyncMode(mode);
    setSyncModeState(mode);
  };

  const handleForceSync = () => {
    void forceSyncMutation.mutate();
  };

  const pending = syncStatus?.pending ?? 0;
  const syncing = syncStatus?.syncing ?? 0;
  const failed = syncStatus?.failed ?? 0;
  const nextRetry = syncStatus?.nextRetry;

  // Get mutation type labels
  const getMutationTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      CHECK_IN: 'Check-In',
      CHECK_OUT: 'Check-Out',
      UPLOAD_EVIDENCE: 'Upload Bukti',
      ADD_EXPENSE: 'Tambah Pengeluaran',
      TRACK_POSITION: 'Update Lokasi',
      UPDATE_MANIFEST: 'Update Manifest',
      UPDATE_MANIFEST_DETAILS: 'Update Detail Manifest',
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-900">Status Koneksi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            {isOnline ? (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                <Wifi className="h-6 w-6 text-emerald-600" />
              </div>
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <WifiOff className="h-6 w-6 text-red-600" />
              </div>
            )}
            <div className="flex-1">
              <p className="font-semibold text-slate-900">
                {isOnline ? 'Terhubung ke Internet' : 'Mode Offline'}
              </p>
              <p className="text-sm text-slate-600">
                {isOnline
                  ? 'Data akan disinkronkan secara otomatis'
                  : 'Data akan tersinkron saat koneksi tersedia'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sync Statistics */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-900">Statistik Sinkronisasi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {/* Pending */}
            <div className="rounded-lg bg-amber-50 p-3 text-center">
              <div className="flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <p className="mt-1 text-2xl font-bold text-amber-700">{pending}</p>
              <p className="text-xs font-medium text-amber-600">Menunggu</p>
            </div>

            {/* Syncing */}
            <div className="rounded-lg bg-blue-50 p-3 text-center">
              <div className="flex items-center justify-center">
                <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
              </div>
              <p className="mt-1 text-2xl font-bold text-blue-700">{syncing}</p>
              <p className="text-xs font-medium text-blue-600">Menyinkronkan</p>
            </div>

            {/* Failed */}
            <div className="rounded-lg bg-red-50 p-3 text-center">
              <div className="flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <p className="mt-1 text-2xl font-bold text-red-700">{failed}</p>
              <p className="text-xs font-medium text-red-600">Gagal</p>
            </div>
          </div>

          {nextRetry && failed > 0 && (
            <div className="mt-4 rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-600">
                Retry berikutnya: <strong>{nextRetry.toLocaleString('id-ID')}</strong>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sync Mode */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-900">Mode Sinkronisasi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-900">Mode Sinkronisasi</p>
              <p className="mt-0.5 text-xs text-slate-600">
                {syncMode === 'data_saver'
                  ? 'Hemat data: foto & pengeluaran berat disinkronkan saat koneksi lebih stabil'
                  : 'Normal: semua data disinkronkan segera saat online'}
              </p>
            </div>
            <div className="flex items-center gap-1 rounded-full bg-white p-1 shadow-sm">
              <button
                type="button"
                onClick={() => handleSyncModeChange('normal')}
                className={cn(
                  'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                  syncMode === 'normal'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100',
                )}
              >
                Normal
              </button>
              <button
                type="button"
                onClick={() => handleSyncModeChange('data_saver')}
                className={cn(
                  'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                  syncMode === 'data_saver'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100',
                )}
              >
                Hemat Data
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      {isOnline && (pending > 0 || failed > 0) && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <Button
              onClick={handleForceSync}
              disabled={forceSyncMutation.isPending}
              className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {forceSyncMutation.isPending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Menyinkronkan...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Sinkronkan Sekarang
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Sync Details */}
      {(pending > 0 || syncing > 0 || failed > 0) && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-900">Detail Sinkronisasi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pending > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-600" />
                    <p className="text-sm font-semibold text-amber-900">
                      {pending} data menunggu sinkronisasi
                    </p>
                  </div>
                  <p className="mt-1 text-xs text-amber-700">
                    Data akan disinkronkan secara otomatis saat koneksi tersedia
                  </p>
                </div>
              )}

              {syncing > 0 && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                    <p className="text-sm font-semibold text-blue-900">
                      {syncing} data sedang disinkronkan
                    </p>
                  </div>
                  <p className="mt-1 text-xs text-blue-700">
                    Mohon tunggu hingga proses selesai
                  </p>
                </div>
              )}

              {failed > 0 && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <p className="text-sm font-semibold text-red-900">
                      {failed} data gagal disinkronkan
                    </p>
                  </div>
                  <p className="mt-1 text-xs text-red-700">
                    {nextRetry
                      ? `Akan dicoba lagi pada ${nextRetry.toLocaleString('id-ID')}`
                      : 'Akan dicoba lagi secara otomatis'}
                  </p>
                </div>
              )}

              {pending === 0 && syncing === 0 && failed === 0 && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <p className="text-sm font-semibold text-emerald-900">
                      Semua data sudah tersinkronkan
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info */}
      <Card className="border-0 bg-slate-50 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-slate-500" />
            <div className="flex-1 space-y-1">
              <p className="text-sm font-semibold text-slate-900">Informasi</p>
              <ul className="space-y-1 text-xs text-slate-600">
                <li>• Data yang perlu disinkronkan: Check-in/out, Bukti foto, Pengeluaran, Update manifest</li>
                <li>• Mode Normal: Semua data disinkronkan segera saat online</li>
                <li>• Mode Hemat Data: Foto dan pengeluaran berat ditunda saat koneksi seluler</li>
                <li>• Sinkronisasi otomatis berjalan setiap 5 menit saat online</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
