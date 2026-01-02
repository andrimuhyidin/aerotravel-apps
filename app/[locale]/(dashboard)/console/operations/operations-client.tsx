/**
 * Operations Hub Client Component
 * Overview of daily operations, trips, and resource allocation
 */

'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  AlertTriangle,
  Anchor,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  RefreshCw,
  Ship,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import queryKeys from '@/lib/queries/query-keys';

type TodayTrip = {
  id: string;
  tripCode: string;
  packageName: string;
  status: 'pending' | 'in_progress' | 'completed';
  paxCount: number;
  guideName: string | null;
  departureTime: string;
};

type OperationsData = {
  todayTrips: TodayTrip[];
  stats: {
    tripsToday: number;
    activeTrips: number;
    completedTrips: number;
    totalPaxToday: number;
    activeGuides: number;
    availableAssets: number;
    pendingAssignments: number;
  };
};

async function fetchOperationsData(): Promise<OperationsData> {
  // Sample data - in production, fetch from API
  return {
    todayTrips: [
      {
        id: 't1',
        tripCode: 'TRIP-2026-001',
        packageName: 'Paket Pahawang 2D1N',
        status: 'in_progress',
        paxCount: 15,
        guideName: 'Budi Santoso',
        departureTime: '08:00',
      },
      {
        id: 't2',
        tripCode: 'TRIP-2026-002',
        packageName: 'Paket Mutun 1 Day',
        status: 'pending',
        paxCount: 8,
        guideName: 'Siti Rahayu',
        departureTime: '09:30',
      },
      {
        id: 't3',
        tripCode: 'TRIP-2026-003',
        packageName: 'Paket Kiluan 2D1N',
        status: 'completed',
        paxCount: 12,
        guideName: 'Ahmad Wijaya',
        departureTime: '06:00',
      },
    ],
    stats: {
      tripsToday: 3,
      activeTrips: 1,
      completedTrips: 1,
      totalPaxToday: 35,
      activeGuides: 5,
      availableAssets: 4,
      pendingAssignments: 2,
    },
  };
}

export function OperationsClient() {
  const {
    data,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: [...queryKeys.admin.all, 'operations'],
    queryFn: fetchOperationsData,
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (error) {
      toast.error('Gagal memuat data operations');
    }
  }, [error]);

  if (isLoading) {
    return <OperationsSkeleton />;
  }

  if (!data) {
    return <div>Error loading data</div>;
  }

  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Operations</h1>
          <p className="text-muted-foreground">{today}</p>
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

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Trips Today"
          value={data.stats.tripsToday.toString()}
          subtitle={`${data.stats.activeTrips} active, ${data.stats.completedTrips} done`}
          icon={Ship}
          color="blue"
        />
        <StatsCard
          title="Total Pax"
          value={data.stats.totalPaxToday.toString()}
          subtitle="Hari ini"
          icon={Users}
          color="green"
        />
        <StatsCard
          title="Active Guides"
          value={data.stats.activeGuides.toString()}
          subtitle="Dalam perjalanan"
          icon={Users}
          color="purple"
        />
        <StatsCard
          title="Available Assets"
          value={data.stats.availableAssets.toString()}
          subtitle="Siap digunakan"
          icon={Anchor}
          color="orange"
        />
      </div>

      {/* Pending Assignments Alert */}
      {data.stats.pendingAssignments > 0 && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-800 dark:text-yellow-200">
                  {data.stats.pendingAssignments} Trip Belum Di-assign
                </p>
                <p className="text-sm text-yellow-600 dark:text-yellow-300">
                  Segera assign guide dan asset
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/console/operations/scheduler">Kelola</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Today's Trips */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Trip Hari Ini
            </CardTitle>
            <CardDescription>
              {data.todayTrips.length} trip terjadwal
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/console/operations/trips">
              Semua Trip <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.todayTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
            {data.todayTrips.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-4">
                Tidak ada trip hari ini
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <QuickLinkCard
          title="Live Tracking"
          description="Monitor posisi guide"
          href="/console/operations/live-tracking"
          icon={MapPin}
        />
        <QuickLinkCard
          title="Scheduler"
          description="Kelola jadwal resources"
          href="/console/operations/scheduler"
          icon={Calendar}
        />
        <QuickLinkCard
          title="Assets"
          description="Kelola kapal & villa"
          href="/console/operations/assets"
          icon={Anchor}
        />
        <QuickLinkCard
          title="Inventory"
          description="Stock & audit"
          href="/console/operations/inventory"
          icon={Activity}
        />
      </div>
    </div>
  );
}

// Sub-components

type StatsCardProps = {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  color: 'blue' | 'green' | 'purple' | 'orange';
};

function StatsCard({ title, value, subtitle, icon: Icon, color }: StatsCardProps) {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
    green: 'text-green-600 bg-green-100 dark:bg-green-900/30',
    purple: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30',
    orange: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30',
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={cn('rounded-lg p-2', colorClasses[color])}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

function TripCard({ trip }: { trip: TodayTrip }) {
  const statusColors = {
    pending: { variant: 'outline' as const, icon: Clock },
    in_progress: { variant: 'default' as const, icon: Activity },
    completed: { variant: 'secondary' as const, icon: CheckCircle2 },
  };
  const status = statusColors[trip.status];
  const StatusIcon = status.icon;

  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div className="flex items-center gap-4">
        <div className="rounded-lg bg-primary/10 p-2">
          <Ship className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="font-medium">{trip.tripCode}</p>
          <p className="text-sm text-muted-foreground">{trip.packageName}</p>
        </div>
      </div>
      <div className="flex items-center gap-4 text-sm">
        <div className="text-right hidden sm:block">
          <p className="font-medium">{trip.departureTime}</p>
          <p className="text-muted-foreground">{trip.paxCount} pax</p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="font-medium">{trip.guideName || '-'}</p>
          <p className="text-muted-foreground">Guide</p>
        </div>
        <Badge variant={status.variant} className="gap-1">
          <StatusIcon className="h-3 w-3" />
          {trip.status.replace('_', ' ')}
        </Badge>
      </div>
    </div>
  );
}

function QuickLinkCard({
  title,
  description,
  href,
  icon: Icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
}) {
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

function OperationsSkeleton() {
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
              <Skeleton className="h-8 w-24 mt-4" />
              <Skeleton className="h-4 w-32 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

