'use client';

/**
 * Guide Contracts Client Component
 * List contracts with status filters and actions
 */

import { useQuery } from '@tanstack/react-query';
import { AlertCircle, CheckCircle2, Clock, Download, FileText, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import queryKeys from '@/lib/queries/query-keys';
import { cn } from '@/lib/utils';

type Contract = {
  id: string;
  contract_number: string;
  contract_type: 'annual'; // Only annual master contracts
  title: string;
  description?: string | null;
  start_date: string;
  end_date?: string | null;
  fee_amount: number | null; // Null for master contracts (fee in trip_guides)
  fee_type: string;
  payment_terms?: string | null;
  status: 'draft' | 'pending_signature' | 'pending_company' | 'active' | 'expired' | 'terminated' | 'rejected';
  guide_signed_at?: string | null;
  company_signed_at?: string | null;
  expires_at?: string | null;
  created_at: string;
  updated_at: string;
  is_master_contract?: boolean;
  auto_cover_trips?: boolean;
  renewal_date?: string | null;
};

type ContractsClientProps = {
  locale: string;
  guideId: string;
};

const contractTypeLabels: Record<string, string> = {
  per_trip: 'Per Trip',
  monthly: 'Bulanan',
  project: 'Project',
  seasonal: 'Musiman',
  annual: 'Tahunan',
};

const statusConfig: Record<
  string,
  { label: string; color: string; icon: React.ComponentType<{ className?: string }> }
> = {
  draft: { label: 'Draft', color: 'bg-slate-100 text-slate-700', icon: FileText },
  pending_signature: {
    label: 'Menunggu Tanda Tangan',
    color: 'bg-amber-100 text-amber-700',
    icon: Clock,
  },
  pending_company: {
    label: 'Menunggu Perusahaan',
    color: 'bg-blue-100 text-blue-700',
    icon: Clock,
  },
  active: { label: 'Aktif', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  expired: { label: 'Kadaluarsa', color: 'bg-slate-100 text-slate-600', icon: AlertCircle },
  terminated: { label: 'Dihentikan', color: 'bg-red-100 text-red-700', icon: XCircle },
  rejected: { label: 'Ditolak', color: 'bg-red-100 text-red-700', icon: XCircle },
};

export function ContractsClient({ locale, guideId }: ContractsClientProps) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data, isLoading, error, refetch } = useQuery<{ contracts: Contract[] }>({
    queryKey: queryKeys.guide.contracts.list({ status: statusFilter !== 'all' ? statusFilter : undefined }),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.set('status', statusFilter);
      }
      const res = await fetch(`/api/guide/contracts?${params.toString()}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.details || 'Failed to load contracts';
        throw new Error(errorMessage);
      }
      return res.json();
    },
  });

  const contracts = data?.contracts ?? [];

  const formatDate = (date: string | null | undefined) => {
    if (!date) return '-';
    try {
      return new Date(date).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return '-';
    }
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) {
      return 'Fee per trip assignment';
    }
    return `Rp ${amount.toLocaleString('id-ID')}`;
  };

  if (isLoading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <LoadingState variant="spinner" message="Memuat kontrak..." />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Gagal memuat kontrak. Silakan coba lagi.';
    
    // Extract error details for better debugging
    let errorDetails: string | undefined;
    if (error instanceof Error) {
      errorDetails = process.env.NODE_ENV === 'development' 
        ? error.stack || error.message
        : undefined;
    }
    
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <ErrorState
            title="Gagal Memuat Kontrak"
            message={errorMessage}
            onRetry={() => void refetch()}
            variant="card"
            showDetails={!!errorDetails}
            details={errorDetails}
            actions={[
              {
                label: 'Refresh Halaman',
                onClick: () => window.location.reload(),
                variant: 'outline',
              },
            ]}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Kontrak Kerja</h1>
        <p className="mt-1 text-sm text-slate-600">Lihat dan kelola kontrak kerja Anda</p>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-slate-700">Filter Status:</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="pending_signature">Menunggu Tanda Tangan</SelectItem>
                <SelectItem value="pending_company">Menunggu Perusahaan</SelectItem>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="expired">Kadaluarsa</SelectItem>
                <SelectItem value="rejected">Ditolak</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Contracts List */}
      {contracts.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <EmptyState
              icon={FileText}
              title="Belum ada kontrak"
              description={
                statusFilter !== 'all'
                  ? `Tidak ada kontrak dengan status "${statusConfig[statusFilter]?.label || statusFilter}"`
                  : 'Kontrak kerja Anda akan muncul di sini setelah admin membuat kontrak untuk Anda'
              }
              variant="subtle"
              action={
                <Button
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/guide/contracts/create-sample', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                      });
                      const data = await res.json();
                      if (res.ok) {
                        window.location.reload();
                      } else {
                        alert(data.error || 'Gagal membuat sample data');
                      }
                    } catch (error) {
                      alert('Gagal membuat sample data');
                    }
                  }}
                  variant="outline"
                >
                  Buat Sample Data
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {contracts.map((contract) => {
            const contractStatus = contract.status || 'draft';
            const status = statusConfig[contractStatus] || statusConfig.draft;
            
            if (!status) {
              return null; // Skip if status config not found
            }
            
            const StatusIcon = status.icon;
            const isPendingSignature = contractStatus === 'pending_signature';
            const isActive = contractStatus === 'active';

            return (
              <Card
                key={contract.id}
                className="border-0 shadow-sm hover:shadow-md transition-shadow"
              >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base font-semibold text-slate-900 line-clamp-1">
                          {contract.title}
                        </CardTitle>
                        <p className="mt-1 text-xs text-slate-500">
                          {contract.contract_number} • {contractTypeLabels[contract.contract_type]}
                        </p>
                      </div>
                      <div
                        className={cn(
                          'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
                          status?.color || 'bg-slate-100 text-slate-700'
                        )}
                      >
                        <StatusIcon className="h-3.5 w-3.5" />
                        <span>{status?.label || 'Unknown'}</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-500">Mulai:</span>
                        <p className="font-medium text-slate-900">{formatDate(contract.start_date)}</p>
                      </div>
                      {contract.end_date && (
                        <div>
                          <span className="text-slate-500">Berakhir:</span>
                          <p className="font-medium text-slate-900">{formatDate(contract.end_date)}</p>
                        </div>
                      )}
                      <div className="col-span-2">
                        <span className="text-slate-500">Fee:</span>
                        <p className="font-semibold text-emerald-600">
                          {contract.fee_amount !== null && contract.fee_amount !== undefined
                            ? formatCurrency(contract.fee_amount)
                            : 'Fee per trip assignment'}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      {isPendingSignature && (
                        <Button
                          size="sm"
                          className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            router.push(`/${locale}/guide/contracts/${contract.id}`);
                          }}
                        >
                          Tandatangani
                        </Button>
                      )}
                      {isActive && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            window.open(`/api/guide/contracts/${contract.id}/pdf`, '_blank');
                          }}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download PDF
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-slate-600"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          router.push(`/${locale}/guide/contracts/${contract.id}`);
                        }}
                      >
                        Lihat Detail
                      </Button>
                    </div>
                  </CardContent>
                </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
