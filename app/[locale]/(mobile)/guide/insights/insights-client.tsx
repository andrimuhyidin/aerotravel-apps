'use client';

/**
 * Guide Insights Client Component
 * Menampilkan ringkasan bulanan dan riwayat penalty
 */

import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Calendar, DollarSign, Minus, Star, TrendingUp, Users } from 'lucide-react';
import { useState } from 'react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import queryKeys from '@/lib/queries/query-keys';

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

type MonthlyInsights = {
  month: string;
  summary: MonthlySummary;
  weeklyBreakdown: WeeklyData[];
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

type InsightsClientProps = {
  locale: string;
};

export function InsightsClient({ locale: _locale }: InsightsClientProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7), // YYYY-MM format
  );

  // Generate month options (last 12 months)
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return {
      value: date.toISOString().slice(0, 7),
      label: date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
    };
  }).reverse();

  // Fetch monthly insights
  const { data: monthlyData, isLoading: monthlyLoading } = useQuery<MonthlyInsights>({
    queryKey: [...queryKeys.guide.insights.monthly(), selectedMonth],
    queryFn: async () => {
      const res = await fetch(`/api/guide/insights/monthly?month=${selectedMonth}`);
      if (!res.ok) throw new Error('Failed to load monthly insights');
      return (await res.json()) as MonthlyInsights;
    },
    staleTime: 60000,
  });

  // Fetch penalty history
  const { data: penaltiesData, isLoading: penaltiesLoading } = useQuery<PenaltiesData>({
    queryKey: queryKeys.guide.insights.penalties(),
    queryFn: async () => {
      const res = await fetch('/api/guide/insights/penalties?limit=20');
      if (!res.ok) throw new Error('Failed to load penalties');
      return (await res.json()) as PenaltiesData;
    },
    staleTime: 60000,
  });

  const summary = monthlyData?.summary;
  const weeklyData = monthlyData?.weeklyBreakdown || [];

  // Calculate max values for chart scaling
  const maxTrips = Math.max(...weeklyData.map((w) => w.trips), 1);
  const maxIncome = Math.max(...weeklyData.map((w) => w.income), 1);
  const maxPenalties = Math.max(...weeklyData.map((w) => w.penalties), 1);

  return (
    <div className="space-y-4 pb-6">
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

      {/* Monthly Summary */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <h2 className="text-base font-semibold text-slate-900">Ringkasan Bulanan</h2>
        </CardHeader>
        <CardContent className="pt-0">
          {monthlyLoading ? (
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-lg bg-slate-200" />
              ))}
            </div>
          ) : summary ? (
            <div className="grid grid-cols-2 gap-4">
              {/* Total Trips */}
              <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 p-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-blue-700/80">Total Trip</p>
                    <p className="mt-0.5 text-xl font-bold text-blue-900">{summary.totalTrips}</p>
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
                    <p className="text-xs font-medium text-purple-700/80">Total Tamu</p>
                    <p className="mt-0.5 text-xl font-bold text-purple-900">{summary.totalGuests}</p>
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
                    <p className="text-xs font-medium text-emerald-700/80">Total Pendapatan</p>
                    <p className="mt-0.5 text-xl font-bold text-emerald-900">
                      Rp {summary.totalIncome.toLocaleString('id-ID')}
                    </p>
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
                    <p className="text-xs font-medium text-amber-700/80">Rating Rata-rata</p>
                    <p className="mt-0.5 text-xl font-bold text-amber-900">
                      {summary.averageRating.toFixed(1)}
                    </p>
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
                      <p className="text-xs font-medium text-red-700/80">Total Penalty</p>
                      <p className="mt-0.5 text-xl font-bold text-red-900">
                        -Rp {summary.totalPenalties.toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-slate-500">
              Tidak ada data untuk periode ini
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weekly Chart */}
      {weeklyData.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <h2 className="text-base font-semibold text-slate-900">Grafik Per Minggu</h2>
            <p className="mt-1 text-xs text-slate-500">Breakdown performa per minggu dalam bulan ini</p>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-4">
              {/* Trips Chart */}
              <div>
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-600">Trip</span>
                  <span className="text-slate-500">Total: {summary?.totalTrips || 0}</span>
                </div>
                <div className="flex h-8 gap-2">
                  {weeklyData.map((week) => {
                    const percentage = maxTrips > 0 ? (week.trips / maxTrips) * 100 : 0;
                    return (
                      <div key={week.week} className="flex-1">
                        <div className="flex h-full flex-col justify-end">
                          <div
                            className="rounded-t bg-blue-500 transition-all"
                            style={{ height: `${percentage}%` }}
                          />
                        </div>
                        <p className="mt-1 text-center text-xs font-medium text-slate-600">
                          {week.trips}
                        </p>
                        <p className="text-center text-[10px] text-slate-400">M{week.week}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Income Chart */}
              <div>
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-600">Pendapatan</span>
                  <span className="text-slate-500">
                    Total: Rp {(summary?.totalIncome || 0).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex h-8 gap-2">
                  {weeklyData.map((week) => {
                    const percentage = maxIncome > 0 ? (week.income / maxIncome) * 100 : 0;
                    return (
                      <div key={week.week} className="flex-1">
                        <div className="flex h-full flex-col justify-end">
                          <div
                            className="rounded-t bg-emerald-500 transition-all"
                            style={{ height: `${percentage}%` }}
                          />
                        </div>
                        <p className="mt-1 text-center text-xs font-medium text-slate-600">
                          {week.income > 0 ? `${Math.round(week.income / 1000)}k` : '0'}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Penalties Chart (if any) */}
              {summary && summary.totalPenalties > 0 && (
                <div>
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-600">Penalty</span>
                    <span className="text-slate-500">
                      Total: Rp {summary.totalPenalties.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex h-8 gap-2">
                    {weeklyData.map((week) => {
                      const percentage = maxPenalties > 0 ? (week.penalties / maxPenalties) * 100 : 0;
                      return (
                        <div key={week.week} className="flex-1">
                          <div className="flex h-full flex-col justify-end">
                            <div
                              className="rounded-t bg-red-500 transition-all"
                              style={{ height: `${percentage}%` }}
                            />
                          </div>
                          <p className="mt-1 text-center text-xs font-medium text-slate-600">
                            {week.penalties > 0 ? `${Math.round(week.penalties / 1000)}k` : '0'}
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

      {/* Penalty History */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <h2 className="text-base font-semibold text-slate-900">Riwayat Penalty</h2>
          <p className="mt-1 text-xs text-slate-500">
            Lihat detail penalty dan tips untuk menghindarinya
          </p>
        </CardHeader>
        <CardContent className="pt-0">
          {penaltiesLoading ? (
            <div className="space-y-3 py-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 animate-pulse rounded-lg bg-slate-200" />
              ))}
            </div>
          ) : !penaltiesData || penaltiesData.penalties.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                <AlertCircle className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="mb-2 text-sm font-semibold text-slate-900">Tidak ada penalty</h3>
              <p className="text-xs text-slate-500">
                Anda tidak memiliki riwayat penalty. Terus pertahankan performa yang baik!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {penaltiesData.penalties.map((penalty) => (
                <div
                  key={penalty.id}
                  className="rounded-xl border-2 border-red-100 bg-red-50/50 p-4"
                >
                  {/* Penalty Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                        <h3 className="font-semibold text-slate-900">{penalty.tip.title}</h3>
                      </div>
                      <p className="mt-1 text-sm text-slate-600">{penalty.tip.description}</p>
                      <p className="mt-2 text-xs text-slate-500">{penalty.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-red-600">
                        -Rp {penalty.amount.toLocaleString('id-ID')}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {new Date(penalty.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Tips to Avoid */}
                  <div className="mt-4 border-t border-red-200 pt-4">
                    <p className="mb-2 text-xs font-semibold text-slate-700">Tips Menghindari:</p>
                    <ul className="space-y-1.5">
                      {penalty.tip.tips.map((tip, index) => (
                        <li key={index} className="flex items-start gap-2 text-xs text-slate-600">
                          <span className="mt-0.5 flex-shrink-0 text-emerald-600">✓</span>
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
