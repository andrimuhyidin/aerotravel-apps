/**
 * Customer Sentiment Indicator Widget
 * Real-time mood indicator dari interaksi customer
 * Uses /api/guide/customer-sentiment/analyze API
 */

'use client';

import { useCallback, useState } from 'react';
import {
  AlertTriangle,
  Frown,
  Lightbulb,
  Loader2,
  Meh,
  Send,
  Smile,
  Sparkles,
  TrendingUp,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/utils/logger';
import { toast } from 'sonner';

type SentimentAnalysis = {
  sentiment: 'positive' | 'neutral' | 'negative';
  score: number;
  confidence: number;
  keywords: string[];
  alert: boolean;
  suggestion?: string;
};

type SentimentIndicatorWidgetProps = {
  tripId: string;
  locale?: string;
  className?: string;
};

export function SentimentIndicatorWidget({
  tripId,
  locale: _locale = 'id',
  className,
}: SentimentIndicatorWidgetProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [observation, setObservation] = useState('');
  const [currentSentiment, setCurrentSentiment] = useState<SentimentAnalysis | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const analyzeSentiment = useCallback(async (text: string, behavior?: string) => {
    if (!text.trim() && !behavior) return;

    setLoading(true);
    try {
      const res = await fetch('/api/guide/customer-sentiment/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId,
          interaction: {
            text: text.trim() || undefined,
            behavior,
          },
        }),
      });

      if (!res.ok) {
        throw new Error('Gagal menganalisis sentimen');
      }

      const data = (await res.json()) as { 
        analysis: SentimentAnalysis; 
        suggestions?: string[];
      };

      setCurrentSentiment(data.analysis);
      if (data.suggestions) {
        setSuggestions(data.suggestions);
      }

      if (data.analysis.alert) {
        toast.warning('Terdeteksi sentimen negatif', {
          description: data.analysis.suggestion || 'Perhatikan kondisi tamu',
        });
      }
    } catch (error) {
      logger.error('Failed to analyze sentiment', error, { tripId });
      toast.error('Gagal menganalisis sentimen');
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  const handleSubmitObservation = async () => {
    if (!observation.trim()) return;
    await analyzeSentiment(observation);
    setObservation('');
    setShowDialog(false);
  };

  const handleQuickSentiment = async (behavior: string) => {
    await analyzeSentiment('', behavior);
  };

  const getSentimentIcon = (sentiment?: 'positive' | 'neutral' | 'negative') => {
    switch (sentiment) {
      case 'positive':
        return <Smile className="h-5 w-5 text-green-500" />;
      case 'negative':
        return <Frown className="h-5 w-5 text-red-500" />;
      default:
        return <Meh className="h-5 w-5 text-amber-500" />;
    }
  };

  const getSentimentColor = (sentiment?: 'positive' | 'neutral' | 'negative') => {
    switch (sentiment) {
      case 'positive':
        return 'border-green-200 bg-green-50';
      case 'negative':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-amber-200 bg-amber-50';
    }
  };

  const getSentimentLabel = (sentiment?: 'positive' | 'neutral' | 'negative') => {
    switch (sentiment) {
      case 'positive':
        return 'Positif';
      case 'negative':
        return 'Negatif';
      default:
        return 'Netral';
    }
  };

  const getSentimentBadgeColor = (sentiment?: 'positive' | 'neutral' | 'negative') => {
    switch (sentiment) {
      case 'positive':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'negative':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-amber-100 text-amber-700 border-amber-200';
    }
  };

  return (
    <>
      <Card className={cn('border shadow-sm', className)}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              Sentimen Tamu
            </span>
            {currentSentiment && (
              <Badge 
                variant="outline" 
                className={cn('text-xs', getSentimentBadgeColor(currentSentiment.sentiment))}
              >
                {getSentimentIcon(currentSentiment.sentiment)}
                <span className="ml-1">{getSentimentLabel(currentSentiment.sentiment)}</span>
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Sentiment Display */}
          {currentSentiment ? (
            <div className={cn(
              'rounded-lg border p-4',
              getSentimentColor(currentSentiment.sentiment)
            )}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getSentimentIcon(currentSentiment.sentiment)}
                  <span className="font-medium">
                    Mood: {getSentimentLabel(currentSentiment.sentiment)}
                  </span>
                </div>
                <div className="text-sm text-slate-500">
                  Confidence: {Math.round(currentSentiment.confidence * 100)}%
                </div>
              </div>

              {/* Score Bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span>Negatif</span>
                  <span>Netral</span>
                  <span>Positif</span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full relative">
                  <div
                    className={cn(
                      'absolute top-0 h-2 w-3 rounded-full transform -translate-x-1/2',
                      currentSentiment.sentiment === 'positive' && 'bg-green-500',
                      currentSentiment.sentiment === 'neutral' && 'bg-amber-500',
                      currentSentiment.sentiment === 'negative' && 'bg-red-500'
                    )}
                    style={{
                      left: `${((currentSentiment.score + 1) / 2) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Keywords */}
              {currentSentiment.keywords.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {currentSentiment.keywords.map((kw, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {kw}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Alert & Suggestion */}
              {currentSentiment.alert && currentSentiment.suggestion && (
                <div className="flex items-start gap-2 rounded-lg bg-white p-3">
                  <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-700">{currentSentiment.suggestion}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6 text-slate-500">
              <Meh className="h-10 w-10 mx-auto mb-2 text-slate-300" />
              <p className="text-sm">Belum ada data sentimen</p>
              <p className="text-xs mt-1">Catat observasi untuk menganalisis mood tamu</p>
            </div>
          )}

          {/* AI Suggestions */}
          {suggestions.length > 0 && currentSentiment?.alert && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                Saran AI
              </h4>
              <ul className="space-y-1">
                {suggestions.map((suggestion, idx) => (
                  <li 
                    key={idx} 
                    className="text-sm text-slate-600 flex items-start gap-2 bg-amber-50 rounded-lg p-2"
                  >
                    <TrendingUp className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Quick Sentiment Buttons */}
          <div className="space-y-2">
            <p className="text-xs text-slate-500">Catat observasi cepat:</p>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Senang', behavior: 'praising', icon: Smile, color: 'bg-green-100 hover:bg-green-200 text-green-700' },
                { label: 'Biasa', behavior: 'neutral', icon: Meh, color: 'bg-amber-100 hover:bg-amber-200 text-amber-700' },
                { label: 'Mengeluh', behavior: 'complaining', icon: Frown, color: 'bg-red-100 hover:bg-red-200 text-red-700' },
              ].map((item) => (
                <Button
                  key={item.behavior}
                  variant="outline"
                  size="sm"
                  className={cn('gap-1 border-0', item.color)}
                  onClick={() => void handleQuickSentiment(item.behavior)}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <item.icon className="h-4 w-4" />
                  )}
                  {item.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Detail Observation Button */}
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => setShowDialog(true)}
          >
            <Sparkles className="h-4 w-4" />
            Catat Observasi Detail
          </Button>
        </CardContent>
      </Card>

      {/* Observation Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              Catat Observasi Tamu
            </DialogTitle>
            <DialogDescription>
              Deskripsikan mood dan interaksi tamu untuk analisis AI
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Textarea
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              placeholder="Contoh: Tamu terlihat senang setelah snorkeling, banyak tertawa dan mengambil foto. Ada 2 orang yang agak mabuk laut tapi sudah membaik."
              rows={4}
            />

            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-600">
                <strong>Tips:</strong> Deskripsikan ekspresi wajah, bahasa tubuh, komentar yang didengar, 
                dan interaksi antar tamu. AI akan menganalisis sentimen keseluruhan.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              <X className="mr-2 h-4 w-4" />
              Batal
            </Button>
            <Button
              onClick={() => void handleSubmitObservation()}
              disabled={loading || !observation.trim()}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Analisis
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

