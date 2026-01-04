/**
 * Rating Breakdown Component
 * Displays rating distribution dengan bar chart
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star } from 'lucide-react';

export type RatingDistribution = {
  '5': number;
  '4': number;
  '3': number;
  '2': number;
  '1': number;
};

export type RatingBreakdownProps = {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: RatingDistribution;
  showTitle?: boolean;
  className?: string;
};

export function RatingBreakdown({
  averageRating,
  totalReviews,
  ratingDistribution,
  showTitle = true,
  className,
}: RatingBreakdownProps) {
  const getRatingPercentage = (rating: keyof RatingDistribution): number => {
    if (totalReviews === 0) return 0;
    const count = ratingDistribution[rating] || 0;
    return (count / totalReviews) * 100;
  };

  const renderStars = (count: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3 w-3 ${
              star <= count
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <Card className={className}>
      {showTitle && (
        <CardHeader>
          <CardTitle className="text-lg">Rating Breakdown</CardTitle>
        </CardHeader>
      )}
      <CardContent className="space-y-3">
        {/* Summary */}
        <div className="flex items-center justify-between pb-3 border-b">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">{averageRating.toFixed(1)}</span>
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${
                    star <= Math.round(averageRating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
          <span className="text-sm text-muted-foreground">
            {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
          </span>
        </div>

        {/* Distribution Bars */}
        <div className="space-y-2.5">
          {(['5', '4', '3', '2', '1'] as const).map((rating) => {
            const count = ratingDistribution[rating] || 0;
            const percentage = getRatingPercentage(rating);
            const ratingNum = parseInt(rating);

            return (
              <div key={rating} className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 w-20">
                  <span className="text-sm font-medium w-4">{rating}</span>
                  {renderStars(ratingNum)}
                </div>
                <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="flex items-center gap-2 w-20 justify-end">
                  <span className="text-sm text-muted-foreground w-8 text-right">
                    {count}
                  </span>
                  <span className="text-xs text-muted-foreground w-10 text-right">
                    {percentage > 0 ? `${percentage.toFixed(0)}%` : '0%'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

