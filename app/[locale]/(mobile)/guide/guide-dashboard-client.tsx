'use client';

/**
 * Guide Dashboard Client - Enhanced
 * Menampilkan trip aktif, statistik, dan quick actions dengan improvements:
 * - Enhanced contextual actions dengan time-based & trip-based prioritization
 * - Better empty states dengan CTAs
 * - Skeleton loaders untuk semua sections
 * - Compact grid layout dengan visual hierarchy
 * - Visual improvements (badges, animations, pulse untuk SOS)
 * - Offline indicators dan sync status
 * - Pull-to-refresh functionality
 * - Better error handling
 * - Accessibility improvements
 * - Performance optimizations
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    AlertTriangle,
    BarChart3,
    Calendar,
    CheckCircle,
    ChevronRight,
    Clock,
    GraduationCap,
    HelpCircle,
    MapPin,
    Pause,
    Play,
    RefreshCw,
    Settings,
    TrendingUp,
    Users,
    Wallet,
    XCircle
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';
import { Skeleton } from '@/components/ui/skeleton';
import {
    useGuideStats,
    useGuideStatus,
    useGuideTrips,
} from '@/hooks/use-guide-common';
import { useOfflineStatus } from '@/hooks/use-offline-status';
import queryKeys from '@/lib/queries/query-keys';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/utils/logger';

import { CareerOverviewWidget } from './widgets/career-overview-widget';
import { ChallengesWidget } from './widgets/challenges-widget';
import { SuperAppMenuGrid } from './widgets/super-app-menu-grid';
import { WeatherWidget } from './widgets/weather-widget';

// Stats Cards Component
function StatsCards({
  completedThisMonth,
  statsData,
  yearMonthKey,
}: {
  completedThisMonth: number;
  statsData: { averageRating: number; totalRatings: number } | undefined;
  yearMonthKey: string;
}) {
  const { data: monthlyData } = useQuery({
    queryKey: [...queryKeys.guide.insights.monthly(), yearMonthKey],
    queryFn: async () => {
      const res = await fetch(`/api/guide/insights/monthly?month=${yearMonthKey}`);
      if (!res.ok) return null;
      return res.json() as Promise<{
        summary: {
          totalTrips: number;
          totalGuests: number;
          totalIncome: number;
          totalPenalties: number;
          averageRating: number;
          totalRatings: number;
        };
      }>;
    },
    staleTime: 60000,
  });

  const monthlySummary = monthlyData?.summary;
  const totalGuests = monthlySummary?.totalGuests || 0;
  const totalIncome = monthlySummary?.totalIncome || 0;

  return (
    <div className="grid grid-cols-2 gap-3">
      <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-emerald-100/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-emerald-600">
                {completedThisMonth}
              </div>
              <div className="mt-1 text-xs font-medium text-slate-600">Trip Selesai</div>
              {totalGuests > 0 && (
                <div className="mt-1 text-xs text-slate-500">
                  {totalGuests} tamu total
                </div>
              )}
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
              <CheckCircle className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-amber-100/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4 text-amber-500" aria-hidden="true" />
                <span className="text-2xl font-bold text-amber-600">
                  {statsData?.averageRating.toFixed(1) ?? '0.0'}
                </span>
              </div>
              <div className="mt-1 text-xs font-medium text-slate-600">
                Rating Rata-rata
              </div>
              {statsData?.totalRatings ? (
                <div className="mt-1 text-xs text-slate-500">
                  {statsData.totalRatings} review
                </div>
              ) : null}
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
              <BarChart3 className="h-6 w-6 text-amber-600" />
            </div>
          </div>
        </CardContent>
      </Card>
      {totalIncome > 0 && (
        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xl font-bold text-blue-600">
                  Rp {Math.round(totalIncome).toLocaleString('id-ID')}
                </div>
                <div className="mt-1 text-xs font-medium text-slate-600">Pendapatan</div>
                <div className="mt-1 text-xs text-slate-500">Bulan ini</div>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10">
                <Wallet className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {monthlySummary && monthlySummary.totalPenalties > 0 && (
        <Card className="border-0 shadow-sm bg-gradient-to-br from-red-50 to-red-100/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xl font-bold text-red-600">
                  Rp {Math.round(monthlySummary.totalPenalties).toLocaleString('id-ID')}
                </div>
                <div className="mt-1 text-xs font-medium text-slate-600">Penalty</div>
                <div className="mt-1 text-xs text-slate-500">Bulan ini</div>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

type GuideDashboardClientProps = {
  userName: string;
  locale: string;
};


export function GuideDashboardClient({ userName, locale }: GuideDashboardClientProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { online, pending } = useOfflineStatus();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const touchStartY = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Use shared hooks
  const { data: statusData, isLoading: statusLoading, error: statusError, refetch: refetchStatus } = useGuideStatus();
  const { data: tripsData, isLoading: tripsLoading, error: tripsError, refetch: refetchTrips } = useGuideTrips();
  const { data: statsData, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useGuideStats();

  const activeTrip =
    tripsData?.trips.find((trip) => trip.status === 'ongoing') ??
    tripsData?.trips.find((trip) => trip.status === 'upcoming');

  const trips = tripsData?.trips ?? [];
  const now = new Date();
  const yearMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const completedThisMonth = trips.filter((trip) => {
    if (trip.status !== 'completed') return false;
    if (!trip.date) return false;
    const key = trip.date.slice(0, 7);
    return key === yearMonthKey;
  }).length;

  const currentStatus = statusData?.status.current_status ?? 'standby';

  const statusLabel =
    currentStatus === 'standby'
      ? 'Standby'
      : currentStatus === 'on_trip'
        ? 'Sedang Trip'
        : 'Tidak Tersedia';

  const statusTextClass =
    currentStatus === 'standby'
      ? 'text-emerald-700'
      : currentStatus === 'on_trip'
        ? 'text-blue-700'
        : 'text-slate-700';

  const updateStatus = async (next: 'standby' | 'on_trip' | 'not_available') => {
    if (currentStatus === next) return;
    try {
      await fetch('/api/guide/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      // Invalidate query to refetch status
      queryClient.invalidateQueries({ queryKey: queryKeys.guide.status() });
    } catch {
      // Error will be handled by UI
    }
  };

  const statusOptions = [
    { value: 'standby' as const, label: 'Standby', icon: Play, color: 'emerald' },
    { value: 'on_trip' as const, label: 'On Trip', icon: Pause, color: 'blue' },
    { value: 'not_available' as const, label: 'Tidak Tersedia', icon: XCircle, color: 'slate' },
  ];


  // Check onboarding status
  const { data: onboardingData } = useQuery<{
    steps: unknown[];
    currentProgress: { status: string; completion_percentage: number } | null;
  }>({
    queryKey: queryKeys.guide.onboarding.steps(),
    queryFn: async () => {
      const res = await fetch('/api/guide/onboarding/steps');
      if (!res.ok) return { steps: [], currentProgress: null };
      return (await res.json()) as { steps: unknown[]; currentProgress: { status: string; completion_percentage: number } | null };
    },
    staleTime: 300000, // 5 minutes
  });

  const needsOnboarding = onboardingData?.currentProgress?.status !== 'completed';
  const onboardingProgress = onboardingData?.currentProgress?.completion_percentage || 0;

  // Pull-to-refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetchStatus(),
        refetchTrips(),
        refetchStats(),
      ]);
    } catch (error) {
      logger.error('Failed to refresh dashboard', error);
    } finally {
      setIsRefreshing(false);
      setPullDistance(0);
      setIsPulling(false);
    }
  };

  // Pull-to-refresh touch handlers
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (container.scrollTop === 0 && e.touches[0]) {
        touchStartY.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (touchStartY.current === null || !e.touches[0]) return;
      
      const currentY = e.touches[0].clientY;
      const distance = currentY - touchStartY.current;

      if (container.scrollTop === 0 && distance > 0) {
        setIsPulling(true);
        const maxDistance = 80;
        setPullDistance(Math.min(distance, maxDistance));
      } else {
        setIsPulling(false);
        setPullDistance(0);
      }
    };

    const handleTouchEnd = () => {
      if (pullDistance > 50 && !isRefreshing) {
        void handleRefresh();
      } else {
        setPullDistance(0);
        setIsPulling(false);
      }
      touchStartY.current = null;
    };

    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchmove', handleTouchMove);
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pullDistance, isRefreshing]);


  return (
    <div
      ref={containerRef}
      className="relative space-y-6 pb-6"
      style={{
        transform: isPulling ? `translateY(${Math.min(pullDistance, 80)}px)` : 'translateY(0)',
        transition: isPulling ? 'none' : 'transform 0.3s ease-out',
      }}
    >
      {/* Pull-to-refresh indicator */}
      {isPulling && (
        <div className="absolute top-0 left-0 right-0 flex items-center justify-center py-2">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            {pullDistance > 50 ? (
              <>
                <RefreshCw className="h-4 w-4" />
                <span>Lepas untuk refresh</span>
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                <span>Tarik untuk refresh</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Refresh spinner */}
      {isRefreshing && (
        <div className="absolute top-0 left-0 right-0 flex items-center justify-center py-2 bg-white/80 backdrop-blur-sm z-10">
          <RefreshCw className="h-5 w-5 animate-spin text-emerald-600" />
        </div>
      )}

      {/* Onboarding Prompt */}
      {needsOnboarding && (
        <Link href={`/${locale}/guide/onboarding`} className="block" aria-label="Lengkapi onboarding">
          <Card className="border-0 shadow-sm bg-gradient-to-r from-emerald-500 to-emerald-600 cursor-pointer transition-all hover:shadow-md active:scale-[0.98]">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                  <GraduationCap className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white mb-1">Lengkapi Onboarding</h3>
                  <p className="text-sm text-emerald-50">
                    {onboardingProgress > 0
                      ? `${onboardingProgress}% selesai - Lanjutkan onboarding Anda`
                      : 'Mulai onboarding untuk mempersiapkan diri sebagai guide profesional'}
                  </p>
                  <div className="mt-2 relative h-1.5 w-full overflow-hidden rounded-full bg-white/20">
                    <div
                      className="h-full bg-white transition-all duration-300"
                      style={{ width: `${onboardingProgress}%` }}
                      role="progressbar"
                      aria-valuenow={onboardingProgress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    />
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-white flex-shrink-0" aria-hidden="true" />
              </div>
            </CardContent>
          </Card>
        </Link>
      )}

      {/* Greeting + Status Bar */}
      <div className="space-y-3">
        <div>
          <h1 className="text-2xl font-bold leading-tight text-slate-900">
            Halo, {userName}! 👋
          </h1>
          <p className="mt-1 text-sm text-slate-600">Siap untuk trip hari ini?</p>
        </div>

        {/* Status Card */}
        {statusError ? (
          <ErrorState
            message="Gagal memuat status"
            onRetry={() => void refetchStatus()}
            variant="inline"
          />
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              {/* Current Status Display */}
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span
                  className={cn(
                    'inline-flex h-2.5 w-2.5 flex-shrink-0 rounded-full',
                    currentStatus === 'standby' && 'bg-emerald-500',
                    currentStatus === 'on_trip' && 'bg-blue-500',
                    currentStatus === 'not_available' && 'bg-slate-400',
                  )}
                  aria-label={`Status: ${statusLabel}`}
                />
                <div className="flex min-w-0 flex-col">
                  <span className="text-xs font-medium text-slate-500">Status Saat Ini</span>
                  {statusLoading ? (
                    <Skeleton className="mt-1 h-4 w-20" />
                  ) : (
                    <span className={cn('text-sm font-semibold', statusTextClass)}>
                      {statusLabel}
                    </span>
                  )}
                </div>
              </div>

              {/* Status Dropdown Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      'flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 active:scale-95',
                      statusLoading && 'cursor-not-allowed opacity-50',
                    )}
                    disabled={statusLoading}
                    aria-label="Ubah status"
                    aria-haspopup="true"
                  >
                    <span>Ubah</span>
                    <ChevronRight className="h-3.5 w-3.5 rotate-90" aria-hidden="true" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[200px]">
                  {statusOptions.map((option) => {
                    const Icon = option.icon;
                    const isActive = option.value === currentStatus;
                    return (
                      <DropdownMenuItem
                        key={option.value}
                        className={cn(
                          'flex cursor-pointer items-center gap-3 py-2.5',
                          isActive && 'bg-slate-50',
                        )}
                        onSelect={(e) => {
                          e.preventDefault();
                          if (option.value !== currentStatus) {
                            void updateStatus(option.value);
                          }
                        }}
                        aria-label={option.label}
                      >
                        <Icon
                          className={cn(
                            'h-4 w-4 flex-shrink-0',
                            option.color === 'emerald' && 'text-emerald-600',
                            option.color === 'blue' && 'text-blue-600',
                            option.color === 'slate' && 'text-slate-600',
                          )}
                          aria-hidden="true"
                        />
                        <span className="flex-1 font-medium">{option.label}</span>
                        {isActive && (
                          <CheckCircle className="h-4 w-4 flex-shrink-0 text-emerald-600" aria-hidden="true" />
                        )}
                      </DropdownMenuItem>
                    );
                  })}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="flex cursor-pointer items-center gap-3 py-2.5"
                    onSelect={() => {
                      router.push(`/${locale}/guide/status`);
                    }}
                    aria-label="Atur ketersediaan"
                  >
                    <Settings className="h-4 w-4 flex-shrink-0 text-slate-600" aria-hidden="true" />
                    <span className="flex-1 font-medium text-slate-700">Atur Ketersediaan</span>
                    <ChevronRight className="h-4 w-4 flex-shrink-0 text-slate-400" aria-hidden="true" />
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}
      </div>

      {/* Weather Widget */}
      <WeatherWidget locale={locale} />

      {/* Active Trip Card */}
      {tripsLoading ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <LoadingState variant="skeleton-card" lines={4} />
          </CardContent>
        </Card>
      ) : tripsError ? (
        <ErrorState
          message="Gagal memuat trip"
          onRetry={() => void refetchTrips()}
          variant="card"
        />
      ) : activeTrip ? (
        (() => {
          const tripName = (activeTrip as { name?: string }).name || activeTrip.trip_code || activeTrip.code || 'Trip';
          const destination = (activeTrip as { destination?: string | null }).destination;
          const duration = (activeTrip as { duration?: number | null }).duration;
          const meetingPoint = (activeTrip as { meeting_point?: string | null }).meeting_point;
          const tripDate = activeTrip.date ? new Date(activeTrip.date) : null;
          const formattedDate = tripDate
            ? tripDate.toLocaleDateString('id-ID', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })
            : activeTrip.date;

          return (
            <Link
              href={`/${locale}/guide/trips/${activeTrip.trip_code || activeTrip.code || activeTrip.id}`}
              className="block transition-transform active:scale-[0.98]"
              aria-label={`Trip aktif: ${tripName}`}
            >
              <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100/50 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold text-emerald-800">
                      Trip Aktif
                    </CardTitle>
                    <span className="rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-medium text-white shadow-sm">
                      {activeTrip.status === 'ongoing' ? 'Berlangsung' : 'Akan Berjalan'}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold leading-tight text-slate-900">
                      {tripName}
                    </h3>
                    {destination && (
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600">
                        <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate">{destination}</span>
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {tripDate && (
                      <div className="flex items-center gap-2.5 text-sm text-slate-600">
                        <Calendar className="h-4 w-4 flex-shrink-0 text-emerald-600" aria-hidden="true" />
                        <span className="truncate">{formattedDate}</span>
                      </div>
                    )}
                    {duration && (
                      <div className="flex items-center gap-2.5 text-sm text-slate-600">
                        <Clock className="h-4 w-4 flex-shrink-0 text-emerald-600" aria-hidden="true" />
                        <span>{duration} hari</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2.5 text-sm text-slate-600">
                      <Users className="h-4 w-4 flex-shrink-0 text-emerald-600" aria-hidden="true" />
                      <span>{activeTrip.guests || 0} tamu</span>
                    </div>
                    {meetingPoint && (
                      <div className="flex items-center gap-2.5 text-sm text-slate-600">
                        <MapPin className="h-4 w-4 flex-shrink-0 text-emerald-600" aria-hidden="true" />
                        <span className="truncate">{meetingPoint}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-end gap-1 pt-1 text-emerald-700">
                    <span className="text-sm font-medium">Lihat Detail</span>
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })()
      ) : null}

      {/* Super App Menu Grid */}
      <div>
        <div className="mb-3 flex items-center justify-between px-1">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            MENU APLIKASI
          </h2>
        </div>
        <SuperAppMenuGrid locale={locale} />
      </div>


      {/* Offline Status Banner */}
      {!online && pending > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-amber-900">Mode Offline</p>
                <p className="text-[10px] text-amber-700">
                  {pending} {pending === 1 ? 'aksi' : 'aksi'} menunggu sinkronisasi
                </p>
              </div>
              <Link
                href={`/${locale}/guide/sync-status`}
                className="text-[10px] font-medium text-amber-700 underline"
                aria-label="Lihat status sinkronisasi"
              >
                Lihat
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Learning Hub Entry */}
      <div>
        <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
          PENGEMBANGAN DIRI
        </h2>
        <Link
          href={`/${locale}/guide/learning`}
          className="block transition-transform active:scale-[0.98]"
          aria-label="Buka Learning Hub"
        >
          <Card className="border-0 shadow-sm">
            <CardContent className="flex items-center justify-between gap-3 p-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Learning Hub Guide
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  FAQ, SOP, dan tips singkat untuk Guide.
                </p>
              </div>
              <div className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-700">
                Buka
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Challenges Widget */}
      <ChallengesWidget locale={locale} />

      {/* Career Overview Widget */}
      <div>
        <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
          KARIR & PRESTASI
        </h2>
        <CareerOverviewWidget locale={locale} variant="compact" />
      </div>

      {/* Stats - Enhanced */}
      <div>
        <div className="mb-3 flex items-center justify-between px-1">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            STATISTIK BULAN INI
          </h2>
          <Link
            href={`/${locale}/guide/insights`}
            className="text-xs font-medium text-emerald-600 transition-colors hover:text-emerald-700"
            aria-label="Lihat detail insight & performance"
          >
            Lihat Semua
          </Link>
        </div>
        {statsLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <Skeleton className="h-8 w-12 mb-2" />
                  <Skeleton className="h-3 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : statsError ? (
          <ErrorState
            message="Gagal memuat statistik"
            onRetry={() => void refetchStats()}
            variant="card"
          />
        ) : (
          <StatsCards
            completedThisMonth={completedThisMonth}
            statsData={statsData}
            yearMonthKey={yearMonthKey}
          />
        )}
      </div>

      {/* Upcoming Trips */}
      <div>
        <div className="mb-3 flex items-center justify-between px-1">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            JADWAL MENDATANG
          </h2>
          <Link
            href={`/${locale}/guide/trips`}
            className="text-xs font-medium text-emerald-600 transition-colors hover:text-emerald-700"
            aria-label="Lihat semua trip"
          >
            Lihat Semua
          </Link>
        </div>
        {tripsLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="border-0 shadow-sm">
                <CardContent className="p-3">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : tripsError ? (
          <ErrorState
            message="Gagal memuat jadwal trip"
            onRetry={() => void refetchTrips()}
            variant="card"
          />
        ) : trips.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="Belum ada trip yang dijadwalkan"
            description="Trip yang dijadwalkan akan muncul di sini"
            action={
              <Link
                href={`/${locale}/help#getting-started`}
                className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600"
              >
                <HelpCircle className="h-4 w-4" aria-hidden="true" />
                Pelajari cara mendapatkan trip
              </Link>
            }
            variant="subtle"
          />
        ) : (
          <div className="space-y-2" role="list" aria-label="Daftar trip mendatang">
            {trips
              .filter((trip) => trip.status === 'upcoming')
              .slice(0, 3)
              .map((trip) => {
                const tripDate = trip.date ? new Date(trip.date) : null;
                const formattedDate = tripDate
                  ? tripDate.toLocaleDateString('id-ID', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  : trip.date;
                const tripName = (trip as { name?: string }).name || trip.trip_code || trip.code || 'Trip';
                const destination = (trip as { destination?: string | null }).destination;
                const duration = (trip as { duration?: number | null }).duration;
                const meetingPoint = (trip as { meeting_point?: string | null }).meeting_point;

                return (
                  <Link
                    key={trip.id}
                    href={`/${locale}/guide/trips/${trip.trip_code || trip.code || trip.id}`}
                    className="block rounded-lg border border-slate-200 bg-white p-4 transition-all hover:border-emerald-300 hover:bg-emerald-50/30 hover:shadow-sm active:scale-[0.98]"
                    role="listitem"
                    aria-label={`Trip ${tripName} pada ${formattedDate}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2">
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-100">
                            <Calendar className="h-5 w-5 text-emerald-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-slate-900 leading-tight">
                              {tripName}
                            </div>
                            {destination && (
                              <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-600">
                                <MapPin className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{destination}</span>
                              </div>
                            )}
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formattedDate}
                              </span>
                              {duration && (
                                <>
                                  <span aria-hidden="true">•</span>
                                  <span>{duration} hari</span>
                                </>
                              )}
                              <span aria-hidden="true">•</span>
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {trip.guests || 0} tamu
                              </span>
                            </div>
                            {meetingPoint && (
                              <div className="mt-2 text-xs text-slate-500">
                                <span className="font-medium">Meeting Point:</span> {meetingPoint}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 flex-shrink-0 text-slate-400 mt-1" aria-hidden="true" />
                    </div>
                  </Link>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
