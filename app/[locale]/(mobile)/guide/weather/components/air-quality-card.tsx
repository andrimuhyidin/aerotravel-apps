'use client';

/**
 * Air Quality Card Component
 * Menampilkan Air Quality Index dengan color coding dan health recommendations
 */

import { AlertCircle, CheckCircle2, Shield } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type AirQualityCardProps = {
  airQuality: {
    aqi: number;
    level: string;
    description: string;
  };
};

const getAQIColor = (aqi: number) => {
  switch (aqi) {
    case 1:
      return {
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        text: 'text-emerald-700',
        badge: 'bg-emerald-100 text-emerald-700',
        icon: 'text-emerald-600',
      };
    case 2:
      return {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        text: 'text-amber-700',
        badge: 'bg-amber-100 text-amber-700',
        icon: 'text-amber-600',
      };
    case 3:
      return {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        text: 'text-orange-700',
        badge: 'bg-orange-100 text-orange-700',
        icon: 'text-orange-600',
      };
    case 4:
      return {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-700',
        badge: 'bg-red-100 text-red-700',
        icon: 'text-red-600',
      };
    case 5:
      return {
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        text: 'text-purple-700',
        badge: 'bg-purple-100 text-purple-700',
        icon: 'text-purple-700',
      };
    default:
      return {
        bg: 'bg-slate-50',
        border: 'border-slate-200',
        text: 'text-slate-700',
        badge: 'bg-slate-100 text-slate-700',
        icon: 'text-slate-600',
      };
  }
};

const getHealthRecommendation = (aqi: number): string => {
  switch (aqi) {
    case 1:
      return 'Kualitas udara sangat baik. Aktivitas outdoor aman untuk semua orang.';
    case 2:
      return 'Kualitas udara dapat diterima. Orang sensitif mungkin perlu berhati-hati.';
    case 3:
      return 'Orang dengan masalah pernapasan atau jantung harus mengurangi aktivitas outdoor.';
    case 4:
      return 'Semua orang harus mengurangi aktivitas outdoor. Gunakan masker jika perlu keluar.';
    case 5:
      return 'Peringatan kesehatan: hindari aktivitas outdoor. Tetap di dalam ruangan jika memungkinkan.';
    default:
      return 'Data kualitas udara tidak tersedia.';
  }
};

export function AirQualityCard({ airQuality }: AirQualityCardProps) {
  if (!airQuality || airQuality.aqi === undefined) {
    return null;
  }

  const aqi = airQuality.aqi ?? 0;
  const colors = getAQIColor(aqi);
  const recommendation = getHealthRecommendation(aqi);

  return (
    <Card className={cn('border-0 shadow-sm', colors.bg, colors.border)}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn('flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg', colors.bg)}>
            {aqi <= 2 ? (
              <CheckCircle2 className={cn('h-5 w-5', colors.icon)} />
            ) : (
              <AlertCircle className={cn('h-5 w-5', colors.icon)} />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-slate-900">Kualitas Udara (AQI)</h3>
              <Badge className={cn('text-xs', colors.badge)}>
                {aqi}/5
              </Badge>
            </div>
            <p className={cn('text-sm font-medium mb-2', colors.text)}>
              {airQuality.level ?? 'N/A'}
            </p>
            <p className="text-xs text-slate-600 mb-2">
              {airQuality.description ?? 'Tidak ada deskripsi'}
            </p>
            <div className="mt-3 flex items-start gap-2 rounded-lg bg-white/60 p-2">
              <Shield className="h-4 w-4 flex-shrink-0 mt-0.5 text-slate-500" />
              <p className="text-xs text-slate-700 leading-relaxed">
                {recommendation}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

