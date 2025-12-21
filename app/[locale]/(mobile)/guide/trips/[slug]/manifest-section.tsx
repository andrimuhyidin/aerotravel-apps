'use client';

/**
 * Manifest Section Component
 * Full manifest functionality integrated in trip detail:
 * - Update boarding/return status
 * - AI suggestions
 * - Edit passenger details
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    ArrowLeftRight,
    CheckCircle,
    Download,
    Info,
    Lightbulb,
    Loader2,
    Search,
    Shield,
    Ship
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { canViewManifest, type CrewRole } from '@/lib/guide/crew-permissions';
import { getTripManifest, type Passenger, type TripManifest } from '@/lib/guide/manifest';
import queryKeys from '@/lib/queries/query-keys';
import { cn } from '@/lib/utils';

import { ManifestAiSuggestions } from '@/app/[locale]/(mobile)/guide/manifest/manifest-ai-suggestions';

type ManifestSectionProps = {
  tripId: string;
  locale: string;
  crewRole?: string | null;
  isLeadGuide: boolean;
};

const passengerTypeLabels: Record<string, string> = {
  adult: 'Dewasa',
  child: 'Anak',
  infant: 'Bayi',
};

function maskPassengerName(name: string): string {
  if (name.length <= 2) return name;
  const first = name[0];
  const last = name[name.length - 1];
  const masked = '*'.repeat(Math.max(2, name.length - 2));
  return `${first}${masked}${last}`;
}

function maskPhone(phone: string): string {
  if (phone.length <= 4) return phone;
  const last4 = phone.slice(-4);
  return `****${last4}`;
}

export function ManifestSection({ tripId, locale, crewRole, isLeadGuide }: ManifestSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'boarded' | 'returned'>('all');
  const [editingPassenger, setEditingPassenger] = useState<Passenger | null>(null);
  const queryClient = useQueryClient();

  const manifestPermission = canViewManifest((crewRole as CrewRole) ?? null);
  const isMasked = manifestPermission.isMasked;

  // Fetch manifest
  const { data: manifest, isLoading } = useQuery<TripManifest>({
    queryKey: ['guide', 'manifest', tripId],
    queryFn: () => getTripManifest(tripId),
  });


  // Update boarding status
  const boardMutation = useMutation({
    mutationFn: async (passengerId: string) => {
      const { markPassengerBoarded } = await import('@/lib/guide/manifest');
      return await markPassengerBoarded(tripId, passengerId);
    },
    onSuccess: (result) => {
      toast.success(result.message || 'Penumpang berhasil ditandai naik');
      void queryClient.invalidateQueries({ queryKey: ['guide', 'manifest', tripId] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.guide.tripsDetail(tripId) });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal menandai penumpang');
    },
  });

  // Update return status
  const returnMutation = useMutation({
    mutationFn: async (passengerId: string) => {
      const { markPassengerReturned } = await import('@/lib/guide/manifest');
      return await markPassengerReturned(tripId, passengerId);
    },
    onSuccess: (result) => {
      toast.success(result.message || 'Penumpang berhasil ditandai kembali');
      void queryClient.invalidateQueries({ queryKey: ['guide', 'manifest', tripId] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.guide.tripsDetail(tripId) });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal menandai penumpang');
    },
  });


  // Update passenger details
  const updatePassengerMutation = useMutation({
    mutationFn: async ({ passengerId, details }: { passengerId: string; details: Partial<Passenger> }) => {
      const { updatePassengerDetails } = await import('@/lib/guide/manifest');
      return await updatePassengerDetails(tripId, passengerId, {
        notes: details.notes,
        allergy: details.allergy,
        specialRequest: details.specialRequest,
      });
    },
    onSuccess: (result) => {
      toast.success(result.message || 'Detail penumpang berhasil diperbarui');
      setEditingPassenger(null);
      void queryClient.invalidateQueries({ queryKey: ['guide', 'manifest', tripId] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal memperbarui detail penumpang');
    },
  });

  const filteredPassengers = manifest?.passengers.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (filter === 'pending') return p.status === 'pending';
    if (filter === 'boarded') return p.status === 'boarded';
    if (filter === 'returned') return p.status === 'returned';
    return true;
  }) ?? [];

  if (isLoading || !manifest) {
    return null; // Will be handled by parent
  }

  const canEdit = isLeadGuide || crewRole === 'support';

  return (
    <div className="space-y-4">
      {/* AI Suggestions */}
      <ManifestAiSuggestions tripId={tripId} autoLoadAlerts={true} />

      {/* Search & Filters */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Cari nama penumpang..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 flex-shrink-0"
            onClick={async () => {
              try {
                const response = await fetch(`/api/guide/manifest/pdf?tripId=${tripId}`);
                if (!response.ok) {
                  throw new Error('Failed to download PDF');
                }
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `manifest-${tripId}.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                toast.success('Manifest PDF berhasil diunduh');
              } catch (error) {
                toast.error('Gagal mengunduh PDF');
              }
            }}
          >
            <Download className="h-4 w-4" />
          </Button>
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
            <div className="divide-y divide-slate-100" style={{ userSelect: 'none' } as React.CSSProperties}>
              {filteredPassengers.map((passenger, index) => (
                <div
                  key={passenger.id}
                  className="flex min-h-[64px] items-center justify-between px-4 py-3 transition-colors hover:bg-slate-50"
                  style={{ 
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    MozUserSelect: 'none',
                    msUserSelect: 'none',
                  } as React.CSSProperties}
                  onContextMenu={(e) => e.preventDefault()}
                  onCopy={(e) => e.preventDefault()}
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
                      <p 
                        className="font-semibold text-slate-900"
                        style={{ userSelect: 'none' } as React.CSSProperties}
                      >
                        {isMasked ? maskPassengerName(passenger.name) : passenger.name}
                      </p>
                      <p 
                        className="mt-0.5 text-xs text-slate-500"
                        style={{ userSelect: 'none' } as React.CSSProperties}
                      >
                        {passengerTypeLabels[passenger.type] ?? passenger.type}
                        {!isMasked && passenger.phone && (
                          <span className="ml-2 text-slate-600">
                            • {passenger.phone}
                          </span>
                        )}
                        {isMasked && passenger.phone && (
                          <span className="ml-2 text-slate-400">
                            • {maskPhone(passenger.phone)}
                          </span>
                        )}
                      </p>
                      {!isMasked && (passenger.notes || passenger.allergy || passenger.specialRequest) && (
                        <p className="mt-0.5 line-clamp-2 text-[11px] text-slate-500">
                          {passenger.notes && <span>Catatan: {passenger.notes}. </span>}
                          {passenger.allergy && <span>Alergi: {passenger.allergy}. </span>}
                          {passenger.specialRequest && (
                            <span>Permintaan: {passenger.specialRequest}.</span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-shrink-0 items-center gap-2">
                    {canEdit && passenger.status === 'pending' && (
                      <Button
                        size="sm"
                        className="h-8 bg-blue-600 text-white hover:bg-blue-700 active:scale-95"
                        onClick={() => boardMutation.mutate(passenger.id)}
                        disabled={boardMutation.isPending}
                      >
                        <Ship className="mr-1.5 h-3.5 w-3.5" />
                        Naik
                      </Button>
                    )}
                    {canEdit && passenger.status === 'boarded' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 active:scale-95"
                        onClick={() => returnMutation.mutate(passenger.id)}
                        disabled={returnMutation.isPending}
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
                    {canEdit && (
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8 border-slate-200 text-slate-500 hover:bg-slate-100 active:scale-95"
                        onClick={() => setEditingPassenger(passenger)}
                      >
                        <span className="text-xs font-semibold">i</span>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Passenger Dialog */}
      <Dialog open={!!editingPassenger} onOpenChange={(open) => !open && setEditingPassenger(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detail Penumpang</DialogTitle>
            <DialogDescription>
              {editingPassenger?.name} • {(editingPassenger && (passengerTypeLabels[editingPassenger.type] ?? editingPassenger.type)) || ''}
            </DialogDescription>
          </DialogHeader>
          {editingPassenger && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-600">Catatan</label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs text-emerald-600"
                    onClick={async () => {
                      try {
                        const res = await fetch('/api/guide/manifest/suggest', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            tripId,
                            type: 'notes',
                            passengerId: editingPassenger.id,
                          }),
                        });
                        if (res.ok) {
                          const data = await res.json();
                          if (data.suggestedNotes) {
                            setEditingPassenger((prev) =>
                              prev ? { ...prev, notes: data.suggestedNotes } : prev,
                            );
                          }
                        }
                      } catch {
                        // Ignore
                      }
                    }}
                  >
                    <Lightbulb className="mr-1 h-3 w-3" />
                    AI Suggest
                  </Button>
                </div>
                <Textarea
                  className="text-xs"
                  placeholder="Catatan singkat (mis. seasick, anak kecil, dll.)"
                  value={editingPassenger.notes ?? ''}
                  onChange={(e) =>
                    setEditingPassenger((prev) =>
                      prev ? { ...prev, notes: e.target.value } : prev,
                    )
                  }
                  rows={2}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Alergi</label>
                <Input
                  className="mt-1 h-9 text-xs"
                  placeholder="Mis. seafood, obat tertentu, dll."
                  value={editingPassenger.allergy ?? ''}
                  onChange={(e) =>
                    setEditingPassenger((prev) =>
                      prev ? { ...prev, allergy: e.target.value } : prev,
                    )
                  }
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Permintaan Khusus</label>
                <Input
                  className="mt-1 h-9 text-xs"
                  placeholder="Mis. vegetarian, butuh bantuan khusus, dll."
                  value={editingPassenger.specialRequest ?? ''}
                  onChange={(e) =>
                    setEditingPassenger((prev) =>
                      prev ? { ...prev, specialRequest: e.target.value } : prev,
                    )
                  }
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingPassenger(null)}
                >
                  Batal
                </Button>
                <Button
                  size="sm"
                  disabled={updatePassengerMutation.isPending}
                  onClick={() => {
                    if (!editingPassenger) return;
                    updatePassengerMutation.mutate({
                      passengerId: editingPassenger.id,
                      details: {
                        notes: editingPassenger.notes,
                        allergy: editingPassenger.allergy,
                        specialRequest: editingPassenger.specialRequest,
                      },
                    });
                  }}
                >
                  {updatePassengerMutation.isPending ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    'Simpan'
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
