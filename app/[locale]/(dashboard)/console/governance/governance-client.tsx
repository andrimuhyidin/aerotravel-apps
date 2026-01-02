/**
 * Governance Dashboard Client Component
 * E-Contract status, approval tracking, and compliance overview
 */

'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileCheck,
  FileSignature,
  FileText,
  RefreshCw,
  Shield,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import queryKeys from '@/lib/queries/query-keys';

import { AuthorityMatrixEditor } from './authority-matrix-editor';

type Approval = {
  id: string;
  type: string;
  title: string;
  requestedBy: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  priority: 'low' | 'medium' | 'high';
};

type ContractStatus = {
  id: string;
  type: string;
  name: string;
  status: 'active' | 'pending' | 'expired';
  expiryDate: string | null;
  signedBy: string | null;
};

type GovernanceData = {
  pendingApprovals: Approval[];
  contracts: ContractStatus[];
  complianceScore: number;
  stats: {
    totalContracts: number;
    activeContracts: number;
    pendingApprovals: number;
    expiringContracts: number;
  };
};

async function fetchGovernanceData(): Promise<GovernanceData> {
  // Sample data - in production, fetch from API
  return {
    pendingApprovals: [
      {
        id: '1',
        type: 'refund',
        title: 'Refund Request - BK-001234',
        requestedBy: 'Admin CS',
        requestedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
        status: 'pending',
        priority: 'high',
      },
      {
        id: '2',
        type: 'discount',
        title: 'Special Discount 20% - Corporate Client',
        requestedBy: 'Marketing',
        requestedAt: new Date(Date.now() - 5 * 3600000).toISOString(),
        status: 'pending',
        priority: 'medium',
      },
      {
        id: '3',
        type: 'expense',
        title: 'Expense Claim - Fuel Cost',
        requestedBy: 'Guide Budi',
        requestedAt: new Date(Date.now() - 24 * 3600000).toISOString(),
        status: 'pending',
        priority: 'low',
      },
    ],
    contracts: [
      {
        id: 'c1',
        type: 'guide',
        name: 'Kontrak Guide - Budi Santoso',
        status: 'active',
        expiryDate: '2026-06-30',
        signedBy: 'Super Admin',
      },
      {
        id: 'c2',
        type: 'vendor',
        name: 'Perjanjian Vendor - Kapal Pahawang',
        status: 'active',
        expiryDate: '2026-03-15',
        signedBy: 'Super Admin',
      },
      {
        id: 'c3',
        type: 'partner',
        name: 'MoU Travel Agent - Jakarta Tours',
        status: 'pending',
        expiryDate: null,
        signedBy: null,
      },
    ],
    complianceScore: 85,
    stats: {
      totalContracts: 15,
      activeContracts: 12,
      pendingApprovals: 3,
      expiringContracts: 2,
    },
  };
}

function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'Baru saja';
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  return `${days} hari lalu`;
}

export function GovernanceClient() {
  const {
    data,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: [...queryKeys.admin.all, 'governance'],
    queryFn: fetchGovernanceData,
  });

  useEffect(() => {
    if (error) {
      toast.error('Gagal memuat data governance');
    }
  }, [error]);

  if (isLoading) {
    return <GovernanceSkeleton />;
  }

  if (!data) {
    return <div>Error loading data</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Governance</h1>
          <p className="text-muted-foreground">
            E-Contract, approval tracking, dan compliance
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

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Compliance Score"
          value={`${data.complianceScore}%`}
          subtitle="Skor kepatuhan"
          icon={Shield}
          color="green"
          progress={data.complianceScore}
        />
        <StatsCard
          title="Active Contracts"
          value={data.stats.activeContracts.toString()}
          subtitle={`dari ${data.stats.totalContracts} total`}
          icon={FileCheck}
          color="blue"
        />
        <StatsCard
          title="Pending Approvals"
          value={data.stats.pendingApprovals.toString()}
          subtitle="Menunggu persetujuan"
          icon={Clock}
          color="yellow"
          highlight={data.stats.pendingApprovals > 0}
        />
        <StatsCard
          title="Expiring Soon"
          value={data.stats.expiringContracts.toString()}
          subtitle="Dalam 30 hari"
          icon={AlertTriangle}
          color="red"
          highlight={data.stats.expiringContracts > 0}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pending Approvals */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Pending Approvals
            </CardTitle>
            <CardDescription>
              {data.pendingApprovals.length} approval menunggu keputusan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.pendingApprovals.map((approval) => (
                <ApprovalCard key={approval.id} approval={approval} />
              ))}
              {data.pendingApprovals.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-4">
                  Tidak ada approval pending
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Contracts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileSignature className="h-5 w-5" />
              E-Contracts
            </CardTitle>
            <CardDescription>
              Status kontrak dan perjanjian
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.contracts.map((contract) => (
                <ContractCard key={contract.id} contract={contract} />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Authority Matrix - Full CRUD Editor */}
      <AuthorityMatrixEditor />
    </div>
  );
}

// Sub-components

type StatsCardProps = {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  color: 'green' | 'blue' | 'yellow' | 'red';
  highlight?: boolean;
  progress?: number;
};

function StatsCard({ title, value, subtitle, icon: Icon, color, highlight, progress }: StatsCardProps) {
  const colorClasses = {
    green: 'text-green-600 bg-green-100 dark:bg-green-900/30',
    blue: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
    yellow: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30',
    red: 'text-red-600 bg-red-100 dark:bg-red-900/30',
  };

  return (
    <Card className={cn(highlight && 'border-yellow-500')}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={cn('rounded-lg p-2', colorClasses[color])}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        {progress !== undefined && (
          <Progress value={progress} className="mt-2 h-1" />
        )}
      </CardContent>
    </Card>
  );
}

function ApprovalCard({ approval }: { approval: Approval }) {
  const priorityColors = {
    high: 'destructive',
    medium: 'default',
    low: 'secondary',
  } as const;

  return (
    <div className="flex items-start gap-3 rounded-lg border p-3">
      <div className="rounded-full bg-muted p-2">
        <FileText className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm">{approval.title}</p>
          <Badge variant={priorityColors[approval.priority]} className="text-xs">
            {approval.priority}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {approval.requestedBy} • {formatRelativeTime(approval.requestedAt)}
        </p>
      </div>
      <div className="flex gap-1">
        <Button variant="outline" size="icon" className="h-7 w-7">
          <CheckCircle2 className="h-3 w-3 text-green-600" />
        </Button>
        <Button variant="outline" size="icon" className="h-7 w-7">
          <XCircle className="h-3 w-3 text-red-600" />
        </Button>
      </div>
    </div>
  );
}

function ContractCard({ contract }: { contract: ContractStatus }) {
  const statusColors = {
    active: 'default',
    pending: 'secondary',
    expired: 'destructive',
  } as const;

  return (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      <div className="rounded-full bg-muted p-2">
        <FileSignature className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{contract.name}</p>
        <p className="text-xs text-muted-foreground">
          {contract.expiryDate ? `Exp: ${new Date(contract.expiryDate).toLocaleDateString('id-ID')}` : 'Menunggu tandatangan'}
        </p>
      </div>
      <Badge variant={statusColors[contract.status]}>{contract.status}</Badge>
    </div>
  );
}

function AuthorityRow({
  action,
  cs,
  ops,
  finance,
  admin,
}: {
  action: string;
  cs: string;
  ops: string;
  finance: string;
  admin: string;
}) {
  return (
    <tr className="border-b hover:bg-muted/50">
      <td className="p-2">{action}</td>
      <td className="text-center p-2">{cs}</td>
      <td className="text-center p-2">{ops}</td>
      <td className="text-center p-2">{finance}</td>
      <td className="text-center p-2">{admin}</td>
    </tr>
  );
}

function GovernanceSkeleton() {
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

