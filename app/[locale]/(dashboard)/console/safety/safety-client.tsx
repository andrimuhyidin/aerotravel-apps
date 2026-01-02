/**
 * Safety Dashboard Client Component
 * SOS alerts, incident tracking, and emergency management
 */

'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  RefreshCw,
  Shield,
  ShieldAlert,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import queryKeys from '@/lib/queries/query-keys';

type SOSAlert = {
  id: string;
  guideId: string;
  guideName: string;
  tripCode: string;
  location: {
    latitude: number;
    longitude: number;
  };
  timestamp: string;
  status: 'active' | 'responding' | 'resolved';
  notes: string | null;
};

type Incident = {
  id: string;
  type: string;
  description: string;
  tripId: string;
  reportedBy: string;
  reportedAt: string;
  severity: 'low' | 'medium' | 'high';
  status: 'open' | 'investigating' | 'resolved';
};

type SafetyData = {
  activeSOSAlerts: SOSAlert[];
  recentIncidents: Incident[];
  stats: {
    activeAlerts: number;
    activeGuides: number;
    safetyScore: number;
    incidentsThisMonth: number;
  };
  emergencyContacts: Array<{
    name: string;
    role: string;
    phone: string;
  }>;
};

async function fetchSafetyData(): Promise<SafetyData> {
  // Sample data - in production, fetch from API
  return {
    activeSOSAlerts: [],
    recentIncidents: [
      {
        id: 'i1',
        type: 'equipment',
        description: 'Pelampung rusak ditemukan',
        tripId: 'TRIP-001',
        reportedBy: 'Guide Budi',
        reportedAt: new Date(Date.now() - 24 * 3600000).toISOString(),
        severity: 'medium',
        status: 'resolved',
      },
      {
        id: 'i2',
        type: 'weather',
        description: 'Cuaca buruk, trip ditunda',
        tripId: 'TRIP-002',
        reportedBy: 'Guide Siti',
        reportedAt: new Date(Date.now() - 48 * 3600000).toISOString(),
        severity: 'high',
        status: 'resolved',
      },
    ],
    stats: {
      activeAlerts: 0,
      activeGuides: 5,
      safetyScore: 98,
      incidentsThisMonth: 2,
    },
    emergencyContacts: [
      { name: 'Emergency Response Team', role: 'Primary', phone: '08xx-xxxx-xxxx' },
      { name: 'SAR Lampung', role: 'SAR', phone: '0721-xxxxxxx' },
      { name: 'RS Advent Bandar Lampung', role: 'Medical', phone: '0721-xxxxxxx' },
    ],
  };
}

export function SafetyClient() {
  const {
    data,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: [...queryKeys.admin.all, 'safety'],
    queryFn: fetchSafetyData,
    refetchInterval: 10000, // Refresh every 10 seconds for safety alerts
  });

  useEffect(() => {
    if (error) {
      toast.error('Gagal memuat data safety');
    }
  }, [error]);

  if (isLoading) {
    return <SafetySkeleton />;
  }

  if (!data) {
    return <div>Error loading data</div>;
  }

  const hasActiveAlerts = data.activeSOSAlerts.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Safety Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor keamanan dan respons darurat
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/console/operations/live-tracking">
              <MapPin className="mr-2 h-4 w-4" />
              Live Tracking
            </Link>
          </Button>
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
      </div>

      {/* Active SOS Alert Banner */}
      {hasActiveAlerts && (
        <Card className="border-red-500 bg-red-50 dark:bg-red-900/20 animate-pulse">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-8 w-8 text-red-600" />
              <div>
                <p className="font-bold text-red-600 text-lg">
                  {data.activeSOSAlerts.length} SOS ALERT AKTIF
                </p>
                <p className="text-sm text-red-600">
                  Segera tangani kondisi darurat!
                </p>
              </div>
            </div>
            <Button variant="destructive">
              Lihat Detail
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Active Alerts"
          value={data.stats.activeAlerts.toString()}
          icon={AlertTriangle}
          color={hasActiveAlerts ? 'red' : 'green'}
          status={hasActiveAlerts ? 'Ada alert aktif!' : 'Aman'}
        />
        <StatsCard
          title="Safety Score"
          value={`${data.stats.safetyScore}%`}
          icon={Shield}
          color="green"
          progress={data.stats.safetyScore}
        />
        <StatsCard
          title="Active Guides"
          value={data.stats.activeGuides.toString()}
          icon={Users}
          color="blue"
          status="Dalam perjalanan"
        />
        <StatsCard
          title="Incidents (MTD)"
          value={data.stats.incidentsThisMonth.toString()}
          icon={Bell}
          color="yellow"
          status="Bulan ini"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Incidents */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Recent Incidents
            </CardTitle>
            <CardDescription>
              Insiden dan laporan keamanan terbaru
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recentIncidents.map((incident) => (
                <IncidentCard key={incident.id} incident={incident} />
              ))}
              {data.recentIncidents.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <p>Tidak ada insiden terbaru</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contacts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Emergency Contacts
            </CardTitle>
            <CardDescription>
              Kontak darurat dan tim respons
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.emergencyContacts.map((contact, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-red-100 p-2">
                      <Phone className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{contact.name}</p>
                      <p className="text-xs text-muted-foreground">{contact.role}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a href={`tel:${contact.phone}`}>
                      {contact.phone}
                    </a>
                  </Button>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="mt-4 w-full">
              Kelola Kontak Darurat
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Safety Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            Daily Safety Checklist
          </CardTitle>
          <CardDescription>
            Checklist keamanan harian untuk trip
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ChecklistItem label="Equipment Check" completed={true} />
            <ChecklistItem label="Weather Briefing" completed={true} />
            <ChecklistItem label="First Aid Kit" completed={true} />
            <ChecklistItem label="Communication Test" completed={false} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Sub-components

type StatsCardProps = {
  title: string;
  value: string;
  icon: React.ElementType;
  color: 'green' | 'blue' | 'yellow' | 'red';
  status?: string;
  progress?: number;
};

function StatsCard({ title, value, icon: Icon, color, status, progress }: StatsCardProps) {
  const colorClasses = {
    green: 'text-green-600 bg-green-100 dark:bg-green-900/30',
    blue: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
    yellow: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30',
    red: 'text-red-600 bg-red-100 dark:bg-red-900/30',
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
        {status && <p className="text-xs text-muted-foreground mt-1">{status}</p>}
        {progress !== undefined && (
          <Progress value={progress} className="mt-2 h-1" />
        )}
      </CardContent>
    </Card>
  );
}

function IncidentCard({ incident }: { incident: Incident }) {
  const severityColors = {
    low: 'secondary',
    medium: 'default',
    high: 'destructive',
  } as const;

  const statusColors = {
    open: 'destructive',
    investigating: 'default',
    resolved: 'secondary',
  } as const;

  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant={severityColors[incident.severity]} className="uppercase text-xs">
              {incident.severity}
            </Badge>
            <Badge variant={statusColors[incident.status]}>{incident.status}</Badge>
          </div>
          <p className="font-medium text-sm">{incident.description}</p>
          <p className="text-xs text-muted-foreground">
            {incident.reportedBy} • {new Date(incident.reportedAt).toLocaleDateString('id-ID')}
          </p>
        </div>
      </div>
    </div>
  );
}

function ChecklistItem({ label, completed }: { label: string; completed: boolean }) {
  return (
    <div className={cn(
      'flex items-center gap-2 rounded-lg border p-3',
      completed ? 'border-green-200 bg-green-50 dark:bg-green-900/10' : 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10'
    )}>
      {completed ? (
        <CheckCircle2 className="h-4 w-4 text-green-600" />
      ) : (
        <Clock className="h-4 w-4 text-yellow-600" />
      )}
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

function SafetySkeleton() {
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

