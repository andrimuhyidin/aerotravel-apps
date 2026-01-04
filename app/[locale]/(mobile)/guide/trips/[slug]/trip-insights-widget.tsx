'use client';

/**
 * Trip Insights Widget
 * Predictive trip insights widget
 */

import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Lightbulb, Package } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/loading-state';
import queryKeys from '@/lib/queries/query-keys';

type TripInsightsWidgetProps = {
  tripId: string;
  locale: string;
};

export function TripInsightsWidget({ tripId, locale: _locale }: TripInsightsWidgetProps) {
  const { data, isLoading } = useQuery({
    queryKey: [...queryKeys.guide.tripsDetail(tripId), 'ai-insights'],
    queryFn: async () => {
      const res = await fetch(`/api/guide/trips/${tripId}/ai-insights`);
      if (!res.ok) throw new Error('Failed to load insights');
      return (await res.json()) as {
        insights: Array<{
          type: string;
          title: string;
          description: string;
          probability: number;
          severity: 'low' | 'medium' | 'high';
          recommendations: string[];
        }>;
        resourceSuggestions: Array<{
          item: string;
          quantity: number;
          reason: string;
          priority: 'high' | 'medium' | 'low';
        }>;
      };
    },
  });

  if (isLoading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent>
          <LoadingState variant="spinner" message="Memuat insights..." />
        </CardContent>
      </Card>
    );
  }

  if (!data || (data.insights.length === 0 && data.resourceSuggestions.length === 0)) {
    return null;
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Lightbulb className="h-5 w-5 text-emerald-600" />
          AI Trip Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Insights */}
        {data.insights.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold text-slate-700">Prediksi & Rekomendasi</p>
            <div className="space-y-2">
              {data.insights.slice(0, 3).map((insight, idx) => (
                <div
                  key={idx}
                  className={`rounded-lg border p-3 ${
                    insight.severity === 'high'
                      ? 'border-red-200 bg-red-50'
                      : insight.severity === 'medium'
                        ? 'border-amber-200 bg-amber-50'
                        : 'border-blue-200 bg-blue-50'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle
                      className={`h-4 w-4 mt-0.5 ${
                        insight.severity === 'high'
                          ? 'text-red-600'
                          : insight.severity === 'medium'
                            ? 'text-amber-600'
                            : 'text-blue-600'
                      }`}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{insight.title}</p>
                      <p className="mt-1 text-xs leading-relaxed">{insight.description}</p>
                      {insight.recommendations.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {insight.recommendations.slice(0, 2).map((rec, i) => (
                            <li key={i} className="text-[11px] flex items-start gap-1.5">
                              <span>•</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resource Suggestions */}
        {data.resourceSuggestions.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold text-slate-700">Resource Planning</p>
            <div className="space-y-2">
              {data.resourceSuggestions.slice(0, 3).map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-2.5"
                >
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-slate-500" />
                    <div>
                      <p className="text-xs font-semibold text-slate-900">{item.item}</p>
                      <p className="text-[11px] text-slate-600">{item.reason}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">{item.quantity}x</p>
                    <p
                      className={`text-[10px] ${
                        item.priority === 'high'
                          ? 'text-red-600'
                          : item.priority === 'medium'
                            ? 'text-amber-600'
                            : 'text-slate-600'
                      }`}
                    >
                      {item.priority}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
