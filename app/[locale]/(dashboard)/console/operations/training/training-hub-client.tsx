/**
 * Training Hub Client Component
 * Overview of training programs, sessions, and compliance status
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  GraduationCap,
  RefreshCw,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import queryKeys from '@/lib/queries/query-keys';

type TrainingSession = {
  id: string;
  title: string;
  type: string;
  date: string;
  attendees: number;
  maxAttendees: number;
  status: 'upcoming' | 'in_progress' | 'completed';
};

type TrainingStats = {
  totalSessions: number;
  upcomingSessions: number;
  completedThisMonth: number;
  averageAttendance: number;
  guidesWithExpiring: number;
  complianceRate: number;
};

type TrainingHubData = {
  stats: TrainingStats;
  upcomingSessions: TrainingSession[];
};

type TrainingHubClientProps = {
  locale: string;
};

async function fetchTrainingData(): Promise<TrainingHubData> {
  // Sample data - in production, fetch from API
  return {
    stats: {
      totalSessions: 24,
      upcomingSessions: 5,
      completedThisMonth: 8,
      averageAttendance: 85,
      guidesWithExpiring: 3,
      complianceRate: 92,
    },
    upcomingSessions: [
      {
        id: 's1',
        title: 'First Aid & Safety Training',
        type: 'Mandatory',
        date: '2026-01-10',
        attendees: 12,
        maxAttendees: 15,
        status: 'upcoming',
      },
      {
        id: 's2',
        title: 'Customer Service Excellence',
        type: 'Optional',
        date: '2026-01-15',
        attendees: 8,
        maxAttendees: 20,
        status: 'upcoming',
      },
      {
        id: 's3',
        title: 'Marine Navigation Basics',
        type: 'Mandatory',
        date: '2026-01-20',
        attendees: 10,
        maxAttendees: 10,
        status: 'upcoming',
      },
    ],
  };
}

export function TrainingHubClient({ locale }: TrainingHubClientProps) {
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: [...queryKeys.admin.all, 'training-hub'],
    queryFn: fetchTrainingData,
    refetchInterval: 60000,
  });

  if (error) {
    toast.error('Gagal memuat data training');
  }

  if (isLoading) {
    return <TrainingSkeleton />;
  }

  if (!data) {
    return <div>Error loading data</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Training Management
          </h1>
          <p className="text-muted-foreground">
            Kelola program training dan sertifikasi guide
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isRefetching}
        >
          <RefreshCw
            className={cn('mr-2 h-4 w-4', isRefetching && 'animate-spin')}
          />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Sessions"
          value={data.stats.totalSessions.toString()}
          subtitle="Semua sesi training"
          icon={BookOpen}
          color="blue"
        />
        <StatsCard
          title="Upcoming"
          value={data.stats.upcomingSessions.toString()}
          subtitle="Sesi yang akan datang"
          icon={Calendar}
          color="green"
        />
        <StatsCard
          title="Compliance Rate"
          value={`${data.stats.complianceRate}%`}
          subtitle="Guide dengan training lengkap"
          icon={CheckCircle2}
          color="purple"
        />
        <StatsCard
          title="Expiring Soon"
          value={data.stats.guidesWithExpiring.toString()}
          subtitle="Guide perlu recertification"
          icon={Clock}
          color="orange"
        />
      </div>

      {/* Upcoming Sessions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Upcoming Training Sessions
            </CardTitle>
            <CardDescription>
              {data.upcomingSessions.length} sesi terjadwal
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/${locale}/console/operations/training/sessions`}>
              Semua Sesi <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.upcomingSessions.map((session) => (
              <SessionCard key={session.id} session={session} locale={locale} />
            ))}
            {data.upcomingSessions.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-4">
                Tidak ada sesi training yang terjadwal
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <QuickLinkCard
          title="Compliance Report"
          description="Status training per guide"
          href={`/${locale}/console/operations/training/compliance-report`}
          icon={FileText}
        />
        <QuickLinkCard
          title="Mandatory Training"
          description="Training wajib untuk guide"
          href={`/${locale}/console/guide-license`}
          icon={Award}
        />
        <QuickLinkCard
          title="Guide Certification"
          description="Kelola lisensi dan sertifikasi"
          href={`/${locale}/console/guide-license`}
          icon={Award}
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

function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
}: StatsCardProps) {
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

function SessionCard({
  session,
  locale,
}: {
  session: TrainingSession;
  locale: string;
}) {
  const statusColors = {
    upcoming: { variant: 'outline' as const, icon: Clock },
    in_progress: { variant: 'default' as const, icon: BookOpen },
    completed: { variant: 'secondary' as const, icon: CheckCircle2 },
  };
  const status = statusColors[session.status];
  const StatusIcon = status.icon;

  const formattedDate = new Date(session.date).toLocaleDateString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  return (
    <Link href={`/${locale}/console/operations/training/sessions/${session.id}`}>
      <div className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-4">
          <div className="rounded-lg bg-primary/10 p-2">
            <GraduationCap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">{session.title}</p>
            <p className="text-sm text-muted-foreground">{session.type}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="text-right hidden sm:block">
            <p className="font-medium">{formattedDate}</p>
            <p className="text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />
              {session.attendees}/{session.maxAttendees}
            </p>
          </div>
          <Badge variant={status.variant} className="gap-1">
            <StatusIcon className="h-3 w-3" />
            {session.status.replace('_', ' ')}
          </Badge>
        </div>
      </div>
    </Link>
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

function TrainingSkeleton() {
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

