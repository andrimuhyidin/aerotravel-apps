/**
 * AI Insights Panel Component
 * Displays AI-generated sales insights dengan recommendations
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Lightbulb,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Target,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { logger } from '@/lib/utils/logger';
import type { SalesInsights, SalesInsight } from '@/lib/ai/sales-insights';

type AIInsightsPanelProps = {
  period?: '7' | '30' | '90';
};

export function AIInsightsPanel({ period = '30' }: AIInsightsPanelProps) {
  const [insights, setInsights] = useState<SalesInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInsights();
  }, [period]);

  const loadInsights = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/partner/ai/insights?period=${period}`);

      if (!response.ok) {
        throw new Error('Failed to load insights');
      }

      const data = await response.json();
      setInsights(data.insights);
    } catch (error) {
      logger.error('Failed to load AI insights', error);
      setError('Gagal memuat insights. Silakan coba lagi.');
      toast.error('Gagal memuat AI insights');
    } finally {
      setLoading(false);
    }
  };

  const getInsightIcon = (type: SalesInsight['type']) => {
    switch (type) {
      case 'trend':
        return <TrendingUp className="h-5 w-5" />;
      case 'opportunity':
        return <Lightbulb className="h-5 w-5" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5" />;
      case 'recommendation':
        return <Sparkles className="h-5 w-5" />;
      default:
        return <Sparkles className="h-5 w-5" />;
    }
  };

  const getInsightColor = (type: SalesInsight['type']) => {
    switch (type) {
      case 'trend':
        return 'bg-blue-100 text-blue-700';
      case 'opportunity':
        return 'bg-green-100 text-green-700';
      case 'warning':
        return 'bg-yellow-100 text-yellow-700';
      case 'recommendation':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getImpactColor = (impact: SalesInsight['impact']) => {
    switch (impact) {
      case 'high':
        return 'bg-red-100 text-red-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'low':
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Sales Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Sales Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button onClick={loadInsights} variant="outline" className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!insights) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Key Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Sales Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {insights.insights.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Tidak ada insights untuk periode ini.
            </p>
          ) : (
            insights.insights.map((insight, idx) => (
              <div
                key={idx}
                className="border rounded-lg p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`p-2 rounded-lg ${getInsightColor(insight.type)}`}>
                      {getInsightIcon(insight.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{insight.title}</h3>
                        <Badge variant="outline" className={getImpactColor(insight.impact)}>
                          {insight.impact} impact
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {insight.description}
                      </p>
                      {insight.metrics && (
                        <div className="mt-2 flex items-center gap-4 text-sm">
                          <span>
                            Current: {typeof insight.metrics.current === 'number' 
                              ? `Rp ${insight.metrics.current.toLocaleString('id-ID')}`
                              : insight.metrics.current}
                          </span>
                          {insight.metrics.change && (
                            <span className="flex items-center gap-1">
                              {insight.metrics.change > 0 ? (
                                <>
                                  <ArrowUp className="h-3 w-3 text-green-500" />
                                  <span className="text-green-500">
                                    +{typeof insight.metrics.change === 'number'
                                      ? `Rp ${insight.metrics.change.toLocaleString('id-ID')}`
                                      : insight.metrics.change}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <ArrowDown className="h-3 w-3 text-red-500" />
                                  <span className="text-red-500">
                                    {typeof insight.metrics.change === 'number'
                                      ? `Rp ${insight.metrics.change.toLocaleString('id-ID')}`
                                      : insight.metrics.change}
                                  </span>
                                </>
                              )}
                            </span>
                          )}
                        </div>
                      )}
                      {insight.actionable && insight.actionItems && insight.actionItems.length > 0 && (
                        <div className="mt-3 space-y-1">
                          <p className="text-xs font-medium text-muted-foreground">
                            Action Items:
                          </p>
                          <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                            {insight.actionItems.map((action, actionIdx) => (
                              <li key={actionIdx}>{action}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Predictions */}
      {insights.predictions && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Predictions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">
                  Prediksi Revenue Bulan Depan
                </p>
                <p className="text-2xl font-bold">
                  Rp {insights.predictions.nextMonthRevenue.toLocaleString('id-ID')}
                </p>
              </div>
              <div className="border rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-1">
                  Prediksi Bookings Bulan Depan
                </p>
                <p className="text-2xl font-bold">
                  {insights.predictions.nextMonthBookings} bookings
                </p>
              </div>
            </div>
            {insights.predictions.bestSellingPackages.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Best Selling Packages (Predicted):</p>
                {insights.predictions.bestSellingPackages.map((pkg, idx) => (
                  <div key={idx} className="flex items-center justify-between border rounded p-2">
                    <span className="text-sm">{pkg.packageName}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {pkg.predictedBookings} bookings
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {pkg.confidence} confidence
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {insights.recommendations && insights.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {insights.recommendations.map((rec, idx) => (
              <div key={idx} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold">{rec.title}</h3>
                  <Badge variant="outline" className={getImpactColor(rec.priority)}>
                    {rec.priority} priority
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{rec.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

