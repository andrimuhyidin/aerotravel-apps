'use client';

/**
 * Trip Detail Client Component
 * Menampilkan ringkasan trip dan manifest real-time
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  FileText,
  MapPin,
  MessageSquare,
  Play,
  ThermometerSun,
  Upload,
  Users,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { MapNavigationButtons } from '@/components/guide/map-navigation-buttons';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
import { startTracking, stopTracking } from '@/lib/guide/background-tracking';
import queryKeys from '@/lib/queries/query-keys';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/utils/logger';
import type { LocationPoint } from '@/lib/utils/maps';
import { cacheLocationPoint } from '@/lib/utils/maps';

import { useTripCrew } from '@/hooks/use-trip-crew';
import { toast } from 'sonner';
import { RiskAssessmentDialog } from './risk-assessment-dialog';
import { TripReadinessDialog } from './trip-readiness-dialog';
import { TripTimelineView } from './trip-timeline-view';

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

/**
 * Mask passenger name for Support Guide
 */
function maskPassengerName(name: string): string {
  if (name.length <= 2) return name;
  const first = name[0];
  const last = name[name.length - 1];
  const masked = '*'.repeat(Math.max(2, name.length - 2));
  return `${first}${masked}${last}`;
}

/**
 * Mask phone number
 */
function maskPhone(phone: string): string {
  if (phone.length <= 4) return phone;
  const last4 = phone.slice(-4);
  return `****${last4}`;
}

export function TripDetailClient({
  tripId,
  locale,
  tripCode,
}: TripDetailClientProps) {
  const [manifest, setManifest] = useState<TripManifest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meetingPoint, setMeetingPoint] = useState<{
    lat: number;
    lng: number;
    name: string;
  } | null>(null);
  const [weatherSummary, setWeatherSummary] = useState<{
    temp: number;
    description: string;
    hasAlert: boolean;
  } | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [rejectionNote, setRejectionNote] = useState<string>('');
  const [readinessDialogOpen, setReadinessDialogOpen] = useState(false);
  const [riskAssessmentOpen, setRiskAssessmentOpen] = useState(false);
  const [canStartTrip, setCanStartTrip] = useState<boolean | null>(null);
  const queryClient = useQueryClient();

  // Get crew role for permissions
  const { data: crewData } = useTripCrew(tripId);
  const crewRole = crewData?.currentUserRole ?? null;
  const isLeadGuide = crewData?.isLeadGuide ?? false;

  // Fetch assignment status, trip status, and trip details
  const { data: tripStatusData } = useQuery<{
    assignment_status: string | null;
    confirmation_deadline: string | null;
    confirmed_at: string | null;
    rejected_at: string | null;
    trip_status: string | null;
    actual_departure_time: string | null;
    departure_time: string | null;
    return_time: string | null;
    destination: string | null;
  }>({
    queryKey: ['guide', 'trip-status', tripId],
    queryFn: async () => {
      const tripsRes = await fetch(`/api/guide/trips`);

      let assignment_status: string | null = null;
      let confirmation_deadline: string | null = null;
      let confirmed_at: string | null = null;
      let rejected_at: string | null = null;
      let trip_status: string | null = 'scheduled';
      let departure_time: string | null = null;
      let return_time: string | null = null;
      let destination: string | null = null;

      if (tripsRes.ok) {
        const data = (await tripsRes.json()) as {
          trips: Array<{
            id: string;
            assignment_status?: string | null;
            confirmation_deadline?: string | null;
            confirmed_at?: string | null;
            rejected_at?: string | null;
            status?: string;
            destination?: string | null;
          }>;
        };
        const trip = data.trips.find((t) => t.id === tripId);
        if (trip) {
          assignment_status = trip.assignment_status || null;
          confirmation_deadline = trip.confirmation_deadline || null;
          confirmed_at = trip.confirmed_at || null;
          rejected_at = trip.rejected_at || null;
          trip_status = trip.status || 'scheduled';
          destination = trip.destination || null;
        }
      }

      // Fetch detailed trip data for times
      const tripDetailRes = await fetch(`/api/guide/trips/${tripId}/preload`);
      if (tripDetailRes.ok) {
        const detailData = (await tripDetailRes.json()) as {
          trip?: {
            departure_time?: string | null;
            return_time?: string | null;
            actual_departure_time?: string | null;
          };
        };
        departure_time = detailData.trip?.departure_time || null;
        return_time = detailData.trip?.return_time || null;
      }

      return {
        assignment_status,
        confirmation_deadline,
        confirmed_at,
        rejected_at,
        trip_status,
        actual_departure_time: null, // Can be added later if needed
        departure_time,
        return_time,
        destination,
      };
    },
  });

  // Check if trip can start
  const { data: canStartData } = useQuery<{
    can_start: boolean;
    certifications_valid: boolean;
    risk_assessment_safe: boolean;
    reasons?: string[];
  }>({
    queryKey: ['guide', 'trip-can-start', tripId],
    queryFn: async () => {
      const res = await fetch(`/api/guide/trips/${tripId}/can-start`);
      if (!res.ok) {
        return {
          can_start: false,
          certifications_valid: false,
          risk_assessment_safe: false,
          reasons: ['Tidak dapat memeriksa status'],
        };
      }
      return res.json();
    },
    enabled: !!tripId && isLeadGuide,
    refetchInterval: 30000, // Check every 30 seconds
  });

  useEffect(() => {
    if (canStartData) {
      setCanStartTrip(canStartData.can_start);
    }
  }, [canStartData]);

  // Auto-start tracking when trip status becomes 'on_trip'
  useEffect(() => {
    const tripStatus = tripStatusData?.trip_status;

    if (tripStatus === 'on_trip' && tripId) {
      // Auto-start tracking
      startTracking(tripId).catch((error) => {
        logger.error(
          '[Trip Detail] Failed to auto-start tracking on status change',
          error,
          { tripId }
        );
      });
    } else if (tripStatus !== 'on_trip' && tripStatus !== 'preparing') {
      // Stop tracking if trip is not active
      stopTracking().catch((error) => {
        logger.error('[Trip Detail] Failed to stop tracking', error, {
          tripId,
        });
      });
    }
  }, [tripStatusData?.trip_status, tripId]);

  const confirmMutation = useMutation({
    mutationFn: async ({
      action,
      reason,
    }: {
      action: 'accept' | 'reject';
      reason?: string;
    }) => {
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
      queryClient.invalidateQueries({
        queryKey: ['guide', 'trip-assignment', tripId],
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.guide.trips.all() });
      setConfirmDialogOpen(false);
      setRejectionReason('');
      setRejectionNote('');
    },
  });

  const getTimeRemaining = (
    deadline: string | null | undefined
  ): string | null => {
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
      if (locationsData?.locations && Array.isArray(locationsData.locations)) {
        const locations = locationsData.locations as LocationPoint[];

        // Cache all locations
        for (const location of locations) {
          if (location?.latitude && location?.longitude) {
            await cacheLocationPoint(location);
          }
        }

        // Find meeting point
        const meetingPointLocation = locations.find(
          (loc) => loc?.type === 'meeting_point'
        );
        if (meetingPointLocation?.latitude && meetingPointLocation?.longitude) {
          setMeetingPoint({
            lat: meetingPointLocation.latitude,
            lng: meetingPointLocation.longitude,
            name: meetingPointLocation.name || 'Meeting Point',
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
        const dateOnly =
          new Date(manifest.date).toISOString().split('T')[0] ?? undefined;
        const res = await fetch(
          `/api/guide/weather?lat=${meetingPoint.lat}&lng=${meetingPoint.lng}${
            dateOnly ? `&date=${dateOnly}` : ''
          }`
        );
        if (!res.ok) return;
        const json = (await res.json()) as {
          current?: { temp: number; weather?: { description?: string } };
          alerts?: Array<{
            title: string;
            description: string;
            severity: string;
          }>;
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
        <Link
          href={`/${locale}/guide/trips`}
          className="flex items-center gap-2 text-slate-500"
        >
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
        <Link
          href={`/${locale}/guide/trips`}
          className="flex items-center gap-2 text-slate-500"
        >
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
        <Link
          href={`/${locale}/guide/trips`}
          className="flex items-center gap-2 text-slate-500"
        >
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
      canDo: isLeadGuide || crewRole === 'support', // Both can check-in
    },
    {
      label: 'Upload dokumentasi wajib',
      done: Boolean(manifest.documentationUrl),
      canDo: isLeadGuide || crewRole === 'support', // Both can upload
    },
    {
      label: 'Semua tamu kembali',
      done:
        manifest.returnedCount >= manifest.totalPax && manifest.totalPax > 0,
      canDo: true, // Read-only status
    },
    {
      label: 'Start/End Trip',
      done: false, // This would be tracked separately
      canDo: isLeadGuide, // Only Lead Guide can start/end trip
    },
  ];

  const assignmentData = tripStatusData
    ? {
        assignment_status: tripStatusData.assignment_status,
        confirmation_deadline: tripStatusData.confirmation_deadline,
        confirmed_at: tripStatusData.confirmed_at,
        rejected_at: tripStatusData.rejected_at,
      }
    : null;

  const isPendingConfirmation =
    assignmentData?.assignment_status === 'pending_confirmation';

  // Determine current phase
  const getCurrentPhase = ():
    | 'pre_trip'
    | 'before_departure'
    | 'during_trip'
    | 'post_trip' => {
    if (assignmentData?.assignment_status === 'pending_confirmation') {
      return 'pre_trip';
    }

    const tripStatus = tripStatusData?.trip_status || 'scheduled';

    if (tripStatus === 'completed') {
      return 'post_trip';
    }

    if (tripStatus === 'on_trip' || tripStatus === 'on_the_way') {
      return 'during_trip';
    }

    // scheduled, preparing, atau status lainnya sebelum trip dimulai
    return 'before_departure';
  };

  const currentPhase = getCurrentPhase();

  return (
    <div className="space-y-4">
      {/* Back Button */}
      <Link
        href={`/${locale}/guide/trips`}
        className="flex items-center gap-2 text-slate-500"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Kembali</span>
      </Link>

      {/* Pending Confirmation Alert */}
      {isPendingConfirmation && (
        <Card className="border-amber-200/50 bg-gradient-to-br from-amber-50 via-amber-50/50 to-orange-50/30 shadow-md ring-1 ring-amber-100/50 backdrop-blur-sm">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 shadow-lg shadow-amber-200/50">
                <AlertCircle className="h-6 w-6 text-amber-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-base font-bold text-amber-900">
                  Trip Butuh Konfirmasi
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-amber-800/80">
                  Silakan konfirmasi bisa/tidak sebelum deadline. Jika tidak
                  dikonfirmasi, trip akan dialihkan ke guide lain.
                </p>
                {assignmentData?.confirmation_deadline && (
                  <div className="mt-3 flex items-center gap-2.5 rounded-lg bg-amber-100/60 px-3 py-2">
                    <Clock className="h-4 w-4 text-amber-700" />
                    <p className="text-xs font-semibold text-amber-900">
                      Deadline:{' '}
                      {getTimeRemaining(assignmentData.confirmation_deadline) ||
                        'Lewat'}
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

      {/* Trip Header - Elegant Unified Design */}
      <div className="space-y-4">
        {/* Unified Header Card with All Information - Premium Design */}
        <Card className="border-0 bg-gradient-to-br from-white via-emerald-50/30 to-white shadow-xl ring-1 ring-slate-200/50">
          <CardContent className="p-5">
            {/* Top Section: Date Badge, Title, Code, Destination, Status */}
            <div className="mb-5 flex items-start gap-4">
              {/* Date Badge */}
              {manifest.date &&
                (() => {
                  const tripDate = new Date(manifest.date);
                  const day = tripDate.getDate().toString().padStart(2, '0');
                  const month = tripDate.toLocaleDateString('id-ID', {
                    month: 'short',
                  });

                  return (
                    <div className="relative flex h-16 w-16 flex-shrink-0 flex-col items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-emerald-500 via-emerald-400 to-teal-500 shadow-lg shadow-emerald-200/50">
                      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
                      <span className="relative text-xl font-bold text-white drop-shadow-sm">
                        {day}
                      </span>
                      <span className="relative text-[10px] font-semibold uppercase text-emerald-50 drop-shadow-sm">
                        {month}
                      </span>
                    </div>
                  );
                })()}

              {/* Trip Title, Code & Destination */}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h1 className="text-lg font-bold leading-tight text-slate-900">
                      {manifest.tripName}
                    </h1>
                    {tripCode && (
                      <p className="mt-0.5 text-xs font-medium text-slate-500">
                        Kode: {tripCode}
                      </p>
                    )}
                    {tripStatusData?.destination && (
                      <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                        <MapPin className="h-3 w-3" />
                        {tripStatusData.destination}
                      </div>
                    )}
                  </div>

                  {/* Status Badge - Compact & Premium */}
                  {(() => {
                    const status = tripStatusData?.trip_status || 'scheduled';
                    const assignmentStatus = assignmentData?.assignment_status;

                    let statusConfig;
                    if (assignmentStatus === 'pending_confirmation') {
                      statusConfig = {
                        text: 'Butuh Konfirmasi',
                        className:
                          'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md',
                      };
                    } else if (
                      status === 'on_trip' ||
                      status === 'on_the_way'
                    ) {
                      statusConfig = {
                        text: 'Berlangsung',
                        className:
                          'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md',
                      };
                    } else if (status === 'completed') {
                      statusConfig = {
                        text: 'Selesai',
                        className:
                          'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md',
                      };
                    } else if (status === 'cancelled') {
                      statusConfig = {
                        text: 'Dibatalkan',
                        className:
                          'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md',
                      };
                    } else {
                      statusConfig = {
                        text: 'Terjadwal',
                        className:
                          'bg-gradient-to-r from-slate-500 to-slate-600 text-white shadow-md',
                      };
                    }

                    return (
                      <div
                        className={cn(
                          'flex-shrink-0 rounded-full px-3 py-1.5 text-[10px] font-bold shadow-sm',
                          statusConfig.className
                        )}
                      >
                        {statusConfig.text}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Info Grid: Date & Time, Total Pax, Meeting Point, Weather */}
            <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
              {/* Date & Time */}
              <div className="flex items-start gap-2.5">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100">
                  <Calendar className="h-4.5 w-4.5 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                    Tanggal & Waktu
                  </p>
                  {manifest.date && (
                    <p className="mt-0.5 text-xs font-bold text-slate-900">
                      {new Date(manifest.date).toLocaleDateString('id-ID', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                      })}
                    </p>
                  )}
                  {tripStatusData?.departure_time && (
                    <p className="mt-0.5 text-[10px] text-slate-600">
                      {typeof tripStatusData.departure_time === 'string'
                        ? tripStatusData.departure_time.slice(0, 5)
                        : tripStatusData.departure_time}{' '}
                      WIB
                    </p>
                  )}
                  {tripStatusData?.return_time && (
                    <p className="text-[10px] text-slate-600">
                      ~
                      {typeof tripStatusData.return_time === 'string'
                        ? tripStatusData.return_time.slice(0, 5)
                        : tripStatusData.return_time}{' '}
                      WIB
                    </p>
                  )}
                </div>
              </div>

              {/* Total Pax & Progress */}
              <div className="flex items-start gap-2.5">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-100">
                  <Users className="h-4.5 w-4.5 text-emerald-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                    Total Tamu
                  </p>
                  <p className="mt-0.5 text-sm font-bold text-slate-900">
                    {manifest.totalPax}
                  </p>
                  {manifest.totalPax > 0 &&
                    manifest.boardedCount + manifest.returnedCount > 0 && (
                      <>
                        <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-slate-200">
                          <div
                            className="h-full bg-emerald-500 transition-all"
                            style={{
                              width: `${Math.min(100, ((manifest.boardedCount + manifest.returnedCount) / manifest.totalPax) * 100)}%`,
                            }}
                          />
                        </div>
                        <p className="mt-1 text-[10px] font-semibold text-emerald-700">
                          {manifest.boardedCount + manifest.returnedCount}/
                          {manifest.totalPax} checked-in
                        </p>
                      </>
                    )}
                </div>
              </div>

              {/* Meeting Point */}
              {(meetingPoint?.name || meetingPointName) && (
                <div className="flex items-start gap-2.5">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-purple-100">
                    <MapPin className="h-4.5 w-4.5 text-purple-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                      Meeting Point
                    </p>
                    <p className="mt-0.5 line-clamp-1 text-xs font-bold text-slate-900">
                      {meetingPoint?.name || meetingPointName}
                    </p>
                    {meetingPoint?.lat && meetingPoint?.lng && (
                      <MapNavigationButtons
                        latitude={meetingPoint.lat}
                        longitude={meetingPoint.lng}
                        label={meetingPoint.name || 'Meeting Point'}
                        className="mt-1.5 h-6 text-[10px]"
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Weather */}
              <div className="flex items-start gap-2.5">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-amber-100">
                  <ThermometerSun className="h-4.5 w-4.5 text-amber-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                    Cuaca
                  </p>
                  {weatherSummary ? (
                    <>
                      <p className="mt-0.5 text-sm font-bold text-slate-900">
                        {weatherSummary.temp}°C
                      </p>
                      <p className="mt-0.5 line-clamp-1 text-[10px] text-slate-600">
                        {weatherSummary.description}
                      </p>
                    </>
                  ) : (
                    <p className="mt-0.5 text-xs text-slate-500">
                      Tidak tersedia
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weather Alert - Prominent */}
        {weatherSummary?.hasAlert && (
          <Alert
            variant="destructive"
            className="border-red-200 bg-gradient-to-r from-red-50 to-orange-50"
          >
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle className="font-bold">
              Peringatan Cuaca Buruk
            </AlertTitle>
            <AlertDescription className="text-sm">
              Kondisi cuaca tidak ideal terdeteksi. Pertimbangkan untuk postpone
              trip atau gunakan extra caution selama perjalanan.
            </AlertDescription>
          </Alert>
        )}

        {/* Can Start Trip Alert - Show Blockers */}
        {isLeadGuide &&
          canStartTrip === false &&
          canStartData?.reasons &&
          canStartData.reasons.length > 0 && (
            <Alert className="border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <AlertTitle className="font-bold text-amber-900">
                Trip Belum Bisa Dimulai
              </AlertTitle>
              <AlertDescription>
                <ul className="mt-2 space-y-1 text-sm text-amber-800">
                  {canStartData.reasons.map((reason, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-600" />
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

        {/* Pre-Trip Checklist - Visual */}
        {(currentPhase === 'pre_trip' ||
          currentPhase === 'before_departure') && (
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                Checklist{' '}
                {currentPhase === 'pre_trip' ? 'Persiapan' : 'Pre-Departure'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {checklist.map((item, i) => (
                <div key={i} className="flex items-center gap-3 py-2">
                  {item.done ? (
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-600" />
                  ) : (
                    <Circle className="h-5 w-5 flex-shrink-0 text-slate-300" />
                  )}
                  <span
                    className={cn(
                      'flex-1 text-sm',
                      item.done
                        ? 'font-medium text-slate-900'
                        : 'text-slate-500'
                    )}
                  >
                    {item.label}
                  </span>
                  {!item.canDo && (
                    <span className="text-xs text-slate-400">(Lead only)</span>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

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
                <p className="text-xs font-medium text-slate-600">
                  Deadline Konfirmasi
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {getTimeRemaining(assignmentData.confirmation_deadline) ||
                    'Lewat'}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {new Date(
                    assignmentData.confirmation_deadline
                  ).toLocaleString('id-ID', {
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
                    const reason =
                      rejectionReason === 'other'
                        ? rejectionNote
                        : REJECTION_REASONS.find(
                            (r) => r.value === rejectionReason
                          )?.label || rejectionReason;
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
              <label className="text-xs font-medium text-slate-700">
                Alasan Penolakan
              </label>
              <Select
                value={rejectionReason}
                onValueChange={setRejectionReason}
              >
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
            <Button
              variant="outline"
              onClick={() => setConfirmDialogOpen(false)}
            >
              Batal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Trip Readiness Dialog */}
      <TripReadinessDialog
        open={readinessDialogOpen}
        onOpenChange={setReadinessDialogOpen}
        onContinue={() => {
          setReadinessDialogOpen(false);
          setRiskAssessmentOpen(true);
        }}
        onOpenRiskAssessment={() => {
          setReadinessDialogOpen(false);
          setRiskAssessmentOpen(true);
        }}
        tripId={tripId}
        locale={locale}
      />

      {/* Risk Assessment Dialog */}
      <RiskAssessmentDialog
        open={riskAssessmentOpen}
        onOpenChange={setRiskAssessmentOpen}
        onComplete={async (canStart) => {
          if (canStart) {
            // Try to start trip
            const res = await fetch(`/api/guide/trips/${tripId}/start`, {
              method: 'POST',
            });
            if (res.ok) {
              toast.success('Trip berhasil dimulai');
              queryClient.invalidateQueries({
                queryKey: queryKeys.guide.tripsDetail(tripId),
              });
              queryClient.invalidateQueries({
                queryKey: ['guide', 'trip-can-start', tripId],
              });

              // Auto-start tracking when trip starts
              try {
                await startTracking(tripId);
                logger.info(
                  '[Trip Detail] Auto-started tracking after trip start',
                  { tripId }
                );
              } catch (error) {
                logger.error(
                  '[Trip Detail] Failed to auto-start tracking',
                  error,
                  { tripId }
                );
                // Don't show error to user, tracking failure shouldn't block trip start
              }
            } else {
              const body = (await res.json()) as {
                error?: string;
                reasons?: string[];
              };
              if (body.reasons && body.reasons.length > 0) {
                toast.error(
                  `Trip tidak dapat dimulai: ${body.reasons.join(', ')}`,
                  { duration: 5000 }
                );
              } else {
                toast.error(body.error || 'Gagal start trip');
              }
            }
          } else {
            toast.warning(
              'Risk assessment menunjukkan risiko tinggi. Admin perlu approve untuk memulai trip.'
            );
          }
        }}
        tripId={tripId}
      />

      {/* Trip Timeline View - Industry Best Practice */}
      <TripTimelineView
        tripId={tripId}
        locale={locale}
        isLeadGuide={isLeadGuide}
        crewRole={crewRole}
        manifest={{
          tripName: manifest.tripName,
          tripCode: tripCode,
          date: manifest.date || '',
          totalPax: manifest.totalPax,
          boardedCount: manifest.boardedCount,
          returnedCount: manifest.returnedCount,
          documentationUrl: manifest.documentationUrl,
          passengers: manifest.passengers,
        }}
        assignmentStatus={
          assignmentData?.assignment_status as
            | 'pending_confirmation'
            | 'confirmed'
            | 'rejected'
            | null
            | undefined
        }
        currentPhase={getCurrentPhase()}
        onStartTrip={() => {
          // Always show readiness dialog first
          setReadinessDialogOpen(true);
        }}
        onOpenReadinessDialog={() => {
          setReadinessDialogOpen(true);
        }}
        onEndTrip={async () => {
          if (confirm('Yakin ingin menyelesaikan trip ini?')) {
            const res = await fetch(`/api/guide/trips/${tripId}/end`, {
              method: 'POST',
            });
            if (res.ok) {
              toast.success('Trip berhasil diselesaikan');
              queryClient.invalidateQueries({
                queryKey: queryKeys.guide.tripsDetail(tripId),
              });
              queryClient.invalidateQueries({
                queryKey: queryKeys.guide.trips.completionStatus(tripId),
              });
            } else {
              const body = (await res.json()) as {
                error?: string;
                message?: string;
                missingItems?: string[];
              };
              if (body.missingItems && body.missingItems.length > 0) {
                toast.error(
                  `${body.message || body.error || 'Gagal end trip'}: ${body.missingItems.join(', ')}`,
                  { duration: 6000 }
                );
              } else {
                toast.error(body.message || body.error || 'Gagal end trip');
              }
            }
          }
        }}
      />

      {/* Quick Actions Floating Button - Context-Aware */}
      {currentPhase !== 'pre_trip' && (
        <div className="fixed bottom-[72px] left-0 right-0 z-10 mx-auto max-w-md px-4">
          <Card className="border-0 shadow-2xl ring-1 ring-slate-200">
            <CardContent className="flex gap-2 p-2">
              {/* Lead Guide: Start Trip Button */}
              {isLeadGuide && currentPhase === 'before_departure' && (
                <Button
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 font-semibold text-white shadow-lg hover:from-emerald-700 hover:to-teal-700"
                  onClick={() => setReadinessDialogOpen(true)}
                  disabled={canStartTrip === false}
                >
                  <Play className="mr-2 h-4 w-4" />
                  Mulai Trip
                </Button>
              )}

              {/* During Trip: Quick Actions */}
              {currentPhase === 'during_trip' && (
                <>
                  <Button variant="outline" className="flex-1" asChild>
                    <Link
                      href={`/${locale}/guide/trips/${tripCode || tripId}/chat`}
                    >
                      <MessageSquare className="mr-2 h-4 w-4" />
                      <span className="hidden sm:inline">Chat</span>
                      <span className="sm:hidden">Chat</span>
                    </Link>
                  </Button>
                  <Button variant="outline" className="flex-1" asChild>
                    <Link
                      href={`/${locale}/guide/trips/${tripCode || tripId}/manifest`}
                    >
                      <Users className="mr-2 h-4 w-4" />
                      <span className="hidden sm:inline">Manifest</span>
                      <span className="sm:hidden">Tamu</span>
                    </Link>
                  </Button>
                  <Button variant="outline" className="flex-1" asChild>
                    <Link
                      href={`/${locale}/guide/trips/${tripCode || tripId}/documentation`}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      <span className="hidden sm:inline">Docs</span>
                      <span className="sm:hidden">Foto</span>
                    </Link>
                  </Button>
                </>
              )}

              {/* Post Trip: Upload Documentation Reminder */}
              {currentPhase === 'post_trip' && !manifest.documentationUrl && (
                <Button
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 font-semibold text-white"
                  asChild
                >
                  <Link
                    href={`/${locale}/guide/trips/${tripCode || tripId}/documentation`}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Dokumentasi
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
