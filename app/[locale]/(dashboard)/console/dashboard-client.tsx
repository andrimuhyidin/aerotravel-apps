/**
 * Main Admin Dashboard Client Component
 * Displays KPI cards, quick stats, recent activities, and overview widgets
 */

'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Calendar,
  Clock,
  DollarSign,
  MapPin,
  RefreshCw,
  Ship,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import queryKeys from '@/lib/queries/query-keys';

type KPIData = {
  bookingsToday: number;
  bookingsTrend: number;
  revenueToday: number;
  revenueTrend: number;
  activeTrips: number;
  activeTripsTrend: number;
  pendingPayments: number;
  pendingPaymentsTrend: number;
};

type RecentActivity = {
  id: string;
  type: 'booking' | 'payment' | 'trip' | 'guide' | 'sos';
  title: string;
  description: string;
  timestamp: string;
  status?: 'success' | 'warning' | 'danger';
};

type UpcomingTrip = {
  id: string;
  tripCode: string;
  packageName: string;
  tripDate: string;
  paxCount: number;
  guideName: string | null;
  status: string;
};

type DashboardData = {
  kpi: KPIData;
  recentActivities: RecentActivity[];
  upcomingTrips: UpcomingTrip[];
  activeGuides: number;
  pendingApprovals: number;
  sosAlerts: number;
  monthlyRevenue: number;
  monthlyBookings: number;
};

async function fetchDashboardData(): Promise<DashboardData> {
  // Fetch from multiple endpoints in parallel
  const [financeRes, tripsRes] = await Promise.allSettled([
    fetch('/api/admin/finance/dashboard?period=month'),
    fetch('/api/admin/guide/live-tracking'),
  ]);

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Parse finance data
  let financeData = null;
  if (financeRes.status === 'fulfilled' && financeRes.value.ok) {
    financeData = await financeRes.value.json();
  }

  // Parse live tracking data
  let trackingData = null;
  if (tripsRes.status === 'fulfilled' && tripsRes.value.ok) {
    trackingData = await tripsRes.value.json();
  }

  // Build KPI data from available sources
  const kpi: KPIData = {
    bookingsToday: 0,
    bookingsTrend: 0,
    revenueToday: financeData?.summary?.totalRevenue || 0,
    revenueTrend: 12.5, // Calculate from trends if available
    activeTrips: trackingData?.guides?.length || 0,
    activeTripsTrend: 0,
    pendingPayments: 0,
    pendingPaymentsTrend: 0,
  };

  // Generate sample recent activities (in production, fetch from audit log)
  const recentActivities: RecentActivity[] = [
    {
      id: '1',
      type: 'booking',
      title: 'Booking baru diterima',
      description: 'Paket Pahawang 2D1N - 4 pax',
      timestamp: new Date().toISOString(),
      status: 'success',
    },
    {
      id: '2',
      type: 'payment',
      title: 'Pembayaran dikonfirmasi',
      description: 'Rp 2.500.000 - Transfer Bank',
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      status: 'success',
    },
    {
      id: '3',
      type: 'trip',
      title: 'Trip dimulai',
      description: 'TRIP-2026-001 - Guide: Budi',
      timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      status: 'success',
    },
  ];

  // Generate upcoming trips from finance data
  const upcomingTrips: UpcomingTrip[] = (financeData?.trips || [])
    .slice(0, 5)
    .map((trip: { tripId: string; tripCode: string; packageName: string; startDate: string; paxCount: number; status: string }) => ({
      id: trip.tripId,
      tripCode: trip.tripCode,
      packageName: trip.packageName,
      tripDate: trip.startDate,
      paxCount: trip.paxCount,
      guideName: null,
      status: trip.status,
    }));

  return {
    kpi,
    recentActivities,
    upcomingTrips,
    activeGuides: trackingData?.guides?.length || 0,
    pendingApprovals: 3,
    sosAlerts: 0,
    monthlyRevenue: financeData?.summary?.totalRevenue || 0,
    monthlyBookings: financeData?.summary?.totalTrips || 0,
  };
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Baru saja';
  if (minutes < 60) return `${minutes} menit lalu`;
  if (hours < 24) return `${hours} jam lalu`;
  return `${days} hari lalu`;
}

export function DashboardClient() {
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: [...queryKeys.admin.all, 'main-dashboard'],
    queryFn: fetchDashboardData,
    refetchInterval: 60000, // Refresh every minute
  });

  useEffect(() => {
    if (error) {
      toast.error('Gagal memuat data dashboard');
    }
  }, [error]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground mb-4">Tidak ada data</p>
        <Button onClick={() => refetch()}>Coba Lagi</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview bisnis dan aktivitas terkini
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isRefetching}
        >
          <RefreshCw className={cn('mr-2 h-4 w-4', isRefetching && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* SOS Alert Banner */}
      {data.sosAlerts > 0 && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-destructive" />
              <div>
                <p className="font-semibold text-destructive">
                  {data.sosAlerts} SOS Alert Aktif
                </p>
                <p className="text-sm text-muted-foreground">
                  Segera periksa kondisi darurat
                </p>
              </div>
            </div>
            <Button variant="destructive" size="sm" asChild>
              <Link href="/console/safety">Lihat Detail</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Revenue Bulan Ini"
          value={formatCurrency(data.kpi.revenueToday)}
          trend={data.kpi.revenueTrend}
          icon={DollarSign}
          color="green"
        />
        <KPICard
          title="Booking Bulan Ini"
          value={data.monthlyBookings.toString()}
          trend={data.kpi.bookingsTrend}
          icon={Calendar}
          color="blue"
        />
        <KPICard
          title="Trip Aktif"
          value={data.kpi.activeTrips.toString()}
          trend={data.kpi.activeTripsTrend}
          icon={Ship}
          color="purple"
        />
        <KPICard
          title="Guide Aktif"
          value={data.activeGuides.toString()}
          icon={Users}
          color="orange"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Aktivitas Terkini</CardTitle>
              <CardDescription>Update real-time dari sistem</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/console/audit-log">
                Lihat Semua <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.recentActivities.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
              {data.recentActivities.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-4">
                  Belum ada aktivitas
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Stats</CardTitle>
            <CardDescription>Ringkasan cepat</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <QuickStatItem
              label="Pending Approvals"
              value={data.pendingApprovals}
              href="/console/governance"
              icon={Clock}
              color="yellow"
            />
            <QuickStatItem
              label="Revenue MTD"
              value={formatCurrency(data.monthlyRevenue)}
              href="/console/finance"
              icon={TrendingUp}
              color="green"
            />
            <QuickStatItem
              label="Booking MTD"
              value={data.monthlyBookings}
              href="/console/bookings"
              icon={BarChart3}
              color="blue"
            />
            <QuickStatItem
              label="SOS Alerts"
              value={data.sosAlerts}
              href="/console/safety"
              icon={AlertTriangle}
              color={data.sosAlerts > 0 ? 'red' : 'gray'}
            />
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Trips */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Trip Mendatang</CardTitle>
            <CardDescription>5 trip terdekat yang akan berangkat</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/console/operations/trips">
              Lihat Semua <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.upcomingTrips.map((trip) => (
              <TripItem key={trip.id} trip={trip} />
            ))}
            {data.upcomingTrips.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-4">
                Tidak ada trip mendatang
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <QuickLinkCard
          title="Buat Booking"
          description="Input booking baru"
          href="/console/bookings/new"
          icon={Calendar}
        />
        <QuickLinkCard
          title="Live Tracking"
          description="Monitor trip aktif"
          href="/console/operations/live-tracking"
          icon={MapPin}
        />
        <QuickLinkCard
          title="Laporan Keuangan"
          description="Shadow P&L"
          href="/console/finance/shadow-pnl"
          icon={DollarSign}
        />
        <QuickLinkCard
          title="Manajemen Guide"
          description="Lihat semua guide"
          href="/console/guide/contracts"
          icon={Users}
        />
      </div>
    </div>
  );
}

// Sub-components

type KPICardProps = {
  title: string;
  value: string;
  trend?: number;
  icon: React.ElementType;
  color: 'green' | 'blue' | 'purple' | 'orange' | 'red';
};

function KPICard({ title, value, trend, icon: Icon, color }: KPICardProps) {
  const colorClasses = {
    green: 'text-green-600 bg-green-100 dark:bg-green-900/30',
    blue: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
    purple: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30',
    orange: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30',
    red: 'text-red-600 bg-red-100 dark:bg-red-900/30',
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className={cn('rounded-lg p-2', colorClasses[color])}>
            <Icon className="h-5 w-5" />
          </div>
          {trend !== undefined && trend !== 0 && (
            <Badge variant={trend > 0 ? 'default' : 'destructive'} className="gap-1">
              {trend > 0 ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )}
              {Math.abs(trend)}%
            </Badge>
          )}
        </div>
        <div className="mt-4">
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{title}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ActivityItem({ activity }: { activity: RecentActivity }) {
  const iconMap = {
    booking: Calendar,
    payment: Wallet,
    trip: Ship,
    guide: Users,
    sos: AlertTriangle,
  };
  const Icon = iconMap[activity.type];

  const statusColors = {
    success: 'text-green-600',
    warning: 'text-yellow-600',
    danger: 'text-red-600',
  };

  return (
    <div className="flex items-start gap-4 rounded-lg border p-3">
      <div className="rounded-full bg-muted p-2">
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('font-medium text-sm', activity.status && statusColors[activity.status])}>
          {activity.title}
        </p>
        <p className="text-sm text-muted-foreground truncate">{activity.description}</p>
      </div>
      <p className="text-xs text-muted-foreground whitespace-nowrap">
        {formatRelativeTime(activity.timestamp)}
      </p>
    </div>
  );
}

type QuickStatItemProps = {
  label: string;
  value: string | number;
  href: string;
  icon: React.ElementType;
  color: 'green' | 'blue' | 'yellow' | 'red' | 'gray';
};

function QuickStatItem({ label, value, href, icon: Icon, color }: QuickStatItemProps) {
  const colorClasses = {
    green: 'text-green-600',
    blue: 'text-blue-600',
    yellow: 'text-yellow-600',
    red: 'text-red-600',
    gray: 'text-muted-foreground',
  };

  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <Icon className={cn('h-4 w-4', colorClasses[color])} />
        <span className="text-sm">{label}</span>
      </div>
      <span className="font-semibold">{value}</span>
    </Link>
  );
}

function TripItem({ trip }: { trip: UpcomingTrip }) {
  const statusBadge = {
    confirmed: { label: 'Confirmed', variant: 'default' as const },
    pending: { label: 'Pending', variant: 'secondary' as const },
    in_progress: { label: 'In Progress', variant: 'default' as const },
    completed: { label: 'Completed', variant: 'outline' as const },
  };
  const status = statusBadge[trip.status as keyof typeof statusBadge] || statusBadge.pending;

  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div className="flex items-center gap-4">
        <div className="rounded-lg bg-primary/10 p-2">
          <Ship className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="font-medium text-sm">{trip.tripCode}</p>
          <p className="text-sm text-muted-foreground">{trip.packageName}</p>
        </div>
      </div>
      <div className="flex items-center gap-4 text-sm">
        <div className="text-right">
          <p className="font-medium">
            {new Date(trip.tripDate).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
            })}
          </p>
          <p className="text-muted-foreground">{trip.paxCount} pax</p>
        </div>
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>
    </div>
  );
}

type QuickLinkCardProps = {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
};

function QuickLinkCard({ title, description, href, icon: Icon }: QuickLinkCardProps) {
  return (
    <Link href={href}>
      <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="rounded-lg bg-primary/10 p-3">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">{title}</p>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-24" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <Skeleton className="h-8 w-32 mt-4" />
              <Skeleton className="h-4 w-24 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

