'use client';

import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  AlertTriangle,
  Award,
  Bell,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  Plus,
  RefreshCw,
  Shield,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import queryKeys from '@/lib/queries/query-keys';

type DashboardStats = {
  total: number;
  valid: number;
  warning: number;
  critical: number;
  expired: number;
  suspended: number;
};

type UpcomingExpiry = {
  id: string;
  licenseType: string;
  licenseName: string;
  licenseNumber: string;
  status: string;
  expiryDate: string;
  daysUntilExpiry: number;
};

type RecentAlert = {
  id: string;
  alertType: string;
  severity: string;
  message: string;
  isRead: boolean;
  isResolved: boolean;
  createdAt: string;
  license: {
    id: string;
    type: string;
    name: string;
  } | null;
};

type ASITAMembership = {
  isMember: boolean;
  status: string | null;
  expiryDate: string | null;
  details: {
    nia: string;
    membership_type: string;
    dpd_region: string | null;
    member_since: string;
  } | null;
};

type DashboardResponse = {
  stats: DashboardStats;
  complianceScore: number;
  upcomingExpiries: UpcomingExpiry[];
  recentAlerts: RecentAlert[];
  unreadAlertsCount: number;
  licenseTypeBreakdown: Record<string, { total: number; valid: number; expiring: number; expired: number }>;
  asitaMembership: ASITAMembership;
  generatedAt: string;
};

async function fetchDashboardData(): Promise<DashboardResponse> {
  const response = await fetch('/api/admin/compliance/dashboard');
  if (!response.ok) {
    throw new Error('Failed to fetch dashboard data');
  }
  return response.json();
}

const licenseTypeLabels: Record<string, string> = {
  nib: 'NIB',
  skdn: 'SKDN',
  sisupar: 'SISUPAR',
  tdup: 'TDUP',
  asita: 'ASITA',
  chse: 'CHSE',
};

const statusColors: Record<string, string> = {
  valid: 'bg-green-100 text-green-800 border-green-200',
  warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  critical: 'bg-red-100 text-red-800 border-red-200',
  expired: 'bg-gray-100 text-gray-800 border-gray-200',
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) return `${diffMins} menit lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  return `${diffDays} hari lalu`;
}

function StatsCard({
  title,
  value,
  icon: Icon,
  color,
  description,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
  description?: string;
}) {
  return (
    <Card className="border-l-4" style={{ borderLeftColor: color }}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
            {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
          </div>
          <div className="h-12 w-12 rounded-full flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
            <Icon className="h-6 w-6" style={{ color }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ComplianceScoreGauge({ score }: { score: number }) {
  const getScoreColor = (s: number) => {
    if (s >= 80) return '#22C55E';
    if (s >= 60) return '#F59E0B';
    return '#EF4444';
  };

  const getScoreLabel = (s: number) => {
    if (s >= 80) return 'Baik';
    if (s >= 60) return 'Perlu Perhatian';
    return 'Kritis';
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Skor Compliance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center">
          <div className="relative w-32 h-32">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                className="stroke-muted"
                strokeWidth="10"
                fill="transparent"
                r="40"
                cx="50"
                cy="50"
              />
              <circle
                stroke={getScoreColor(score)}
                strokeWidth="10"
                strokeLinecap="round"
                fill="transparent"
                r="40"
                cx="50"
                cy="50"
                strokeDasharray={`${score * 2.51} 251`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold">{score}%</span>
            </div>
          </div>
          <Badge
            className="mt-3"
            style={{
              backgroundColor: `${getScoreColor(score)}20`,
              color: getScoreColor(score),
              borderColor: getScoreColor(score),
            }}
          >
            {getScoreLabel(score)}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function ASITAMembershipCard({ membership }: { membership: ASITAMembership }) {
  if (!membership.isMember) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <div className="text-center py-4">
            <Award className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Belum terdaftar sebagai anggota ASITA</p>
            <Button variant="outline" size="sm" className="mt-3" asChild>
              <Link href="/console/compliance/licenses/new?type=asita">
                <Plus className="h-4 w-4 mr-2" />
                Daftarkan Keanggotaan
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Award className="h-5 w-5 text-blue-600" />
            Keanggotaan ASITA
          </CardTitle>
          <Badge className={statusColors[membership.status || 'valid']}>
            {membership.status === 'valid' ? 'Aktif' : membership.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">NIA</span>
            <span className="font-medium">{membership.details?.nia}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tipe</span>
            <span className="font-medium capitalize">{membership.details?.membership_type}</span>
          </div>
          {membership.details?.dpd_region && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">DPD</span>
              <span className="font-medium">{membership.details.dpd_region}</span>
            </div>
          )}
          {membership.expiryDate && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Berlaku s/d</span>
              <span className="font-medium">{formatDate(membership.expiryDate)}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function ComplianceDashboardClient() {
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: queryKeys.admin.compliance.dashboard(),
    queryFn: fetchDashboardData,
    staleTime: 60 * 1000, // 1 minute
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64 lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-3" />
            <p className="text-destructive font-medium">Gagal memuat data compliance</p>
            <p className="text-muted-foreground text-sm mt-1">Silakan coba lagi nanti</p>
            <Button variant="outline" className="mt-4" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Coba Lagi
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Compliance Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor izin usaha dan kepatuhan regulasi Permenparekraf
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" asChild>
            <Link href="/console/compliance/licenses/new">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Izin
            </Link>
          </Button>
        </div>
      </div>

      {/* Alert Banner for Critical Issues */}
      {(data.stats.expired > 0 || data.stats.critical > 0) && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-destructive flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-destructive">
                  {data.stats.expired > 0
                    ? `${data.stats.expired} izin telah EXPIRED!`
                    : `${data.stats.critical} izin akan expired dalam 7 hari!`}
                </p>
                <p className="text-sm text-muted-foreground">
                  Segera lakukan perpanjangan untuk menghindari operasional ilegal.
                </p>
              </div>
              <Button variant="destructive" size="sm" asChild>
                <Link href="/console/compliance/licenses?status=expired,critical">
                  Lihat Detail
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard
          title="Total Izin"
          value={data.stats.total}
          icon={FileText}
          color="#3B82F6"
        />
        <StatsCard
          title="Valid"
          value={data.stats.valid}
          icon={CheckCircle2}
          color="#22C55E"
          description="Status aktif"
        />
        <StatsCard
          title="Warning"
          value={data.stats.warning}
          icon={Clock}
          color="#F59E0B"
          description="Exp. 30 hari"
        />
        <StatsCard
          title="Critical"
          value={data.stats.critical}
          icon={AlertTriangle}
          color="#EF4444"
          description="Exp. 7 hari"
        />
        <StatsCard
          title="Expired"
          value={data.stats.expired}
          icon={XCircle}
          color="#6B7280"
          description="Sudah habis"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          <ComplianceScoreGauge score={data.complianceScore} />
          <ASITAMembershipCard membership={data.asitaMembership} />
        </div>

        {/* Right Column - Upcoming Expiries */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Akan Expired (30 Hari)
                </CardTitle>
                <CardDescription>Izin yang membutuhkan perpanjangan segera</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/console/compliance/licenses">
                  Lihat Semua
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {data.upcomingExpiries.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-3" />
                <p className="text-muted-foreground">Tidak ada izin yang akan expired dalam 30 hari</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.upcomingExpiries.map((license) => (
                  <Link
                    key={license.id}
                    href={`/console/compliance/licenses/${license.id}`}
                    className="block"
                  >
                    <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="font-mono">
                          {licenseTypeLabels[license.licenseType] || license.licenseType.toUpperCase()}
                        </Badge>
                        <div>
                          <p className="font-medium">{license.licenseName}</p>
                          <p className="text-sm text-muted-foreground">{license.licenseNumber}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={statusColors[license.status]}>
                          {license.daysUntilExpiry} hari
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(license.expiryDate)}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* License Type Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Status per Jenis Izin</CardTitle>
          <CardDescription>Ringkasan status untuk setiap jenis izin usaha</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(data.licenseTypeBreakdown).map(([type, breakdown]) => (
              <div key={type} className="p-4 rounded-lg border">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium">{licenseTypeLabels[type] || type.toUpperCase()}</span>
                  <Badge variant="outline">{breakdown.total}</Badge>
                </div>
                <Progress
                  value={breakdown.total > 0 ? (breakdown.valid / breakdown.total) * 100 : 0}
                  className="h-2 mb-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span className="text-green-600">✓ {breakdown.valid} valid</span>
                  {breakdown.expiring > 0 && <span className="text-yellow-600">⚠ {breakdown.expiring} expiring</span>}
                  {breakdown.expired > 0 && <span className="text-red-600">✗ {breakdown.expired} expired</span>}
                </div>
              </div>
            ))}
            {Object.keys(data.licenseTypeBreakdown).length === 0 && (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                Belum ada izin yang terdaftar
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Alerts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Alert Terbaru
                {data.unreadAlertsCount > 0 && (
                  <Badge variant="destructive">{data.unreadAlertsCount}</Badge>
                )}
              </CardTitle>
              <CardDescription>Notifikasi terkait izin usaha</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/console/compliance/alerts">
                Lihat Semua
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {data.recentAlerts.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Tidak ada alert</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.recentAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${
                    !alert.isRead ? 'bg-blue-50/50 border-blue-100' : ''
                  }`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {alert.severity === 'critical' && <AlertTriangle className="h-5 w-5 text-red-500" />}
                    {alert.severity === 'warning' && <AlertCircle className="h-5 w-5 text-yellow-500" />}
                    {alert.severity === 'info' && <Bell className="h-5 w-5 text-blue-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{alert.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatRelativeTime(alert.createdAt)}
                    </p>
                  </div>
                  {!alert.isRead && (
                    <Badge variant="secondary" className="flex-shrink-0">Baru</Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground">
        Data terakhir diperbarui: {formatDate(data.generatedAt)}
      </div>
    </div>
  );
}

