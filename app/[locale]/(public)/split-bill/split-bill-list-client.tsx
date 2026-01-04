'use client';

/**
 * Split Bill List Client Component
 * Display list of split bills for the user
 */

import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import {
  ArrowLeft,
  Calendar,
  ChevronRight,
  Plus,
  Sparkles,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { logger } from '@/lib/utils/logger';

type SplitBill = {
  id: string;
  bookingCode: string;
  tripName: string;
  tripDate: string;
  totalAmount: number;
  paidAmount: number;
  participantCount: number;
  paidCount: number;
  status: 'active' | 'completed' | 'expired';
  createdAt: string;
};

type SplitBillListClientProps = {
  locale: string;
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  active: { label: 'Aktif', variant: 'default' },
  completed: { label: 'Lunas', variant: 'secondary' },
  expired: { label: 'Expired', variant: 'destructive' },
};

export function SplitBillListClient({ locale }: SplitBillListClientProps) {
  const [splitBills, setSplitBills] = useState<SplitBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [_error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSplitBills = async () => {
      try {
        // TODO: Replace with actual API endpoint when available
        // For now, show empty state as split_bills table may not exist
        setSplitBills([]);
      } catch (err) {
        logger.error('Failed to fetch split bills', err);
        setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
      } finally {
        setLoading(false);
      }
    };

    fetchSplitBills();
  }, []);

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/${locale}/account`}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 transition-colors hover:bg-slate-200 dark:bg-slate-800"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold">Split Bill</h1>
            <p className="text-sm text-muted-foreground">Patungan bayar trip</p>
          </div>
        </div>
        <Link href={`/${locale}/book`}>
          <Button size="sm" className="gap-1 rounded-xl">
            <Plus className="h-4 w-4" />
            Buat Baru
          </Button>
        </Link>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-800">
              <div className="flex items-start gap-3">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : splitBills.length === 0 ? (
        <div className="rounded-2xl bg-slate-50 p-8 text-center dark:bg-slate-800">
          <Sparkles className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
          <p className="font-medium text-muted-foreground">Belum ada Split Bill</p>
          <p className="mt-1 text-sm text-muted-foreground/70">
            Patungan bayar trip bareng teman dengan mudah
          </p>
          <Link
            href={`/${locale}/book`}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white"
          >
            <Plus className="h-4 w-4" />
            Buat Split Bill
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {splitBills.map((bill) => {
            const status = statusConfig[bill.status];
            const progress = (bill.paidAmount / bill.totalAmount) * 100;

            return (
              <Link
                key={bill.id}
                href={`/${locale}/split-bill/${bill.id}`}
                className="block rounded-2xl bg-white p-4 shadow-sm transition-colors active:bg-slate-50 dark:bg-slate-800 dark:active:bg-slate-700"
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10">
                    <Users className="h-6 w-6 text-indigo-600" />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-foreground">
                          {bill.tripName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {bill.bookingCode}
                        </p>
                      </div>
                      <Badge variant={status.variant} className="shrink-0 text-[10px]">
                        {status.label}
                      </Badge>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-3">
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="text-muted-foreground">
                          {bill.paidCount}/{bill.participantCount} sudah bayar
                        </span>
                        <span className="font-medium text-foreground">
                          {Math.round(progress)}%
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(bill.tripDate), 'd MMM yyyy', { locale: localeId })}
                      </span>
                      <span className="font-medium text-foreground">
                        {formatCurrency(bill.totalAmount)}
                      </span>
                    </div>
                  </div>

                  {/* Arrow */}
                  <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground/50" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

