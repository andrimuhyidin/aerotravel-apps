'use client';

/**
 * Unified AI Insights Card Component
 * Reusable component for displaying AI-generated insights
 * Used in both insights and performance pages
 */

import {
  AlertTriangle,
  Brain,
  DollarSign,
  Lightbulb,
  Target,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';

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

        {/* Risk Alerts */}
        {insights.riskAlerts !== undefined && (
          <div className="rounded-lg bg-white/60 p-4 backdrop-blur-sm">
            <div className="mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-xs font-semibold text-slate-700">
                Peringatan Risiko
              </span>
            </div>
            {insights.riskAlerts.length > 0 ? (
              <div className="space-y-2">
                {insights.riskAlerts.slice(0, 3).map((alert) => (
                  <div
                    key={alert.id}
                    className={cn(
                      'rounded-lg border p-3',
                      alert.severity === 'critical' &&
                        'border-red-500 bg-red-50/50',
                      alert.severity === 'high' &&
                        'border-orange-500 bg-orange-50/50',
                      alert.severity === 'medium' &&
                        'border-yellow-500 bg-yellow-50/50',
                      alert.severity === 'low' &&
                        'border-blue-500 bg-blue-50/50'
                    )}
                  >
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-slate-900">
                          {alert.title}
                        </p>
                        <p className="mt-1 text-xs text-slate-600">
                          {alert.description}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          'shrink-0 text-[10px]',
                          alert.severity === 'critical' &&
                            'border-red-500 text-red-700',
                          alert.severity === 'high' &&
                            'border-orange-500 text-orange-700',
                          alert.severity === 'medium' &&
                            'border-yellow-500 text-yellow-700',
                          alert.severity === 'low' &&
                            'border-blue-500 text-blue-700'
                        )}
                      >
                        {alert.severity === 'critical' && 'Kritis'}
                        {alert.severity === 'high' && 'Tinggi'}
                        {alert.severity === 'medium' && 'Sedang'}
                        {alert.severity === 'low' && 'Rendah'}
                      </Badge>
                    </div>
                    <div className="mt-2 rounded bg-white/60 p-2">
                      <p className="text-[10px] font-medium text-slate-700">
                        Rekomendasi:
                      </p>
                      <p className="mt-0.5 text-[10px] text-slate-600">
                        {alert.recommendedAction}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center">
                <p className="text-xs text-slate-500">
                  Tidak ada peringatan risiko saat ini
                </p>
              </div>
            )}
          </div>
        )}

        {/* Quick Wins */}
        {insights.quickWins !== undefined && (
          <div className="rounded-lg bg-white/60 p-4 backdrop-blur-sm">
            <div className="mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-600" />
              <span className="text-xs font-semibold text-slate-700">
                Quick Wins (Cepat & Berdampak)
              </span>
            </div>
            {insights.quickWins.length > 0 ? (
              <div className="space-y-2">
                {insights.quickWins.slice(0, 3).map((win) => (
                  <div
                    key={win.id}
                    className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3"
                  >
                    <div className="mb-2">
                      <p className="text-xs font-semibold text-slate-900">
                        {win.title}
                      </p>
                      <p className="mt-1 text-xs text-slate-600">
                        {win.description}
                      </p>
                    </div>
                    {win.estimatedImpact && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {win.estimatedImpact.earnings && (
                          <Badge
                            variant="outline"
                            className="border-emerald-500 text-[10px] text-emerald-700"
                          >
                            +Rp{' '}
                            {win.estimatedImpact.earnings.toLocaleString(
                              'id-ID'
                            )}
                          </Badge>
                        )}
                        {win.estimatedImpact.rating && (
                          <Badge
                            variant="outline"
                            className="border-blue-500 text-[10px] text-blue-700"
                          >
                            +{win.estimatedImpact.rating.toFixed(1)} Rating
                          </Badge>
                        )}
                        {win.estimatedImpact.time && (
                          <Badge
                            variant="outline"
                            className="border-slate-500 text-[10px] text-slate-700"
                          >
                            {win.estimatedImpact.time}
                          </Badge>
                        )}
                      </div>
                    )}
                    {win.actionSteps.length > 0 && (
                      <ul className="mt-2 space-y-0.5">
                        {win.actionSteps.slice(0, 2).map((step, idx) => (
                          <li key={idx} className="text-[10px] text-slate-600">
                            • {step}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center">
                <p className="text-xs text-slate-500">
                  Belum ada quick wins yang tersedia
                </p>
              </div>
            )}
          </div>
        )}

        {/* Comparative Insights */}
        {insights.comparative !== undefined && (
          <div className="rounded-lg bg-white/60 p-4 backdrop-blur-sm">
            <div className="mb-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-semibold text-slate-700">
                Perbandingan dengan Peer
              </span>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-2">
                  <p className="text-[10px] text-slate-500">Overall Ranking</p>
                  <p className="text-sm font-bold text-blue-700">
                    Top{' '}
                    {100 - Math.round(insights.comparative.peerRanking.overall)}
                    %
                  </p>
                </div>
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-2">
                  <p className="text-[10px] text-slate-500">Earnings</p>
                  <p className="text-sm font-bold text-emerald-700">
                    Top{' '}
                    {100 -
                      Math.round(insights.comparative.peerRanking.earnings)}
                    %
                  </p>
                </div>
              </div>
              {insights.comparative.strengthsVsPeer.length > 0 && (
                <div>
                  <p className="mb-1.5 text-xs font-medium text-green-700">
                    Kekuatan vs Peer:
                  </p>
                  <ul className="space-y-1">
                    {insights.comparative.strengthsVsPeer
                      .slice(0, 2)
                      .map((strength, idx) => (
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
              {insights.comparative.strengthsVsPeer.length === 0 &&
                insights.comparative.improvementOpportunities.length === 0 && (
                  <div className="py-4 text-center">
                    <p className="text-xs text-slate-500">
                      Belum ada data perbandingan dengan peer
                    </p>
                  </div>
                )}
            </div>
          </div>
        )}

        {/* Opportunities */}
        {insights.opportunities !== undefined && (
          <div className="rounded-lg bg-white/60 p-4 backdrop-blur-sm">
            <div className="mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              <span className="text-xs font-semibold text-slate-700">
                Peluang Peningkatan
              </span>
            </div>
            {insights.opportunities.length > 0 ? (
              <div className="space-y-2">
                {insights.opportunities.slice(0, 3).map((opp) => (
                  <div
                    key={opp.id}
                    className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3"
                  >
                    <div className="mb-2">
                      <p className="text-xs font-semibold text-slate-900">
                        {opp.title}
                      </p>
                      <p className="mt-1 text-xs text-slate-600">
                        {opp.description}
                      </p>
                    </div>
                    {opp.potentialImpact && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {opp.potentialImpact.earnings && (
                          <Badge
                            variant="outline"
                            className="border-emerald-500 text-[10px] text-emerald-700"
                          >
                            +Rp{' '}
                            {opp.potentialImpact.earnings.toLocaleString(
                              'id-ID'
                            )}
                          </Badge>
                        )}
                        {opp.potentialImpact.rating && (
                          <Badge
                            variant="outline"
                            className="border-blue-500 text-[10px] text-blue-700"
                          >
                            +{opp.potentialImpact.rating.toFixed(1)} Rating
                          </Badge>
                        )}
                        {opp.potentialImpact.trips && (
                          <Badge
                            variant="outline"
                            className="border-purple-500 text-[10px] text-purple-700"
                          >
                            +{opp.potentialImpact.trips} Trips
                          </Badge>
                        )}
                        <Badge
                          variant="outline"
                          className="border-slate-500 text-[10px] text-slate-700"
                        >
                          {opp.timeframe}
                        </Badge>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center">
                <p className="text-xs text-slate-500">
                  Belum ada peluang peningkatan yang teridentifikasi
                </p>
              </div>
            )}
          </div>
        )}

        {/* Financial Health */}
        {insights.financialHealth !== undefined && (
          <div className="rounded-lg bg-white/60 p-4 backdrop-blur-sm">
            <div className="mb-3 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-600" />
              <span className="text-xs font-semibold text-slate-700">
                Financial Health
              </span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">Score</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-24 rounded-full bg-slate-200">
                    <div
                      className={cn(
                        'h-2 rounded-full',
                        insights.financialHealth.score >= 80 &&
                          'bg-emerald-600',
                        insights.financialHealth.score >= 60 &&
                          insights.financialHealth.score < 80 &&
                          'bg-blue-600',
                        insights.financialHealth.score >= 40 &&
                          insights.financialHealth.score < 60 &&
                          'bg-yellow-600',
                        insights.financialHealth.score < 40 && 'bg-red-600'
                      )}
                      style={{
                        width: `${insights.financialHealth.score}%`,
                      }}
                    />
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-xs',
                      insights.financialHealth.level === 'excellent' &&
                        'border-emerald-500 text-emerald-700',
                      insights.financialHealth.level === 'good' &&
                        'border-blue-500 text-blue-700',
                      insights.financialHealth.level === 'fair' &&
                        'border-yellow-500 text-yellow-700',
                      insights.financialHealth.level === 'poor' &&
                        'border-red-500 text-red-700'
                    )}
                  >
                    {insights.financialHealth.level === 'excellent' &&
                      'Excellent'}
                    {insights.financialHealth.level === 'good' && 'Good'}
                    {insights.financialHealth.level === 'fair' && 'Fair'}
                    {insights.financialHealth.level === 'poor' && 'Poor'}
                  </Badge>
                </div>
              </div>
              {insights.financialHealth.recommendations.length > 0 && (
                <div>
                  <p className="mb-1.5 text-xs font-medium text-slate-700">
                    Rekomendasi:
                  </p>
                  <ul className="space-y-1">
                    {insights.financialHealth.recommendations
                      .slice(0, 2)
                      .map((rec, idx) => (
                        <li key={idx} className="text-xs text-slate-600">
                          • {rec}
                        </li>
                      ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recommendations with Impact Prediction */}
        {sectionsToShow.includes('recommendations') && (
          <div className="rounded-lg bg-white/60 p-4 backdrop-blur-sm">
            <div className="mb-3 flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-600" />
              <span className="text-xs font-semibold text-slate-700">
                Rekomendasi
              </span>
            </div>
            {insights.recommendations.length > 0 ? (
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
                            {rec.predictedImpact && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {rec.predictedImpact.earnings && (
                                  <Badge
                                    variant="outline"
                                    className="border-emerald-500 text-[10px] text-emerald-700"
                                  >
                                    +Rp{' '}
                                    {rec.predictedImpact.earnings.toLocaleString(
                                      'id-ID'
                                    )}
                                  </Badge>
                                )}
                                {rec.predictedImpact.rating && (
                                  <Badge
                                    variant="outline"
                                    className="border-blue-500 text-[10px] text-blue-700"
                                  >
                                    +{rec.predictedImpact.rating.toFixed(1)}{' '}
                                    Rating
                                  </Badge>
                                )}
                                <Badge
                                  variant="outline"
                                  className="border-slate-500 text-[10px] text-slate-700"
                                >
                                  {rec.predictedImpact.timeframe}
                                </Badge>
                              </div>
                            )}
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
                            {rec.predictedImpact && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {rec.predictedImpact.earnings && (
                                  <Badge
                                    variant="outline"
                                    className="border-emerald-500 text-[10px] text-emerald-700"
                                  >
                                    +Rp{' '}
                                    {rec.predictedImpact.earnings.toLocaleString(
                                      'id-ID'
                                    )}
                                  </Badge>
                                )}
                                {rec.predictedImpact.rating && (
                                  <Badge
                                    variant="outline"
                                    className="border-blue-500 text-[10px] text-blue-700"
                                  >
                                    +{rec.predictedImpact.rating.toFixed(1)}{' '}
                                    Rating
                                  </Badge>
                                )}
                                <Badge
                                  variant="outline"
                                  className="border-slate-500 text-[10px] text-slate-700"
                                >
                                  {rec.predictedImpact.timeframe}
                                </Badge>
                              </div>
                            )}
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
                              {rec.predictedImpact && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {rec.predictedImpact.earnings && (
                                    <Badge
                                      variant="outline"
                                      className="border-emerald-500 text-[10px] text-emerald-700"
                                    >
                                      +Rp{' '}
                                      {rec.predictedImpact.earnings.toLocaleString(
                                        'id-ID'
                                      )}
                                    </Badge>
                                  )}
                                  {rec.predictedImpact.rating && (
                                    <Badge
                                      variant="outline"
                                      className="border-blue-500 text-[10px] text-blue-700"
                                    >
                                      +{rec.predictedImpact.rating.toFixed(1)}{' '}
                                      Rating
                                    </Badge>
                                  )}
                                  <Badge
                                    variant="outline"
                                    className="border-slate-500 text-[10px] text-slate-700"
                                  >
                                    {rec.predictedImpact.timeframe}
                                  </Badge>
                                </div>
                              )}
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
            ) : (
              <div className="py-4 text-center">
                <p className="text-xs text-slate-500">
                  Belum ada rekomendasi yang tersedia
                </p>
              </div>
            )}
          </div>
        )}

        {/* Coaching Action Plan & Skill Gaps */}
        {sectionsToShow.includes('coaching') &&
          insights.coaching !== undefined && (
            <div className="space-y-4">
              {/* Action Plan */}
              {insights.coaching.actionPlan !== undefined && (
                <div className="rounded-lg bg-white/60 p-4 backdrop-blur-sm">
                  <div className="mb-3 flex items-center gap-2">
                    <Target className="h-4 w-4 text-emerald-600" />
                    <span className="text-xs font-semibold text-slate-700">
                      Action Plan (4 Minggu)
                    </span>
                  </div>
                  {insights.coaching.actionPlan &&
                  insights.coaching.actionPlan.length > 0 ? (
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
                              <li
                                key={idx}
                                className="text-[11px] text-slate-600"
                              >
                                • {goal}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-4 text-center">
                      <p className="text-xs text-slate-500">
                        Belum ada action plan yang tersedia
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Skill Gaps */}
              {insights.coaching.skillGaps !== undefined && (
                <div className="rounded-lg bg-white/60 p-4 backdrop-blur-sm">
                  <div className="mb-3 flex items-center gap-2">
                    <Target className="h-4 w-4 text-blue-600" />
                    <span className="text-xs font-semibold text-slate-700">
                      Skill Gaps
                    </span>
                  </div>
                  {insights.coaching.skillGaps &&
                  insights.coaching.skillGaps.length > 0 ? (
                    <div className="space-y-2">
                      {insights.coaching.skillGaps
                        .slice(0, 3)
                        .map((gap, idx) => (
                          <div
                            key={idx}
                            className="rounded-lg border border-blue-200 bg-blue-50/50 p-3"
                          >
                            <div className="mb-2 flex items-center justify-between">
                              <p className="text-xs font-semibold text-slate-900">
                                {gap.skill}
                              </p>
                              <Badge
                                variant="outline"
                                className={cn(
                                  'text-[10px]',
                                  gap.priority === 'high' &&
                                    'border-red-500 text-red-700',
                                  gap.priority === 'medium' &&
                                    'border-yellow-500 text-yellow-700',
                                  gap.priority === 'low' &&
                                    'border-blue-500 text-blue-700'
                                )}
                              >
                                {gap.priority === 'high' && 'Tinggi'}
                                {gap.priority === 'medium' && 'Sedang'}
                                {gap.priority === 'low' && 'Rendah'}
                              </Badge>
                            </div>
                            <div className="mb-2 flex items-center gap-2">
                              <span className="text-[10px] text-slate-600">
                                Level: {gap.currentLevel} → {gap.targetLevel}
                              </span>
                            </div>
                            {gap.learningPath &&
                              gap.learningPath.length > 0 && (
                                <ul className="mt-2 space-y-0.5">
                                  {gap.learningPath
                                    .slice(0, 2)
                                    .map((path, pathIdx) => (
                                      <li
                                        key={pathIdx}
                                        className="text-[10px] text-slate-600"
                                      >
                                        • {path}
                                      </li>
                                    ))}
                                </ul>
                              )}
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="py-4 text-center">
                      <p className="text-xs text-slate-500">
                        Belum ada skill gaps yang teridentifikasi
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
      </CardContent>
    </Card>
  );
}
