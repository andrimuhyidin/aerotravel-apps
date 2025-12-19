'use client';

/**
 * Trip Detail Client Component
 * Menampilkan ringkasan trip dan manifest real-time
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, ArrowLeft, Calendar, CheckCircle, CheckCircle2, ClipboardList, Clock, Link as LinkIcon, MapPin, MessageSquare, Package, ThermometerSun, Users, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { MapNavigationButtons } from '@/components/guide/map-navigation-buttons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { TripManifest, getTripManifest } from '@/lib/guide';
import queryKeys from '@/lib/queries/query-keys';
import type { LocationPoint } from '@/lib/utils/maps';
import { cacheLocationPoint } from '@/lib/utils/maps';

import { TripBriefing } from '@/components/guide/trip-briefing';
import { GuideAiAssistant } from './guide-ai-assistant';
import { TripAiChat } from './trip-ai-chat';
import { TripInsightsWidget } from './trip-insights-widget';
import { TripItineraryTimeline } from './trip-itinerary-timeline';
import { TripTasks } from './trip-tasks';

type TripDetailClientProps = {
  tripId: string;
  locale: string;
  tripCode?: string;
};

const REJECTION_REASONS = [
  { value: 'sick', label: 'Sakit' },
  { value: 'schedule_conflict', label: 'Konflik Jadwal' },
  { value: 'personal_emergency', label: 'Keperluan Pribadi Mendesak' },
  { value: 'not_available', label: 'Tidak Tersedia' },
  { value: 'other', label: 'Lainnya' },
];

export function TripDetailClient({ tripId, locale, tripCode }: TripDetailClientProps) {
  const [manifest, setManifest] = useState<TripManifest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meetingPoint, setMeetingPoint] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [weatherSummary, setWeatherSummary] = useState<{
    temp: number;
    description: string;
    hasAlert: boolean;
  } | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [rejectionNote, setRejectionNote] = useState<string>('');
  const queryClient = useQueryClient();

  // Fetch assignment status
  const { data: assignmentData } = useQuery<{
    assignment_status: string | null;
    confirmation_deadline: string | null;
    confirmed_at: string | null;
    rejected_at: string | null;
  }>({
    queryKey: ['guide', 'trip-assignment', tripId],
    queryFn: async () => {
      const res = await fetch(`/api/guide/trips`);
      if (!res.ok) {
        return {
          assignment_status: null,
          confirmation_deadline: null,
          confirmed_at: null,
          rejected_at: null,
        };
      }
      const data = (await res.json()) as { trips: Array<{
        id: string;
        assignment_status?: string | null;
        confirmation_deadline?: string | null;
        confirmed_at?: string | null;
        rejected_at?: string | null;
      }> };
      const trip = data.trips.find((t) => t.id === tripId);
      return {
        assignment_status: trip?.assignment_status || null,
        confirmation_deadline: trip?.confirmation_deadline || null,
        confirmed_at: trip?.confirmed_at || null,
        rejected_at: trip?.rejected_at || null,
      };
    },
  });

  const confirmMutation = useMutation({
    mutationFn: async ({ action, reason }: { action: 'accept' | 'reject'; reason?: string }) => {
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
      queryClient.invalidateQueries({ queryKey: ['guide', 'trip-assignment', tripId] });
      queryClient.invalidateQueries({ queryKey: queryKeys.guide.trips() });
      setConfirmDialogOpen(false);
      setRejectionReason('');
      setRejectionNote('');
    },
  });

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

  const loadTripData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [manifestData, locationsData] = await Promise.all([
        getTripManifest(tripId),
        fetch(`/api/guide/trips/${tripId}/locations`).then((res) => res.json()),
      ]);

      setManifest(manifestData);

      // Cache locations and set meeting point
      if (locationsData.locations && Array.isArray(locationsData.locations)) {
        const locations = locationsData.locations as LocationPoint[];
        
        // Cache all locations
        for (const location of locations) {
          await cacheLocationPoint(location);
        }

        // Find meeting point
        const meetingPointLocation = locations.find((loc) => loc.type === 'meeting_point');
        if (meetingPointLocation) {
          setMeetingPoint({
            lat: meetingPointLocation.latitude,
            lng: meetingPointLocation.longitude,
            name: meetingPointLocation.name,
          });
        }
      }
    } catch (err) {
      setError((err as Error).message ?? 'Gagal memuat detail trip');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      await loadTripData();
      if (!mounted) return;
    };

    void load();

    return () => {
      mounted = false;
    };
  }, [tripId]);

  // Load simple weather summary once meeting point & date are known
  useEffect(() => {
    if (!manifest?.date || !meetingPoint?.lat || !meetingPoint.lng) return;

    let active = true;

    const loadWeather = async () => {
      try {
        const dateOnly = new Date(manifest.date).toISOString().split('T')[0] ?? undefined;
        const res = await fetch(
          `/api/guide/weather?lat=${meetingPoint.lat}&lng=${meetingPoint.lng}${
            dateOnly ? `&date=${dateOnly}` : ''
          }`,
        );
        if (!res.ok) return;
        const json = (await res.json()) as {
          current?: { temp: number; weather?: { description?: string } };
          alerts?: unknown[];
        };
        if (!active || !json.current) return;
        setWeatherSummary({
          temp: Math.round(json.current.temp),
          description: json.current.weather?.description ?? '',
          hasAlert: Array.isArray(json.alerts) && json.alerts.length > 0,
        });
      } catch {
        // ignore error, widget is optional
      }
    };

    void loadWeather();

    return () => {
      active = false;
    };
  }, [manifest?.date, meetingPoint?.lat, meetingPoint?.lng]);

  if (loading && !manifest) {
    return (
      <div className="space-y-3">
        <Link href={`/${locale}/guide/trips`} className="flex items-center gap-2 text-slate-500">
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali</span>
        </Link>
        <Card className="border-0 shadow-sm">
          <CardContent>
            <LoadingState variant="spinner" message="Memuat detail trip..." />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-3">
        <Link href={`/${locale}/guide/trips`} className="flex items-center gap-2 text-slate-500">
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali</span>
        </Link>
        <Card className="border-0 shadow-sm">
          <CardContent>
            <ErrorState
              message={error}
              onRetry={loadTripData}
              variant="card"
              showIcon={false}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!manifest) {
    return (
      <div className="space-y-3">
        <Link href={`/${locale}/guide/trips`} className="flex items-center gap-2 text-slate-500">
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali</span>
        </Link>
        <Card className="border-0 shadow-sm">
          <CardContent>
            <EmptyState
              icon={Calendar}
              title="Data trip tidak tersedia"
              description="Trip yang Anda cari tidak ditemukan atau belum tersedia"
              variant="subtle"
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  const dateLabel = manifest.date
    ? new Date(manifest.date).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : '';

  const meetingPointName = 'Dermaga Ketapang';

  const checklist = [
    {
      label: 'Check-in di lokasi',
      done: (manifest.boardedCount ?? 0) + (manifest.returnedCount ?? 0) > 0,
    },
    {
      label: 'Upload dokumentasi wajib',
      done: Boolean(manifest.documentationUrl),
    },
    {
      label: 'Semua tamu kembali',
      done: manifest.returnedCount >= manifest.totalPax && manifest.totalPax > 0,
    },
  ];

  const isPendingConfirmation = assignmentData?.assignment_status === 'pending_confirmation';

  return (
    <div className="space-y-4">
      {/* Back Button */}
      <Link href={`/${locale}/guide/trips`} className="flex items-center gap-2 text-slate-500">
        <ArrowLeft className="h-4 w-4" />
        <span>Kembali</span>
      </Link>

      {/* Pending Confirmation Alert */}
      {isPendingConfirmation && (
        <Card className="border-amber-200/50 bg-gradient-to-br from-amber-50 via-amber-50/50 to-orange-50/30 shadow-md backdrop-blur-sm ring-1 ring-amber-100/50">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 shadow-lg shadow-amber-200/50">
                <AlertCircle className="h-6 w-6 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold text-amber-900">
                  Trip Butuh Konfirmasi
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-amber-800/80">
                  Silakan konfirmasi bisa/tidak sebelum deadline. Jika tidak dikonfirmasi, trip akan dialihkan ke guide lain.
                </p>
                {assignmentData?.confirmation_deadline && (
                  <div className="mt-3 flex items-center gap-2.5 rounded-lg bg-amber-100/60 px-3 py-2">
                    <Clock className="h-4 w-4 text-amber-700" />
                    <p className="text-xs font-semibold text-amber-900">
                      Deadline: {getTimeRemaining(assignmentData.confirmation_deadline) || 'Lewat'}
                    </p>
                  </div>
                )}
                <Button
                  size="sm"
                  className="mt-4 bg-gradient-to-r from-amber-600 to-orange-600 font-semibold text-white shadow-md shadow-amber-200/50 hover:from-amber-700 hover:to-orange-700"
                  onClick={() => setConfirmDialogOpen(true)}
                >
                  Konfirmasi Sekarang
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trip Header - Enhanced Design */}
      <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-600 text-white shadow-xl shadow-emerald-200/50 ring-1 ring-emerald-400/20">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/10 to-transparent" />
        <CardContent className="relative p-6">
          <div className="mb-4">
            <h1 className="text-2xl font-bold leading-tight drop-shadow-sm">{manifest.tripName}</h1>
            {tripCode && (
              <p className="mt-1.5 text-sm font-medium opacity-90 drop-shadow-sm">Kode: {tripCode}</p>
            )}
          </div>
          <div className="grid grid-cols-1 gap-3 text-sm">
            <div className="flex items-center gap-3 rounded-xl bg-white/20 px-4 py-3 backdrop-blur-md ring-1 ring-white/30 shadow-lg">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/30 backdrop-blur-sm">
                <Calendar className="h-4 w-4 flex-shrink-0" />
              </div>
              <span className="font-semibold">{dateLabel || '-'}</span>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-white/20 px-4 py-3 backdrop-blur-md ring-1 ring-white/30 shadow-lg">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/30 backdrop-blur-sm">
                <MapPin className="h-4 w-4 flex-shrink-0" />
              </div>
              <span className="truncate font-semibold">{meetingPoint?.name || meetingPointName}</span>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-white/20 px-4 py-3 backdrop-blur-md ring-1 ring-white/30 shadow-lg">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/30 backdrop-blur-sm">
                <Users className="h-4 w-4 flex-shrink-0" />
              </div>
              <span className="font-semibold">{manifest.totalPax} tamu</span>
            </div>
            {weatherSummary && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-500/20 px-3 py-2 backdrop-blur-sm">
                <ThermometerSun className="h-4 w-4 flex-shrink-0" />
                <span className="truncate text-xs font-medium">
                  {weatherSummary.temp}°C
                  {weatherSummary.description
                    ? ` • ${weatherSummary.description}`
                    : ''}
                  {weatherSummary.hasAlert && ' • ⚠️ Peringatan cuaca'}
                </span>
              </div>
            )}
          </div>
        </CardContent>
        <div className="border-t border-emerald-500/30 bg-emerald-500/10 px-5 pb-4 pt-3">
          <MapNavigationButtons
            latitude={meetingPoint?.lat ?? -8.1319}
            longitude={meetingPoint?.lng ?? 114.3656}
            label={meetingPoint?.name || meetingPointName}
            className="w-full justify-center bg-white/10 hover:bg-white/20 text-white border-white/20"
          />
        </div>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Trip Assignment</DialogTitle>
            <DialogDescription>
              {manifest?.tripName} - {tripCode}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {assignmentData?.confirmation_deadline && (
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs font-medium text-slate-600">Deadline Konfirmasi</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {getTimeRemaining(assignmentData.confirmation_deadline) || 'Lewat'}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {new Date(assignmentData.confirmation_deadline).toLocaleString('id-ID', {
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
                  confirmMutation.mutate({ action: 'accept' });
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
                  if (rejectionReason) {
                    const reason = rejectionReason === 'other' 
                      ? rejectionNote 
                      : REJECTION_REASONS.find(r => r.value === rejectionReason)?.label || rejectionReason;
                    confirmMutation.mutate({ 
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

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-700">Alasan Penolakan</label>
              <Select value={rejectionReason} onValueChange={setRejectionReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih alasan (jika menolak)" />
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              Batal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 gap-3">
        <Link href={`/${locale}/guide/trips/${tripCode || tripId}/chat`}>
          <Card className="border-0 shadow-sm transition-all hover:shadow-md active:scale-[0.98]">
            <CardContent className="flex flex-col items-center justify-center gap-2 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                <MessageSquare className="h-5 w-5 text-emerald-600" />
              </div>
              <span className="text-center text-sm font-medium text-slate-900">Chat Ops</span>
            </CardContent>
          </Card>
        </Link>
        <Link href={`/${locale}/guide/trips/${tripCode || tripId}/equipment`}>
          <Card className="border-0 shadow-sm transition-all hover:shadow-md active:scale-[0.98]">
            <CardContent className="flex flex-col items-center justify-center gap-2 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
                <Package className="h-5 w-5 text-orange-600" />
              </div>
              <span className="text-center text-sm font-medium text-slate-900">Equipment</span>
            </CardContent>
          </Card>
        </Link>
        <Link href={`/${locale}/guide/trips/${tripCode || tripId}/evidence`}>
          <Card className="border-0 shadow-sm transition-all hover:shadow-md active:scale-[0.98]">
            <CardContent className="flex flex-col items-center justify-center gap-2 p-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${manifest.documentationUrl ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                <LinkIcon className={`h-5 w-5 ${manifest.documentationUrl ? 'text-emerald-600' : 'text-amber-600'}`} />
              </div>
              <span className="text-center text-sm font-medium text-slate-900">Dokumentasi</span>
              {manifest.documentationUrl ? (
                <span className="text-[10px] text-emerald-600">✓ Selesai</span>
              ) : (
                <span className="text-[10px] text-amber-600">Belum</span>
              )}
            </CardContent>
          </Card>
        </Link>
        <Link href={`/${locale}/guide/trips/${tripCode || tripId}/expenses`}>
          <Card className="border-0 shadow-sm transition-all hover:shadow-md active:scale-[0.98]">
            <CardContent className="flex flex-col items-center justify-center gap-2 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                <ClipboardList className="h-5 w-5 text-blue-600" />
              </div>
              <span className="text-center text-sm font-medium text-slate-900">Pengeluaran</span>
            </CardContent>
          </Card>
        </Link>
        <Link href={`/${locale}/guide/manifest?tripId=${tripId}`}>
          <Card className="border-0 shadow-sm transition-all hover:shadow-md active:scale-[0.98]">
            <CardContent className="flex flex-col items-center justify-center gap-2 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <span className="text-center text-sm font-medium text-slate-900">Manifest</span>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Manifest / Guest List - Enhanced */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <ClipboardList className="h-5 w-5 text-emerald-600" />
              Daftar Tamu
            </CardTitle>
            <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1">
              <span className="text-sm font-semibold text-emerald-700">
                {manifest.boardedCount + manifest.returnedCount}/{manifest.totalPax}
              </span>
              <span className="text-xs text-emerald-600">hadir</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            {manifest.passengers.map((guest, index) => {
              const statusColors = {
                pending: 'bg-slate-100 text-slate-600',
                boarded: 'bg-blue-100 text-blue-700',
                returned: 'bg-emerald-100 text-emerald-700',
              };
              
              return (
                <div
                  key={guest.id}
                  className="flex items-center gap-3 rounded-lg border border-slate-100 bg-white p-3 transition-colors hover:bg-slate-50"
                >
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-50 to-emerald-100 text-sm font-semibold text-emerald-700">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">{guest.name}</p>
                    {guest.phone && (
                      <p className="mt-0.5 text-xs text-slate-500">{guest.phone}</p>
                    )}
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-medium capitalize ${statusColors[guest.status] || statusColors.pending}`}>
                    {guest.status === 'pending' ? 'Menunggu' : guest.status === 'boarded' ? 'Naik' : 'Kembali'}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Itinerary Timeline */}
      <TripItineraryTimeline tripId={tripId} locale={locale} />

      {/* Trip Tasks Checklist */}
      <TripTasks tripId={tripId} />

      {/* Trip Briefing */}
      <TripBriefing tripId={tripId} locale={locale} />

      {/* AI Assistant Coaching */}
      <GuideAiAssistant locale={locale} />

      {/* AI Trip Insights */}
      <TripInsightsWidget tripId={tripId} locale={locale} />

      {/* AI Chat Assistant */}
      <TripAiChat tripId={tripId} locale={locale} />

      {/* Completion Checklist - Enhanced */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <CheckCircle className="h-5 w-5 text-emerald-600" />
            Checklist Penyelesaian
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {checklist.map((item) => (
            <div
              key={item.label}
              className={`flex items-center justify-between rounded-lg border p-3.5 text-sm transition-colors ${
                item.done
                  ? 'border-emerald-200 bg-emerald-50'
                  : 'border-amber-200 bg-amber-50'
              }`}
            >
              <span className={`font-medium ${item.done ? 'text-emerald-900' : 'text-amber-900'}`}>
                {item.label}
              </span>
              {item.done ? (
                <div className="flex items-center gap-1.5 text-emerald-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="text-xs font-medium">Selesai</span>
                </div>
              ) : (
                <span className="text-xs font-medium text-amber-600">Belum</span>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

    </div>
  );
}
