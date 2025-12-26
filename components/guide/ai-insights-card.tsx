'use client';

/**
 * Unified AI Insights Card Component
 * Reusable component for displaying AI-generated insights
 * Used in both insights and performance pages
 */

import { useState } from 'react';
import {
  AlertTriangle,
  Brain,
  DollarSign,
  Filter,
  Lightbulb,
  Target,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
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
    | 'riskAlerts'
    | 'quickWins'
    | 'comparative'
    | 'opportunities'
    | 'financialHealth'
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
    'coaching',
    'riskAlerts',
    'quickWins',
    'comparative',
    'opportunities',
    'financialHealth',
  ];

  // State for filtering and sorting
  const [recommendationFilter, setRecommendationFilter] = useState<
    'all' | 'high' | 'medium' | 'low'
  >('all');
  const [recommendationTypeFilter, setRecommendationTypeFilter] = useState<
    'all' | string
  >('all');
  const [riskAlertSort, setRiskAlertSort] = useState<
    'severity' | 'type'
  >('severity');
  const [expandedLists, setExpandedLists] = useState<Set<string>>(new Set());

  // Group recommendations by priority
  const recommendationsByPriority = {
    high: insights.recommendations.filter((r) => r.priority === 'high'),
    medium: insights.recommendations.filter((r) => r.priority === 'medium'),
    low: insights.recommendations.filter((r) => r.priority === 'low'),
  };

  // Filter recommendations
  const filteredRecommendations = insights.recommendations.filter((rec) => {
    if (recommendationFilter !== 'all' && rec.priority !== recommendationFilter) {
      return false;
    }
    if (recommendationTypeFilter !== 'all' && rec.type !== recommendationTypeFilter) {
      return false;
    }
    return true;
  });

  // Sort risk alerts
  const sortedRiskAlerts = [...(insights.riskAlerts || [])].sort((a, b) => {
    if (riskAlertSort === 'severity') {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return (
        severityOrder[a.severity] - severityOrder[b.severity]
      );
    } else {
      return a.type.localeCompare(b.type);
    }
  });

  // Toggle list expansion
  const toggleListExpansion = (listId: string) => {
    setExpandedLists((prev) => {
      const next = new Set(prev);
      if (next.has(listId)) {
        next.delete(listId);
      } else {
        next.add(listId);
      }
      return next;
    });
  };

  // Helper function to check if section has data
  const hasData = {
    riskAlerts:
      insights.riskAlerts !== undefined && insights.riskAlerts.length > 0,
    quickWins:
      insights.quickWins !== undefined && insights.quickWins.length > 0,
    opportunities:
      insights.opportunities !== undefined && insights.opportunities.length > 0,
    comparative:
      insights.comparative !== undefined &&
      (insights.comparative.strengthsVsPeer.length > 0 ||
        insights.comparative.improvementOpportunities.length > 0 ||
        insights.comparative.peerRanking.overall !== 50),
    financialHealth:
      insights.financialHealth !== undefined &&
      (insights.financialHealth.factors.length > 0 ||
        insights.financialHealth.recommendations.length > 0 ||
        insights.financialHealth.score !== 50),
  };

  // Section grouping
  const criticalSections = sectionsToShow.includes('riskAlerts') &&
    hasData.riskAlerts;
  const quickActionSections =
    (sectionsToShow.includes('quickWins') && hasData.quickWins) ||
    (sectionsToShow.includes('opportunities') && hasData.opportunities);
  const analysisSections =
    (sectionsToShow.includes('comparative') && hasData.comparative) ||
    (sectionsToShow.includes('financialHealth') && hasData.financialHealth);

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

        {/* Critical Alerts: Risk Alerts */}
        {sectionsToShow.includes('riskAlerts') &&
          insights.riskAlerts !== undefined && (
          <div className="rounded-lg bg-white/60 p-4 backdrop-blur-sm">
            <div className="mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-xs font-semibold text-slate-700">
                Peringatan Risiko
              </span>
              {insights.riskAlerts.length > 0 && (
                <>
                  <Badge
                    variant="outline"
                    className={cn(
                      'ml-auto border-red-500 text-[10px] text-red-700',
                      insights.riskAlerts.some((a) => a.severity === 'critical') &&
                        'bg-red-50'
                    )}
                  >
                    {insights.riskAlerts.length} Alert
                    {insights.riskAlerts.some((a) => a.severity === 'critical') &&
                      ' • Kritis'}
                  </Badge>
                  {insights.riskAlerts.length > 1 && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => setRiskAlertSort('severity')}
                        className={cn(
                          'rounded px-2 py-0.5 text-[10px] transition-colors',
                          riskAlertSort === 'severity'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        )}
                      >
                        Severity
                      </button>
                      <button
                        onClick={() => setRiskAlertSort('type')}
                        className={cn(
                          'rounded px-2 py-0.5 text-[10px] transition-colors',
                          riskAlertSort === 'type'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        )}
                      >
                        Type
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
            {insights.riskAlerts.length > 0 ? (
              <div className="space-y-2">
                {(expandedLists.has('riskAlerts')
                  ? sortedRiskAlerts
                  : sortedRiskAlerts.slice(0, 3)
                ).map((alert) => (
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
                {sortedRiskAlerts.length > 3 && (
                  <button
                    onClick={() => toggleListExpansion('riskAlerts')}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 transition-colors hover:bg-slate-100"
                  >
                    {expandedLists.has('riskAlerts')
                      ? 'Tampilkan Lebih Sedikit'
                      : `Tampilkan Semua (${sortedRiskAlerts.length})`}
                  </button>
                )}
              </div>
            ) : (
              <div className="py-4 text-center">
                <AlertTriangle className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                <p className="text-xs font-medium text-slate-600">
                  Tidak ada peringatan risiko saat ini
                </p>
                <p className="mt-1 text-[10px] text-slate-500">
                  Semua metrik keselamatan dan operasional dalam batas normal
                </p>
              </div>
            )}
          </div>
        )}

        {/* Quick Actions: Quick Wins */}
        {sectionsToShow.includes('quickWins') &&
          insights.quickWins !== undefined && (
          <div className="rounded-lg bg-white/60 p-4 backdrop-blur-sm">
            <div className="mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-600" />
              <span className="text-xs font-semibold text-slate-700">
                Quick Wins (Cepat & Berdampak)
              </span>
              {insights.quickWins.length > 0 && (
                <Badge
                  variant="outline"
                  className="ml-auto border-emerald-500 bg-emerald-50 text-[10px] text-emerald-700"
                >
                  {insights.quickWins.length} Quick Win
                </Badge>
              )}
            </div>
            {insights.quickWins.length > 0 ? (
              <div className="space-y-2">
                {(expandedLists.has('quickWins')
                  ? insights.quickWins
                  : insights.quickWins.slice(0, 3)
                ).map((win) => (
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
                {insights.quickWins.length > 3 && (
                  <button
                    onClick={() => toggleListExpansion('quickWins')}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 transition-colors hover:bg-slate-100"
                  >
                    {expandedLists.has('quickWins')
                      ? 'Tampilkan Lebih Sedikit'
                      : `Tampilkan Semua (${insights.quickWins.length})`}
                  </button>
                )}
              </div>
            ) : (
              <div className="py-4 text-center">
                <Zap className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                <p className="text-xs font-medium text-slate-600">
                  Belum ada quick wins yang tersedia
                </p>
                <p className="mt-1 text-[10px] text-slate-500">
                  Terus tingkatkan performa untuk mendapatkan quick wins baru
                </p>
              </div>
            )}
          </div>
        )}

        {/* Analysis Section: Comparative Insights & Financial Health */}
        {analysisSections && (
          <Accordion defaultOpen={false} type="multiple">
            {/* Comparative Insights */}
            {sectionsToShow.includes('comparative') &&
              insights.comparative !== undefined && (
              <AccordionItem value="comparative" defaultOpen={false}>
                <AccordionTrigger value="comparative">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span className="text-xs font-semibold text-slate-700">
                      Perbandingan dengan Peer
                    </span>
                    {hasData.comparative && (
                      <Badge
                        variant="outline"
                        className="ml-2 border-blue-500 text-[10px] text-blue-700"
                      >
                        Top{' '}
                        {100 -
                          Math.round(
                            insights.comparative.peerRanking.overall
                          )}
                        %
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent value="comparative">
                  <div className="rounded-lg bg-white/60 p-4 backdrop-blur-sm">
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
                        insights.comparative.improvementOpportunities.length ===
                          0 && (
                          <div className="py-4 text-center">
                            <Users className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                            <p className="text-xs font-medium text-slate-600">
                              Belum ada data perbandingan dengan peer
                            </p>
                            <p className="mt-1 text-[10px] text-slate-500">
                              Data akan muncul setelah ada cukup guide lain untuk dibandingkan
                            </p>
                          </div>
                        )}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Financial Health */}
            {sectionsToShow.includes('financialHealth') &&
              insights.financialHealth !== undefined && (
              <AccordionItem value="financialHealth" defaultOpen={false}>
                <AccordionTrigger value="financialHealth">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-emerald-600" />
                    <span className="text-xs font-semibold text-slate-700">
                      Financial Health
                    </span>
                    {hasData.financialHealth && (
                      <Badge
                        variant="outline"
                        className={cn(
                          'ml-2 text-[10px]',
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
                        {insights.financialHealth.score}/100 •{' '}
                        {insights.financialHealth.level === 'excellent' &&
                          'Excellent'}
                        {insights.financialHealth.level === 'good' && 'Good'}
                        {insights.financialHealth.level === 'fair' && 'Fair'}
                        {insights.financialHealth.level === 'poor' && 'Poor'}
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent value="financialHealth">
                  <div className="rounded-lg bg-white/60 p-4 backdrop-blur-sm">
                    <div className="space-y-3">
                      {insights.financialHealth.score !== 50 ||
                      insights.financialHealth.level !== 'fair' ||
                      insights.financialHealth.factors.length > 0 ||
                      insights.financialHealth.recommendations.length > 0 ? (
                        <>
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
                                    insights.financialHealth.score < 40 &&
                                      'bg-red-600'
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
                                {insights.financialHealth.level === 'good' &&
                                  'Good'}
                                {insights.financialHealth.level === 'fair' &&
                                  'Fair'}
                                {insights.financialHealth.level === 'poor' &&
                                  'Poor'}
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
                        </>
                      ) : (
                        <div className="py-4 text-center">
                          <DollarSign className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                          <p className="text-xs font-medium text-slate-600">
                            Belum ada data kesehatan finansial
                          </p>
                          <p className="mt-1 text-[10px] text-slate-500">
                            Lengkapi data earnings dan expenses untuk analisis finansial
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        )}

        {/* Quick Actions: Opportunities */}
        {sectionsToShow.includes('opportunities') &&
          insights.opportunities !== undefined && (
          <div className="rounded-lg bg-white/60 p-4 backdrop-blur-sm">
            <div className="mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              <span className="text-xs font-semibold text-slate-700">
                Peluang Peningkatan
              </span>
              {insights.opportunities.length > 0 && (
                <Badge
                  variant="outline"
                  className="ml-auto border-emerald-500 bg-emerald-50 text-[10px] text-emerald-700"
                >
                  {insights.opportunities.length} Peluang
                </Badge>
              )}
            </div>
            {insights.opportunities.length > 0 ? (
              <div className="space-y-2">
                {(expandedLists.has('opportunities')
                  ? insights.opportunities
                  : insights.opportunities.slice(0, 3)
                ).map((opp) => (
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
                {insights.opportunities.length > 3 && (
                  <button
                    onClick={() => toggleListExpansion('opportunities')}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 transition-colors hover:bg-slate-100"
                  >
                    {expandedLists.has('opportunities')
                      ? 'Tampilkan Lebih Sedikit'
                      : `Tampilkan Semua (${insights.opportunities.length})`}
                  </button>
                )}
              </div>
            ) : (
              <div className="py-4 text-center">
                <TrendingUp className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                <p className="text-xs font-medium text-slate-600">
                  Belum ada peluang peningkatan yang teridentifikasi
                </p>
                <p className="mt-1 text-[10px] text-slate-500">
                  Terus tingkatkan performa untuk membuka peluang baru
                </p>
              </div>
            )}
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
              {insights.recommendations.length > 0 && (
                <Badge
                  variant="outline"
                  className="ml-auto border-amber-500 bg-amber-50 text-[10px] text-amber-700"
                >
                  {filteredRecommendations.length} dari {insights.recommendations.length}
                  {recommendationsByPriority.high.length > 0 &&
                    ` • ${recommendationsByPriority.high.length} Prioritas Tinggi`}
                </Badge>
              )}
            </div>
            {insights.recommendations.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-1">
                <button
                  onClick={() => setRecommendationFilter('all')}
                  className={cn(
                    'rounded px-2 py-1 text-[10px] transition-colors',
                    recommendationFilter === 'all'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  )}
                >
                  Semua
                </button>
                <button
                  onClick={() => setRecommendationFilter('high')}
                  className={cn(
                    'rounded px-2 py-1 text-[10px] transition-colors',
                    recommendationFilter === 'high'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  )}
                >
                  Tinggi ({recommendationsByPriority.high.length})
                </button>
                <button
                  onClick={() => setRecommendationFilter('medium')}
                  className={cn(
                    'rounded px-2 py-1 text-[10px] transition-colors',
                    recommendationFilter === 'medium'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  )}
                >
                  Sedang ({recommendationsByPriority.medium.length})
                </button>
                <button
                  onClick={() => setRecommendationFilter('low')}
                  className={cn(
                    'rounded px-2 py-1 text-[10px] transition-colors',
                    recommendationFilter === 'low'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  )}
                >
                  Rendah ({recommendationsByPriority.low.length})
                </button>
              </div>
            )}
            {filteredRecommendations.length > 0 ? (
              <div className="space-y-2">
                {(expandedLists.has('recommendations')
                  ? filteredRecommendations
                  : filteredRecommendations.slice(0, 5)
                ).map((rec) => (
                  <div
                    key={rec.id}
                    className={cn(
                      'mb-2 rounded-lg border p-3',
                      rec.priority === 'high' &&
                        'border-red-200 bg-red-50/50',
                      rec.priority === 'medium' &&
                        'border-yellow-200 bg-yellow-50/50',
                      rec.priority === 'low' &&
                        'border-blue-200 bg-blue-50/50'
                    )}
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
                                +{rec.predictedImpact.rating.toFixed(1)} Rating
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
                        className={cn(
                          'shrink-0 text-[10px]',
                          rec.priority === 'high' &&
                            'border-red-500 text-red-700',
                          rec.priority === 'medium' &&
                            'border-yellow-500 text-yellow-700',
                          rec.priority === 'low' &&
                            'border-blue-500 text-blue-700'
                        )}
                      >
                        {rec.priority === 'high' && 'Tinggi'}
                        {rec.priority === 'medium' && 'Sedang'}
                        {rec.priority === 'low' && 'Rendah'}
                      </Badge>
                    </div>
                  </div>
                ))}
                {filteredRecommendations.length > 5 && (
                  <button
                    onClick={() => toggleListExpansion('recommendations')}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 transition-colors hover:bg-slate-100"
                  >
                    {expandedLists.has('recommendations')
                      ? 'Tampilkan Lebih Sedikit'
                      : `Tampilkan Semua (${filteredRecommendations.length})`}
                  </button>
                )}
              </div>
              ) : (
                <div className="py-4 text-center">
                  <Lightbulb className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                  <p className="text-xs font-medium text-slate-600">
                    Belum ada rekomendasi yang tersedia
                  </p>
                  <p className="mt-1 text-[10px] text-slate-500">
                    AI akan memberikan rekomendasi setelah menganalisis data performa Anda
                  </p>
                </div>
              )}
          </div>
        )}

        {/* Coaching Action Plan & Skill Gaps */}
        {sectionsToShow.includes('coaching') && (
          <div className="space-y-4">
            {/* Action Plan */}
            {insights.coaching?.actionPlan !== undefined ? (
                <div className="rounded-lg bg-white/60 p-4 backdrop-blur-sm">
                  <div className="mb-3 flex items-center gap-2">
                    <Target className="h-4 w-4 text-emerald-600" />
                    <span className="text-xs font-semibold text-slate-700">
                      Action Plan (4 Minggu)
                    </span>
                    {insights.coaching.actionPlan &&
                      insights.coaching.actionPlan.length > 0 && (
                        <Badge
                          variant="outline"
                          className="ml-auto border-emerald-500 bg-emerald-50 text-[10px] text-emerald-700"
                        >
                          {insights.coaching.actionPlan.length} Minggu
                        </Badge>
                      )}
                  </div>
                  {insights.coaching.actionPlan &&
                  insights.coaching.actionPlan.length > 0 ? (
                    <div className="space-y-1.5">
                      {(expandedLists.has('actionPlan')
                        ? insights.coaching.actionPlan
                        : insights.coaching.actionPlan.slice(0, 2)
                      ).map((week) => (
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
                      {insights.coaching.actionPlan.length > 2 && (
                        <button
                          onClick={() => toggleListExpansion('actionPlan')}
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 transition-colors hover:bg-slate-100"
                        >
                          {expandedLists.has('actionPlan')
                            ? 'Tampilkan Lebih Sedikit'
                            : `Tampilkan Semua (${insights.coaching.actionPlan.length} minggu)`}
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="py-4 text-center">
                      <Target className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                      <p className="text-xs font-medium text-slate-600">
                        Belum ada action plan yang tersedia
                      </p>
                      <p className="mt-1 text-[10px] text-slate-500">
                        Action plan akan dibuat setelah AI menganalisis skill gaps Anda
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-lg bg-white/60 p-4 backdrop-blur-sm">
                  <div className="mb-3 flex items-center gap-2">
                    <Target className="h-4 w-4 text-emerald-600" />
                    <span className="text-xs font-semibold text-slate-700">
                      Action Plan (4 Minggu)
                    </span>
                  </div>
                  <div className="py-4 text-center">
                    <Target className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                    <p className="text-xs font-medium text-slate-600">
                      Belum ada action plan yang tersedia
                    </p>
                    <p className="mt-1 text-[10px] text-slate-500">
                      Action plan akan dibuat setelah AI menganalisis skill gaps Anda
                    </p>
                  </div>
                </div>
              )}

            {/* Skill Gaps */}
            {insights.coaching?.skillGaps !== undefined ? (
              <div className="rounded-lg bg-white/60 p-4 backdrop-blur-sm">
                <div className="mb-3 flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-600" />
                  <span className="text-xs font-semibold text-slate-700">
                    Skill Gaps
                  </span>
                  {insights.coaching.skillGaps &&
                    insights.coaching.skillGaps.length > 0 && (
                      <Badge
                        variant="outline"
                        className="ml-auto border-blue-500 bg-blue-50 text-[10px] text-blue-700"
                      >
                        {insights.coaching.skillGaps.length} Skill Gap
                        {insights.coaching.skillGaps.filter(
                          (g) => g.priority === 'high'
                        ).length > 0 &&
                          ` • ${insights.coaching.skillGaps.filter((g) => g.priority === 'high').length} Prioritas Tinggi`}
                      </Badge>
                    )}
                </div>
                {insights.coaching.skillGaps &&
                insights.coaching.skillGaps.length > 0 ? (
                    <div className="space-y-2">
                      {(expandedLists.has('skillGaps')
                        ? insights.coaching.skillGaps
                        : insights.coaching.skillGaps.slice(0, 3)
                      ).map((gap, idx) => (
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
                      {insights.coaching.skillGaps.length > 3 && (
                        <button
                          onClick={() => toggleListExpansion('skillGaps')}
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 transition-colors hover:bg-slate-100"
                        >
                          {expandedLists.has('skillGaps')
                            ? 'Tampilkan Lebih Sedikit'
                            : `Tampilkan Semua (${insights.coaching.skillGaps.length})`}
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="py-4 text-center">
                      <Target className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                      <p className="text-xs font-medium text-slate-600">
                        Belum ada skill gaps yang teridentifikasi
                      </p>
                      <p className="mt-1 text-[10px] text-slate-500">
                        Skill Anda sudah sesuai dengan standar yang diharapkan
                      </p>
                    </div>
                  )}
                </div>
            ) : (
              <div className="rounded-lg bg-white/60 p-4 backdrop-blur-sm">
                <div className="mb-3 flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-600" />
                  <span className="text-xs font-semibold text-slate-700">
                    Skill Gaps
                  </span>
                </div>
                <div className="py-4 text-center">
                  <Target className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                  <p className="text-xs font-medium text-slate-600">
                    Belum ada skill gaps yang teridentifikasi
                  </p>
                  <p className="mt-1 text-[10px] text-slate-500">
                    Skill Anda sudah sesuai dengan standar yang diharapkan
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
