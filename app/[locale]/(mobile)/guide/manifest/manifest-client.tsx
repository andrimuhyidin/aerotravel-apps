'use client';

/**
 * Digital Manifest Client Component
 * Checklist boarding/return penumpang + link dokumentasi
 */

import {
    ArrowLeftRight,
    CheckCircle,
    Link as LinkIcon,
    Loader2,
    Search,
    Ship,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    getTripManifest,
    markPassengerBoarded,
    markPassengerReturned,
    Passenger,
    saveTripDocumentationUrl,
    TripManifest,
} from '@/lib/guide';
import { cn } from '@/lib/utils';

type ManifestClientProps = {
  tripId: string;
};

const passengerTypeLabels: Record<string, string> = {
  adult: 'Dewasa',
  child: 'Anak',
  infant: 'Bayi',
};

export function ManifestClient({ tripId }: ManifestClientProps) {
  const [manifest, setManifest] = useState<TripManifest | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [driveUrl, setDriveUrl] = useState('');
  const [savingDoc, setSavingDoc] = useState(false);
  const [docSaved, setDocSaved] = useState(false);

  const [filter, setFilter] = useState<'all' | 'pending' | 'boarded' | 'returned'>('all');

  useEffect(() => {
    loadManifest();
  }, [tripId]);

  const loadManifest = async () => {
    setLoading(true);
    const data = await getTripManifest(tripId);
    setManifest(data);
    setDriveUrl(data.documentationUrl ?? '');
    setLoading(false);
  };

  const handleBoard = async (passengerId: string) => {
    await markPassengerBoarded(tripId, passengerId);
    // Update local state
    setManifest((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        passengers: prev.passengers.map((p: Passenger) =>
          p.id === passengerId ? { ...p, status: 'boarded' as const } : p
        ),
        boardedCount: prev.boardedCount + 1,
      };
    });
  };

  const handleReturn = async (passengerId: string) => {
    await markPassengerReturned(tripId, passengerId);
    // Update local state
    setManifest((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        passengers: prev.passengers.map((p: Passenger) =>
          p.id === passengerId ? { ...p, status: 'returned' as const } : p
        ),
        returnedCount: prev.returnedCount + 1,
      };
    });
  };

  const handleSaveDriveUrl = async () => {
    if (!driveUrl.trim()) return;
    setSavingDoc(true);
    const result = await saveTripDocumentationUrl(tripId, driveUrl.trim());
    if (result.success) {
      setDocSaved(true);
    }
    setSavingDoc(false);
  };

  const filteredPassengers =
    manifest?.passengers.filter((p: Passenger) => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
      if (filter === 'pending') return p.status === 'pending';
      if (filter === 'boarded') return p.status === 'boarded';
      if (filter === 'returned') return p.status === 'returned';
      return true;
    }) ?? [];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!manifest) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Ship className="mb-3 h-12 w-12 text-slate-300" />
          <p className="text-sm font-medium text-slate-600">Manifest tidak tersedia</p>
          <p className="mt-1 text-xs text-slate-500">
            Data manifest untuk trip ini belum dapat dimuat
          </p>
        </CardContent>
      </Card>
    );
  }

  const hasDocs = Boolean(driveUrl.trim());

  return (
    <div className="space-y-4">
      {/* Trip Info */}
      <Card className="border-0 bg-gradient-to-br from-emerald-600 to-emerald-700 text-white shadow-sm">
        <CardContent className="p-4">
          <h2 className="text-lg font-bold leading-tight">{manifest.tripName}</h2>
          <p className="mt-1 text-sm opacity-90">{manifest.date}</p>
          <div className="mt-4 grid grid-cols-3 gap-3 rounded-lg bg-white/10 p-3 backdrop-blur-sm">
            <div className="text-center">
              <p className="text-lg font-bold">{manifest.totalPax}</p>
              <p className="text-xs opacity-80">Total</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold">{manifest.boardedCount}</p>
              <p className="text-xs opacity-80">Naik</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold">{manifest.returnedCount}</p>
              <p className="text-xs opacity-80">Kembali</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search & Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Cari nama penumpang..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            { key: 'all', label: 'Semua' },
            { key: 'pending', label: 'Belum Naik' },
            { key: 'boarded', label: 'Sudah Naik' },
            { key: 'returned', label: 'Sudah Kembali' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={cn(
                'whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-medium transition-all active:scale-95',
                filter === tab.key
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
              )}
              onClick={() => setFilter(tab.key as typeof filter)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Passenger List */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-slate-900">
              Daftar Penumpang
            </CardTitle>
            <span className="text-xs font-medium text-slate-500">
              {filteredPassengers.length} dari {manifest.passengers.length}
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredPassengers.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-sm text-slate-500">
                {searchQuery ? 'Tidak ada penumpang yang sesuai' : 'Tidak ada penumpang'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredPassengers.map((passenger: Passenger, index: number) => (
                <div
                  key={passenger.id}
                  className="flex min-h-[64px] items-center justify-between px-4 py-3 transition-colors hover:bg-slate-50"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div
                      className={cn(
                        'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold',
                        passenger.status === 'returned'
                          ? 'bg-emerald-100 text-emerald-700'
                          : passenger.status === 'boarded'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-slate-100 text-slate-600',
                      )}
                    >
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900">{passenger.name}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {passengerTypeLabels[passenger.type] ?? passenger.type}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-shrink-0 items-center gap-2">
                    {passenger.status === 'pending' && (
                      <Button
                        size="sm"
                        className="h-8 bg-blue-600 text-white hover:bg-blue-700 active:scale-95"
                        onClick={() => handleBoard(passenger.id)}
                      >
                        <Ship className="mr-1.5 h-3.5 w-3.5" />
                        Naik
                      </Button>
                    )}
                    {passenger.status === 'boarded' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 active:scale-95"
                        onClick={() => handleReturn(passenger.id)}
                      >
                        <ArrowLeftRight className="mr-1.5 h-3.5 w-3.5" />
                        Kembali
                      </Button>
                    )}
                    {passenger.status === 'returned' && (
                      <div className="flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                        <CheckCircle className="h-4 w-4" />
                        <span>Selesai</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dokumentasi: Link Drive */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <LinkIcon className="h-5 w-5 text-blue-600" />
            Link Dokumentasi Trip
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs leading-relaxed text-slate-600">
            Simpan 1 link folder Google Drive yang berisi semua foto & video dokumentasi trip.
          </p>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Input
                placeholder="https://drive.google.com/drive/folders/..."
                value={driveUrl}
                onChange={(e) => {
                  setDriveUrl(e.target.value);
                  setDocSaved(false);
                }}
                className="flex-1"
              />
              {hasDocs && (
                <a
                  href={driveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 active:scale-95"
                >
                  <LinkIcon className="mr-1.5 h-4 w-4" />
                  Buka
                </a>
              )}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'h-2 w-2 rounded-full',
                    hasDocs ? 'bg-emerald-500' : 'bg-amber-500',
                  )}
                />
                <span
                  className={cn(
                    'text-xs font-medium',
                    hasDocs ? 'text-emerald-700' : 'text-amber-700',
                  )}
                >
                  {hasDocs ? 'Link terisi' : 'Belum diisi'}
                </span>
              </div>
              <Button
                size="sm"
                disabled={!hasDocs || savingDoc}
                onClick={handleSaveDriveUrl}
                className="bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95"
              >
                {savingDoc ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  'Simpan Link'
                )}
              </Button>
            </div>
            {docSaved && (
              <div className="rounded-lg bg-emerald-50 p-3">
                <p className="text-xs font-medium text-emerald-700">
                  ✓ Link dokumentasi berhasil disimpan
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
