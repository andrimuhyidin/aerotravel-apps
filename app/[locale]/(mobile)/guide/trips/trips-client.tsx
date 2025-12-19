'use client';

/**
 * Guide Trips List Client
 * Menampilkan daftar trip dengan filter berdasarkan status
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Calendar, CheckCircle2, ChevronRight, Clock, DollarSign, Users, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import queryKeys from '@/lib/queries/query-keys';
import { cn } from '@/lib/utils';

type TripItem = {
  id: string;
  code: string;
  name: string;
  date: string;
  guests: number;
  status: 'ongoing' | 'upcoming' | 'completed' | 'cancelled';
  assignment_status?: 'pending_confirmation' | 'confirmed' | 'rejected' | 'expired' | 'auto_reassigned' | null;
  confirmation_deadline?: string | null;
  confirmed_at?: string | null;
  rejected_at?: string | null;
  fee_amount?: number | null;
};

type GuideTripsResponse = {
  trips: TripItem[];
};

type TripsClientProps = {
  locale: string;
};

type FilterStatus = 'all' | 'ongoing' | 'upcoming' | 'completed' | 'cancelled';

function getStatusLabel(status: TripItem['status']) {
  switch (status) {
    case 'ongoing':
      return {
        text: 'Berlangsung',
        className: 'bg-emerald-100 text-emerald-700',
        dot: 'bg-emerald-500',
      };
    case 'upcoming':
      return {
        text: 'Mendatang',
        className: 'bg-blue-100 text-blue-700',
        dot: 'bg-blue-500',
      };
    case 'completed':
      return {
        text: 'Selesai',
        className: 'bg-slate-100 text-slate-600',
        dot: 'bg-slate-400',
      };
    case 'cancelled':
      return {
        text: 'Dibatalkan',
        className: 'bg-red-100 text-red-600',
        dot: 'bg-red-500',
      };
  }
}

const filterOptions: { key: FilterStatus; label: string }[] = [
  { key: 'all', label: 'Semua' },
  { key: 'upcoming', label: 'Mendatang' },
  { key: 'ongoing', label: 'Berlangsung' },
  { key: 'completed', label: 'Selesai' },
  { key: 'cancelled', label: 'Dibatalkan' },
];

const REJECTION_REASONS = [
  { value: 'sick', label: 'Sakit' },
  { value: 'schedule_conflict', label: 'Konflik Jadwal' },
  { value: 'personal_emergency', label: 'Keperluan Pribadi Mendesak' },
  { value: 'not_available', label: 'Tidak Tersedia' },
  { value: 'other', label: 'Lainnya' },
];

export function TripsClient({ locale }: TripsClientProps) {
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'this_month' | 'next_month' | string>('all');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<TripItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [rejectionNote, setRejectionNote] = useState<string>('');
  const queryClient = useQueryClient();

  // Generate month options (current month + next 6 months)
  const monthOptions = useMemo(() => {
    const options = [
      { value: 'all', label: 'Semua Tanggal' },
      { value: 'this_month', label: 'Bulan Ini' },
      { value: 'next_month', label: 'Bulan Depan' },
    ];

    const now = new Date();
    for (let i = 0; i < 6; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
      options.push({
        value: date.toISOString().slice(0, 7), // YYYY-MM
        label: date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
      });
    }

    return options;
  }, []);

  const { data, isLoading, error } = useQuery<GuideTripsResponse>({
    queryKey: queryKeys.guide.trips.all(),
    queryFn: async () => {
      const res = await fetch('/api/guide/trips');
      if (!res.ok) {
        throw new Error('Gagal memuat trip');
      }
      return (await res.json()) as GuideTripsResponse;
    },
  });

  const confirmMutation = useMutation({
    mutationFn: async ({ tripId, action, reason }: { tripId: string; action: 'accept' | 'reject'; reason?: string }) => {
      const res = await fetch(`/api/guide/trips/${tripId}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, rejection_reason: reason }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error || 'Gagal mengkonfirmasi trip');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.guide.trips.all() });
      setConfirmDialogOpen(false);
      setSelectedTrip(null);
      setRejectionReason('');
      setRejectionNote('');
    },
  });

  const trips = data?.trips ?? [];

  // Filter by date
  const dateFilteredTrips = useMemo(() => {
    if (dateFilter === 'all') return trips;

    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    if (dateFilter === 'this_month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    } else if (dateFilter === 'next_month') {
      startDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 2, 0, 23, 59, 59);
    } else {
      // Specific month (YYYY-MM format)
      const parts = dateFilter.split('-');
      const year = parts[0] ? parseInt(parts[0], 10) : now.getFullYear();
      const month = parts[1] ? parseInt(parts[1], 10) : now.getMonth() + 1;
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month, 0, 23, 59, 59);
    }

    return trips.filter((trip) => {
      const tripDate = new Date(trip.date);
      return tripDate >= startDate && tripDate <= endDate;
    });
  }, [trips, dateFilter]);

  // Separate pending confirmation trips
  const pendingTrips = dateFilteredTrips.filter((t) => t.assignment_status === 'pending_confirmation');
  const otherTrips = dateFilteredTrips.filter((t) => t.assignment_status !== 'pending_confirmation');

  // Filter by status
  const filteredTrips =
    filter === 'all'
      ? dateFilteredTrips
      : dateFilteredTrips.filter((trip) => trip.status === filter);

  // Countdown timer for pending trips
  const getTimeRemaining = (deadline: string | null | undefined): string | null => {
    if (!deadline) return null;
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diff = deadlineDate.getTime() - now.getTime();

    if (diff <= 0) return 'Deadline lewat';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} menit lagi`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} jam lagi`;
    return `${Math.floor(diff / 86400000)} hari lagi`;
  };

  const refetchTrips = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.guide.trips.all() });
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <LoadingState variant="skeleton" lines={2} />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent>
          <ErrorState
            message={error instanceof Error ? error.message : 'Gagal memuat trip'}
            onRetry={refetchTrips}
            variant="card"
          />
        </CardContent>
      </Card>
    );
  }

  if (trips.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent>
          <EmptyState
            icon={Calendar}
            title="Belum ada penugasan trip"
            description="Trip yang ditugaskan ke Anda akan muncul di sini"
            variant="default"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Pending Confirmation Alert */}
      {pendingTrips.length > 0 && (
        <Card className="border-amber-200/50 bg-gradient-to-br from-amber-50 via-amber-50/50 to-orange-50/30 shadow-sm backdrop-blur-sm">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100 shadow-sm">
                <AlertCircle className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-amber-900">
                  {pendingTrips.length} Trip Butuh Konfirmasi
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-amber-800/80">
                  Silakan konfirmasi bisa/tidak sebelum deadline. Jika tidak dikonfirmasi, trip akan dialihkan ke guide lain.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Date Filter */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="h-10 w-full border-slate-200 bg-white shadow-sm transition-all hover:border-emerald-300 hover:shadow-md sm:w-[220px]">
              <Calendar className="mr-2 h-4 w-4 text-slate-500" />
              <SelectValue placeholder="Pilih periode" />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {filterOptions.map((option) => {
          const isActive = filter === option.key;
          return (
            <button
              key={option.key}
              type="button"
              className={cn(
                'whitespace-nowrap rounded-full px-5 py-2 text-xs font-semibold transition-all duration-200 active:scale-95',
                isActive
                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-md shadow-emerald-200/50'
                  : 'bg-white text-slate-600 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50 hover:ring-emerald-200',
              )}
              onClick={() => setFilter(option.key)}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {/* Trips List */}
      {filteredTrips.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Calendar className="mb-3 h-12 w-12 text-slate-300" />
            <p className="text-sm font-medium text-slate-600">
              Tidak ada trip dengan status ini
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Coba pilih filter lain untuk melihat trip lainnya
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTrips.map((trip) => {
            const status = getStatusLabel(trip.status);
            const tripDate = new Date(trip.date);
            const day = tripDate.getDate().toString().padStart(2, '0');
            const month = tripDate.toLocaleDateString('id-ID', { month: 'short' });
            const formattedDate = tripDate.toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            });

            return (
              <Card
                key={trip.id}
                className="group border-0 bg-white shadow-sm ring-1 ring-slate-100 transition-all duration-300 hover:shadow-lg hover:ring-emerald-200/50 active:scale-[0.98]"
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Date Badge - Enhanced */}
                    <div className="relative flex h-16 w-16 flex-shrink-0 flex-col items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-400 to-teal-500 shadow-md shadow-emerald-200/50 transition-transform duration-300 group-hover:scale-105">
                      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
                      <span className="relative text-xl font-bold text-white drop-shadow-sm">{day}</span>
                      <span className="relative text-[10px] font-semibold uppercase text-emerald-50 drop-shadow-sm">
                        {month}
                      </span>
                    </div>

                    {/* Trip Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-base font-bold leading-tight text-slate-900 group-hover:text-emerald-700 transition-colors">
                            {trip.name}
                          </h3>
                          <p className="mt-1 text-xs font-medium text-slate-500">Kode: {trip.code}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                          {trip.assignment_status === 'pending_confirmation' && (
                            <span className="flex-shrink-0 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 px-3 py-1 text-[10px] font-semibold text-amber-800 shadow-sm ring-1 ring-amber-200/50">
                              Butuh Konfirmasi
                            </span>
                          )}
                          <span
                            className={cn(
                              'flex-shrink-0 rounded-full px-3 py-1 text-[10px] font-semibold shadow-sm ring-1',
                              status.className,
                              'ring-opacity-50',
                            )}
                          >
                            {status.text}
                          </span>
                        </div>
                      </div>

                      {/* Pending Confirmation Info */}
                      {trip.assignment_status === 'pending_confirmation' && trip.confirmation_deadline && (
                        <div className="mt-3 space-y-2">
                          {/* Fee Info - Prominent for transparency */}
                          {trip.fee_amount && (
                            <div className="rounded-xl border border-emerald-200/60 bg-gradient-to-r from-emerald-50/80 to-teal-50/50 p-3 shadow-sm ring-1 ring-emerald-100/50">
                              <div className="flex items-center gap-2.5">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
                                  <DollarSign className="h-4 w-4 text-emerald-600" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-xs font-semibold text-emerald-900">Estimasi Fee</p>
                                  <p className="mt-0.5 text-sm font-bold text-emerald-700">
                                    Rp {Number(trip.fee_amount).toLocaleString('id-ID')}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                          {/* Deadline Info */}
                          <div className="rounded-xl border border-amber-200/60 bg-gradient-to-r from-amber-50/80 to-orange-50/50 p-3 shadow-sm ring-1 ring-amber-100/50">
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2.5">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
                                  <Clock className="h-4 w-4 text-amber-600" />
                                </div>
                                <div>
                                  <p className="text-xs font-semibold text-amber-900">
                                    {getTimeRemaining(trip.confirmation_deadline) || 'Deadline lewat'}
                                  </p>
                                  <p className="text-[10px] text-amber-700/70">Batas konfirmasi</p>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                className="h-8 bg-amber-600 text-xs font-semibold text-white shadow-sm hover:bg-amber-700"
                                onClick={() => {
                                  setSelectedTrip(trip);
                                  setConfirmDialogOpen(true);
                                }}
                              >
                                Konfirmasi
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                        <div className="flex flex-wrap items-center gap-4 text-xs">
                          <div className="flex items-center gap-2 text-slate-600">
                            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100">
                              <Clock className="h-3.5 w-3.5 text-slate-500" />
                            </div>
                            <span className="font-medium">{formattedDate}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-600">
                            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100">
                              <Users className="h-3.5 w-3.5 text-slate-500" />
                            </div>
                            <span className="font-medium">{trip.guests} tamu</span>
                          </div>
                          {/* Fee Display - Always visible for transparency */}
                          {trip.fee_amount && (
                            <div className="flex items-center gap-2 text-emerald-600">
                              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-100">
                                <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                              </div>
                              <span className="font-semibold">
                                Rp {Number(trip.fee_amount).toLocaleString('id-ID')}
                              </span>
                            </div>
                          )}
                        </div>
                        <Link
                          href={`/${locale}/guide/trips/${trip.code}`}
                          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 transition-all hover:bg-emerald-100 hover:scale-110 active:scale-95"
                        >
                          <ChevronRight className="h-5 w-5" aria-hidden="true" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Trip Assignment</DialogTitle>
            <DialogDescription>
              {selectedTrip?.name} - {selectedTrip?.code}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Fee Info - Prominent in dialog */}
            {selectedTrip?.fee_amount && (
              <div className="rounded-lg border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                    <DollarSign className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-emerald-700">Estimasi Fee yang Akan Diterima</p>
                    <p className="mt-1 text-lg font-bold text-emerald-900">
                      Rp {Number(selectedTrip.fee_amount).toLocaleString('id-ID')}
                    </p>
                    <p className="mt-1 text-xs text-emerald-600/70">
                      Fee akan dibayarkan setelah trip selesai
                    </p>
                  </div>
                </div>
              </div>
            )}
            {selectedTrip?.confirmation_deadline && (
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs font-medium text-slate-600">Deadline Konfirmasi</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {getTimeRemaining(selectedTrip.confirmation_deadline) || 'Lewat'}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {new Date(selectedTrip.confirmation_deadline).toLocaleString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                onClick={() => {
                  if (selectedTrip) {
                    confirmMutation.mutate({ tripId: selectedTrip.id, action: 'accept' });
                  }
                }}
                disabled={confirmMutation.isPending}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Terima
              </Button>
              <Button
                variant="outline"
                className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                onClick={() => {
                  if (selectedTrip && rejectionReason) {
                    const reason = rejectionReason === 'other' 
                      ? rejectionNote 
                      : REJECTION_REASONS.find(r => r.value === rejectionReason)?.label || rejectionReason;
                    confirmMutation.mutate({ 
                      tripId: selectedTrip.id, 
                      action: 'reject',
                      reason,
                    });
                  } else {
                    alert('Silakan pilih alasan penolakan');
                  }
                }}
                disabled={confirmMutation.isPending || !rejectionReason}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Tolak
              </Button>
            </div>

            {rejectionReason && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-700">Alasan Penolakan</label>
                <Select value={rejectionReason} onValueChange={setRejectionReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih alasan" />
                  </SelectTrigger>
                  <SelectContent>
                    {REJECTION_REASONS.map((reason) => (
                      <SelectItem key={reason.value} value={reason.value}>
                        {reason.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {rejectionReason === 'other' && (
                  <Textarea
                    placeholder="Jelaskan alasan penolakan..."
                    value={rejectionNote}
                    onChange={(e) => setRejectionNote(e.target.value)}
                    rows={3}
                  />
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              Batal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
