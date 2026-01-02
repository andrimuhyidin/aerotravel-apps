/**
 * Equipment Predictor Card
 * AI-powered predictive maintenance alerts for equipment
 * Uses /api/guide/equipment/predictive-maintenance API
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  RefreshCw,
  Shield,
  Sparkles,
  Wrench,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/utils/logger';
import { toast } from 'sonner';

type MaintenancePrediction = {
  equipmentId: string;
  equipmentName: string;
  issueProbability: number;
  predictedIssue: string;
  recommendedAction: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  estimatedMaintenanceDate: string;
  safetyAlert: boolean;
  confidence: number;
};

type EquipmentPredictorCardProps = {
  tripId: string;
  locale?: string;
  className?: string;
};

export function EquipmentPredictorCard({
  tripId,
  locale: _locale = 'id',
  className,
}: EquipmentPredictorCardProps) {
  const [loading, setLoading] = useState(false);
  const [predictions, setPredictions] = useState<MaintenancePrediction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  const fetchPredictions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/guide/equipment/predictive-maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tripId }),
      });

      if (!res.ok) {
        throw new Error('Gagal mengambil prediksi maintenance');
      }

      const data = (await res.json()) as { predictions: MaintenancePrediction[] };
      setPredictions(data.predictions || []);
    } catch (err) {
      logger.error('Failed to fetch equipment predictions', err, { tripId });
      setError(err instanceof Error ? err.message : 'Gagal mengambil prediksi');
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    void fetchPredictions();
  }, [fetchPredictions]);

  const getUrgencyColor = (urgency: MaintenancePrediction['urgency']) => {
    switch (urgency) {
      case 'critical':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      default:
        return 'bg-green-100 text-green-700 border-green-200';
    }
  };

  const getUrgencyLabel = (urgency: MaintenancePrediction['urgency']) => {
    switch (urgency) {
      case 'critical':
        return 'Kritis';
      case 'high':
        return 'Tinggi';
      case 'medium':
        return 'Sedang';
      default:
        return 'Rendah';
    }
  };

  const getProbabilityColor = (probability: number) => {
    if (probability >= 80) return 'text-red-600';
    if (probability >= 60) return 'text-orange-600';
    if (probability >= 40) return 'text-amber-600';
    return 'text-green-600';
  };

  const getProgressColor = (probability: number) => {
    if (probability >= 80) return 'bg-red-500';
    if (probability >= 60) return 'bg-orange-500';
    if (probability >= 40) return 'bg-amber-500';
    return 'bg-green-500';
  };

  const criticalCount = predictions.filter(p => p.urgency === 'critical').length;
  const highCount = predictions.filter(p => p.urgency === 'high').length;
  const safetyAlertCount = predictions.filter(p => p.safetyAlert).length;

  // Don't show if no predictions
  if (!loading && predictions.length === 0 && !error) {
    return null;
  }

  return (
    <Card className={cn('border shadow-sm', className)}>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CardHeader className="pb-3">
          <CollapsibleTrigger asChild>
            <button className="flex w-full items-center justify-between text-left">
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-5 w-5 text-purple-500" />
                Prediksi Maintenance
              </CardTitle>
              <div className="flex items-center gap-2">
                {/* Summary Badges */}
                {criticalCount > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {criticalCount} Kritis
                  </Badge>
                )}
                {highCount > 0 && (
                  <Badge className="bg-orange-100 text-orange-700 text-xs">
                    {highCount} Tinggi
                  </Badge>
                )}
                {safetyAlertCount > 0 && (
                  <Badge className="bg-red-100 text-red-700 text-xs">
                    <Shield className="mr-1 h-3 w-3" />
                    {safetyAlertCount} Safety
                  </Badge>
                )}
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5 text-slate-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-slate-400" />
                )}
              </div>
            </button>
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-0">
            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
                <span className="ml-2 text-sm text-slate-500">Menganalisis...</span>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="rounded-lg bg-red-50 p-4 text-center">
                <p className="text-sm text-red-600 mb-2">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void fetchPredictions()}
                  className="gap-1"
                >
                  <RefreshCw className="h-4 w-4" />
                  Coba Lagi
                </Button>
              </div>
            )}

            {/* Predictions List */}
            {!loading && !error && predictions.length > 0 && (
              <div className="space-y-3">
                {/* All Clear Message */}
                {predictions.every(p => p.urgency === 'low') && (
                  <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span className="text-sm text-green-700">
                      Semua peralatan dalam kondisi baik!
                    </span>
                  </div>
                )}

                {/* Prediction Cards */}
                {predictions.map((prediction) => (
                  <div
                    key={prediction.equipmentId}
                    className={cn(
                      'rounded-lg border p-3',
                      prediction.safetyAlert && 'border-red-300 bg-red-50',
                      !prediction.safetyAlert && 'border-slate-200 bg-slate-50'
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {prediction.safetyAlert ? (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        ) : (
                          <Tool className="h-4 w-4 text-slate-500" />
                        )}
                        <span className="font-medium text-sm">
                          {prediction.equipmentName}
                        </span>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={cn('text-xs', getUrgencyColor(prediction.urgency))}
                      >
                        {getUrgencyLabel(prediction.urgency)}
                      </Badge>
                    </div>

                    {/* Issue Probability */}
                    <div className="mb-2">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-500">Risiko Masalah</span>
                        <span className={cn('font-medium', getProbabilityColor(prediction.issueProbability))}>
                          {prediction.issueProbability}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className={cn('h-full rounded-full', getProgressColor(prediction.issueProbability))}
                          style={{ width: `${prediction.issueProbability}%` }}
                        />
                      </div>
                    </div>

                    {/* Predicted Issue */}
                    <p className="text-xs text-slate-600 mb-2">
                      <strong>Prediksi:</strong> {prediction.predictedIssue}
                    </p>

                    {/* Recommended Action */}
                    <div className="flex items-start gap-2 rounded bg-white p-2">
                      <Wrench className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-slate-700">
                          {prediction.recommendedAction}
                        </p>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                          <Calendar className="h-3 w-3" />
                          Target: {new Date(prediction.estimatedMaintenanceDate).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Confidence */}
                    <div className="mt-2 text-right">
                      <span className="text-[10px] text-slate-400">
                        Confidence: {Math.round(prediction.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                ))}

                {/* Refresh Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void fetchPredictions()}
                  className="w-full gap-1"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Refresh Prediksi
                </Button>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && predictions.length === 0 && (
              <div className="text-center py-6">
                <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-900">
                  Tidak ada prediksi maintenance
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Semua peralatan dalam kondisi optimal
                </p>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

