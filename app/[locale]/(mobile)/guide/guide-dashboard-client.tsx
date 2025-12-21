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
    AlertCircle,
    AlertTriangle,
    BarChart3,
    Bell,
    Calendar,
    Camera,
    CheckCircle,
    ChevronRight,
    ClipboardList,
    Clock,
    GraduationCap,
    HelpCircle,
    MapPin,
    Pause,
    Play,
    RefreshCw,
    Settings,
    TrendingUp,
    Upload,
    Users,
    Wallet,
    XCircle
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
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

import type { GreetingData, OnboardingData, WeatherAlert } from '@/types/guide';
import { ChallengesWidget } from './widgets/challenges-widget';
import { PromoUpdatesWidget } from './widgets/promo-updates-widget';
import { RewardPointsWidget } from './widgets/reward-points-widget';
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
                  {(statsData?.averageRating ?? 0).toFixed(1)}
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

  // State for real-time countdown updates
  const [, setCountdownTick] = useState(0);
  
  // Update countdown every second for pending confirmation trips
  useEffect(() => {
    const hasPendingConfirmation = trips.some(
      (trip) => trip.assignment_status === 'pending_confirmation' && trip.confirmation_deadline
    );
    
    if (!hasPendingConfirmation) return;

    const interval = setInterval(() => {
      setCountdownTick((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [trips]);

  const completedThisMonth = trips.filter((trip) => {
    if (trip.status !== 'completed') return false;
    if (!trip.date) return false;
    const key = trip.date.slice(0, 7);
    return key === yearMonthKey;
  }).length;

  const currentStatus = statusData?.status?.current_status ?? 'standby';

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

  // Fetch notifications for urgent alerts
  const { data: notificationsData } = useQuery({
    queryKey: [...queryKeys.guide.notifications(), 'urgent'],
    queryFn: async () => {
      const res = await fetch('/api/guide/notifications?limit=10');
      if (!res.ok) return null;
      const data = await res.json() as { notifications: Array<{ id: string; type: string; title: string; message: string; created_at: string; read: boolean; is_urgent?: boolean }> };
      return data.notifications.filter((n) => !n.read && (n.is_urgent || n.type === 'trip_assignment' || n.type === 'deadline'));
    },
    staleTime: 60000, // 1 minute
  });

  // Fetch can-start data for active trip
  const { data: canStartData } = useQuery({
    queryKey: ['guide', 'trip', 'can-start', activeTrip?.id],
    queryFn: async () => {
      if (!activeTrip?.id) return null;
      const res = await fetch(`/api/guide/trips/${activeTrip.id}/can-start`);
      if (!res.ok) return null;
      return await res.json() as {
        can_start: boolean;
        reasons?: string[];
        attendance_checked_in: boolean;
        facility_checklist: { complete: boolean; checked: number; total: number };
        equipment_checklist: { complete: boolean; checked: number; total: number };
        risk_assessment: { exists: boolean; safe: boolean };
        certifications_valid: boolean;
        manifest: { boarded: number; total: number; percentage: number };
      };
    },
    enabled: !!activeTrip?.id,
    staleTime: 30000, // 30 seconds
  });

  // Fetch trip crew data to check if user is lead guide
  const { data: crewData } = useQuery({
    queryKey: ['guide', 'trip', 'crew', activeTrip?.id],
    queryFn: async () => {
      if (!activeTrip?.id) return null;
      const res = await fetch(`/api/guide/crew/trip/${activeTrip.id}`);
      if (!res.ok) return null;
      return await res.json() as {
        currentUserRole: string | null;
        isLeadGuide: boolean;
      };
    },
    enabled: !!activeTrip?.id,
    staleTime: 300000, // 5 minutes
  });

  // Fetch weather alerts
  const { data: weatherAlerts } = useQuery({
    queryKey: [...queryKeys.guide.all, 'weather', 'alerts'],
    queryFn: async () => {
      const res = await fetch('/api/guide/weather?lat=-5.45&lng=105.27');
      if (!res.ok) return null;
      const data = await res.json() as { alerts?: Array<{ title: string; description: string; severity: string }> };
      return data.alerts && data.alerts.length > 0 ? data.alerts : null;
    },
    staleTime: 300000, // 5 minutes
  });

  // Fetch wallet analytics for today's earnings
  const { data: walletAnalytics } = useQuery({
    queryKey: ['guide', 'wallet', 'analytics', 'today'],
    queryFn: async () => {
      const res = await fetch('/api/guide/wallet/analytics');
      if (!res.ok) return null;
      return await res.json() as { today: { amount: number } };
    },
    staleTime: 60000, // 1 minute
  });

  // Fetch AI-powered dynamic greeting
  const { data: greetingData } = useQuery<GreetingData | null>({
    queryKey: ['guide', 'greeting', 'dynamic'],
    queryFn: async () => {
      const res = await fetch('/api/guide/greeting');
      if (!res.ok) return null;
      return await res.json() as GreetingData;
    },
    staleTime: 300000, // 5 minutes (greeting doesn't need to update too frequently)
    refetchOnWindowFocus: false,
  });

  const isLeadGuide = crewData?.isLeadGuide ?? false;
  const canStartTrip = canStartData?.can_start ?? false;

  // Prepare recent activity data
  const recentTrips = trips.filter((trip) => trip.status === 'completed').slice(0, 3);
  const recentActivity = [
    ...recentTrips.map((trip) => ({
      type: 'trip_completed' as const,
      title: 'Trip Selesai',
      message: `${(trip as { name?: string }).name || trip.trip_code || trip.code || 'Trip'} telah selesai`,
      date: trip.date,
      tripId: trip.id,
    })),
  ].sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.date ? new Date(b.date).getTime() : 0;
    return dateB - dateA;
  }).slice(0, 5);

  // Helper function to get time remaining for confirmation deadline
  const getConfirmationTimeRemaining = (deadline: string | null | undefined): string | null => {
    if (!deadline) return null;
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diff = deadlineDate.getTime() - now.getTime();

    if (diff <= 0) return 'Deadline lewat';
    if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))} menit lagi`;
    if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))} jam lagi`;
    return `${Math.floor(diff / (24 * 60 * 60 * 1000))} hari lagi`;
  };

  // Prepare deadline cards data
  const upcomingTrips = trips.filter((trip) => trip.status === 'upcoming').slice(0, 3);
  const deadlines = upcomingTrips
    .map((trip) => {
      const tripDate = trip.date ? new Date(trip.date) : null;
      if (!tripDate) return null;
      const now = new Date();
      const diffMs = tripDate.getTime() - now.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours > 0 && diffHours <= 48) {
        return { trip, hours: diffHours, tripName: (trip as { name?: string }).name || trip.trip_code || trip.code || 'Trip' };
      }
      return null;
    })
    .filter((d): d is { trip: typeof upcomingTrips[0]; hours: number; tripName: string } => d !== null);

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
  const { data: onboardingData } = useQuery<OnboardingData>({
    queryKey: queryKeys.guide.onboarding.steps(),
    queryFn: async () => {
      const res = await fetch('/api/guide/onboarding/steps');
      if (!res.ok) return { steps: [], currentProgress: null };
      return (await res.json()) as OnboardingData;
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

      {/* Dynamic AI-Powered Greeting */}
      <div>
        <h1 className="text-2xl font-bold leading-tight text-slate-900">
          {greetingData?.greeting && greetingData.greeting.includes(userName)
            ? greetingData.greeting
            : greetingData?.greeting
              ? `${greetingData.greeting.replace(/\s*!?\s*👋?\s*$/, '').trim()}, ${userName}! 👋`
              : `Halo, ${userName}! 👋`}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {greetingData?.subtitle || 'Siap untuk petualangan hari ini?'}
        </p>
      </div>

      {/* Urgent Notifications/Alerts Banner */}
      {notificationsData && notificationsData.length > 0 && (
        <Card className="border-red-200 bg-gradient-to-r from-red-50 to-orange-50 shadow-sm">
          <CardContent className="p-3">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-red-500">
                <Bell className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-red-900 mb-1">Penting!</p>
                <div className="space-y-1">
                  {notificationsData.slice(0, 2).map((notif) => (
                    <p key={notif.id} className="text-xs text-red-800 line-clamp-2">
                      {notif.title}: {notif.message}
                    </p>
                  ))}
                </div>
                {notificationsData.length > 2 && (
                  <Link
                    href={`/${locale}/guide/notifications`}
                    className="mt-2 inline-block text-xs font-medium text-red-700 underline"
                  >
                    Lihat {notificationsData.length - 2} notifikasi lainnya
                  </Link>
                )}
              </div>
              <Link
                href={`/${locale}/guide/notifications`}
                className="flex-shrink-0 text-xs font-medium text-red-700"
              >
                Lihat
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Unified Stats + Status + Weather Widget - Enhanced & Compact */}
      {statusError ? (
        <ErrorState
          message="Gagal memuat status"
          onRetry={() => void refetchStatus()}
          variant="inline"
        />
      ) : (
        <Card className="border-slate-200 bg-white shadow-sm overflow-hidden">
          {/* Quick Stats Row - Compact & Unified dengan border seamless */}
          <div className="grid grid-cols-3 divide-x divide-slate-200 border-b border-slate-200">
            <Link href={`/${locale}/guide/wallet`} className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-3 hover:from-emerald-100 hover:to-emerald-200/50 transition-colors group">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-slate-600 font-medium">Hari Ini</span>
                <ChevronRight className="h-3 w-3 text-slate-400 group-hover:text-slate-600 transition-colors" />
              </div>
              {statsLoading ? (
                <Skeleton className="h-4 w-16" />
              ) : (
                <div className="text-sm font-bold text-emerald-600">
                  Rp {(walletAnalytics?.today?.amount || 0).toLocaleString('id-ID')}
                </div>
              )}
            </Link>
            <Link href={`/${locale}/guide/insights`} className="bg-gradient-to-br from-blue-50 to-blue-100/50 p-3 hover:from-blue-100 hover:to-blue-200/50 transition-colors group">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-slate-600 font-medium">Bulan Ini</span>
                <ChevronRight className="h-3 w-3 text-slate-400 group-hover:text-slate-600 transition-colors" />
              </div>
              {tripsLoading ? (
                <Skeleton className="h-4 w-12" />
              ) : (
                <div className="text-sm font-bold text-blue-600">
                  {completedThisMonth} Trip
                </div>
              )}
            </Link>
            <Link href={`/${locale}/guide/insights`} className="bg-gradient-to-br from-amber-50 to-amber-100/50 p-3 hover:from-amber-100 hover:to-amber-200/50 transition-colors group">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-slate-600 font-medium">Rating</span>
                <ChevronRight className="h-3 w-3 text-slate-400 group-hover:text-slate-600 transition-colors" />
              </div>
              {statsLoading ? (
                <Skeleton className="h-4 w-12" />
              ) : (
                <div className="text-sm font-bold text-amber-600">
                  {(statsData?.averageRating ?? 0).toFixed(1)} ⭐
                </div>
              )}
            </Link>
          </div>

          {/* Status + Weather Row - Unified dengan padding yang sama */}
          <CardContent className="p-3">
            <div className="flex items-center justify-between gap-3">
              {/* Status Section */}
              <div className="flex min-w-0 flex-1 items-center justify-between gap-2.5">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span
                    className={cn(
                      'inline-flex h-2 w-2 flex-shrink-0 rounded-full',
                      currentStatus === 'standby' && 'bg-emerald-500',
                      currentStatus === 'on_trip' && 'bg-blue-500',
                      currentStatus === 'not_available' && 'bg-slate-400',
                    )}
                    aria-label={`Status: ${statusLabel}`}
                  />
                  <div className="flex min-w-0 flex-col">
                    <span className="text-[10px] font-medium text-slate-500">Status</span>
                    {statusLoading ? (
                      <Skeleton className="mt-0.5 h-3.5 w-16" />
                    ) : (
                      <span className={cn('text-xs font-semibold leading-tight', statusTextClass)}>
                        {statusLabel}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Status Dropdown Menu - Di kanan section Status */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-50 active:scale-95',
                        statusLoading && 'cursor-not-allowed opacity-50',
                      )}
                      disabled={statusLoading}
                      aria-label="Ubah status"
                      aria-haspopup="true"
                    >
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

              {/* Divider */}
              <div className="h-6 w-px bg-slate-200" />

              {/* Weather Section */}
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <WeatherWidget locale={locale} compact />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Trip Card - Ultra Compact & Unified Design */}
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
        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/30 shadow-md overflow-hidden">
          {/* Compact Header dengan semua info penting */}
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-3">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-emerald-100">Trip Aktif</span>
                  <span className="h-1 w-1 rounded-full bg-emerald-200" />
                  <span className="text-xs text-emerald-50">
                    {activeTrip.status === 'ongoing' ? 'Berlangsung' : 'Akan Berjalan'}
                  </span>
                </div>
                <h3 className="text-lg font-bold leading-tight text-white mb-1 truncate">
                  {(activeTrip as { name?: string }).name || activeTrip.trip_code || activeTrip.code || 'Trip'}
                </h3>
                {(activeTrip as { destination?: string | null }).destination && (
                  <p className="flex items-center gap-1 text-xs text-emerald-50 truncate">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{(activeTrip as { destination?: string | null }).destination}</span>
                  </p>
                )}
              </div>
              {/* Quick Readiness Badge untuk upcoming trip */}
              {activeTrip.status === 'upcoming' && canStartData && (
                <div className={cn(
                  'flex-shrink-0 rounded-lg px-2 py-1.5 text-center min-w-[60px]',
                  canStartTrip 
                    ? 'bg-emerald-400/20 backdrop-blur-sm border border-emerald-300/30' 
                    : 'bg-red-400/20 backdrop-blur-sm border border-red-300/30'
                )}>
                  <div className={cn('text-[10px] font-semibold mb-0.5', canStartTrip ? 'text-emerald-100' : 'text-red-100')}>
                    {canStartTrip ? 'Siap' : 'Belum Siap'}
                  </div>
                  {!canStartTrip && canStartData.reasons && (
                    <div className="text-[9px] text-red-100/80">
                      {canStartData.reasons.length} syarat
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Compact Info Bar - Semua info dalam satu baris */}
            <div className="flex items-center gap-3 text-xs text-emerald-50/90 flex-wrap">
              {activeTrip.date && (() => {
                const tripDate = new Date(activeTrip.date);
                const formattedDate = tripDate.toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                });
                return (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{formattedDate}</span>
                  </div>
                );
              })()}
              {(activeTrip as { duration?: number | null }).duration && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{(activeTrip as { duration?: number | null }).duration}d</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span>{activeTrip.guests || 0} tamu</span>
              </div>
              {/* Readiness Progress untuk upcoming trip */}
              {activeTrip.status === 'upcoming' && canStartData && (() => {
                const totalChecks = 2 + (canStartData.facility_checklist.total > 0 ? 1 : 0) + (canStartData.equipment_checklist.total > 0 ? 1 : 0);
                const completedChecks = 
                  (canStartData.attendance_checked_in ? 1 : 0) +
                  (canStartData.facility_checklist.complete ? 1 : 0) +
                  (canStartData.equipment_checklist.complete ? 1 : 0) +
                  (canStartData.risk_assessment.safe ? 1 : 0) +
                  (canStartData.certifications_valid ? 1 : 0);
                const progress = totalChecks > 0 ? (completedChecks / totalChecks) * 100 : 0;
                return (
                  <div className="flex items-center gap-1.5 ml-auto">
                    <div className="w-16 h-1.5 bg-white/20 rounded-full overflow-hidden">
                      <div 
                        className={cn('h-full transition-all', canStartTrip ? 'bg-emerald-200' : 'bg-red-200')}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-medium">{completedChecks}/{totalChecks}</span>
                  </div>
                );
              })()}
            </div>
          </div>

          <CardContent className="p-3 space-y-2.5">
            {/* Action Buttons - Minimalis dengan 3 tombol */}
            <div className="grid grid-cols-3 gap-2">
              {/* Primary Action - Start Trip (upcoming) atau Manifest (ongoing) */}
              {isLeadGuide && activeTrip.status === 'upcoming' ? (
                <Button
                  onClick={() => router.push(`/${locale}/guide/trips/${activeTrip.trip_code || activeTrip.code || activeTrip.id}`)}
                  className={cn(
                    'h-14 flex-col gap-1 py-0 text-white shadow-sm transition-all',
                    canStartTrip 
                      ? 'bg-emerald-600 hover:bg-emerald-700 active:scale-95' 
                      : 'bg-slate-400 hover:bg-slate-500 cursor-not-allowed opacity-75'
                  )}
                  disabled={!canStartTrip}
                >
                  <Play className="h-4 w-4" />
                  <span className="text-[10px] font-semibold leading-tight">Start Trip</span>
                </Button>
              ) : activeTrip.status === 'ongoing' ? (
                <Link href={`/${locale}/guide/trips/${activeTrip.trip_code || activeTrip.code || activeTrip.id}/manifest`} className="block">
                  <Button className="h-14 flex-col gap-1 py-0 w-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all active:scale-95">
                    <ClipboardList className="h-4 w-4" />
                    <span className="text-[10px] font-semibold leading-tight">Manifest</span>
                  </Button>
                </Link>
              ) : (
                <div className="h-14" />
              )}
              
              {/* Check-in Button */}
              <Link href={`/${locale}/guide/attendance?trip=${activeTrip.trip_code || activeTrip.code || activeTrip.id}`} className="block">
                <Button variant="outline" className="h-14 flex-col gap-1 py-0 w-full border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95">
                  <MapPin className="h-4 w-4 text-slate-700" />
                  <span className="text-[10px] font-semibold leading-tight text-slate-700">Check-in</span>
                </Button>
              </Link>
              
              {/* Detail Trip Button */}
              <Link href={`/${locale}/guide/trips/${activeTrip.trip_code || activeTrip.code || activeTrip.id}`} className="block">
                <Button variant="outline" className="h-14 flex-col gap-1 py-0 w-full border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95">
                  <ChevronRight className="h-4 w-4 text-slate-700" />
                  <span className="text-[10px] font-semibold leading-tight text-slate-700">Detail</span>
                </Button>
              </Link>
            </div>

            {/* Compact Readiness Checklist - Collapsible atau inline */}
            {activeTrip.status === 'upcoming' && canStartData && (
              <details className="group">
                <summary className="cursor-pointer list-none">
                  <div className="flex items-center justify-between text-xs py-1.5 px-2 rounded-md hover:bg-slate-50 transition-colors">
                    <span className="font-medium text-slate-700">Detail Kesiapan</span>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-400 transition-transform group-open:rotate-90" />
                  </div>
                </summary>
                <div className="mt-1.5 space-y-1.5 pl-2 pr-1">
                  <div className="flex items-center justify-between text-[11px] py-1">
                    <span className="text-slate-600">Check-in</span>
                    <span className={cn('font-medium flex items-center gap-1', canStartData.attendance_checked_in ? 'text-emerald-600' : 'text-red-600')}>
                      {canStartData.attendance_checked_in ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        <XCircle className="h-3 w-3" />
                      )}
                    </span>
                  </div>
                  {canStartData.facility_checklist.total > 0 && (
                    <div className="flex items-center justify-between text-[11px] py-1">
                      <span className="text-slate-600">Facility</span>
                      <span className={cn('font-medium', canStartData.facility_checklist.complete ? 'text-emerald-600' : 'text-red-600')}>
                        {canStartData.facility_checklist.checked}/{canStartData.facility_checklist.total}
                      </span>
                    </div>
                  )}
                  {canStartData.equipment_checklist.total > 0 && (
                    <div className="flex items-center justify-between text-[11px] py-1">
                      <span className="text-slate-600">Equipment</span>
                      <span className={cn('font-medium', canStartData.equipment_checklist.complete ? 'text-emerald-600' : 'text-red-600')}>
                        {canStartData.equipment_checklist.checked}/{canStartData.equipment_checklist.total}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-[11px] py-1">
                    <span className="text-slate-600">Risk Assessment</span>
                    <span className={cn('font-medium flex items-center gap-1', canStartData.risk_assessment.safe ? 'text-emerald-600' : 'text-red-600')}>
                      {canStartData.risk_assessment.safe ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        <XCircle className="h-3 w-3" />
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] py-1">
                    <span className="text-slate-600">Sertifikasi</span>
                    <span className={cn('font-medium flex items-center gap-1', canStartData.certifications_valid ? 'text-emerald-600' : 'text-red-600')}>
                      {canStartData.certifications_valid ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        <XCircle className="h-3 w-3" />
                      )}
                    </span>
                  </div>
                </div>
              </details>
            )}
          </CardContent>
        </Card>
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

      {/* Countdown/Deadline Cards - Hanya untuk trip yang BUKAN activeTrip */}
      {deadlines.filter((d) => d.trip.id !== activeTrip?.id).length > 0 && (
        <div className="space-y-2">
          {deadlines
            .filter((d) => d.trip.id !== activeTrip?.id)
            .map((deadline) => (
              <Card key={deadline.trip.id} className="border-amber-200 bg-amber-50/50">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-amber-900">
                        Trip akan dimulai dalam {deadline.hours} jam
                      </p>
                      <p className="mt-0.5 text-xs text-amber-700 truncate">
                        {deadline.tripName}
                      </p>
                    </div>
                    <Link href={`/${locale}/guide/trips/${deadline.trip.trip_code || deadline.trip.code || deadline.trip.id}`}>
                      <Button size="sm" variant="outline" className="h-8 border-amber-300 text-amber-700 hover:bg-amber-100">
                        Lihat
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      {/* Upcoming Trips - Filter out activeTrip dan trip yang sudah di Countdown Cards */}
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
        ) : (() => {
          const deadlineTripIds = new Set(deadlines.map((d) => d.trip.id));
          
          // Filter upcoming trips (exclude activeTrip dan trip yang sudah di Countdown Cards)
          const upcomingTripsFiltered = trips
            .filter((trip) => {
              if (trip.id === activeTrip?.id) return false;
              if (deadlineTripIds.has(trip.id)) return false;
              return trip.status === 'upcoming';
            });

          // Separate pending confirmation trips and regular upcoming trips
          // Prioritize pending confirmation trips (show them first)
          const pendingConfirmationTrips = upcomingTripsFiltered.filter(
            (trip) => trip.assignment_status === 'pending_confirmation'
          );
          const regularUpcomingTrips = upcomingTripsFiltered.filter(
            (trip) => trip.assignment_status !== 'pending_confirmation'
          );

          // Combine: pending confirmation first, then regular upcoming trips
          const sortedUpcomingTrips = [...pendingConfirmationTrips, ...regularUpcomingTrips].slice(0, 3);

          if (sortedUpcomingTrips.length === 0) {
            // No upcoming trips to show - check if there are any upcoming trips at all
            const hasAnyUpcomingTrips = trips.some((trip) => trip.status === 'upcoming');
            
            if (!hasAnyUpcomingTrips) {
              // No upcoming trips at all - show empty state
              return (
                <EmptyState
                  icon={Calendar}
                  title="Belum ada trip yang dijadwalkan"
                  description="Trip yang dijadwalkan akan muncul di sini setelah ditugaskan ke Anda."
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
              );
            } else {
              // Has upcoming trips but all are already shown in active/deadline sections
              return (
                <EmptyState
                  icon={Calendar}
                  title="Belum ada trip yang dijadwalkan"
                  description="Trip yang dijadwalkan akan muncul di sini setelah ditugaskan ke Anda."
                  variant="subtle"
                />
              );
            }
          }

          return (
            <div className="space-y-2" role="list" aria-label="Daftar trip mendatang">
              {sortedUpcomingTrips.map((trip) => {
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
                const isPendingConfirmation = trip.assignment_status === 'pending_confirmation';
                const confirmationTimeRemaining = isPendingConfirmation 
                  ? getConfirmationTimeRemaining(trip.confirmation_deadline || null)
                  : null;

                return (
                  <Link
                    key={trip.id}
                    href={`/${locale}/guide/trips/${trip.trip_code || trip.code || trip.id}`}
                    className={cn(
                      'block rounded-lg border p-4 transition-all hover:shadow-sm active:scale-[0.98]',
                      isPendingConfirmation
                        ? 'border-amber-300 bg-gradient-to-br from-amber-50 via-amber-50/50 to-orange-50/30 hover:border-amber-400'
                        : 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/30'
                    )}
                    role="listitem"
                    aria-label={`Trip ${tripName} pada ${formattedDate}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2">
                          <div className={cn(
                            'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg',
                            isPendingConfirmation
                              ? 'bg-amber-100'
                              : 'bg-emerald-100'
                          )}>
                            {isPendingConfirmation ? (
                              <AlertCircle className="h-5 w-5 text-amber-600" />
                            ) : (
                              <Calendar className="h-5 w-5 text-emerald-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-2">
                              <div className="font-semibold text-slate-900 leading-tight flex-1 min-w-0">
                                {tripName}
                              </div>
                              {isPendingConfirmation && (
                                <div className="flex-shrink-0 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                                  Butuh Konfirmasi
                                </div>
                              )}
                            </div>
                            {isPendingConfirmation && confirmationTimeRemaining && (
                              <div className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-amber-700">
                                <Clock className="h-3 w-3" />
                                <span>{confirmationTimeRemaining}</span>
                              </div>
                            )}
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
          );
        })()}
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

      {/* Recent Activity Feed */}
      {recentActivity.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between px-1">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              AKTIVITAS TERBARU
            </h2>
          </div>
          <div className="space-y-2">
            {recentActivity.map((activity, idx) => (
              <Card key={idx} className="border-0 shadow-sm">
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-100">
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-900">{activity.title}</p>
                      <p className="mt-0.5 text-xs text-slate-600">{activity.message}</p>
                      {activity.date && (
                        <p className="mt-1 text-[10px] text-slate-500">
                          {new Date(activity.date).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Reward Points Widget */}
      <RewardPointsWidget locale={locale} />

      {/* Challenges Widget */}
      <ChallengesWidget locale={locale} />

      {/* Promo & Updates Widget - Di paling bawah */}
      <PromoUpdatesWidget locale={locale} />
    </div>
  );
}
