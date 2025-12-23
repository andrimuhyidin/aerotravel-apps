'use client';

/**
 * Earnings Preview Card Component
 * Show estimated earnings after check-out
 */

import { AlertCircle, DollarSign, TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import queryKeys from '@/lib/queries/query-keys';

type EarningsPreviewCardProps = {
  tripId: string;
  guideId: string;
  locale?: string;
};

type EarningsData = {
  basePay: number;
  bonuses: {
    onTimeBonus: number;
    performanceBonus: number;
    tipBonus: number;
  };
  deductions: {
    latePenalty: number;
    otherDeductions: number;
  };
  total: number;
  status: 'estimated' | 'confirmed';
};

export function EarningsPreviewCard({
  tripId,
  guideId,
  locale = 'id',
}: EarningsPreviewCardProps) {
  const { data, isLoading } = useQuery<EarningsData>({
    queryKey: queryKeys.guide.attendance?.earningsPreview?.(
      tripId,
      guideId
    ) || ['attendance', 'earnings-preview', tripId, guideId],
    queryFn: async () => {
      const res = await fetch(
        `/api/guide/attendance/earnings-preview?tripId=${tripId}&guideId=${guideId}`
      );
      if (!res.ok) throw new Error('Failed to fetch earnings preview');
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const totalBonuses =
    data.bonuses.onTimeBonus +
    data.bonuses.performanceBonus +
    data.bonuses.tipBonus;
  const totalDeductions =
    data.deductions.latePenalty + data.deductions.otherDeductions;

  return (
    <Card className="border-0 bg-gradient-to-br from-emerald-50 to-emerald-100 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <DollarSign className="h-5 w-5 text-emerald-600" />
          Estimasi Pendapatan Trip
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Base Pay */}
        <div className="flex items-center justify-between rounded-lg bg-white/80 px-3 py-2">
          <span className="text-sm text-slate-700">Base Pay</span>
          <span className="text-sm font-semibold text-slate-900">
            Rp {data.basePay.toLocaleString()}
          </span>
        </div>

        {/* Bonuses */}
        {totalBonuses > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between rounded-t-lg bg-emerald-500/20 px-3 py-2">
              <span className="text-sm font-medium text-emerald-900">
                Bonus
              </span>
              <span className="text-sm font-bold text-emerald-900">
                + Rp {totalBonuses.toLocaleString()}
              </span>
            </div>
            {data.bonuses.onTimeBonus > 0 && (
              <div className="flex items-center justify-between bg-white/80 px-3 py-1.5">
                <span className="text-xs text-slate-600">On-time Bonus</span>
                <span className="text-xs text-emerald-600">
                  + Rp {data.bonuses.onTimeBonus.toLocaleString()}
                </span>
              </div>
            )}
            {data.bonuses.performanceBonus > 0 && (
              <div className="flex items-center justify-between bg-white/80 px-3 py-1.5">
                <span className="text-xs text-slate-600">
                  Performance Bonus
                </span>
                <span className="text-xs text-emerald-600">
                  + Rp {data.bonuses.performanceBonus.toLocaleString()}
                </span>
              </div>
            )}
            {data.bonuses.tipBonus > 0 && (
              <div className="flex items-center justify-between rounded-b-lg bg-white/80 px-3 py-1.5">
                <span className="text-xs text-slate-600">
                  Tips dari Customer
                </span>
                <span className="text-xs text-emerald-600">
                  + Rp {data.bonuses.tipBonus.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Deductions */}
        {totalDeductions > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between rounded-t-lg bg-red-500/20 px-3 py-2">
              <span className="text-sm font-medium text-red-900">Potongan</span>
              <span className="text-sm font-bold text-red-900">
                - Rp {totalDeductions.toLocaleString()}
              </span>
            </div>
            {data.deductions.latePenalty > 0 && (
              <div className="flex items-center justify-between bg-white/80 px-3 py-1.5">
                <span className="text-xs text-slate-600">Late Penalty</span>
                <span className="text-xs text-red-600">
                  - Rp {data.deductions.latePenalty.toLocaleString()}
                </span>
              </div>
            )}
            {data.deductions.otherDeductions > 0 && (
              <div className="flex items-center justify-between rounded-b-lg bg-white/80 px-3 py-1.5">
                <span className="text-xs text-slate-600">Potongan Lain</span>
                <span className="text-xs text-red-600">
                  - Rp {data.deductions.otherDeductions.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Total */}
        <div className="flex items-center justify-between rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-500 px-4 py-3 shadow-md">
          <div>
            <p className="text-xs font-medium text-emerald-100">
              Total Pendapatan
            </p>
            <p className="text-2xl font-bold text-white">
              Rp {data.total.toLocaleString()}
            </p>
          </div>
          <TrendingUp className="h-8 w-8 text-emerald-100" />
        </div>

        {/* Status Badge */}
        {data.status === 'estimated' && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
            <p className="text-xs text-amber-700">
              Ini adalah estimasi. Jumlah final akan dikonfirmasi setelah proses
              payroll.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
