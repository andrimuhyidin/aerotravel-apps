'use client';

/**
 * AI Feedback Analyzer Widget
 * Auto-summarize, sentiment analysis, action items
 */

import { useMutation } from '@tanstack/react-query';
import { BarChart3, Lightbulb, Sparkles, TrendingDown, TrendingUp } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/loading-state';
import { cn } from '@/lib/utils';

type FeedbackAiAnalyzerProps = {
  feedbackId?: string;
  feedbackText?: string;
  rating?: number;
  guideId?: string;
  onAnalysisComplete?: (analysis: {
    summary: string;
    sentiment: string;
    actionItems: Array<{ item: string; priority: string }>;
  }) => void;
};

export function FeedbackAiAnalyzer({
  feedbackId,
  feedbackText,
  rating,
  guideId,
  onAnalysisComplete,
}: FeedbackAiAnalyzerProps) {
  const [showAnalysis, setShowAnalysis] = useState(false);

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const payload: {
        type: 'single' | 'trends';
        feedbackId?: string;
        feedbackText?: string;
        rating?: number;
        guideId?: string;
        limit?: number;
      } = {
        type: feedbackId || feedbackText ? 'single' : 'trends',
      };

      if (feedbackId) payload.feedbackId = feedbackId;
      if (feedbackText) payload.feedbackText = feedbackText;
      if (rating !== undefined) payload.rating = rating;
      if (guideId) payload.guideId = guideId;
      // For trends analysis (no feedbackId/feedbackText), analyze recent feedbacks
      if (!feedbackId && !feedbackText) {
        payload.limit = 20;
      }

      const res = await fetch('/api/guide/feedback/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to analyze');
      return (await res.json()) as {
        analysis?: {
          summary: string;
          sentiment: 'positive' | 'neutral' | 'negative';
          sentimentScore: number;
          actionItems: Array<{ item: string; priority: 'high' | 'medium' | 'low' }>;
        };
        trends?: {
          overallSentiment: string;
          commonThemes: Array<{ theme: string; frequency: number }>;
          topActionItems: Array<{ item: string; priority: string; count: number }>;
        };
      };
    },
    onSuccess: (data) => {
      setShowAnalysis(true);
      if (data.analysis && onAnalysisComplete) {
        onAnalysisComplete({
          summary: data.analysis.summary,
          sentiment: data.analysis.sentiment,
          actionItems: data.analysis.actionItems,
        });
      }
    },
  });

  // For trends analysis, guideId is optional - will analyze all feedbacks
  // For single feedback analysis, need feedbackId or feedbackText
  // If none provided, don't render
  if (!feedbackText && !feedbackId && !guideId) {
    return null;
  }

  const analysis = analyzeMutation.data?.analysis;
  const trends = analyzeMutation.data?.trends;

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="h-4 w-4 text-emerald-600" />
            AI Analysis
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() => analyzeMutation.mutate()}
            disabled={analyzeMutation.isPending}
            className="h-7 text-xs"
          >
            {analyzeMutation.isPending ? 'Analyzing...' : 'Analyze'}
          </Button>
        </div>
      </CardHeader>
      {showAnalysis && (analysis || trends) && (
        <CardContent className="space-y-3">
          {analysis && (
            <>
              <div>
                <p className="text-xs font-semibold text-slate-700">Summary</p>
                <p className="mt-1 text-sm text-slate-900">{analysis.summary}</p>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold text-slate-700">Sentiment:</p>
                <div
                  className={cn(
                    'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                    analysis.sentiment === 'positive' && 'bg-emerald-100 text-emerald-700',
                    analysis.sentiment === 'negative' && 'bg-red-100 text-red-700',
                    analysis.sentiment === 'neutral' && 'bg-slate-100 text-slate-700'
                  )}
                >
                  {analysis.sentiment === 'positive' && <TrendingUp className="h-3 w-3" />}
                  {analysis.sentiment === 'negative' && <TrendingDown className="h-3 w-3" />}
                  <span className="capitalize">{analysis.sentiment}</span>
                </div>
              </div>
              {analysis.actionItems.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold text-slate-700">Action Items</p>
                  <div className="space-y-1.5">
                    {analysis.actionItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 rounded-lg border border-slate-200 bg-white p-2"
                      >
                        <Lightbulb
                          className={cn(
                            'h-3 w-3 mt-0.5',
                            item.priority === 'high' && 'text-red-600',
                            item.priority === 'medium' && 'text-amber-600',
                            item.priority === 'low' && 'text-blue-600'
                          )}
                        />
                        <p className="flex-1 text-xs text-slate-900">{item.item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
          {trends && (
            <div>
              <p className="mb-2 text-xs font-semibold text-slate-700">Trends</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-slate-500" />
                  <p className="text-xs text-slate-700">
                    Overall: <span className="font-semibold capitalize">{trends.overallSentiment}</span>
                  </p>
                </div>
                {trends.commonThemes.length > 0 && (
                  <div>
                    <p className="text-[11px] font-medium text-slate-600">Common Themes:</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {trends.commonThemes.slice(0, 3).map((theme, idx) => (
                        <span
                          key={idx}
                          className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-700"
                        >
                          {theme.theme} ({theme.frequency}x)
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      )}
      {analyzeMutation.isPending && (
        <CardContent>
          <LoadingState variant="spinner" message="Menganalisis feedback..." />
        </CardContent>
      )}
    </Card>
  );
}
