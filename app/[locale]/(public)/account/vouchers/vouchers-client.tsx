'use client';

/**
 * Vouchers Client Component
 * Display list of vouchers for the user
 */

import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import {
  ArrowLeft,
  Calendar,
  ChevronRight,
  Copy,
  Gift,
  Percent,
  Ticket,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { logger } from '@/lib/utils/logger';

type Voucher = {
  id: string;
  code: string;
  name: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minPurchase: number;
  maxDiscount: number | null;
  validFrom: string;
  validUntil: string;
  isUsed: boolean;
};

type VouchersClientProps = {
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

export function VouchersClient({ locale }: VouchersClientProps) {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [_error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVouchers = async () => {
      try {
        // TODO: Replace with actual API endpoint when available
        // For now, show empty state as vouchers table may not exist
        setVouchers([]);
      } catch (err) {
        logger.error('Failed to fetch vouchers', err);
        setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
      } finally {
        setLoading(false);
      }
    };

    fetchVouchers();
  }, []);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Kode voucher disalin!');
  };

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
          <h1 className="text-xl font-bold">Voucher & Promo</h1>
          <p className="text-sm text-muted-foreground">Voucher yang bisa kamu gunakan</p>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-800">
              <div className="flex items-start gap-3">
                <Skeleton className="h-16 w-16 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : vouchers.length === 0 ? (
        <div className="rounded-2xl bg-slate-50 p-8 text-center dark:bg-slate-800">
          <Gift className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
          <p className="font-medium text-muted-foreground">Belum ada voucher</p>
          <p className="mt-1 text-sm text-muted-foreground/70">
            Voucher promo akan muncul di sini
          </p>
          <Link
            href={`/${locale}/packages`}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white"
          >
            <Ticket className="h-4 w-4" />
            Lihat Promo
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {vouchers.map((voucher) => {
            const isExpired = new Date(voucher.validUntil) < new Date();
            const isUsable = !voucher.isUsed && !isExpired;

            return (
              <div
                key={voucher.id}
                className={`overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-slate-800 ${
                  !isUsable ? 'opacity-60' : ''
                }`}
              >
                <div className="flex">
                  {/* Left - Discount Badge */}
                  <div className="flex w-24 shrink-0 flex-col items-center justify-center bg-gradient-to-br from-pink-500 to-rose-500 p-4 text-white">
                    {voucher.discountType === 'percentage' ? (
                      <>
                        <Percent className="mb-1 h-6 w-6" />
                        <span className="text-2xl font-bold">{voucher.discountValue}</span>
                        <span className="text-xs">% OFF</span>
                      </>
                    ) : (
                      <>
                        <Gift className="mb-1 h-6 w-6" />
                        <span className="text-lg font-bold">
                          {formatCurrency(voucher.discountValue)}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Right - Details */}
                  <div className="flex flex-1 flex-col justify-between p-4">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-foreground">{voucher.name}</p>
                        {voucher.isUsed ? (
                          <Badge variant="secondary" className="text-[10px]">
                            Sudah Dipakai
                          </Badge>
                        ) : isExpired ? (
                          <Badge variant="destructive" className="text-[10px]">
                            Expired
                          </Badge>
                        ) : null}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {voucher.description}
                      </p>
                      {voucher.minPurchase > 0 && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Min. pembelian {formatCurrency(voucher.minPurchase)}
                        </p>
                      )}
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        s/d {format(new Date(voucher.validUntil), 'd MMM yyyy', { locale: localeId })}
                      </div>
                      {isUsable && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 gap-1 rounded-lg text-xs"
                          onClick={() => copyCode(voucher.code)}
                        >
                          <Copy className="h-3 w-3" />
                          {voucher.code}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

