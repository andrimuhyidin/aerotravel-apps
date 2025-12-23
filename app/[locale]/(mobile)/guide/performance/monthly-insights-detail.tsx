'use client';

/**
 * Monthly Insights Detail Component
 * Menampilkan monthly summary, weekly breakdown, package breakdown, dan penalty history
 */

import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Calendar,
  DollarSign,
  Minus,
  Star,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';
import queryKeys from '@/lib/queries/query-keys';
import { cn } from '@/lib/utils';

type MonthlySummary = {
  totalTrips: number;
  totalGuests: number;
  totalIncome: number;
  totalPenalties: number;
  averageRating: number;
  totalRatings: number;
};

type WeeklyData = {
  week: number;
  weekStart: string;
  weekEnd: string;
  trips: number;
  guests: number;
  income: number;
  penalties: number;
};

type PackageBreakdown = {
  packageId: string | null;
  packageName: string;
  city: string | null;
  trips: number;
  guests: number;
  income: number;
};

type MonthlyInsights = {
  month: string;
  summary: MonthlySummary;
  weeklyBreakdown: WeeklyData[];
  previousMonth?: MonthlySummary;
  packageBreakdown?: PackageBreakdown[];
};

type PenaltyItem = {
  id: string;
  amount: number;
  reason: string;
  description: string;
  createdAt: string;
  tripId: string | null;
  tip: {
    reason: string;
    title: string;
    description: string;
    tips: string[];
  };
};

type PenaltiesData = {
  penalties: PenaltyItem[];
  totalCount: number;
};

type MonthlyInsightsDetailProps = {
  locale: string;
};

export function MonthlyInsightsDetail({
  locale: _locale,
}: MonthlyInsightsDetailProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7) // YYYY-MM format
  );

  // Generate month options (last 12 months)
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return {
      value: date.toISOString().slice(0, 7),
      label: date.toLocaleDateString('id-ID', {
        month: 'long',
        year: 'numeric',
      }),
    };
  }).reverse();

  // Fetch monthly insights
  const {
    data: monthlyData,
    isLoading: monthlyLoading,
    error: monthlyError,
    refetch: refetchMonthly,
  } = useQuery<MonthlyInsights>({
    queryKey: [...queryKeys.guide.insights.monthly(), selectedMonth],
    queryFn: async () => {
      const res = await fetch(
        `/api/guide/insights/monthly?month=${selectedMonth}`
      );
      if (!res.ok) throw new Error('Failed to load monthly insights');
      return (await res.json()) as MonthlyInsights;
    },
    staleTime: 60000,
  });

  // Fetch previous month for comparison
  const previousMonthValue = (() => {
    const parts = selectedMonth.split('-');
    const year = parts[0] ? Number(parts[0]) : new Date().getFullYear();
    const month = parts[1] ? Number(parts[1]) : new Date().getMonth() + 1;
    const prevDate = new Date(year, month - 2, 1);
    return prevDate.toISOString().slice(0, 7);
  })();

  const { data: previousMonthData } = useQuery<MonthlyInsights | null>({
    queryKey: [...queryKeys.guide.insights.monthly(), previousMonthValue],
    queryFn: async (): Promise<MonthlyInsights | null> => {
      const res = await fetch(
        `/api/guide/insights/monthly?month=${previousMonthValue}`
      );
      if (!res.ok) return null;
      return (await res.json()) as MonthlyInsights;
    },
    staleTime: 300000, // 5 minutes
    enabled: selectedMonth !== new Date().toISOString().slice(0, 7), // Only fetch if not current month
  });

  // Fetch penalty history
  const { data: penaltiesData, isLoading: penaltiesLoading } =
    useQuery<PenaltiesData>({
      queryKey: queryKeys.guide.insights.penalties(),
      queryFn: async () => {
        const res = await fetch('/api/guide/insights/penalties?limit=20');
        if (!res.ok) throw new Error('Failed to load penalties');
        return (await res.json()) as PenaltiesData;
      },
      staleTime: 60000,
    });

  const summary = monthlyData?.summary;
  const previousSummary =
    previousMonthData && 'summary' in previousMonthData
      ? previousMonthData.summary
      : undefined;
  const weeklyData = monthlyData?.weeklyBreakdown ?? [];

  // Calculate trend indicators
  const calculateTrend = (current: number, previous: number | undefined) => {
    if (!previous || previous === 0) return null;
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(change),
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
      isPositive: change > 0,
    };
  };

  const tripsTrend = calculateTrend(
    summary?.totalTrips || 0,
    previousSummary?.totalTrips
  );
  const incomeTrend = calculateTrend(
    summary?.totalIncome || 0,
    previousSummary?.totalIncome
  );
  const ratingTrend = calculateTrend(
    summary?.averageRating || 0,
    previousSummary?.averageRating
  );

  // Calculate max values for chart scaling
  const maxTrips =
    weeklyData.length > 0
      ? Math.max(...weeklyData.map((w) => w?.trips ?? 0), 1)
      : 1;
  const maxIncome =
    weeklyData.length > 0
      ? Math.max(...weeklyData.map((w) => w?.income ?? 0), 1)
      : 1;
  const maxPenalties =
    weeklyData.length > 0
      ? Math.max(...weeklyData.map((w) => w?.penalties ?? 0), 1)
      : 1;

  return (
    <div className="space-y-4">
      {/* Month Selector */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-slate-600" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="flex-1 rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              {monthOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {monthlyLoading && (
        <LoadingState
          variant="skeleton-card"
          lines={5}
          message="Memuat insights bulanan..."
        />
      )}

      {/* Error State */}
      {monthlyError && !monthlyLoading && (
        <ErrorState
          message={
            monthlyError instanceof Error
              ? monthlyError.message
              : 'Gagal memuat insights bulanan'
          }
          onRetry={() => void refetchMonthly()}
          variant="card"
        />
      )}

      {/* Monthly Summary with Trends */}
      {!monthlyLoading && !monthlyError && summary && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-900">
              Ringkasan Bulanan
            </CardTitle>
            {previousSummary && (
              <p className="mt-1 text-xs text-slate-500">
                Dibandingkan dengan bulan sebelumnya
              </p>
            )}
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-4">
              {/* Total Trips */}
              <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 p-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-blue-700/80">
                      Total Trip
                    </p>
                    <div className="flex items-baseline gap-2">
                      <p className="mt-0.5 text-xl font-bold text-blue-900">
                        {summary.totalTrips}
                      </p>
                      {tripsTrend && (
                        <div
                          className={cn(
                            'flex items-center gap-0.5 text-xs',
                            tripsTrend.isPositive
                              ? 'text-green-600'
                              : 'text-red-600'
                          )}
                        >
                          {tripsTrend.direction === 'up' ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : (
                            <ArrowDown className="h-3 w-3" />
                          )}
                          <span>{tripsTrend.value.toFixed(0)}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Total Guests */}
              <div className="rounded-xl bg-gradient-to-br from-purple-50 to-purple-100/50 p-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-purple-700/80">
                      Total Tamu
                    </p>
                    <p className="mt-0.5 text-xl font-bold text-purple-900">
                      {summary.totalGuests}
                    </p>
                  </div>
                </div>
              </div>

              {/* Total Income */}
              <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500">
                    <DollarSign className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-emerald-700/80">
                      Total Pendapatan
                    </p>
                    <div className="flex items-baseline gap-2">
                      <p className="mt-0.5 text-xl font-bold text-emerald-900">
                        Rp {summary.totalIncome.toLocaleString('id-ID')}
                      </p>
                      {incomeTrend && (
                        <div
                          className={cn(
                            'flex items-center gap-0.5 text-xs',
                            incomeTrend.isPositive
                              ? 'text-green-600'
                              : 'text-red-600'
                          )}
                        >
                          {incomeTrend.direction === 'up' ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : (
                            <ArrowDown className="h-3 w-3" />
                          )}
                          <span>{incomeTrend.value.toFixed(0)}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Rating */}
              <div className="rounded-xl bg-gradient-to-br from-amber-50 to-amber-100/50 p-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500">
                    <Star className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-amber-700/80">
                      Rating Rata-rata
                    </p>
                    <div className="flex items-baseline gap-2">
                      <p className="mt-0.5 text-xl font-bold text-amber-900">
                        {summary.averageRating.toFixed(1)}
                      </p>
                      {ratingTrend && (
                        <div
                          className={cn(
                            'flex items-center gap-0.5 text-xs',
                            ratingTrend.isPositive
                              ? 'text-green-600'
                              : 'text-red-600'
                          )}
                        >
                          {ratingTrend.direction === 'up' ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : (
                            <ArrowDown className="h-3 w-3" />
                          )}
                          <span>{ratingTrend.value.toFixed(0)}%</span>
                        </div>
                      )}
                    </div>
                    {summary.totalRatings > 0 && (
                      <p className="mt-0.5 text-xs text-amber-700/70">
                        ({summary.totalRatings} review)
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Total Penalties */}
              {summary.totalPenalties > 0 && (
                <div className="col-span-2 rounded-xl bg-gradient-to-br from-red-50 to-red-100/50 p-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500">
                      <Minus className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-red-700/80">
                        Total Penalty
                      </p>
                      <p className="mt-0.5 text-xl font-bold text-red-900">
                        -Rp {summary.totalPenalties.toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Weekly Chart */}
      {weeklyData.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-900">
              Grafik Per Minggu
            </CardTitle>
            <p className="mt-1 text-xs text-slate-500">
              Breakdown performa per minggu dalam bulan ini
            </p>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-6">
              {/* Trips Chart */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">
                    Trip
                  </span>
                  <span className="text-xs text-slate-500">
                    Total: {summary?.totalTrips || 0}
                  </span>
                </div>
                <div className="flex h-24 gap-2">
                  {weeklyData
                    .filter((w) => w && w.week)
                    .map((week) => {
                      const percentage =
                        maxTrips > 0
                          ? ((week?.trips ?? 0) / maxTrips) * 100
                          : 0;
                      return (
                        <div
                          key={week.week}
                          className="group flex flex-1 flex-col items-center"
                        >
                          <div className="relative flex h-full w-full flex-col justify-end">
                            <div
                              className="w-full cursor-pointer rounded-t bg-gradient-to-t from-blue-500 to-blue-400 transition-all group-hover:from-blue-600 group-hover:to-blue-500"
                              style={{ height: `${Math.max(percentage, 5)}%` }}
                              title={`Minggu ${week.week}: ${week.trips} trip`}
                            />
                          </div>
                          <p className="mt-2 text-xs font-semibold text-slate-700">
                            {week.trips}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            M{week.week}
                          </p>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Income Chart */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">
                    Pendapatan
                  </span>
                  <span className="text-xs text-slate-500">
                    Total: Rp{' '}
                    {(summary?.totalIncome || 0).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex h-24 gap-2">
                  {weeklyData
                    .filter((w) => w && w.week)
                    .map((week) => {
                      const percentage =
                        maxIncome > 0
                          ? ((week?.income ?? 0) / maxIncome) * 100
                          : 0;
                      return (
                        <div
                          key={week.week}
                          className="group flex flex-1 flex-col items-center"
                        >
                          <div className="relative flex h-full w-full flex-col justify-end">
                            <div
                              className="w-full cursor-pointer rounded-t bg-gradient-to-t from-emerald-500 to-emerald-400 transition-all group-hover:from-emerald-600 group-hover:to-emerald-500"
                              style={{ height: `${Math.max(percentage, 5)}%` }}
                              title={`Minggu ${week.week}: Rp ${week.income.toLocaleString('id-ID')}`}
                            />
                          </div>
                          <p className="mt-2 text-xs font-semibold text-slate-700">
                            {week.income > 0
                              ? `${Math.round(week.income / 1000)}k`
                              : '0'}
                          </p>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Penalties Chart (if any) */}
              {summary && summary.totalPenalties > 0 && (
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-700">
                      Penalty
                    </span>
                    <span className="text-xs text-slate-500">
                      Total: Rp {summary.totalPenalties.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex h-24 gap-2">
                    {weeklyData
                      .filter((w) => w && w.week)
                      .map((week) => {
                        const percentage =
                          maxPenalties > 0
                            ? ((week?.penalties ?? 0) / maxPenalties) * 100
                            : 0;
                        return (
                          <div
                            key={week.week}
                            className="group flex flex-1 flex-col items-center"
                          >
                            <div className="relative flex h-full w-full flex-col justify-end">
                              <div
                                className="w-full cursor-pointer rounded-t bg-gradient-to-t from-red-500 to-red-400 transition-all group-hover:from-red-600 group-hover:to-red-500"
                                style={{
                                  height: `${Math.max(percentage, 5)}%`,
                                }}
                                title={`Minggu ${week.week}: Rp ${week.penalties.toLocaleString('id-ID')}`}
                              />
                            </div>
                            <p className="mt-2 text-xs font-semibold text-slate-700">
                              {week.penalties > 0
                                ? `${Math.round(week.penalties / 1000)}k`
                                : '0'}
                            </p>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Package Breakdown */}
      {monthlyData?.packageBreakdown &&
        monthlyData.packageBreakdown.length > 0 && (
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-slate-900">
                Breakdown per Paket
              </CardTitle>
              <p className="mt-1 text-xs text-slate-500">
                Distribusi trip dan pendapatan berdasarkan paket/destinasi
              </p>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {monthlyData.packageBreakdown
                  .filter((pkg) => pkg && pkg.packageName)
                  .map((pkg, idx) => {
                    const totalTrips = summary?.totalTrips ?? 1;
                    const totalIncome = summary?.totalIncome ?? 1;
                    const tripsPercentage =
                      totalTrips > 0
                        ? ((pkg?.trips ?? 0) / totalTrips) * 100
                        : 0;
                    const incomePercentage =
                      totalIncome > 0
                        ? ((pkg?.income ?? 0) / totalIncome) * 100
                        : 0;

                    return (
                      <div
                        key={pkg.packageId || `unknown-${idx}`}
                        className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 transition-all hover:border-slate-300 hover:bg-slate-50"
                      >
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-slate-900">
                              {pkg.packageName}
                            </h3>
                            {pkg.city && (
                              <p className="mt-0.5 text-xs text-slate-500">
                                {pkg.city}
                              </p>
                            )}
                          </div>
                          <Badge variant="outline" className="shrink-0">
                            {pkg.trips} trip
                          </Badge>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <p className="text-xs text-slate-500">Trip</p>
                            <p className="mt-0.5 text-sm font-semibold text-slate-900">
                              {pkg.trips}
                            </p>
                            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                              <div
                                className="h-full bg-blue-500 transition-all"
                                style={{ width: `${tripsPercentage}%` }}
                              />
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Tamu</p>
                            <p className="mt-0.5 text-sm font-semibold text-slate-900">
                              {pkg.guests}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Pendapatan</p>
                            <p className="mt-0.5 text-sm font-semibold text-emerald-700">
                              Rp {pkg.income.toLocaleString('id-ID')}
                            </p>
                            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                              <div
                                className="h-full bg-emerald-500 transition-all"
                                style={{ width: `${incomePercentage}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        )}

      {/* Penalty History */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-900">
            Riwayat Penalty
          </CardTitle>
          <p className="mt-1 text-xs text-slate-500">
            Lihat detail penalty dan tips untuk menghindarinya
          </p>
        </CardHeader>
        <CardContent className="pt-0">
          {penaltiesLoading ? (
            <LoadingState variant="skeleton-card" lines={3} />
          ) : !penaltiesData || penaltiesData.penalties.length === 0 ? (
            <EmptyState
              icon={AlertCircle}
              title="Tidak ada penalties"
              description="Anda belum menerima penalties bulan ini"
              variant="subtle"
            />
          ) : (
            <div className="space-y-4">
              {penaltiesData.penalties
                .filter((p) => p && p.id && p.tip)
                .map((penalty) => (
                  <div
                    key={penalty.id}
                    className="rounded-xl border-2 border-red-100 bg-red-50/50 p-4 transition-all hover:border-red-200 hover:bg-red-50"
                  >
                    {/* Penalty Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
                          <h3 className="font-semibold text-slate-900">
                            {penalty.tip.title}
                          </h3>
                        </div>
                        <p className="mt-1 text-sm text-slate-600">
                          {penalty.tip.description}
                        </p>
                        <p className="mt-2 text-xs text-slate-500">
                          {penalty.description}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-lg font-bold text-red-600">
                          -Rp {penalty.amount.toLocaleString('id-ID')}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {penalty.createdAt
                            ? (() => {
                                try {
                                  return new Date(
                                    penalty.createdAt
                                  ).toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                  });
                                } catch {
                                  return 'Tanggal tidak valid';
                                }
                              })()
                            : 'Tanggal tidak tersedia'}
                        </p>
                      </div>
                    </div>

                    {/* Tips to Avoid */}
                    <div className="mt-4 border-t border-red-200 pt-4">
                      <p className="mb-2 text-xs font-semibold text-slate-700">
                        Tips Menghindari:
                      </p>
                      <ul className="space-y-1.5">
                        {penalty.tip.tips &&
                          Array.isArray(penalty.tip.tips) &&
                          penalty.tip.tips
                            .filter((t) => t)
                            .map((tip, index) => (
                              <li
                                key={index}
                                className="flex items-start gap-2 text-xs text-slate-600"
                              >
                                <span className="mt-0.5 shrink-0 text-emerald-600">
                                  ✓
                                </span>
                                <span className="leading-relaxed">{tip}</span>
                              </li>
                            ))}
                      </ul>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
