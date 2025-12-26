/**
 * Rating Display Component
 * Reusable component untuk menampilkan rating dengan stars dan count
 */

'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export type RatingDisplayProps = {
  rating: number;
  totalReviews: number;
  showCount?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

export function RatingDisplay({
  rating,
  totalReviews,
  showCount = true,
  size = 'md',
  className,
}: RatingDisplayProps) {
  const sizeClasses = {
    sm: {
      star: 'h-3 w-3',
      text: 'text-xs',
      number: 'text-sm',
    },
    md: {
      star: 'h-4 w-4',
      text: 'text-sm',
      number: 'text-base',
    },
    lg: {
      star: 'h-5 w-5',
      text: 'text-base',
      number: 'text-lg',
    },
  };

  const sizes = sizeClasses[size];
  const roundedRating = Math.round(rating * 10) / 10; // Round to 1 decimal

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              sizes.star,
              star <= Math.round(rating)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            )}
          />
        ))}
      </div>
      <span className={cn('font-semibold text-foreground', sizes.number)}>
        {roundedRating.toFixed(1)}
      </span>
      {showCount && totalReviews > 0 && (
        <span className={cn('text-muted-foreground', sizes.text)}>
          ({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})
        </span>
      )}
      {showCount && totalReviews === 0 && (
        <span className={cn('text-muted-foreground', sizes.text)}>
          No ratings yet
        </span>
      )}
    </div>
  );
}

