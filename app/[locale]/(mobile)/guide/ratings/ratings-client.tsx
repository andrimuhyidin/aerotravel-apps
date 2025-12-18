'use client';

/**
 * Ratings Client Component
 * Menampilkan rating dan ulasan dari customer dengan summary untuk motivasi
 */

import { useQuery } from '@tanstack/react-query';
import { Minus, Star, TrendingDown, TrendingUp } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import queryKeys from '@/lib/queries/query-keys';
import { cn } from '@/lib/utils';

type Review = {
  id: string;
  bookingId: string;
  reviewerName: string;
  guideRating: number | null;
  overallRating: number;
  reviewText: string | null;
  createdAt: string;
};

type RatingsResponse = {
  reviews: Review[];
  summary: {
    averageRating: number;
    totalRatings: number;
    ratingDistribution: {
      '5': number;
      '4': number;
      '3': number;
      '2': number;
      '1': number;
    };
    recentAverageRating?: number; // Average from last 10 reviews
    trend?: 'up' | 'down' | 'stable';
  };
};

type RatingsClientProps = {
  locale: string;
};

export function RatingsClient({ locale: _locale }: RatingsClientProps) {
  const { data, isLoading, error } = useQuery<RatingsResponse>({
    queryKey: queryKeys.guide.ratings(),
    queryFn: async () => {
      const res = await fetch('/api/guide/ratings');
      if (!res.ok) {
        throw new Error('Failed to load ratings');
      }
      return (await res.json()) as RatingsResponse;
    },
    refetchInterval: 60000, // Refetch every minute
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card className="border-0 bg-gradient-to-br from-amber-50 to-amber-100/50 shadow-sm">
          <CardContent className="p-6">
            <div className="h-20 animate-pulse rounded bg-slate-200" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6 text-center text-sm text-red-600">
          Gagal memuat rating. Silakan coba lagi.
        </CardContent>
      </Card>
    );
  }

  const { reviews, summary } = data;
  const avg = summary.averageRating;
  const total = summary.totalRatings;

  return (
    <div className="space-y-4">
      {/* Rating Summary Card - Enhanced for Motivation */}
      <Card className="border-0 bg-gradient-to-br from-amber-50 via-amber-100/30 to-amber-50 shadow-sm">
        <CardContent className="p-6">
          <div className="text-center">
            {/* Main Rating */}
            <div className="mb-4 flex justify-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    'h-7 w-7',
                    i < Math.round(avg)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-slate-300',
                  )}
                />
              ))}
            </div>
            <p className="text-5xl font-bold text-amber-600">{avg.toFixed(1)}</p>
            <p className="mt-2 text-sm font-medium text-slate-600">
              Dari {total} {total === 1 ? 'ulasan' : 'ulasan'}
            </p>

            {/* Trend Indicator */}
            {summary.trend && summary.recentAverageRating && (
              <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-white/50 px-4 py-2">
                {summary.trend === 'up' ? (
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                ) : summary.trend === 'down' ? (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                ) : (
                  <Minus className="h-4 w-4 text-slate-400" />
                )}
                <span
                  className={cn(
                    'text-sm font-medium',
                    summary.trend === 'up'
                      ? 'text-emerald-700'
                      : summary.trend === 'down'
                        ? 'text-red-700'
                        : 'text-slate-600',
                  )}
                >
                  {summary.trend === 'up'
                    ? 'Meningkat'
                    : summary.trend === 'down'
                      ? 'Menurun'
                      : 'Stabil'}{' '}
                  dari {summary.recentAverageRating.toFixed(1)} (10 ulasan terakhir)
                </span>
              </div>
            )}

            {/* Motivational Message */}
            {avg >= 4.5 && (
              <div className="mt-4 rounded-lg bg-emerald-50 px-4 py-3">
                <p className="text-sm font-semibold text-emerald-800">
                  🎉 Excellent! Rating Anda sangat baik!
                </p>
                <p className="mt-1 text-xs text-emerald-700">
                  Terus pertahankan kualitas layanan Anda
                </p>
              </div>
            )}
            {avg >= 4.0 && avg < 4.5 && (
              <div className="mt-4 rounded-lg bg-blue-50 px-4 py-3">
                <p className="text-sm font-semibold text-blue-800">
                  👍 Bagus! Rating Anda baik
                </p>
                <p className="mt-1 text-xs text-blue-700">
                  Sedikit lagi untuk mencapai Excellent!
                </p>
              </div>
            )}
            {avg >= 3.0 && avg < 4.0 && (
              <div className="mt-4 rounded-lg bg-amber-50 px-4 py-3">
                <p className="text-sm font-semibold text-amber-800">
                  💪 Keep it up! Ada ruang untuk perbaikan
                </p>
                <p className="mt-1 text-xs text-amber-700">
                  Fokus pada layanan yang lebih baik untuk meningkatkan rating
                </p>
              </div>
            )}
            {avg < 3.0 && (
              <div className="mt-4 rounded-lg bg-red-50 px-4 py-3">
                <p className="text-sm font-semibold text-red-800">
                  📈 Peluang untuk berkembang
                </p>
                <p className="mt-1 text-xs text-red-700">
                  Perhatikan feedback dari customer untuk meningkatkan kualitas layanan
                </p>
              </div>
            )}
          </div>

          {/* Rating Distribution */}
          {total > 0 && (
            <div className="mt-6 space-y-2 border-t border-amber-200 pt-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-600">
                Distribusi Rating
              </p>
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = summary.ratingDistribution[String(rating) as '1' | '2' | '3' | '4' | '5'] || 0;
                const percentage = total > 0 ? (count / total) * 100 : 0;
                return (
                  <div key={rating} className="flex items-center gap-3">
                    <div className="flex w-8 items-center gap-1">
                      <span className="text-xs font-medium text-slate-700">{rating}</span>
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full bg-amber-500 transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                    <span className="w-8 text-right text-xs font-medium text-slate-600">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Star className="mb-3 h-12 w-12 text-slate-300" />
            <p className="text-sm font-medium text-slate-600">Belum ada ulasan</p>
            <p className="mt-1 text-xs text-slate-500">
              Ulasan dari customer akan muncul di sini setelah mereka memberikan rating
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-600">
              Ulasan Customer
            </h2>
            <span className="text-xs text-slate-500">{reviews.length} ulasan</span>
          </div>
          {reviews.map((review) => {
            const date = new Date(review.createdAt);
            const formattedDate = date.toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            });
            const formattedTime = date.toLocaleTimeString('id-ID', {
              hour: '2-digit',
              minute: '2-digit',
            });
            const rating = review.guideRating || review.overallRating;

            return (
              <Card key={review.id} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-900">{review.reviewerName}</p>
                        <div className="flex gap-0.5">
                          {Array.from({ length: rating }).map((_, j) => (
                            <Star
                              key={j}
                              className="h-3.5 w-3.5 fill-amber-400 text-amber-400"
                            />
                          ))}
                          {Array.from({ length: 5 - rating }).map((_, j) => (
                            <Star
                              key={j + rating}
                              className="h-3.5 w-3.5 text-slate-300"
                            />
                          ))}
                        </div>
                      </div>
                      {review.reviewText && (
                        <p className="mt-2 text-sm leading-relaxed text-slate-700">
                          {review.reviewText}
                        </p>
                      )}
                      <p className="mt-2 text-xs text-slate-500">
                        {formattedDate} pukul {formattedTime}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
