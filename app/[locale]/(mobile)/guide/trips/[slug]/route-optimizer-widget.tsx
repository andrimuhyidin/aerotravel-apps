/**
 * Route Optimizer Widget
 * AI-powered route optimization for trip itinerary
 * Uses /api/guide/route-optimization/ai API
 */

'use client';

import { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  Route,
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/utils/logger';
import { toast } from 'sonner';

type Suggestion = {
  type: 'reorder' | 'skip' | 'combine' | 'alternative';
  item: string;
  reason: string;
  impact: string;
};

type AlternativeRoute = {
  name: string;
  description: string;
  duration: number;
  advantages: string[];
  disadvantages: string[];
};

type OptimizationResult = {
  optimized: boolean;
  originalDuration: number;
  optimizedDuration: number;
  timeSaved: number;
  suggestions: Suggestion[];
  alternativeRoutes?: AlternativeRoute[];
};

type RouteOptimizerWidgetProps = {
  tripId: string;
  locale?: string;
  className?: string;
};

export function RouteOptimizerWidget({
  tripId,
  locale: _locale = 'id',
  className,
}: RouteOptimizerWidgetProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  const handleOptimize = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/guide/route-optimization/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tripId }),
      });

      if (!res.ok) {
        const errorData = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(errorData.error || 'Gagal mengoptimasi rute');
      }

      const data = (await res.json()) as OptimizationResult;
      setResult(data);
      setShowDialog(true);

      if (data.optimized && data.timeSaved > 0) {
        toast.success(`Optimasi berhasil! Hemat ${data.timeSaved} menit`);
      }
    } catch (error) {
      logger.error('Failed to optimize route', error, { tripId });
      const errorMessage = error instanceof Error ? error.message : 'Gagal mengoptimasi rute';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getSuggestionIcon = (type: Suggestion['type']) => {
    switch (type) {
      case 'reorder':
        return <ArrowRight className="h-4 w-4" />;
      case 'skip':
        return <X className="h-4 w-4" />;
      case 'combine':
        return <TrendingUp className="h-4 w-4" />;
      case 'alternative':
        return <MapPin className="h-4 w-4" />;
    }
  };

  const getSuggestionColor = (type: Suggestion['type']) => {
    switch (type) {
      case 'reorder':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'skip':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'combine':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'alternative':
        return 'bg-purple-100 text-purple-700 border-purple-200';
    }
  };

  const getSuggestionLabel = (type: Suggestion['type']) => {
    switch (type) {
      case 'reorder':
        return 'Urutan';
      case 'skip':
        return 'Lewati';
      case 'combine':
        return 'Gabung';
      case 'alternative':
        return 'Alternatif';
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}j ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className={cn('gap-2', className)}
        onClick={handleOptimize}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4 text-amber-500" />
        )}
        {loading ? 'Menganalisis...' : 'Optimasi AI'}
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Route className="h-5 w-5 text-emerald-600" />
              Hasil Optimasi Rute
            </DialogTitle>
            <DialogDescription>
              Rekomendasi AI untuk mengoptimalkan itinerary trip Anda
            </DialogDescription>
          </DialogHeader>

          {result && (
            <ScrollArea className="max-h-[60vh] pr-4">
              <div className="space-y-4">
                {/* Summary Card */}
                <Card className={cn(
                  'border-2',
                  result.optimized && result.timeSaved > 0
                    ? 'border-emerald-200 bg-emerald-50'
                    : 'border-slate-200 bg-slate-50'
                )}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {result.optimized && result.timeSaved > 0 ? (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                          </div>
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                            <AlertCircle className="h-5 w-5 text-slate-500" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-slate-900">
                            {result.optimized && result.timeSaved > 0
                              ? 'Rute dapat dioptimasi!'
                              : 'Rute sudah optimal'}
                          </p>
                          <p className="text-sm text-slate-600">
                            {result.suggestions.length} saran perbaikan
                          </p>
                        </div>
                      </div>
                      {result.timeSaved > 0 && (
                        <div className="text-right">
                          <p className="text-2xl font-bold text-emerald-600">
                            -{formatDuration(result.timeSaved)}
                          </p>
                          <p className="text-xs text-slate-500">waktu dihemat</p>
                        </div>
                      )}
                    </div>

                    {/* Duration Comparison */}
                    <div className="mt-4 flex items-center gap-3 rounded-lg bg-white p-3">
                      <div className="flex-1 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Clock className="h-4 w-4 text-slate-400" />
                          <span className="text-lg font-semibold text-slate-700">
                            {formatDuration(result.originalDuration)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">Durasi Awal</p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-slate-300" />
                      <div className="flex-1 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Clock className="h-4 w-4 text-emerald-500" />
                          <span className="text-lg font-semibold text-emerald-600">
                            {formatDuration(result.optimizedDuration)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">Durasi Optimal</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Suggestions */}
                {result.suggestions.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-slate-900">Saran Optimasi</h3>
                    {result.suggestions.map((suggestion, idx) => (
                      <Card key={idx} className="border shadow-sm">
                        <CardContent className="p-3">
                          <div className="flex items-start gap-3">
                            <div className={cn(
                              'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg',
                              getSuggestionColor(suggestion.type)
                            )}>
                              {getSuggestionIcon(suggestion.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className={cn('text-xs', getSuggestionColor(suggestion.type))}>
                                  {getSuggestionLabel(suggestion.type)}
                                </Badge>
                                <span className="font-medium text-slate-900 truncate">
                                  {suggestion.item}
                                </span>
                              </div>
                              <p className="text-sm text-slate-600 mb-1">
                                {suggestion.reason}
                              </p>
                              <p className="text-xs text-slate-500 flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" />
                                {suggestion.impact}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Alternative Routes */}
                {result.alternativeRoutes && result.alternativeRoutes.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-slate-900">Rute Alternatif</h3>
                    {result.alternativeRoutes.map((route, idx) => (
                      <Card key={idx} className="border shadow-sm">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center justify-between">
                            <span className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-purple-500" />
                              {route.name}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {formatDuration(route.duration)}
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <p className="text-sm text-slate-600 mb-3">
                            {route.description}
                          </p>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-xs font-medium text-green-700 mb-1">Keuntungan</p>
                              <ul className="space-y-1">
                                {route.advantages.map((adv, i) => (
                                  <li key={i} className="text-xs text-slate-600 flex items-start gap-1">
                                    <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                                    {adv}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-red-700 mb-1">Kekurangan</p>
                              <ul className="space-y-1">
                                {route.disadvantages.map((dis, i) => (
                                  <li key={i} className="text-xs text-slate-600 flex items-start gap-1">
                                    <X className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
                                    {dis}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Empty State */}
                {result.suggestions.length === 0 && !result.alternativeRoutes?.length && (
                  <div className="text-center py-6">
                    <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
                    <p className="font-medium text-slate-900">Rute Anda sudah optimal!</p>
                    <p className="text-sm text-slate-500 mt-1">
                      Tidak ada saran perbaikan yang diperlukan
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Tutup
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

