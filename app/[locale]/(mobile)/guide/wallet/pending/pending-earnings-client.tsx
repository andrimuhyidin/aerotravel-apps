/**
 * Pending Earnings Client Component
 * Display pending earnings from completed trips
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { Calendar, Clock, DollarSign, FileText } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';
import { Skeleton } from '@/components/ui/skeleton';
import queryKeys from '@/lib/queries/query-keys';
import { formatCurrency } from '@/lib/partner/wallet';

type PendingEarning = {
  tripId: string;
  tripCode: string;
  tripDate: string;
  amount: number;
  status: string;
};

type SalaryPending = {
  id: string;
  period: string;
  amount: number;
  status: string;
  type: 'salary';
};

type PendingResponse = {
  pending: PendingEarning[];
  salary: SalaryPending[];
  total: number;
};

type PendingEarningsClientProps = {
  locale: string;
};

export function PendingEarningsClient({ locale }: PendingEarningsClientProps) {
  const { data, isLoading, error, refetch } = useQuery<PendingResponse>({
    queryKey: queryKeys.guide.wallet.pending(),
    queryFn: async () => {
      const res = await fetch('/api/guide/wallet/pending');
      if (!res.ok) throw new Error('Gagal memuat pending earnings');
      return (await res.json()) as PendingResponse;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <Skeleton className="h-6 w-48 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-4 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        message="Gagal memuat pendapatan tertunda"
        onRetry={() => void refetch()}
        variant="card"
      />
    );
  }

  const { pending, salary, total } = data || { pending: [], salary: [], total: 0 };

  if (pending.length === 0 && salary.length === 0) {
    return (
      <EmptyState
        icon={DollarSign}
        title="Tidak ada pendapatan tertunda"
        description="Semua pendapatan sudah masuk ke dompet Anda"
        variant="default"
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Total Summary */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-emerald-100/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Pendapatan Tertunda</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">{formatCurrency(total)}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600/10">
              <DollarSign className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trip Earnings */}
      {pending.length > 0 && (
        <div>
          <h2 className="mb-3 text-base font-semibold text-slate-900">Pendapatan Trip</h2>
          <div className="space-y-3">
            {pending.map((earning) => (
              <Card key={earning.tripId} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <Link
                          href={`/${locale}/guide/trips/${earning.tripCode || earning.tripId}`}
                          className="font-semibold text-slate-900 hover:text-emerald-600 transition-colors"
                        >
                          {earning.tripCode}
                        </Link>
                      </div>
                      <p className="mt-1 text-sm text-slate-600">
                        {new Date(earning.tripDate).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                      <p className="mt-2 text-lg font-bold text-emerald-600">
                        {formatCurrency(earning.amount)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
                        Menunggu
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Salary Payments */}
      {salary.length > 0 && (
        <div>
          <h2 className="mb-3 text-base font-semibold text-slate-900">Gaji Tertunda</h2>
          <div className="space-y-3">
            {salary.map((s) => (
              <Card key={s.id} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-slate-400" />
                        <span className="font-semibold text-slate-900">Gaji</span>
                      </div>
                      <p className="mt-1 text-sm text-slate-600">{s.period}</p>
                      <p className="mt-2 text-lg font-bold text-emerald-600">
                        {formatCurrency(s.amount)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          s.status === 'ready'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {s.status === 'ready' ? 'Siap Dibayar' : 'Perlu Dokumen'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Back to Wallet */}
      <div className="pt-4">
        <Link href={`/${locale}/guide/wallet`}>
          <Button variant="outline" className="w-full">
            Kembali ke Dompet
          </Button>
        </Link>
      </div>
    </div>
  );
}

