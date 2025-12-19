'use client';

/**
 * Console: Guide Contracts Management Client
 * Table view dengan filters, create, edit, send, sign, terminate
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    CheckCircle2,
    Download,
    FileText,
    LogOut,
    MoreVertical,
    Plus,
    Send
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Input } from '@/components/ui/input';
import { LoadingState } from '@/components/ui/loading-state';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

type Contract = {
  id: string;
  contract_number: string;
  contract_type: string;
  title: string;
  start_date: string;
  end_date?: string | null;
  fee_amount: number;
  status: string;
  guide_id: string;
  guide: {
    id: string;
    full_name: string | null;
    email: string | null;
  } | null;
  created_at: string;
  expires_at?: string | null;
};

type ContractsManagementClientProps = {
  locale: string;
};

export function ContractsManagementClient({ locale }: ContractsManagementClientProps) {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading, error, refetch } = useQuery<{
    contracts: Contract[];
    total: number;
  }>({
    queryKey: ['admin', 'guide', 'contracts', { status: statusFilter, type: typeFilter, search: searchQuery }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (typeFilter !== 'all') params.set('type', typeFilter);
      const res = await fetch(`/api/admin/guide/contracts?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load contracts');
      const result = await res.json();
      
      // Client-side search filtering
      let filteredContracts = result.contracts || [];
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredContracts = filteredContracts.filter((contract: Contract) => {
          const contractNumber = contract.contract_number?.toLowerCase() || '';
          const title = contract.title?.toLowerCase() || '';
          const guideName = contract.guide?.full_name?.toLowerCase() || '';
          const guideEmail = contract.guide?.email?.toLowerCase() || '';
          return (
            contractNumber.includes(query) ||
            title.includes(query) ||
            guideName.includes(query) ||
            guideEmail.includes(query)
          );
        });
      }
      
      return {
        contracts: filteredContracts,
        total: filteredContracts.length,
      };
    },
  });

  const sendMutation = useMutation({
    mutationFn: async (contractId: string) => {
      const res = await fetch(`/api/admin/guide/contracts/${contractId}/send`, {
        method: 'POST',
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error || 'Gagal mengirim kontrak');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'guide', 'contracts'] });
    },
  });

  const signMutation = useMutation({
    mutationFn: async (contractId: string) => {
      const res = await fetch(`/api/admin/guide/contracts/${contractId}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signature_method: 'typed' }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error || 'Gagal menandatangani kontrak');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'guide', 'contracts'] });
    },
  });

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString('id-ID')}`;
  };

  const contracts = data?.contracts ?? [];

  if (isLoading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <LoadingState variant="spinner" message="Memuat kontrak..." />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <ErrorState message="Gagal memuat kontrak" onRetry={() => void refetch()} variant="card" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manajemen Kontrak Guide</h1>
          <p className="mt-1 text-sm text-slate-600">
            Kelola semua kontrak kerja guide ({data?.total || 0} total)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/${locale}/console/guide/contracts/resignations`}>
            <Button variant="outline">
              <LogOut className="mr-2 h-4 w-4" />
              Pengajuan Resign
            </Button>
          </Link>
          <Link href={`/${locale}/console/guide/contracts/create`}>
            <Button className="bg-emerald-600 text-white hover:bg-emerald-700">
              <Plus className="mr-2 h-4 w-4" />
              Buat Kontrak Baru
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Cari nomor kontrak, guide..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending_signature">Menunggu Guide</SelectItem>
                <SelectItem value="pending_company">Menunggu Perusahaan</SelectItem>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="expired">Kadaluarsa</SelectItem>
                <SelectItem value="rejected">Ditolak</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Jenis" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Jenis</SelectItem>
                <SelectItem value="per_trip">Per Trip</SelectItem>
                <SelectItem value="monthly">Bulanan</SelectItem>
                <SelectItem value="project">Project</SelectItem>
                <SelectItem value="seasonal">Musiman</SelectItem>
                <SelectItem value="annual">Tahunan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Contracts Table */}
      {contracts.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <EmptyState
              icon={FileText}
              title="Belum ada kontrak"
              description="Kontrak yang dibuat akan muncul di sini"
              variant="subtle"
            />
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Daftar Kontrak</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">
                      Nomor
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">
                      Guide
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">
                      Judul
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">
                      Jenis
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">
                      Fee
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">
                      Tanggal
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {contracts.map((contract) => {
                    const statusConfig = {
                      draft: { label: 'Draft', color: 'bg-slate-100 text-slate-700' },
                      pending_signature: {
                        label: 'Menunggu Guide',
                        color: 'bg-amber-100 text-amber-700',
                      },
                      pending_company: {
                        label: 'Menunggu Perusahaan',
                        color: 'bg-blue-100 text-blue-700',
                      },
                      active: { label: 'Aktif', color: 'bg-emerald-100 text-emerald-700' },
                      expired: { label: 'Kadaluarsa', color: 'bg-slate-100 text-slate-600' },
                      rejected: { label: 'Ditolak', color: 'bg-red-100 text-red-700' },
                    };

                    const status = statusConfig[contract.status as keyof typeof statusConfig] || statusConfig.draft;

                    return (
                      <tr key={contract.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm font-medium text-slate-900">
                          {contract.contract_number}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700">
                          {contract.guide?.full_name || contract.guide?.email || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-900">{contract.title}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {contract.contract_type === 'per_trip' && 'Per Trip'}
                          {contract.contract_type === 'monthly' && 'Bulanan'}
                          {contract.contract_type === 'project' && 'Project'}
                          {contract.contract_type === 'seasonal' && 'Musiman'}
                          {contract.contract_type === 'annual' && 'Tahunan'}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-emerald-600">
                          {formatCurrency(contract.fee_amount)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              'inline-flex rounded-full px-2.5 py-1 text-xs font-medium',
                              status.color
                            )}
                          >
                            {status.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {formatDate(contract.start_date)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/${locale}/console/guide/contracts/${contract.id}`}>
                              <Button variant="ghost" size="sm">
                                Detail
                              </Button>
                            </Link>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {contract.status === 'draft' && (
                                  <DropdownMenuItem
                                    onClick={() => sendMutation.mutate(contract.id)}
                                    disabled={sendMutation.isPending}
                                  >
                                    <Send className="mr-2 h-4 w-4" />
                                    Kirim ke Guide
                                  </DropdownMenuItem>
                                )}
                                {contract.status === 'pending_company' && (
                                  <DropdownMenuItem
                                    onClick={() => signMutation.mutate(contract.id)}
                                    disabled={signMutation.isPending}
                                  >
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Tandatangani
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  onClick={() => {
                                    window.open(`/api/guide/contracts/${contract.id}/pdf`, '_blank');
                                  }}
                                >
                                  <Download className="mr-2 h-4 w-4" />
                                  Download PDF
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
