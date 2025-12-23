'use client';

/**
 * Performance Client Component
 * Display performance metrics, trends, AI insights, and challenges
 */

import { useQuery } from '@tanstack/react-query';
import { BarChart3, Brain, Star, Target } from 'lucide-react';
import { useState } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AIInsightsCard } from '@/components/guide/ai-insights-card';
import { MetricsCard } from '@/components/guide/metrics-card';
import queryKeys from '@/lib/queries/query-keys';
import type { UnifiedAIInsights } from '@/types/ai-insights';
import type { UnifiedMetrics } from '@/types/guide-metrics';

import { ChallengesClient } from '../challenges/challenges-client';
import { RatingsClient } from '../ratings/ratings-client';
import { MonthlyInsightsDetail } from './monthly-insights-detail';
import { PerformanceAiCoach } from './performance-ai-coach';
import { AdvancedMetrics } from './advanced-metrics';

type PerformanceClientProps = {
  locale: string;
};

export function PerformanceClient({ locale: _locale }: PerformanceClientProps) {
  const [activeTab, setActiveTab] = useState<
    'performance' | 'insight' | 'rating' | 'challenges'
  >('performance');

  // Fetch unified metrics (for Performance tab)
  const {
    data: unifiedMetricsData,
    isLoading: unifiedMetricsLoading,
    error: unifiedMetricsError,
    refetch: refetchUnifiedMetrics,
  } = useQuery<{
    metrics: UnifiedMetrics;
  }>({
    queryKey: queryKeys.guide.metrics.unified({ period: 'monthly' }),
    queryFn: async () => {
      const res = await fetch(
        '/api/guide/metrics/unified?period=monthly&include=trips,earnings,ratings,performance,development,trends,customerSatisfaction,efficiency,financial,quality,growth,comparative,sustainability,operations,safety&compareWithPrevious=true'
      );
      if (!res.ok) throw new Error('Failed to load metrics');
      return (await res.json()) as { metrics: UnifiedMetrics };
    },
    enabled: activeTab === 'performance',
    staleTime: 300000, // 5 minutes
  });

  // Fetch unified AI insights (for Insight tab)
  const {
    data: unifiedAIInsightsData,
    isLoading: unifiedAIInsightsLoading,
    error: unifiedAIInsightsError,
    refetch: refetchUnifiedAIInsights,
  } = useQuery<{
    insights: UnifiedAIInsights;
  }>({
    queryKey: queryKeys.guide.aiInsights.unified({ period: 'monthly' }),
    queryFn: async () => {
      const res = await fetch(
        '/api/guide/ai/insights/unified?period=monthly&include=performance,recommendations,predictions,coaching&includeCoaching=true'
      );
      if (!res.ok) throw new Error('Failed to load insights');
      return (await res.json()) as { insights: UnifiedAIInsights };
    },
    enabled: activeTab === 'insight',
    staleTime: 600000, // 10 minutes
    retry: 1,
  });

  const unifiedMetrics = unifiedMetricsData?.metrics;
  const unifiedAIInsights = unifiedAIInsightsData?.insights;

  return (
    <Tabs
      value={activeTab}
      onValueChange={(v) => setActiveTab(v as typeof activeTab)}
      className="space-y-4"
    >
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger
          value="performance"
          className="flex items-center gap-1 text-xs sm:text-sm"
        >
          <BarChart3 className="h-4 w-4" />
          <span>Performance</span>
        </TabsTrigger>
        <TabsTrigger
          value="insight"
          className="flex items-center gap-1 text-xs sm:text-sm"
        >
          <Brain className="h-4 w-4" />
          <span>Insight</span>
        </TabsTrigger>
        <TabsTrigger
          value="rating"
          className="flex items-center gap-1 text-xs sm:text-sm"
        >
          <Star className="h-4 w-4" />
          <span>Rating</span>
        </TabsTrigger>
        <TabsTrigger
          value="challenges"
          className="flex items-center gap-1 text-xs sm:text-sm"
        >
          <Target className="h-4 w-4" />
          <span>Challenges</span>
        </TabsTrigger>
      </TabsList>

      {/* Performance Tab - Only Metrics */}
      <TabsContent value="performance" className="mt-4 space-y-4">
        {unifiedMetricsLoading ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <LoadingState variant="skeleton" lines={4} />
            </CardContent>
          </Card>
        ) : unifiedMetricsError ? (
          <ErrorState
            message={
              unifiedMetricsError instanceof Error
                ? unifiedMetricsError.message
                : 'Gagal memuat data performa'
            }
            onRetry={() => void refetchUnifiedMetrics()}
            variant="card"
          />
        ) : !unifiedMetrics ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-12">
              <EmptyState
                icon={BarChart3}
                title="Belum ada data performa"
                description="Data performa akan muncul setelah Anda menyelesaikan beberapa trip"
                variant="default"
              />
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4 pb-6">
            {/* Unified Metrics Card */}
            <MetricsCard
              metrics={unifiedMetrics}
              view="detailed"
              showTrends={true}
            />

            {/* Advanced Metrics */}
            <AdvancedMetrics metrics={unifiedMetrics} />

            {/* Monthly Insights Detail */}
            <MonthlyInsightsDetail locale={_locale} />
          </div>
        )}
      </TabsContent>

      {/* Insight Tab - Only AI Insights */}
      <TabsContent value="insight" className="mt-4 space-y-4">
        {unifiedAIInsightsLoading ? (
          <Card className="border-0 bg-gradient-to-br from-purple-50 to-indigo-50 shadow-sm">
            <CardContent className="p-6">
              <LoadingState variant="skeleton" lines={5} />
            </CardContent>
          </Card>
        ) : unifiedAIInsightsError ? (
          <ErrorState
            message={
              unifiedAIInsightsError instanceof Error
                ? unifiedAIInsightsError.message
                : 'Gagal memuat AI insights'
            }
            onRetry={() => void refetchUnifiedAIInsights()}
            variant="card"
          />
        ) : !unifiedAIInsights ? (
          <Card className="border-0 bg-gradient-to-br from-purple-50 to-indigo-50 shadow-sm">
            <CardContent className="py-12">
              <EmptyState
                icon={Brain}
                title="Belum ada AI insights"
                description="AI insights akan muncul setelah Anda memiliki cukup data performa"
                variant="default"
              />
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4 pb-6">
            <AIInsightsCard
              insights={unifiedAIInsights}
              showSections={[
                'performance',
                'recommendations',
                'predictions',
                'coaching',
              ]}
            />
            {/* Additional AI Performance Coach */}
            <PerformanceAiCoach locale={_locale} />
          </div>
        )}
      </TabsContent>

      {/* Rating Tab */}
      <TabsContent value="rating" className="mt-4 space-y-4">
        <RatingsClient locale={_locale} />
      </TabsContent>

      {/* Challenges Tab */}
      <TabsContent value="challenges" className="mt-4 space-y-4">
        <ChallengesClient locale={_locale} />
      </TabsContent>
    </Tabs>
  );
}
