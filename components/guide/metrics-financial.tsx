'use client';

/**
 * Financial Metrics Component
 * Displays financial breakdown with charts and trends
 */

import {
  DollarSign,
  Minus,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';
import type { UnifiedMetrics } from '@/types/guide-metrics';

type FinancialMetricsProps = {
  metrics: UnifiedMetrics;
  className?: string;
};

export function FinancialMetrics({
  metrics,
  className,
}: FinancialMetricsProps) {
  const financial = metrics.financial;

  if (!financial) {
    return (
      <Card className={cn('border-0 shadow-sm', className)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-900">
            Financial Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={DollarSign}
            title="Belum ada data financial"
            description="Data financial akan muncul setelah Anda menyelesaikan trip dan menerima pembayaran."
            variant="minimal"
          />
        </CardContent>
      </Card>
    );
  }

  const hasData =
    financial.netEarnings !== undefined ||
    financial.penaltyImpact !== undefined ||
    financial.savingsRate !== null ||
    financial.withdrawalFrequency !== undefined ||
    (financial.earningsTrend && financial.earningsTrend.length > 0);

  if (!hasData) {
    return (
      <Card className={cn('border-0 shadow-sm', className)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-900">
            Financial Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={DollarSign}
            title="Belum ada data financial"
            description="Data financial akan muncul setelah Anda menyelesaikan trip dan menerima pembayaran."
            variant="minimal"
          />
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (amount: number) => {
    return `Rp ${Math.round(amount).toLocaleString('id-ID')}`;
  };

  // Simple bar chart for earnings trend
  const maxEarnings = Math.max(
    ...financial.earningsTrend,
    financial.netEarnings,
    1
  );
  const earningsTrendBars = financial.earningsTrend.map((earnings, index) => ({
    value: earnings,
    percentage: maxEarnings > 0 ? (earnings / maxEarnings) * 100 : 0,
    month: index + 1,
  }));

  return (
    <Card className={cn('border-0 shadow-sm', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-900">
          Financial Deep Dive
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {/* Net Earnings */}
        <div className="rounded-lg bg-emerald-50/50 p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-600" />
              <span className="text-sm font-medium text-slate-700">
                Net Earnings
              </span>
            </div>
            <span className="text-xs text-slate-500">
              {formatCurrency(metrics.earnings.total)} -{' '}
              {formatCurrency(metrics.earnings.total - financial.netEarnings)}
            </span>
          </div>
          <p className="text-2xl font-bold text-emerald-900">
            {formatCurrency(financial.netEarnings)}
          </p>
        </div>

        {/* Penalty Impact */}
        {financial.penaltyImpact > 0 && (
          <div className="rounded-lg bg-red-50/50 p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Minus className="h-5 w-5 text-red-600" />
                <span className="text-sm font-medium text-slate-700">
                  Penalty Impact
                </span>
              </div>
              <span className="text-xs font-medium text-red-600">
                {financial.penaltyImpact.toFixed(1)}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-red-100">
              <div
                className="h-full bg-red-500 transition-all"
                style={{ width: `${Math.min(financial.penaltyImpact, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Savings Rate */}
        {financial.savingsRate !== null && (
          <div className="rounded-lg bg-blue-50/50 p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-slate-700">
                  Savings Rate
                </span>
              </div>
              <span className="text-xs font-medium text-blue-600">
                {financial.savingsRate.toFixed(0)}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-blue-100">
              <div
                className="h-full bg-blue-500 transition-all"
                style={{ width: `${Math.min(financial.savingsRate, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Withdrawal Frequency */}
        <div className="rounded-lg bg-slate-50/50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-slate-600" />
              <span className="text-sm font-medium text-slate-700">
                Withdrawals This Month
              </span>
            </div>
            <span className="text-lg font-bold text-slate-900">
              {financial.withdrawalFrequency}
            </span>
          </div>
        </div>

        {/* Earnings Trend Chart */}
        {financial.earningsTrend.length > 0 && (
          <div className="rounded-lg bg-slate-50/50 p-4">
            <div className="mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-slate-600" />
              <span className="text-sm font-medium text-slate-700">
                Earnings Trend (Last 3 Months)
              </span>
            </div>
            <div className="flex h-24 items-end gap-2">
              {earningsTrendBars.map((bar, index) => (
                <div
                  key={index}
                  className="group flex flex-1 flex-col items-center"
                >
                  <div className="relative flex h-full w-full flex-col justify-end">
                    <div
                      className="w-full cursor-pointer rounded-t bg-gradient-to-t from-emerald-500 to-emerald-400 transition-all group-hover:from-emerald-600 group-hover:to-emerald-500"
                      style={{ height: `${Math.max(bar.percentage, 5)}%` }}
                      title={`Month ${bar.month}: ${formatCurrency(bar.value)}`}
                    />
                  </div>
                  <p className="mt-1 text-[10px] text-slate-400">
                    M{bar.month}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
