'use client';

/**
 * Trip Insights Component
 * Menampilkan insights spesifik per trip dari AI Weather Insights
 */

import {
  AlertTriangle,
  Calendar,
  Clock,
  MapPin,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type TripSpecificInsight = {
  tripId: string;
  tripCode: string;
  tripDate: string;
  riskLevel: 'low' | 'medium' | 'high';
  recommendations: Array<{
    type: 'go_ahead' | 'postpone' | 'modify' | 'cancel';
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  alternativePlans?: Array<{
    title: string;
    description: string;
    conditions: string;
  }>;
  bestDepartureTime?: string;
  bestReturnTime?: string;
  equipmentNeeds?: Array<{
    item: string;
    reason: string;
    priority: 'essential' | 'recommended' | 'optional';
  }>;
  weatherComparison?: {
    currentLocation: string;
    destination: string;
  };
  tideConsiderations?: string;
};

type TripInsightsProps = {
  insights: TripSpecificInsight[];
};

const getRiskColor = (riskLevel: string) => {
  switch (riskLevel) {
    case 'low':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'medium':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'high':
      return 'bg-red-100 text-red-700 border-red-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

const getRiskLabel = (riskLevel: string) => {
  switch (riskLevel) {
    case 'low':
      return 'Rendah';
    case 'medium':
      return 'Sedang';
    case 'high':
      return 'Tinggi';
    default:
      return 'Tidak Diketahui';
  }
};

const getRecommendationTypeLabel = (type: string) => {
  switch (type) {
    case 'go_ahead':
      return 'Lanjutkan';
    case 'postpone':
      return 'Tunda';
    case 'modify':
      return 'Modifikasi';
    case 'cancel':
      return 'Batalkan';
    default:
      return type;
  }
};

const getRecommendationTypeColor = (type: string) => {
  switch (type) {
    case 'go_ahead':
      return 'bg-emerald-100 text-emerald-700';
    case 'postpone':
      return 'bg-amber-100 text-amber-700';
    case 'modify':
      return 'bg-blue-100 text-blue-700';
    case 'cancel':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-slate-100 text-slate-700';
  }
};

export function TripInsights({ insights }: TripInsightsProps) {
  if (!insights || !Array.isArray(insights) || insights.length === 0) {
    return null;
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MapPin className="h-5 w-5 text-blue-600" />
          Insight Per Trip
        </CardTitle>
        <p className="mt-1 text-sm text-slate-600">
          Rekomendasi dan peringatan spesifik untuk trip yang akan datang
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {insights.map((insight, index) => {
          if (!insight) return null;
          return (
            <div
              key={insight.tripId || `trip-${index}`}
              className="space-y-3 rounded-xl border border-slate-200 bg-white p-4"
            >
              {/* Trip Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    {insight.tripId ? (
                      <Link
                        href={`/guide/trips/${insight.tripId}`}
                        className="font-semibold text-slate-900 transition-colors hover:text-blue-600"
                      >
                        {insight.tripCode || insight.tripId}
                      </Link>
                    ) : (
                      <span className="font-semibold text-slate-900">
                        {insight.tripCode || 'Trip'}
                      </span>
                    )}
                    <Badge
                      className={cn(
                        'text-xs',
                        getRiskColor(insight.riskLevel ?? 'medium')
                      )}
                    >
                      Risiko: {getRiskLabel(insight.riskLevel ?? 'medium')}
                    </Badge>
                  </div>
                  {insight.tripDate && (
                    <div className="flex items-center gap-3 text-xs text-slate-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {(() => {
                            try {
                              return new Date(
                                insight.tripDate
                              ).toLocaleDateString('id-ID', {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short',
                              });
                            } catch {
                              return insight.tripDate;
                            }
                          })()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Weather Comparison */}
              {insight.weatherComparison && (
                <div className="rounded-lg bg-slate-50 p-3">
                  <div className="mb-1 text-xs font-medium text-slate-700">
                    Perbandingan Cuaca
                  </div>
                  <div className="space-y-1 text-xs text-slate-600">
                    {insight.weatherComparison.currentLocation && (
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-3 w-3 text-blue-600" />
                        <span>
                          Lokasi Saat Ini:{' '}
                          {insight.weatherComparison.currentLocation}
                        </span>
                      </div>
                    )}
                    {insight.weatherComparison.destination && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3 text-emerald-600" />
                        <span>
                          Destinasi: {insight.weatherComparison.destination}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Best Times */}
              {(insight.bestDepartureTime || insight.bestReturnTime) && (
                <div className="rounded-lg bg-blue-50 p-3">
                  <div className="mb-2 text-xs font-medium text-blue-900">
                    Waktu Terbaik
                  </div>
                  <div className="space-y-1 text-xs text-blue-700">
                    {insight.bestDepartureTime && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        <span>Keberangkatan: {insight.bestDepartureTime}</span>
                      </div>
                    )}
                    {insight.bestReturnTime && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        <span>Kembali: {insight.bestReturnTime}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tide Considerations */}
              {insight.tideConsiderations && (
                <div className="rounded-lg bg-cyan-50 p-3">
                  <div className="mb-1 text-xs font-medium text-cyan-900">
                    Pertimbangan Pasang Surut
                  </div>
                  <p className="text-xs text-cyan-700">
                    {insight.tideConsiderations}
                  </p>
                </div>
              )}

              {/* Recommendations */}
              {insight.recommendations &&
                Array.isArray(insight.recommendations) &&
                insight.recommendations.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-slate-700">
                      Rekomendasi
                    </div>
                    {insight.recommendations.map((rec, i) => {
                      if (!rec) return null;
                      return (
                        <div
                          key={i}
                          className="rounded-lg border border-slate-200 bg-white p-3"
                        >
                          <div className="mb-1 flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Badge
                                className={cn(
                                  'text-xs',
                                  getRecommendationTypeColor(
                                    rec.type ?? 'go_ahead'
                                  )
                                )}
                              >
                                {getRecommendationTypeLabel(
                                  rec.type ?? 'go_ahead'
                                )}
                              </Badge>
                              <span className="text-sm font-medium text-slate-900">
                                {rec.title ?? 'Rekomendasi'}
                              </span>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {rec.priority === 'high'
                                ? 'Tinggi'
                                : rec.priority === 'medium'
                                  ? 'Sedang'
                                  : 'Rendah'}
                            </Badge>
                          </div>
                          <p className="mt-1 text-xs leading-relaxed text-slate-600">
                            {rec.description ?? 'Tidak ada deskripsi'}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}

              {/* Alternative Plans */}
              {insight.alternativePlans &&
                Array.isArray(insight.alternativePlans) &&
                insight.alternativePlans.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-slate-700">
                      Rencana Alternatif
                    </div>
                    {insight.alternativePlans.map((plan, i) => {
                      if (!plan) return null;
                      return (
                        <div
                          key={i}
                          className="rounded-lg border border-amber-200 bg-amber-50 p-3"
                        >
                          <div className="mb-1 text-sm font-medium text-amber-900">
                            {plan.title ?? 'Rencana Alternatif'}
                          </div>
                          <p className="mb-1 text-xs leading-relaxed text-amber-700">
                            {plan.description ?? 'Tidak ada deskripsi'}
                          </p>
                          {plan.conditions && (
                            <p className="text-xs italic text-amber-600">
                              Kondisi: {plan.conditions}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

              {/* Equipment Needs */}
              {insight.equipmentNeeds &&
                Array.isArray(insight.equipmentNeeds) &&
                insight.equipmentNeeds.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-slate-700">
                      Kebutuhan Peralatan
                    </div>
                    <div className="space-y-1">
                      {insight.equipmentNeeds.map((eq, i) => {
                        if (!eq) return null;
                        return (
                          <div
                            key={i}
                            className="flex items-start justify-between gap-2 rounded-lg bg-slate-50 p-2"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-medium text-slate-900">
                                {eq.item ?? 'Peralatan'}
                              </div>
                              <p className="text-xs text-slate-600">
                                {eq.reason ?? 'Tidak ada alasan'}
                              </p>
                            </div>
                            <Badge
                              variant={
                                eq.priority === 'essential'
                                  ? 'destructive'
                                  : 'outline'
                              }
                              className="text-xs"
                            >
                              {eq.priority === 'essential'
                                ? 'Wajib'
                                : eq.priority === 'recommended'
                                  ? 'Disarankan'
                                  : 'Opsional'}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              {/* Warning if high risk */}
              {insight.riskLevel === 'high' && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" />
                  <div className="text-xs text-red-700">
                    <div className="mb-1 font-medium">
                      Peringatan: Risiko Tinggi
                    </div>
                    <p>
                      Pertimbangkan untuk menunda atau memodifikasi trip ini
                      berdasarkan kondisi cuaca dan pasang surut.
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
