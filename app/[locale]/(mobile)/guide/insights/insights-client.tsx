'use client';

/**
 * Guide Insights Client Component
 * Enhanced insights dengan AI recommendations, performance metrics, dan trend analysis
 */

import { useQuery } from '@tanstack/react-query';
import {
    AlertCircle,
    ArrowDown,
    ArrowUp,
    BarChart3,
    Brain,
    Calendar,
    DollarSign,
    Lightbulb,
    Minus,
    Star,
    Target,
    TrendingDown,
    TrendingUp,
    Users,
    Zap
} from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  previousMonth?: MonthlySummary; // For comparison
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

type PerformanceMetrics = {
  period: number;
  onTimeRate: number;
  totalTrips: number;
  onTimeTrips: number;
  averageRating: number;
  ratingTrend: number[];
  percentile: number;
  earningsByTrip: number;
};

type AIInsights = {
  income_prediction: {
    next_month: number;
    next_3_months: number;
    confidence: 'high' | 'medium' | 'low';
    reasoning: string;
  };
  recommendations: Array<{
    type: 'performance' | 'earning' | 'safety' | 'customer_service';
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  trip_suggestions: Array<{
    suggestion: string;
    reason: string;
  }>;
  performance_insights: {
    strengths: string[];
    improvements: string[];
    trend: 'improving' | 'stable' | 'declining';
  };
};

type InsightsClientProps = {
  locale: string;
};

export function InsightsClient({ locale }: InsightsClientProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7), // YYYY-MM format
  );
  const [activeTab, setActiveTab] = useState<'insights' | 'ratings'>('insights');

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
      const res = await fetch(`/api/guide/insights/monthly?month=${previousMonthValue}`);
      if (!res.ok) return null;
      return (await res.json()) as MonthlyInsights;
    },
    staleTime: 300000, // 5 minutes
    enabled: selectedMonth !== new Date().toISOString().slice(0, 7), // Only fetch if not current month
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

  // Fetch performance metrics (from performance API)
  const { data: performanceData, isLoading: performanceLoading } = useQuery({
    queryKey: queryKeys.guide.performance.metrics(),
    queryFn: async () => {
      const res = await fetch('/api/guide/performance/metrics?period=monthly');
      if (!res.ok) throw new Error('Failed to load performance metrics');
      return (await res.json()) as {
        metrics: {
          total_trips: number;
          completed_trips: number;
          average_rating: number | null;
          total_earnings: number;
          on_time_rate: number | null;
          overall_score: number | null;
          performance_tier: string | null;
          skills_improved: number;
          assessments_completed: number;
        };
      };
    },
    staleTime: 60000,
  });

  // Fetch performance insights (AI-powered)
  const { data: performanceInsightsData } = useQuery({
    queryKey: queryKeys.guide.performance.insights(),
    queryFn: async () => {
      const res = await fetch('/api/guide/performance/insights');
      if (!res.ok) return null;
      return (await res.json()) as {
        insights: {
          summary?: string;
          trends?: Array<{ metric: string; change: number; direction: string }>;
          recommendations?: string[];
        };
      };
    },
    staleTime: 300000, // 5 minutes
    retry: 1,
  });

  // Fetch AI insights
  const { data: aiData, isLoading: aiLoading } = useQuery<{ insights: AIInsights; context: unknown }>({
    queryKey: queryKeys.guide.aiInsights(),
    queryFn: async () => {
      const res = await fetch('/api/guide/insights/ai');
      if (!res.ok) throw new Error('Failed to load AI insights');
      return (await res.json()) as { insights: AIInsights; context: unknown };
    },
    staleTime: 300000, // 5 minutes - AI insights don't change frequently
    retry: 1, // Only retry once for AI insights (can be slow)
  });

  const summary = monthlyData?.summary;
  const previousSummary = previousMonthData && 'summary' in previousMonthData ? previousMonthData.summary : undefined;
  const weeklyData = monthlyData?.weeklyBreakdown || [];
  const aiInsights = aiData?.insights;
  const performanceMetrics = performanceData?.metrics;
  const performanceInsights = performanceInsightsData?.insights;

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

  const tripsTrend = calculateTrend(summary?.totalTrips || 0, previousSummary?.totalTrips);
  const incomeTrend = calculateTrend(summary?.totalIncome || 0, previousSummary?.totalIncome);
  const ratingTrend = calculateTrend(summary?.averageRating || 0, previousSummary?.averageRating);

  // Calculate max values for chart scaling
  const maxTrips = Math.max(...weeklyData.map((w) => w.trips), 1);
  const maxIncome = Math.max(...weeklyData.map((w) => w.income), 1);
  const maxPenalties = Math.max(...weeklyData.map((w) => w.penalties), 1);

  // Ratings data (for ratings tab)
  type RatingsResponse = {
    reviews: Array<{
      id: string;
      bookingId: string;
      reviewerName: string;
      guideRating: number | null;
      overallRating: number;
      reviewText: string | null;
      createdAt: string;
    }>;
    summary: {
      averageRating: number;
      totalRatings: number;
      ratingDistribution: {
        '5': number;
        '4': number;
        '3': number;
        '2': number;
        '1': number;
      };
      recentAverageRating?: number;
      trend?: 'up' | 'down' | 'stable';
    };
  };

  const { data: ratingsData, isLoading: ratingsLoading } = useQuery<RatingsResponse>({
    queryKey: queryKeys.guide.ratings(),
    queryFn: async (): Promise<RatingsResponse> => {
      const res = await fetch('/api/guide/ratings');
      if (!res.ok) throw new Error('Failed to load ratings');
      return (await res.json()) as RatingsResponse;
    },
    enabled: activeTab === 'ratings',
    refetchInterval: 60000,
  });

  return (
    <div className="space-y-4 pb-6">
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="insights">Insight</TabsTrigger>
          <TabsTrigger value="ratings">
            Rating & Ulasan {ratingsData?.summary.totalRatings ? `(${ratingsData.summary.totalRatings})` : ''}
          </TabsTrigger>
        </TabsList>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-4 mt-4">
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

      {/* AI Insights Card */}
      {aiLoading ? (
        <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-indigo-50">
          <CardHeader className="pb-3">
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </CardContent>
        </Card>
      ) : aiInsights ? (
        <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-indigo-50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-base font-semibold text-slate-900">AI Insights</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            {/* Income Prediction */}
            <div className="rounded-lg bg-white/60 p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-600">Prediksi Pendapatan</span>
                <Badge
                  variant="outline"
                  className={cn(
                    'text-xs',
                    aiInsights.income_prediction.confidence === 'high' && 'border-green-500 text-green-700',
                    aiInsights.income_prediction.confidence === 'medium' && 'border-yellow-500 text-yellow-700',
                    aiInsights.income_prediction.confidence === 'low' && 'border-red-500 text-red-700',
                  )}
                >
                  {aiInsights.income_prediction.confidence === 'high' && 'Tinggi'}
                  {aiInsights.income_prediction.confidence === 'medium' && 'Sedang'}
                  {aiInsights.income_prediction.confidence === 'low' && 'Rendah'}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <p className="text-xs text-slate-500">Bulan Depan</p>
                  <p className="text-lg font-bold text-slate-900">
                    Rp {aiInsights.income_prediction.next_month.toLocaleString('id-ID')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">3 Bulan</p>
                  <p className="text-lg font-bold text-slate-900">
                    Rp {aiInsights.income_prediction.next_3_months.toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-600">{aiInsights.income_prediction.reasoning}</p>
            </div>

            {/* Performance Insights */}
            {aiInsights.performance_insights && (
              <div className="rounded-lg bg-white/60 p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="h-4 w-4 text-purple-600" />
                  <span className="text-xs font-semibold text-slate-700">Analisis Performa</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      'ml-auto text-xs',
                      aiInsights.performance_insights.trend === 'improving' && 'border-green-500 text-green-700',
                      aiInsights.performance_insights.trend === 'stable' && 'border-blue-500 text-blue-700',
                      aiInsights.performance_insights.trend === 'declining' && 'border-red-500 text-red-700',
                    )}
                  >
                    {aiInsights.performance_insights.trend === 'improving' && 'Meningkat'}
                    {aiInsights.performance_insights.trend === 'stable' && 'Stabil'}
                    {aiInsights.performance_insights.trend === 'declining' && 'Menurun'}
                  </Badge>
                </div>
                {aiInsights.performance_insights.strengths.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-green-700 mb-1.5">Kekuatan:</p>
                    <ul className="space-y-1">
                      {aiInsights.performance_insights.strengths.map((strength, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                          <span className="mt-0.5 text-green-600">✓</span>
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {aiInsights.performance_insights.improvements.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-amber-700 mb-1.5">Area Perbaikan:</p>
                    <ul className="space-y-1">
                      {aiInsights.performance_insights.improvements.map((improvement, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                          <span className="mt-0.5 text-amber-600">→</span>
                          <span>{improvement}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Recommendations */}
            {aiInsights.recommendations && aiInsights.recommendations.length > 0 && (
              <div className="rounded-lg bg-white/60 p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="h-4 w-4 text-amber-600" />
                  <span className="text-xs font-semibold text-slate-700">Rekomendasi</span>
                </div>
                <div className="space-y-2">
                  {aiInsights.recommendations.slice(0, 3).map((rec, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        'rounded-lg p-3 border',
                        rec.priority === 'high' && 'border-red-200 bg-red-50/50',
                        rec.priority === 'medium' && 'border-yellow-200 bg-yellow-50/50',
                        rec.priority === 'low' && 'border-blue-200 bg-blue-50/50',
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-slate-900">{rec.title}</p>
                          <p className="mt-1 text-xs text-slate-600">{rec.description}</p>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[10px] shrink-0',
                            rec.priority === 'high' && 'border-red-500 text-red-700',
                            rec.priority === 'medium' && 'border-yellow-500 text-yellow-700',
                            rec.priority === 'low' && 'border-blue-500 text-blue-700',
                          )}
                        >
                          {rec.priority === 'high' && 'Tinggi'}
                          {rec.priority === 'medium' && 'Sedang'}
                          {rec.priority === 'low' && 'Rendah'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      {/* Performance Metrics - Integrated from Performance API */}
      {performanceLoading ? (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="mt-2 h-3 w-24" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-24 rounded-xl" />
              <Skeleton className="h-24 rounded-xl" />
            </div>
          </CardContent>
        </Card>
      ) : performanceMetrics ? (
        <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-blue-50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-emerald-600" />
              <CardTitle className="text-base font-semibold text-slate-900">Performance Metrics</CardTitle>
            </div>
            <p className="mt-1 text-xs text-slate-500">Analisis performa terintegrasi</p>
          </CardHeader>
          <CardContent className="pt-0">
            {/* Overall Score */}
            {performanceMetrics.overall_score !== null && (
              <div className="mb-4 rounded-xl bg-white/80 p-4 text-center backdrop-blur-sm">
                <p className="text-xs text-slate-600 mb-1">Overall Score</p>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-4xl font-bold text-slate-900">{Math.round(performanceMetrics.overall_score)}</span>
                  <span className="text-xl text-slate-600">/100</span>
                </div>
                {performanceMetrics.performance_tier && (
                  <Badge className={cn(
                    'mt-2',
                    performanceMetrics.performance_tier === 'excellent' && 'bg-emerald-500',
                    performanceMetrics.performance_tier === 'good' && 'bg-blue-500',
                    performanceMetrics.performance_tier === 'average' && 'bg-amber-500',
                    performanceMetrics.performance_tier === 'needs_improvement' && 'bg-red-500',
                  )}>
                    {performanceMetrics.performance_tier === 'excellent' && 'Excellent'}
                    {performanceMetrics.performance_tier === 'good' && 'Good'}
                    {performanceMetrics.performance_tier === 'average' && 'Average'}
                    {performanceMetrics.performance_tier === 'needs_improvement' && 'Perlu Peningkatan'}
                  </Badge>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {/* On-Time Rate */}
              {performanceMetrics.on_time_rate !== null && (
                <div className="rounded-xl bg-white/80 p-4 backdrop-blur-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-4 w-4 text-blue-600" />
                    <p className="text-xs font-medium text-blue-700/80">On-Time Rate</p>
                  </div>
                  <p className="text-2xl font-bold text-blue-900">{performanceMetrics.on_time_rate.toFixed(1)}%</p>
                  <p className="mt-1 text-xs text-blue-700/70">
                    Ketepatan waktu
                  </p>
                </div>
              )}

              {/* Skills & Assessments */}
              <div className="rounded-xl bg-white/80 p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-purple-600" />
                  <p className="text-xs font-medium text-purple-700/80">Development</p>
                </div>
                <p className="text-2xl font-bold text-purple-900">
                  {performanceMetrics.skills_improved + performanceMetrics.assessments_completed}
                </p>
                <p className="mt-1 text-xs text-purple-700/70">
                  {performanceMetrics.skills_improved} skills, {performanceMetrics.assessments_completed} assessments
                </p>
              </div>
            </div>

            {/* Performance Insights */}
            {performanceInsights && (
              <div className="mt-4 rounded-xl bg-white/80 p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Brain className="h-4 w-4 text-emerald-600" />
                  <p className="text-xs font-semibold text-slate-700">AI Performance Insights</p>
                </div>
                {performanceInsights.summary && (
                  <p className="text-xs text-slate-600 leading-relaxed mb-3">{performanceInsights.summary}</p>
                )}
                {performanceInsights.recommendations && performanceInsights.recommendations.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-slate-700 mb-2">Rekomendasi:</p>
                    <ul className="space-y-1">
                      {performanceInsights.recommendations.slice(0, 3).map((rec: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                          <span className="text-emerald-600 mt-0.5">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      {/* Monthly Summary with Trends */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-slate-900">Ringkasan Bulanan</CardTitle>
          {previousSummary && (
            <p className="mt-1 text-xs text-slate-500">Dibandingkan dengan bulan sebelumnya</p>
          )}
        </CardHeader>
        <CardContent className="pt-0">
          {monthlyLoading ? (
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
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
                    <div className="flex items-baseline gap-2">
                      <p className="mt-0.5 text-xl font-bold text-blue-900">{summary.totalTrips}</p>
                      {tripsTrend && (
                        <div
                          className={cn(
                            'flex items-center gap-0.5 text-xs',
                            tripsTrend.isPositive ? 'text-green-600' : 'text-red-600',
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
                    <div className="flex items-baseline gap-2">
                      <p className="mt-0.5 text-xl font-bold text-emerald-900">
                        Rp {summary.totalIncome.toLocaleString('id-ID')}
                      </p>
                      {incomeTrend && (
                        <div
                          className={cn(
                            'flex items-center gap-0.5 text-xs',
                            incomeTrend.isPositive ? 'text-green-600' : 'text-red-600',
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
                    <p className="text-xs font-medium text-amber-700/80">Rating Rata-rata</p>
                    <div className="flex items-baseline gap-2">
                      <p className="mt-0.5 text-xl font-bold text-amber-900">
                        {summary.averageRating.toFixed(1)}
                      </p>
                      {ratingTrend && (
                        <div
                          className={cn(
                            'flex items-center gap-0.5 text-xs',
                            ratingTrend.isPositive ? 'text-green-600' : 'text-red-600',
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

      {/* Weekly Chart - Enhanced */}
      {weeklyData.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-900">Grafik Per Minggu</CardTitle>
            <p className="mt-1 text-xs text-slate-500">Breakdown performa per minggu dalam bulan ini</p>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-6">
              {/* Trips Chart */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">Trip</span>
                  <span className="text-xs text-slate-500">Total: {summary?.totalTrips || 0}</span>
                </div>
                <div className="flex h-24 gap-2">
                  {weeklyData.map((week) => {
                    const percentage = maxTrips > 0 ? (week.trips / maxTrips) * 100 : 0;
                    return (
                      <div key={week.week} className="flex-1 flex flex-col items-center group">
                        <div className="w-full flex flex-col justify-end h-full relative">
                          <div
                            className="w-full rounded-t bg-gradient-to-t from-blue-500 to-blue-400 transition-all group-hover:from-blue-600 group-hover:to-blue-500 cursor-pointer"
                            style={{ height: `${Math.max(percentage, 5)}%` }}
                            title={`Minggu ${week.week}: ${week.trips} trip`}
                          />
                        </div>
                        <p className="mt-2 text-xs font-semibold text-slate-700">{week.trips}</p>
                        <p className="text-[10px] text-slate-400">M{week.week}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Income Chart */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">Pendapatan</span>
                  <span className="text-xs text-slate-500">
                    Total: Rp {(summary?.totalIncome || 0).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex h-24 gap-2">
                  {weeklyData.map((week) => {
                    const percentage = maxIncome > 0 ? (week.income / maxIncome) * 100 : 0;
                    return (
                      <div key={week.week} className="flex-1 flex flex-col items-center group">
                        <div className="w-full flex flex-col justify-end h-full relative">
                          <div
                            className="w-full rounded-t bg-gradient-to-t from-emerald-500 to-emerald-400 transition-all group-hover:from-emerald-600 group-hover:to-emerald-500 cursor-pointer"
                            style={{ height: `${Math.max(percentage, 5)}%` }}
                            title={`Minggu ${week.week}: Rp ${week.income.toLocaleString('id-ID')}`}
                          />
                        </div>
                        <p className="mt-2 text-xs font-semibold text-slate-700">
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
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-700">Penalty</span>
                    <span className="text-xs text-slate-500">
                      Total: Rp {summary.totalPenalties.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex h-24 gap-2">
                    {weeklyData.map((week) => {
                      const percentage = maxPenalties > 0 ? (week.penalties / maxPenalties) * 100 : 0;
                      return (
                        <div key={week.week} className="flex-1 flex flex-col items-center group">
                          <div className="w-full flex flex-col justify-end h-full relative">
                            <div
                              className="w-full rounded-t bg-gradient-to-t from-red-500 to-red-400 transition-all group-hover:from-red-600 group-hover:to-red-500 cursor-pointer"
                              style={{ height: `${Math.max(percentage, 5)}%` }}
                              title={`Minggu ${week.week}: Rp ${week.penalties.toLocaleString('id-ID')}`}
                            />
                          </div>
                          <p className="mt-2 text-xs font-semibold text-slate-700">
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

      {/* Package Breakdown */}
      {monthlyData?.packageBreakdown && monthlyData.packageBreakdown.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-slate-900">Breakdown per Paket</CardTitle>
            <p className="mt-1 text-xs text-slate-500">
              Distribusi trip dan pendapatan berdasarkan paket/destinasi
            </p>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {monthlyData.packageBreakdown.map((pkg, idx) => {
                const totalTrips = summary?.totalTrips || 1;
                const totalIncome = summary?.totalIncome || 1;
                const tripsPercentage = (pkg.trips / totalTrips) * 100;
                const incomePercentage = (pkg.income / totalIncome) * 100;

                return (
                  <div
                    key={pkg.packageId || `unknown-${idx}`}
                    className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 transition-all hover:border-slate-300 hover:bg-slate-50"
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900">{pkg.packageName}</h3>
                        {pkg.city && (
                          <p className="mt-0.5 text-xs text-slate-500">{pkg.city}</p>
                        )}
                      </div>
                      <Badge variant="outline" className="shrink-0">
                        {pkg.trips} trip
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <p className="text-xs text-slate-500">Trip</p>
                        <p className="mt-0.5 text-sm font-semibold text-slate-900">{pkg.trips}</p>
                        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                          <div
                            className="h-full bg-blue-500 transition-all"
                            style={{ width: `${tripsPercentage}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Tamu</p>
                        <p className="mt-0.5 text-sm font-semibold text-slate-900">{pkg.guests}</p>
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
          <CardTitle className="text-base font-semibold text-slate-900">Riwayat Penalty</CardTitle>
          <p className="mt-1 text-xs text-slate-500">
            Lihat detail penalty dan tips untuk menghindarinya
          </p>
        </CardHeader>
        <CardContent className="pt-0">
          {penaltiesLoading ? (
            <div className="space-y-3 py-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 rounded-lg" />
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
                  className="rounded-xl border-2 border-red-100 bg-red-50/50 p-4 transition-all hover:border-red-200 hover:bg-red-50"
                >
                  {/* Penalty Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
                        <h3 className="font-semibold text-slate-900">{penalty.tip.title}</h3>
                      </div>
                      <p className="mt-1 text-sm text-slate-600">{penalty.tip.description}</p>
                      <p className="mt-2 text-xs text-slate-500">{penalty.description}</p>
                    </div>
                    <div className="text-right shrink-0">
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
        </TabsContent>

        {/* Ratings Tab */}
        <TabsContent value="ratings" className="space-y-4 mt-4">
          {ratingsLoading ? (
            <Card className="border-0 bg-gradient-to-br from-amber-50 to-amber-100/50 shadow-sm">
              <CardContent className="p-6">
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ) : ratingsData ? (
            <>
              {/* Rating Summary Card */}
              <Card className="border-0 bg-gradient-to-br from-amber-50 via-amber-100/30 to-amber-50 shadow-sm">
                <CardContent className="p-6">
                  <div className="text-center">
                    {/* Main Rating */}
                    <div className="mb-4 flex justify-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            'h-7 w-7',
                            i < Math.round(ratingsData.summary.averageRating)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-300',
                          )}
                        />
                      ))}
                    </div>
                    <p className="text-5xl font-bold text-amber-600">
                      {ratingsData.summary.averageRating.toFixed(1)}
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-600">
                      Dari {ratingsData.summary.totalRatings}{' '}
                      {ratingsData.summary.totalRatings === 1 ? 'ulasan' : 'ulasan'}
                    </p>

                    {/* Trend Indicator */}
                    {ratingsData.summary.trend && ratingsData.summary.recentAverageRating && (
                      <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-white/50 px-4 py-2">
                        {ratingsData.summary.trend === 'up' ? (
                          <TrendingUp className="h-4 w-4 text-emerald-600" />
                        ) : ratingsData.summary.trend === 'down' ? (
                          <TrendingDown className="h-4 w-4 text-red-600" />
                        ) : (
                          <Minus className="h-4 w-4 text-slate-400" />
                        )}
                        <span
                          className={cn(
                            'text-sm font-medium',
                            ratingsData.summary.trend === 'up'
                              ? 'text-emerald-700'
                              : ratingsData.summary.trend === 'down'
                                ? 'text-red-700'
                                : 'text-slate-600',
                          )}
                        >
                          {ratingsData.summary.trend === 'up'
                            ? 'Meningkat'
                            : ratingsData.summary.trend === 'down'
                              ? 'Menurun'
                              : 'Stabil'}{' '}
                          dari {ratingsData.summary.recentAverageRating.toFixed(1)} (10 ulasan terakhir)
                        </span>
                      </div>
                    )}

                    {/* Motivational Message */}
                    {ratingsData.summary.averageRating >= 4.5 && (
                      <div className="mt-4 rounded-lg bg-emerald-50 px-4 py-3">
                        <p className="text-sm font-semibold text-emerald-800">
                          🎉 Excellent! Rating Anda sangat baik!
                        </p>
                        <p className="mt-1 text-xs text-emerald-700">
                          Terus pertahankan kualitas layanan Anda
                        </p>
                      </div>
                    )}
                    {ratingsData.summary.averageRating >= 4.0 &&
                      ratingsData.summary.averageRating < 4.5 && (
                        <div className="mt-4 rounded-lg bg-blue-50 px-4 py-3">
                          <p className="text-sm font-semibold text-blue-800">
                            👍 Bagus! Rating Anda baik
                          </p>
                          <p className="mt-1 text-xs text-blue-700">
                            Sedikit lagi untuk mencapai Excellent!
                          </p>
                        </div>
                      )}
                    {ratingsData.summary.averageRating >= 3.0 &&
                      ratingsData.summary.averageRating < 4.0 && (
                        <div className="mt-4 rounded-lg bg-amber-50 px-4 py-3">
                          <p className="text-sm font-semibold text-amber-800">
                            💪 Keep it up! Ada ruang untuk perbaikan
                          </p>
                          <p className="mt-1 text-xs text-amber-700">
                            Fokus pada layanan yang lebih baik untuk meningkatkan rating
                          </p>
                        </div>
                      )}
                    {ratingsData.summary.averageRating < 3.0 && (
                      <div className="mt-4 rounded-lg bg-red-50 px-4 py-3">
                        <p className="text-sm font-semibold text-red-800">
                          📈 Peluang untuk berkembang
                        </p>
                        <p className="mt-1 text-xs text-red-700">
                          Perhatikan feedback dari customer untuk meningkatkan kualitas layanan
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Rating Distribution */}
                  {ratingsData.summary.totalRatings > 0 && (
                    <div className="mt-6 space-y-2 border-t border-amber-200 pt-4">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-600">
                        Distribusi Rating
                      </p>
                      {[5, 4, 3, 2, 1].map((rating) => {
                        const count =
                          ratingsData.summary.ratingDistribution[
                            String(rating) as '1' | '2' | '3' | '4' | '5'
                          ] || 0;
                        const percentage =
                          ratingsData.summary.totalRatings > 0
                            ? (count / ratingsData.summary.totalRatings) * 100
                            : 0;
                        return (
                          <div key={rating} className="flex items-center gap-3">
                            <div className="flex w-8 items-center gap-1">
                              <span className="text-xs font-medium text-slate-700">{rating}</span>
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            </div>
                            <div className="flex-1">
                              <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                                <div
                                  className="h-full bg-amber-500 transition-all"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                            <span className="w-8 text-right text-xs font-medium text-slate-600">
                              {count}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Reviews List */}
              {ratingsData.reviews.length === 0 ? (
                <Card className="border-0 shadow-sm">
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <Star className="mb-3 h-12 w-12 text-slate-300" />
                    <p className="text-sm font-medium text-slate-600">Belum ada ulasan</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Ulasan dari customer akan muncul di sini setelah mereka memberikan rating
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-600">
                      Ulasan Customer
                    </h2>
                    <span className="text-xs text-slate-500">{ratingsData.reviews.length} ulasan</span>
                  </div>
                  {ratingsData.reviews.map((review) => {
                    const date = new Date(review.createdAt);
                    const formattedDate = date.toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    });
                    const formattedTime = date.toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                    });
                    const rating = review.guideRating || review.overallRating;

                    return (
                      <Card key={review.id} className="border-0 shadow-sm">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-slate-900">{review.reviewerName}</p>
                                <div className="flex gap-0.5">
                                  {Array.from({ length: rating }).map((_, j) => (
                                    <Star
                                      key={j}
                                      className="h-3.5 w-3.5 fill-amber-400 text-amber-400"
                                    />
                                  ))}
                                  {Array.from({ length: 5 - rating }).map((_, j) => (
                                    <Star
                                      key={j + rating}
                                      className="h-3.5 w-3.5 text-slate-300"
                                    />
                                  ))}
                                </div>
                              </div>
                              {review.reviewText && (
                                <p className="mt-2 text-sm leading-relaxed text-slate-700">
                                  {review.reviewText}
                                </p>
                              )}
                              <p className="mt-2 text-xs text-slate-500">
                                {formattedDate} pukul {formattedTime}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-12 text-center">
                <p className="text-sm text-slate-500">Gagal memuat data rating</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
