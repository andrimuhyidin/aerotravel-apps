'use client';

/**
 * Guide Dashboard Client
 * Menampilkan trip aktif, statistik, dan quick actions
 */

import { useQuery } from '@tanstack/react-query';
import {
    AlertTriangle,
    BarChart3,
    Calendar,
    CheckCircle,
    ChevronRight,
    ClipboardList,
    Clock,
    FileText,
    MapPin,
    Megaphone,
    Pause,
    Play,
    Settings,
    Users,
    Wallet,
    XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useOfflineStatus } from '@/hooks/use-offline-status';
import queryKeys from '@/lib/queries/query-keys';
import { cn } from '@/lib/utils';

type GuideDashboardClientProps = {
  userName: string;
  locale: string;
};

type GuideStatusResponse = {
  status: {
    current_status?: 'standby' | 'on_trip' | 'not_available';
  };
};

type GuideStatsResponse = {
  averageRating: number;
  totalRatings: number;
  totalTrips: number;
};

type GuideTrip = {
  id: string;
  code: string;
  name: string;
  date: string;
  guests: number;
  status: 'ongoing' | 'upcoming' | 'completed' | 'cancelled';
};

type GuideTripsResponse = {
  trips: GuideTrip[];
};

type QuickAction = {
  id: string;
  href: string;
  label: string;
  icon_name: string;
  color: string;
  description: string;
};

type QuickActionsResponse = {
  actions: QuickAction[];
};

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  MapPin: MapPin,
  ClipboardList: ClipboardList,
  AlertTriangle: AlertTriangle,
  BarChart3: BarChart3,
  FileText: FileText,
  Calendar: Calendar,
  Clock: Clock,
  Settings: Settings,
  Wallet: Wallet,
  Megaphone: Megaphone,
};

export function GuideDashboardClient({ userName, locale }: GuideDashboardClientProps) {
  const router = useRouter();
  const [status, setStatus] = useState<'standby' | 'on_trip' | 'not_available'>('standby');
  const { online, pending } = useOfflineStatus();

  const { data: quickActionsData, isLoading: quickActionsLoading } = useQuery<QuickActionsResponse>({
    queryKey: queryKeys.guide.quickActions(),
    queryFn: async () => {
      const res = await fetch('/api/guide/quick-actions');
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Quick actions API error:', res.status, errorText);
        throw new Error('Failed to load quick actions');
      }
      return (await res.json()) as QuickActionsResponse;
    },
    retry: 2,
    staleTime: 300000, // Cache 5 minutes
  });

  const { data: statusData, isLoading: statusLoading } = useQuery<GuideStatusResponse>({
    queryKey: queryKeys.guide.status(),
    queryFn: async () => {
      const res = await fetch('/api/guide/status');
      if (!res.ok) {
        throw new Error('Failed to load guide status');
      }
      return (await res.json()) as GuideStatusResponse;
    },
  });

  const { data: tripsData } = useQuery<GuideTripsResponse>({
    queryKey: queryKeys.guide.trips(),
    queryFn: async () => {
      const res = await fetch('/api/guide/trips');
      if (!res.ok) {
        throw new Error('Failed to load guide trips');
      }
      return (await res.json()) as GuideTripsResponse;
    },
  });

  const { data: statsData } = useQuery<GuideStatsResponse>({
    queryKey: queryKeys.guide.stats(),
    queryFn: async () => {
      const res = await fetch('/api/guide/stats');
      if (!res.ok) {
        throw new Error('Failed to load guide stats');
      }
      return (await res.json()) as GuideStatsResponse;
    },
  });

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

  const statusLabel =
    (statusData?.status.current_status ?? status) === 'standby'
      ? 'Standby'
      : (statusData?.status.current_status ?? status) === 'on_trip'
        ? 'Sedang Trip'
        : 'Tidak Tersedia';

  const statusTextClass =
    (statusData?.status.current_status ?? status) === 'standby'
      ? 'text-emerald-700'
      : (statusData?.status.current_status ?? status) === 'on_trip'
        ? 'text-blue-700'
        : 'text-slate-700';

  const updateStatus = async (next: 'standby' | 'on_trip' | 'not_available') => {
    if (status === next) return;
    try {
      setStatus(next);
      await fetch('/api/guide/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
    } catch {
      // optimistic; akan tersinkron pada refresh berikutnya
    }
  };

  const currentStatusValue = statusData?.status.current_status ?? status;
  const statusOptions = [
    { value: 'standby' as const, label: 'Standby', icon: Play, color: 'emerald' },
    { value: 'on_trip' as const, label: 'On Trip', icon: Pause, color: 'blue' },
    { value: 'not_available' as const, label: 'Tidak Tersedia', icon: XCircle, color: 'slate' },
  ];

  return (
    <div className="space-y-6 pb-6">
      {/* Greeting + Status Bar */}
      <div className="space-y-3">
        <div>
          <h1 className="text-2xl font-bold leading-tight text-slate-900">
            Halo, {userName}! 👋
          </h1>
          <p className="mt-1 text-sm text-slate-600">Siap untuk trip hari ini?</p>
        </div>

        {/* Status Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            {/* Current Status Display */}
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <span
                className={cn(
                  'inline-flex h-2.5 w-2.5 flex-shrink-0 rounded-full',
                  currentStatusValue === 'standby' && 'bg-emerald-500',
                  currentStatusValue === 'on_trip' && 'bg-blue-500',
                  currentStatusValue === 'not_available' && 'bg-slate-400',
                )}
              />
              <div className="flex min-w-0 flex-col">
                <span className="text-xs font-medium text-slate-500">Status Saat Ini</span>
                <span className={cn('text-sm font-semibold', statusTextClass)}>
                  {statusLoading ? 'Memuat...' : statusLabel}
                </span>
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
                >
                  <span>Ubah</span>
                  <ChevronRight className="h-3.5 w-3.5 rotate-90" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[200px]">
                {statusOptions.map((option) => {
                  const Icon = option.icon;
                  const isActive = option.value === currentStatusValue;
                  return (
                    <DropdownMenuItem
                      key={option.value}
                      className={cn(
                        'flex cursor-pointer items-center gap-3 py-2.5',
                        isActive && 'bg-slate-50',
                      )}
                      onSelect={(e) => {
                        e.preventDefault();
                        if (option.value !== currentStatusValue) {
                          void updateStatus(option.value);
                        }
                      }}
                    >
                      <Icon
                        className={cn(
                          'h-4 w-4 flex-shrink-0',
                          option.color === 'emerald' && 'text-emerald-600',
                          option.color === 'blue' && 'text-blue-600',
                          option.color === 'slate' && 'text-slate-600',
                        )}
                      />
                      <span className="flex-1 font-medium">{option.label}</span>
                      {isActive && (
                        <CheckCircle className="h-4 w-4 flex-shrink-0 text-emerald-600" />
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
                >
                  <Settings className="h-4 w-4 flex-shrink-0 text-slate-600" />
                  <span className="flex-1 font-medium text-slate-700">Atur Ketersediaan</span>
                  <ChevronRight className="h-4 w-4 flex-shrink-0 text-slate-400" />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Active Trip Card */}
      {activeTrip && (
        <Link
          href={`/${locale}/guide/trips/${activeTrip.id}`}
          className="block transition-transform active:scale-[0.98]"
        >
          <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100/50 shadow-sm">
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
              <h3 className="text-lg font-bold leading-tight text-slate-900">
                {activeTrip.name}
              </h3>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <div className="flex items-center gap-2.5 text-sm text-slate-600">
                  <MapPin className="h-4 w-4 flex-shrink-0 text-emerald-600" />
                  <span className="truncate">Meeting point dermaga</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-slate-600">
                  <Clock className="h-4 w-4 flex-shrink-0 text-emerald-600" />
                  <span>{activeTrip.date}</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-slate-600">
                  <Users className="h-4 w-4 flex-shrink-0 text-emerald-600" />
                  <span>{activeTrip.guests} tamu</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-slate-600">
                  <CheckCircle className="h-4 w-4 flex-shrink-0 text-emerald-600" />
                  <span className="truncate">Pastikan semua tamu absen</span>
                </div>
              </div>
              <div className="flex items-center justify-end gap-1 pt-1 text-emerald-700">
                <span className="text-sm font-medium">Lihat Detail</span>
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </div>
            </CardContent>
          </Card>
        </Link>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="mb-3 px-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
          AKSI CEPAT
        </h2>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {quickActionsLoading ? (
            <div className="col-span-full p-4 text-center text-sm text-slate-500">
              Memuat quick actions...
            </div>
          ) : quickActionsData?.actions && quickActionsData.actions.length > 0 ? (
            quickActionsData.actions.map((action) => {
              const IconComponent = iconMap[action.icon_name] || MapPin;
              return (
                <Link
                  key={action.id}
                  href={`/${locale}${action.href}`}
                  className="group flex min-h-[80px] flex-col items-center justify-center gap-2 rounded-xl bg-white p-3 transition-all hover:bg-slate-50 active:scale-95"
                  aria-label={action.label}
                >
                  <div
                    className={cn(
                      'flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-sm transition-transform group-active:scale-110',
                      action.color,
                    )}
                  >
                    <IconComponent className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <span className="text-center text-[11px] font-medium leading-tight text-slate-700">
                    {action.label}
                  </span>
                </Link>
              );
            })
          ) : (
            <div className="col-span-full p-4 text-center text-sm text-slate-500">
              Tidak ada quick actions tersedia
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div>
        <h2 className="mb-3 px-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
          STATISTIK BULAN INI
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-emerald-600">
                {completedThisMonth}
              </div>
              <div className="mt-1 text-xs text-slate-600">Trip Selesai</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-amber-500">
                ⭐ {statsData?.averageRating ? statsData.averageRating.toFixed(1) : '0.0'}
              </div>
              <div className="mt-1 text-xs text-slate-600">Rating</div>
            </CardContent>
          </Card>
          <Card className="col-span-2 border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-slate-900">Rp 0</div>
              <div className="mt-1 text-xs text-slate-600">
                Estimasi Pendapatan (coming soon)
              </div>
            </CardContent>
          </Card>
        </div>
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
          >
            Lihat Semua
          </Link>
        </div>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            <nav className="divide-y divide-slate-100" aria-label="Upcoming trips">
              {trips
                .filter((trip) => trip.status === 'upcoming')
                .slice(0, 3)
                .map((trip) => (
                  <Link
                    key={trip.id}
                    href={`/${locale}/guide/trips/${trip.id}`}
                    className="flex min-h-[72px] items-center gap-4 px-4 py-4 transition-colors hover:bg-slate-50 active:bg-slate-100"
                  >
                    <div className="flex h-12 w-12 flex-shrink-0 flex-col items-center justify-center rounded-xl bg-slate-100">
                      <span className="text-lg font-bold text-slate-700">
                        {trip.date.slice(8, 10)}
                      </span>
                      <span className="text-[10px] font-medium text-slate-500">
                        {trip.date.slice(5, 7)}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-slate-900">{trip.name}</h4>
                      <p className="mt-0.5 text-sm text-slate-500">{trip.guests} tamu</p>
                    </div>
                    <ChevronRight
                      className="h-5 w-5 flex-shrink-0 text-slate-400"
                      aria-hidden="true"
                    />
                  </Link>
                ))}
              {trips.filter((trip) => trip.status === 'upcoming').length === 0 && (
                <div className="p-6 text-center text-sm text-slate-500">
                  Belum ada jadwal mendatang.
                </div>
              )}
            </nav>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
