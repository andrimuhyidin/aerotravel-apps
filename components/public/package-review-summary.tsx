/**
 * Package Review Summary Component
 * Displays average rating, total reviews, and rating distribution
 */

'use client';

import { Star } from 'lucide-react';

import { cn } from '@/lib/utils';

type RatingDistribution = {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
};

type PackageReviewSummaryProps = {
  averageRating: number;
  totalReviews: number;
  distribution: RatingDistribution;
  className?: string;
};

export function PackageReviewSummary({
  averageRating,
  totalReviews,
  distribution,
  className,
}: PackageReviewSummaryProps) {
  const maxCount = Math.max(...Object.values(distribution), 1);

  return (
    <div className={cn('rounded-2xl bg-muted/50 p-4', className)}>
      <div className="flex gap-6">
        {/* Left: Average Rating */}
        <div className="flex flex-col items-center justify-center">
          <span className="text-4xl font-bold">{averageRating.toFixed(1)}</span>
          <div className="mt-1 flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={cn(
                  'h-4 w-4',
                  star <= Math.round(averageRating)
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-gray-300'
                )}
              />
            ))}
          </div>
          <span className="mt-1 text-xs text-muted-foreground">
            {totalReviews} ulasan
          </span>
        </div>

        {/* Right: Distribution Bars */}
        <div className="flex flex-1 flex-col justify-center gap-1.5">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = distribution[rating as keyof RatingDistribution];
            const percentage = (count / maxCount) * 100;

            return (
              <div key={rating} className="flex items-center gap-2">
                <span className="w-3 text-xs text-muted-foreground">{rating}</span>
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full rounded-full bg-amber-400 transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-6 text-right text-xs text-muted-foreground">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

