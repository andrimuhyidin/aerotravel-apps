'use client';

/**
 * Unified AI Insights Card Component
 * Reusable component for displaying AI-generated insights
 * Used in both insights and performance pages
 */

import { Brain, Lightbulb, Target } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { UnifiedAIInsights } from '@/types/ai-insights';

type AIInsightsCardProps = {
  insights: UnifiedAIInsights;
  showSections?: (
    | 'performance'
    | 'recommendations'
    | 'predictions'
    | 'coaching'
  )[];
  className?: string;
};

export function AIInsightsCard({
  insights,
  showSections,
  className,
}: AIInsightsCardProps) {
  const sectionsToShow = showSections || [
    'performance',
    'recommendations',
    'predictions',
  ];

  // Group recommendations by priority
  const recommendationsByPriority = {
    high: insights.recommendations.filter((r) => r.priority === 'high'),
    medium: insights.recommendations.filter((r) => r.priority === 'medium'),
    low: insights.recommendations.filter((r) => r.priority === 'low'),
  };

  return (
    <Card
      className={cn(
        'border-0 bg-gradient-to-br from-purple-50 to-indigo-50 shadow-sm',
        className
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-600" />
          <CardTitle className="text-base font-semibold text-slate-900">
            AI Insights
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {/* Performance Insights */}
        {sectionsToShow.includes('performance') && (
          <div className="rounded-lg bg-white/60 p-4 backdrop-blur-sm">
            <div className="mb-3 flex items-center gap-2">
              <Target className="h-4 w-4 text-purple-600" />
              <span className="text-xs font-semibold text-slate-700">
                Analisis Performa
              </span>
              <Badge
                variant="outline"
                className={cn(
                  'ml-auto text-xs',
                  insights.performance.trend === 'improving' &&
                    'border-green-500 text-green-700',
                  insights.performance.trend === 'stable' &&
                    'border-blue-500 text-blue-700',
                  insights.performance.trend === 'declining' &&
                    'border-red-500 text-red-700'
                )}
              >
                {insights.performance.trend === 'improving' && 'Meningkat'}
                {insights.performance.trend === 'stable' && 'Stabil'}
                {insights.performance.trend === 'declining' && 'Menurun'}
              </Badge>
            </div>
            {insights.performance.summary && (
              <p className="mb-3 text-xs leading-relaxed text-slate-600">
                {insights.performance.summary}
              </p>
            )}
            {insights.performance.strengths &&
              insights.performance.strengths.length > 0 && (
                <div className="mb-3">
                  <p className="mb-1.5 text-xs font-medium text-green-700">
                    Kekuatan:
                  </p>
                  <ul className="space-y-1">
                    {insights.performance.strengths.map((strength, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-xs text-slate-600"
                      >
                        <span className="mt-0.5 text-green-600">✓</span>
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            {insights.performance.weaknesses &&
              insights.performance.weaknesses.length > 0 && (
                <div>
                  <p className="mb-1.5 text-xs font-medium text-amber-700">
                    Area Perbaikan:
                  </p>
                  <ul className="space-y-1">
                    {insights.performance.weaknesses.map((weakness, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-xs text-slate-600"
                      >
                        <span className="mt-0.5 text-amber-600">→</span>
                        <span>{weakness}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
          </div>
        )}

        {/* Income Predictions */}
        {sectionsToShow.includes('predictions') && (
          <div className="rounded-lg bg-white/60 p-4 backdrop-blur-sm">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-600">
                Prediksi Pendapatan
              </span>
              <Badge
                variant="outline"
                className={cn(
                  'text-xs',
                  insights.predictions.income.confidence === 'high' &&
                    'border-green-500 text-green-700',
                  insights.predictions.income.confidence === 'medium' &&
                    'border-yellow-500 text-yellow-700',
                  insights.predictions.income.confidence === 'low' &&
                    'border-red-500 text-red-700'
                )}
              >
                {insights.predictions.income.confidence === 'high' && 'Tinggi'}
                {insights.predictions.income.confidence === 'medium' &&
                  'Sedang'}
                {insights.predictions.income.confidence === 'low' && 'Rendah'}
              </Badge>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-slate-500">Bulan Depan</p>
                <p className="text-lg font-bold text-slate-900">
                  Rp{' '}
                  {(insights.predictions.income.nextMonth || 0).toLocaleString(
                    'id-ID'
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">3 Bulan</p>
                <p className="text-lg font-bold text-slate-900">
                  Rp{' '}
                  {(
                    insights.predictions.income.next3Months || 0
                  ).toLocaleString('id-ID')}
                </p>
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-600">
              {insights.predictions.income.reasoning}
            </p>
          </div>
        )}

        {/* Recommendations */}
        {sectionsToShow.includes('recommendations') &&
          insights.recommendations.length > 0 && (
            <div className="rounded-lg bg-white/60 p-4 backdrop-blur-sm">
              <div className="mb-3 flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-600" />
                <span className="text-xs font-semibold text-slate-700">
                  Rekomendasi
                </span>
              </div>
              <div className="space-y-2">
                {/* High Priority */}
                {recommendationsByPriority.high.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-medium text-red-700">
                      Prioritas Tinggi
                    </p>
                    {recommendationsByPriority.high.slice(0, 3).map((rec) => (
                      <div
                        key={rec.id}
                        className="mb-2 rounded-lg border border-red-200 bg-red-50/50 p-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="text-xs font-semibold text-slate-900">
                              {rec.title}
                            </p>
                            <p className="mt-1 text-xs text-slate-600">
                              {rec.description}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className="shrink-0 border-red-500 text-[10px] text-red-700"
                          >
                            Tinggi
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Medium Priority */}
                {recommendationsByPriority.medium.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-medium text-yellow-700">
                      Prioritas Sedang
                    </p>
                    {recommendationsByPriority.medium.slice(0, 3).map((rec) => (
                      <div
                        key={rec.id}
                        className="mb-2 rounded-lg border border-yellow-200 bg-yellow-50/50 p-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="text-xs font-semibold text-slate-900">
                              {rec.title}
                            </p>
                            <p className="mt-1 text-xs text-slate-600">
                              {rec.description}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className="shrink-0 border-yellow-500 text-[10px] text-yellow-700"
                          >
                            Sedang
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Low Priority */}
                {recommendationsByPriority.low.length > 0 &&
                  recommendationsByPriority.high.length === 0 &&
                  recommendationsByPriority.medium.length === 0 && (
                    <div>
                      {recommendationsByPriority.low.slice(0, 3).map((rec) => (
                        <div
                          key={rec.id}
                          className="mb-2 rounded-lg border border-blue-200 bg-blue-50/50 p-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="text-xs font-semibold text-slate-900">
                                {rec.title}
                              </p>
                              <p className="mt-1 text-xs text-slate-600">
                                {rec.description}
                              </p>
                            </div>
                            <Badge
                              variant="outline"
                              className="shrink-0 border-blue-500 text-[10px] text-blue-700"
                            >
                              Rendah
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            </div>
          )}

        {/* Coaching Action Plan */}
        {sectionsToShow.includes('coaching') &&
          insights.coaching &&
          insights.coaching.actionPlan &&
          insights.coaching.actionPlan.length > 0 && (
            <div className="rounded-lg bg-white/60 p-4 backdrop-blur-sm">
              <div className="mb-3 flex items-center gap-2">
                <Target className="h-4 w-4 text-emerald-600" />
                <span className="text-xs font-semibold text-slate-700">
                  Action Plan (4 Minggu)
                </span>
              </div>
              <div className="space-y-1.5">
                {insights.coaching.actionPlan.slice(0, 2).map((week) => (
                  <div
                    key={week.week}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-2.5"
                  >
                    <p className="text-xs font-semibold text-slate-900">
                      Minggu {week.week}: {week.focus}
                    </p>
                    <ul className="mt-1 space-y-0.5">
                      {week.goals.slice(0, 2).map((goal, idx) => (
                        <li key={idx} className="text-[11px] text-slate-600">
                          • {goal}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
      </CardContent>
    </Card>
  );
}
