'use client';

/**
 * Transactions Client Component
 * Display payment/booking history for customer
 */

import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import {
  ArrowLeft,
  Calendar,
  ChevronRight,
  CreditCard,
  Package,
  Receipt,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { logger } from '@/lib/utils/logger';
import { cn } from '@/lib/utils';

type Transaction = {
  id: string;
  code: string;
  tripDate: string;
  totalPax: number;
  totalAmount: number;
  status: string;
  createdAt: string;
  package: {
    id: string;
    name: string;
    slug: string;
    destination: string;
    duration: string;
  } | null;
};

type TransactionsClientProps = {
  locale: string;
};

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending_payment: { label: 'Menunggu Bayar', variant: 'secondary' },
  paid: { label: 'Dibayar', variant: 'default' },
  confirmed: { label: 'Dikonfirmasi', variant: 'default' },
  completed: { label: 'Selesai', variant: 'default' },
  cancelled: { label: 'Dibatalkan', variant: 'destructive' },
  refunded: { label: 'Refund', variant: 'outline' },
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function TransactionsClient({ locale }: TransactionsClientProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await fetch('/api/user/bookings?limit=50');
        if (!response.ok) {
          throw new Error('Gagal memuat riwayat transaksi');
        }
        const data = await response.json();
        setTransactions(data.bookings || []);
      } catch (err) {
        logger.error('Failed to fetch transactions', err);
        setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          href={`/${locale}/account`}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 transition-colors hover:bg-slate-200 dark:bg-slate-800"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">Riwayat Transaksi</h1>
          <p className="text-sm text-muted-foreground">Semua booking dan pembayaran</p>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-800">
              <div className="flex items-start gap-3">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-5 w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl bg-red-50 p-6 text-center dark:bg-red-950/20">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      ) : transactions.length === 0 ? (
        <div className="rounded-2xl bg-slate-50 p-8 text-center dark:bg-slate-800">
          <Receipt className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
          <p className="font-medium text-muted-foreground">Belum ada transaksi</p>
          <p className="mt-1 text-sm text-muted-foreground/70">
            Booking trip pertamamu sekarang!
          </p>
          <Link
            href={`/${locale}/packages`}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white"
          >
            <Package className="h-4 w-4" />
            Lihat Paket
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx) => {
            const status = statusConfig[tx.status] || { label: tx.status, variant: 'outline' as const };
            
            return (
              <Link
                key={tx.id}
                href={`/${locale}/my-trips/${tx.id}`}
                className="block rounded-2xl bg-white p-4 shadow-sm transition-colors active:bg-slate-50 dark:bg-slate-800 dark:active:bg-slate-700"
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-blue-500/10">
                    <CreditCard className="h-6 w-6 text-primary" />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-foreground">
                          {tx.package?.name || 'Paket Trip'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {tx.code}
                        </p>
                      </div>
                      <Badge variant={status.variant} className="shrink-0 text-[10px]">
                        {status.label}
                      </Badge>
                    </div>

                    <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(tx.tripDate), 'd MMM yyyy', { locale: localeId })}
                      </span>
                      <span>{tx.totalPax} pax</span>
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      <p className="font-bold text-foreground">
                        {formatCurrency(tx.totalAmount)}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(tx.createdAt), 'd MMM yyyy', { locale: localeId })}
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

