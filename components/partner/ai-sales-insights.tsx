/**
 * AI Sales Insights Component
 * AI-powered insights for analytics dashboard
 */

'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Lightbulb,
  Loader2,
  RefreshCw,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/finance/shadow-pnl';
import queryKeys from '@/lib/queries/query-keys';

type SalesInsight = {
  type: 'trend' | 'opportunity' | 'warning' | 'recommendation';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  actionItems?: string[];
  metrics?: {
    current: number;
    target?: number;
    change?: number;
  };
};

type SalesInsights = {
  insights: SalesInsight[];
  predictions: {
    nextMonthRevenue: number;
    nextMonthBookings: number;
    bestSellingPackages: Array<{
      packageName: string;
      predictedBookings: number;
      confidence: 'high' | 'medium' | 'low';
    }>;
    // Enhanced: Weekly predictions
    weeklyPredictions?: Array<{
      week: number;
      revenue: number;
      bookings: number;
    }>;
    // Enhanced: Category breakdown
    categoryBreakdown?: Array<{
      category: string;
      revenue: number;
      growth: number;
    }>;
    // Enhanced: Seasonality factor
    seasonalityFactor?: number;
    seasonalityNote?: string;
  };
  recommendations: Array<{
    category: 'pricing' | 'promotion' | 'packages' | 'customers';
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  // Enhanced: What-if scenarios
  whatIfScenarios?: Array<{
    scenario: string;
    investmentRequired: number;
    expectedRevenue: number;
    expectedROI: number;
  }>;
};

type InsightsResponse = {
  salesData: unknown;
  insights: SalesInsights;
  remaining: number;
};

async function fetchInsights(period: string): Promise<InsightsResponse> {
  const response = await fetch(`/api/partner/analytics/insights?period=${period}`);
  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('Rate limit exceeded');
    }
    throw new Error('Failed to fetch insights');
  }
  return response.json();
}

type AiSalesInsightsProps = {
  period?: 'week' | 'month' | 'quarter';
};

export function AiSalesInsights({ period = 'month' }: AiSalesInsightsProps) {
  const [showAll, setShowAll] = useState(false);

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: [...queryKeys.partner.all, 'sales-insights', period],
    queryFn: () => fetchInsights(period),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  });

  useEffect(() => {
    if (error) {
      if (error.message === 'Rate limit exceeded') {
        toast.error('Rate limit tercapai. Silakan tunggu sebentar.');
      } else {
        toast.error('Gagal memuat AI insights');
      }
    }
  }, [error]);

  if (isLoading) {
    return <InsightsSkeleton />;
  }

  if (error || !data) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-6 text-center">
          <Sparkles className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-4">
            Gagal memuat AI Insights
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Coba Lagi
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { insights } = data;
  const displayInsights = showAll ? insights.insights : insights.insights.slice(0, 3);

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'trend':
        return TrendingUp;
      case 'opportunity':
        return Lightbulb;
      case 'warning':
        return AlertTriangle;
      case 'recommendation':
        return Target;
      default:
        return BarChart3;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'trend':
        return 'text-blue-500 bg-blue-50 dark:bg-blue-950/30';
      case 'opportunity':
        return 'text-green-500 bg-green-50 dark:bg-green-950/30';
      case 'warning':
        return 'text-yellow-500 bg-yellow-50 dark:bg-yellow-950/30';
      case 'recommendation':
        return 'text-purple-500 bg-purple-50 dark:bg-purple-950/30';
      default:
        return 'text-primary bg-primary/10';
    }
  };

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case 'high':
        return { label: 'High Impact', className: 'bg-red-500' };
      case 'medium':
        return { label: 'Medium', className: 'bg-yellow-500' };
      case 'low':
        return { label: 'Low', className: 'bg-gray-500' };
      default:
        return { label: impact, className: 'bg-gray-500' };
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">AI Sales Insights</h3>
          <Badge variant="secondary" className="text-[10px]">Beta</Badge>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => refetch()}
          disabled={isRefetching}
        >
          <RefreshCw className={cn('h-4 w-4', isRefetching && 'animate-spin')} />
        </Button>
      </div>

      {/* Predictions Card */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            Prediksi Bulan Depan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Est. Revenue</p>
              <p className="text-lg font-bold">{formatCurrency(insights.predictions.nextMonthRevenue)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Est. Bookings</p>
              <p className="text-lg font-bold">{insights.predictions.nextMonthBookings}</p>
            </div>
          </div>
          
          {/* Enhanced: Seasonality Info */}
          {insights.predictions.seasonalityFactor !== undefined && (
            <div className="rounded-lg bg-white/50 p-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Seasonality Factor</span>
                <span className={cn(
                  'font-medium',
                  insights.predictions.seasonalityFactor > 1 ? 'text-green-600' : 'text-yellow-600'
                )}>
                  {insights.predictions.seasonalityFactor > 1 ? '↑' : '↓'} {((insights.predictions.seasonalityFactor - 1) * 100).toFixed(0)}%
                </span>
              </div>
              {insights.predictions.seasonalityNote && (
                <p className="text-[10px] text-muted-foreground mt-1">
                  {insights.predictions.seasonalityNote}
                </p>
              )}
            </div>
          )}

          {/* Enhanced: Weekly Breakdown */}
          {insights.predictions.weeklyPredictions && insights.predictions.weeklyPredictions.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Weekly Breakdown</p>
              <div className="grid grid-cols-4 gap-1">
                {insights.predictions.weeklyPredictions.map((week, idx) => (
                  <div key={idx} className="rounded bg-white/50 p-1.5 text-center">
                    <p className="text-[10px] text-muted-foreground">Week {week.week}</p>
                    <p className="text-xs font-medium">{formatCurrency(week.revenue)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Enhanced: Category Breakdown */}
          {insights.predictions.categoryBreakdown && insights.predictions.categoryBreakdown.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">By Category</p>
              <div className="space-y-1">
                {insights.predictions.categoryBreakdown.slice(0, 3).map((cat, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span>{cat.category}</span>
                    <span className={cn(
                      'flex items-center gap-1',
                      cat.growth >= 0 ? 'text-green-600' : 'text-red-600'
                    )}>
                      {cat.growth >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {cat.growth >= 0 ? '+' : ''}{cat.growth.toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {insights.predictions.bestSellingPackages.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Best Selling Prediction</p>
              <div className="flex flex-wrap gap-1">
                {insights.predictions.bestSellingPackages.slice(0, 3).map((pkg, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {pkg.packageName}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced: What-If Scenarios */}
      {insights.whatIfScenarios && insights.whatIfScenarios.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-yellow-500" />
              What-If Scenarios
            </CardTitle>
            <CardDescription className="text-xs">
              Simulasi jika Anda investasi di marketing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {insights.whatIfScenarios.map((scenario, idx) => (
              <div
                key={idx}
                className="rounded-lg border p-3"
              >
                <p className="text-sm font-medium mb-1">{scenario.scenario}</p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">Invest</p>
                    <p className="font-medium">{formatCurrency(scenario.investmentRequired)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Expected</p>
                    <p className="font-medium text-green-600">{formatCurrency(scenario.expectedRevenue)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">ROI</p>
                    <p className="font-medium text-primary">{scenario.expectedROI.toFixed(0)}%</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Insights List */}
      <div className="space-y-3">
        {displayInsights.map((insight, idx) => {
          const Icon = getInsightIcon(insight.type);
          const colorClass = getInsightColor(insight.type);
          const impactBadge = getImpactBadge(insight.impact);

          return (
            <Card key={idx} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <div className={cn('flex-shrink-0 p-2 rounded-lg', colorClass)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="font-medium text-sm">{insight.title}</h4>
                      <Badge className={cn('text-[10px] text-white flex-shrink-0', impactBadge.className)}>
                        {impactBadge.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {insight.description}
                    </p>
                    {insight.actionItems && insight.actionItems.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium mb-1">Action Items:</p>
                        <ul className="space-y-1">
                          {insight.actionItems.slice(0, 2).map((action, actionIdx) => (
                            <li key={actionIdx} className="text-xs text-muted-foreground flex items-start gap-1">
                              <ArrowRight className="h-3 w-3 mt-0.5 text-primary flex-shrink-0" />
                              {action}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {insight.metrics && (
                      <div className="mt-2 flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground">Current:</span>
                        <span className="font-medium">{formatCurrency(insight.metrics.current)}</span>
                        {insight.metrics.change && (
                          <span className={cn(
                            'flex items-center gap-0.5',
                            insight.metrics.change >= 0 ? 'text-green-600' : 'text-red-600'
                          )}>
                            {insight.metrics.change >= 0 ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <TrendingDown className="h-3 w-3" />
                            )}
                            {insight.metrics.change >= 0 ? '+' : ''}{formatCurrency(insight.metrics.change)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Show More */}
      {insights.insights.length > 3 && (
        <Button
          variant="ghost"
          className="w-full"
          onClick={() => setShowAll(!showAll)}
        >
          {showAll ? 'Tampilkan Lebih Sedikit' : `Lihat ${insights.insights.length - 3} Insight Lainnya`}
        </Button>
      )}

      {/* Recommendations */}
      {insights.recommendations.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-primary" />
              Rekomendasi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {insights.recommendations.slice(0, 3).map((rec, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 p-2 rounded-lg bg-muted/50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-medium">{rec.title}</p>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[10px]',
                        rec.priority === 'high' && 'border-red-500 text-red-500',
                        rec.priority === 'medium' && 'border-yellow-500 text-yellow-500'
                      )}
                    >
                      {rec.category}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{rec.description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Rate Limit Info */}
      {data.remaining !== undefined && (
        <p className="text-[10px] text-muted-foreground text-center">
          {data.remaining} refresh tersisa hari ini
        </p>
      )}
    </div>
  );
}

function InsightsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-5 rounded" />
        <Skeleton className="h-5 w-32" />
      </div>
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        </CardContent>
      </Card>
      {[...Array(3)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Skeleton className="h-8 w-8 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

