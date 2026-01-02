'use client';

import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  Award,
  BarChart3,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  Shield,
  TrendingUp,
  XCircle,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { apiClient } from '@/lib/api/client';
import queryKeys from '@/lib/queries/query-keys';

type ComplianceStandard = 'chse' | 'gstc' | 'duty_of_care' | 'iso_31030';

type ComplianceStatus = {
  standard: ComplianceStandard;
  standardName: string;
  status: 'compliant' | 'partially_compliant' | 'non_compliant' | 'not_assessed';
  complianceLevel: number;
  lastAssessment: string | null;
  nextAssessment: string | null;
  openIssues: number;
  isCertified: boolean;
  certValidUntil: string | null;
};

type ComplianceDashboardData = {
  overallScore: number;
  overallStatus: string;
  standards: ComplianceStatus[];
  recentAudits: Array<{
    id: string;
    auditType: string;
    auditDate: string;
    score: number;
    result: string;
  }>;
  upcomingActions: Array<{
    id: string;
    title: string;
    dueDate: string;
    priority: string;
    status: string;
  }>;
  metrics: {
    totalAudits: number;
    passRate: number;
    avgScore: number;
    openNonConformities: number;
  };
};

const standardIcons: Record<ComplianceStandard, React.ReactNode> = {
  chse: <Shield className="h-5 w-5" />,
  gstc: <TrendingUp className="h-5 w-5" />,
  duty_of_care: <Award className="h-5 w-5" />,
  iso_31030: <FileText className="h-5 w-5" />,
};

const statusColors: Record<string, string> = {
  compliant: 'bg-emerald-500',
  partially_compliant: 'bg-amber-500',
  non_compliant: 'bg-red-500',
  not_assessed: 'bg-slate-400',
};

const statusBadgeVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  compliant: 'default',
  partially_compliant: 'secondary',
  non_compliant: 'destructive',
  not_assessed: 'outline',
};

const statusLabels: Record<string, string> = {
  compliant: 'Compliant',
  partially_compliant: 'Partial',
  non_compliant: 'Non-Compliant',
  not_assessed: 'Not Assessed',
};

async function fetchComplianceDashboard(): Promise<ComplianceDashboardData> {
  const response = await apiClient.get<ComplianceDashboardData>('/api/admin/compliance/dashboard');
  return response.data;
}

export default function ComplianceDashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.admin.compliance.dashboard(),
    queryFn: fetchComplianceDashboard,
  });

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <XCircle className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-4 text-lg font-semibold">Gagal memuat data</h2>
          <p className="text-muted-foreground">Silakan coba lagi nanti</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Compliance Dashboard</h1>
        <p className="text-muted-foreground">
          Monitoring kepatuhan CHSE, GSTC, Duty of Care, dan ISO 31030
        </p>
      </div>

      {/* Overall Score Card */}
      <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardContent className="flex items-center gap-6 p-6">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/20">
            <span className="text-3xl font-bold text-primary">{data.overallScore}%</span>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold">Overall Compliance Score</h2>
            <Badge variant={statusBadgeVariants[data.overallStatus] || 'outline'} className="mt-1">
              {statusLabels[data.overallStatus] || 'Unknown'}
            </Badge>
            <p className="mt-2 text-sm text-muted-foreground">
              Berdasarkan {data.standards.filter((s) => s.status !== 'not_assessed').length} dari 4
              standar yang sudah dinilai
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{data.metrics.totalAudits}</div>
              <div className="text-xs text-muted-foreground">Total Audit</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{data.metrics.passRate}%</div>
              <div className="text-xs text-muted-foreground">Pass Rate</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{data.metrics.avgScore}</div>
              <div className="text-xs text-muted-foreground">Avg Score</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-600">{data.metrics.openNonConformities}</div>
              <div className="text-xs text-muted-foreground">Open Issues</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Standards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {data.standards.map((standard) => (
          <Card key={standard.standard} className="relative overflow-hidden">
            <div className={`absolute left-0 top-0 h-full w-1 ${statusColors[standard.status]}`} />
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <div className="rounded-lg bg-muted p-2">{standardIcons[standard.standard]}</div>
              <div className="flex-1">
                <CardTitle className="text-sm font-medium">{standard.standardName}</CardTitle>
                <Badge variant={statusBadgeVariants[standard.status] || 'outline'} className="mt-1">
                  {statusLabels[standard.status]}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>Compliance Level</span>
                    <span className="font-medium">{standard.complianceLevel}%</span>
                  </div>
                  <Progress value={standard.complianceLevel} className="h-2" />
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Last Assessed</span>
                    <div className="font-medium">
                      {standard.lastAssessment
                        ? new Date(standard.lastAssessment).toLocaleDateString('id-ID')
                        : '-'}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Open Issues</span>
                    <div className="font-medium">{standard.openIssues}</div>
                  </div>
                </div>
                {standard.isCertified && (
                  <div className="flex items-center gap-1 text-xs text-emerald-600">
                    <CheckCircle className="h-3 w-3" />
                    <span>
                      Certified until{' '}
                      {standard.certValidUntil
                        ? new Date(standard.certValidUntil).toLocaleDateString('id-ID')
                        : 'N/A'}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Audits & Upcoming Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Audits */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Recent Audits
            </CardTitle>
            <CardDescription>5 audit terbaru</CardDescription>
          </CardHeader>
          <CardContent>
            {data.recentAudits.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                Belum ada data audit
              </div>
            ) : (
              <div className="space-y-4">
                {data.recentAudits.map((audit) => (
                  <div key={audit.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <div className="font-medium capitalize">{audit.auditType.replace('_', ' ')}</div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(audit.auditDate).toLocaleDateString('id-ID')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">{audit.score}%</div>
                      <Badge
                        variant={
                          audit.result === 'pass'
                            ? 'default'
                            : audit.result === 'conditional_pass'
                            ? 'secondary'
                            : 'destructive'
                        }
                      >
                        {audit.result.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Corrective Actions
            </CardTitle>
            <CardDescription>Tindakan perbaikan yang perlu diselesaikan</CardDescription>
          </CardHeader>
          <CardContent>
            {data.upcomingActions.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                Tidak ada tindakan perbaikan tertunda
              </div>
            ) : (
              <div className="space-y-3">
                {data.upcomingActions.map((action) => (
                  <div key={action.id} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium">{action.title}</div>
                        <div className="mt-1 flex items-center gap-2">
                          <Badge
                            variant={
                              action.priority === 'critical'
                                ? 'destructive'
                                : action.priority === 'high'
                                ? 'default'
                                : 'secondary'
                            }
                          >
                            {action.priority}
                          </Badge>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            Due: {new Date(action.dueDate).toLocaleDateString('id-ID')}
                          </span>
                        </div>
                      </div>
                      <Badge variant="outline">{action.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
