'use client';

/**
 * Insight Widget Component
 * Menampilkan summary insight yang bisa diklik untuk membuka halaman insights lengkap
 * Mirip dengan GuideBadges widget
 */

import { BarChart3, ChevronRight, Star } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/loading-state';
import { useGuideStats } from '@/hooks/use-guide-common';

type InsightWidgetProps = {
  locale: string;
};

export function InsightWidget({ locale: _locale }: InsightWidgetProps) {
  const { data: stats, isLoading: statsLoading } = useGuideStats();

  const displayRating = stats?.averageRating ? stats.averageRating.toFixed(1) : '0.0';
  const totalRatings = stats?.totalRatings ?? 0;
  const totalTrips = stats?.totalTrips ?? 0;

  if (statsLoading) {
    return (
      <Card className="border-0 bg-gradient-to-br from-purple-50 to-purple-100/50 shadow-sm">
        <CardContent className="p-4">
          <LoadingState variant="skeleton" lines={2} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 bg-gradient-to-br from-purple-50 to-purple-100/50 shadow-sm transition-all hover:shadow-md active:scale-[0.99] cursor-pointer group">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/20 backdrop-blur-sm">
              <BarChart3 className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-purple-700/80">Insight</p>
              <div className="mt-1 flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-purple-400 text-purple-400" />
                  <span className="text-lg font-bold text-purple-700">{displayRating}</span>
                </div>
                {totalRatings > 0 && (
                  <span className="text-xs text-purple-600/70">
                    ({totalRatings} ulasan)
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-[10px] text-purple-600/70">
                {totalTrips} trip selesai
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-purple-600/60 transition-transform group-hover:translate-x-0.5" />
        </div>
      </CardContent>
    </Card>
  );
}
