/**
 * Package Review List Component
 * Fetches and displays reviews with load more functionality
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, MessageSquare } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ReviewCard } from '@/components/shared/review-card';
import { PackageReviewSummary } from '@/components/public/package-review-summary';
import { logger } from '@/lib/utils/logger';

type Review = {
  id: string;
  rating: number;
  review: string;
  createdAt: string;
  user: {
    name: string;
    avatarUrl: string | null;
  };
};

type ReviewSummary = {
  averageRating: number;
  totalReviews: number;
  distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
};

type PackageReviewListProps = {
  slug: string;
  initialLimit?: number;
};

export function PackageReviewList({ slug, initialLimit = 3 }: PackageReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);

  const fetchReviews = useCallback(async (currentOffset: number, isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const response = await fetch(
        `/api/public/packages/${slug}/reviews?limit=${initialLimit}&offset=${currentOffset}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch reviews');
      }

      const data = await response.json();

      if (isLoadMore) {
        setReviews((prev) => [...prev, ...data.reviews]);
      } else {
        setReviews(data.reviews);
        setSummary(data.summary);
      }

      setHasMore(data.reviews.length === initialLimit);
      setOffset(currentOffset + data.reviews.length);
    } catch (error) {
      logger.error('Failed to fetch reviews', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [slug, initialLimit]);

  useEffect(() => {
    fetchReviews(0);
  }, [fetchReviews]);

  const handleLoadMore = () => {
    fetchReviews(offset, true);
  };

  if (loading) {
    return (
      <div className="mt-6">
        <h2 className="mb-3 text-sm font-semibold">Ulasan</h2>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!summary || summary.totalReviews === 0) {
    return (
      <div className="mt-6">
        <h2 className="mb-3 text-sm font-semibold">Ulasan</h2>
        <div className="flex flex-col items-center rounded-2xl bg-muted/50 p-6 text-center">
          <MessageSquare className="mb-2 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Belum ada ulasan</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <h2 className="mb-3 text-sm font-semibold">Ulasan</h2>

      {/* Summary */}
      <PackageReviewSummary
        averageRating={summary.averageRating}
        totalReviews={summary.totalReviews}
        distribution={summary.distribution}
        className="mb-4"
      />

      {/* Review List */}
      <div className="space-y-0">
        {reviews.map((review) => (
          <ReviewCard
            key={review.id}
            rating={review.rating}
            review={review.review}
            createdAt={review.createdAt}
            user={review.user}
          />
        ))}
      </div>

      {/* Load More */}
      {hasMore && (
        <Button
          variant="outline"
          className="mt-2 w-full"
          onClick={handleLoadMore}
          disabled={loadingMore}
        >
          {loadingMore ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Memuat...
            </>
          ) : (
            'Lihat Lebih Banyak'
          )}
        </Button>
      )}
    </div>
  );
}

