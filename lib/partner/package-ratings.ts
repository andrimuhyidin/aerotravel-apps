/**
 * Package Ratings Utility
 * Functions to aggregate ratings and reviews for packages
 */

export type PackageRatings = {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    '5': number;
    '4': number;
    '3': number;
    '2': number;
    '1': number;
  };
};

export type PackageReview = {
  id: string;
  bookingId: string;
  reviewerName: string;
  overallRating: number;
  guideRating: number | null;
  facilityRating: number | null;
  valueRating: number | null;
  reviewText: string | null;
  createdAt: string;
};

/**
 * Aggregate ratings for a single package
 */
export function aggregatePackageRatings(
  reviews: Array<{
    overall_rating: number;
  }>
): PackageRatings {
  if (!reviews || reviews.length === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: {
        '5': 0,
        '4': 0,
        '3': 0,
        '2': 0,
        '1': 0,
      },
    };
  }

  const ratings = reviews
    .map((r) => r.overall_rating)
    .filter((r): r is number => r !== null && r >= 1 && r <= 5);

  const totalReviews = ratings.length;
  const averageRating =
    totalReviews > 0
      ? ratings.reduce((sum, rating) => sum + rating, 0) / totalReviews
      : 0;

  const distribution = {
    '5': ratings.filter((r) => r === 5).length,
    '4': ratings.filter((r) => r === 4).length,
    '3': ratings.filter((r) => r === 3).length,
    '2': ratings.filter((r) => r === 2).length,
    '1': ratings.filter((r) => r === 1).length,
  };

  return {
    averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
    totalReviews,
    ratingDistribution: distribution,
  };
}

/**
 * Fetch ratings for multiple packages in batch
 * Returns a map of packageId -> PackageRatings
 */
export async function fetchPackageRatingsBatch(
  client: any,
  packageIds: string[]
): Promise<Record<string, PackageRatings>> {
  if (!packageIds || packageIds.length === 0) {
    return {};
  }

  try {
    // Get bookings for these packages
    const { data: bookings, error: bookingsError } = await client
      .from('bookings')
      .select('id, package_id')
      .in('package_id', packageIds)
      .in('status', ['confirmed', 'paid', 'ongoing', 'completed']);

    if (bookingsError || !bookings) {
      return {};
    }

    const bookingIds = bookings.map((b: { id: string }) => b.id);

    if (bookingIds.length === 0) {
      return {};
    }

    // Get reviews for these bookings
    const { data: reviews, error: reviewsError } = await client
      .from('reviews')
      .select('id, booking_id, overall_rating')
      .in('booking_id', bookingIds)
      .eq('is_published', true)
      .not('overall_rating', 'is', null);

    if (reviewsError || !reviews) {
      return {};
    }

    // Group reviews by package_id
    const packageBookingsMap = new Map<string, string[]>();
    bookings.forEach((booking: { id: string; package_id: string }) => {
      const existing = packageBookingsMap.get(booking.package_id) || [];
      existing.push(booking.id);
      packageBookingsMap.set(booking.package_id, existing);
    });

    const result: Record<string, PackageRatings> = {};

    packageIds.forEach((packageId) => {
      const bookingIdsForPackage = packageBookingsMap.get(packageId) || [];
      const reviewsForPackage = reviews.filter((r: { booking_id: string }) =>
        bookingIdsForPackage.includes(r.booking_id)
      );

      result[packageId] = aggregatePackageRatings(reviewsForPackage);
    });

    return result;
  } catch (error) {
    // Return empty map on error
    return {};
  }
}

/**
 * Fetch full reviews list for a single package
 */
export async function fetchPackageReviews(
  client: any,
  packageId: string
): Promise<{
  reviews: PackageReview[];
  ratings: PackageRatings;
}> {
  try {
    // Get bookings for this package
    const { data: bookings, error: bookingsError } = await client
      .from('bookings')
      .select('id')
      .eq('package_id', packageId)
      .in('status', ['confirmed', 'paid', 'ongoing', 'completed']);

    if (bookingsError || !bookings || bookings.length === 0) {
      return {
        reviews: [],
        ratings: {
          averageRating: 0,
          totalReviews: 0,
          ratingDistribution: {
            '5': 0,
            '4': 0,
            '3': 0,
            '2': 0,
            '1': 0,
          },
        },
      };
    }

    const bookingIds = bookings.map((b: { id: string }) => b.id);

    // Get reviews for these bookings
    const { data: reviews, error: reviewsError } = await client
      .from('reviews')
      .select(
        'id, booking_id, reviewer_name, overall_rating, guide_rating, facility_rating, value_rating, review_text, created_at'
      )
      .in('booking_id', bookingIds)
      .eq('is_published', true)
      .not('overall_rating', 'is', null)
      .order('created_at', { ascending: false });

    if (reviewsError || !reviews) {
      return {
        reviews: [],
        ratings: {
          averageRating: 0,
          totalReviews: 0,
          ratingDistribution: {
            '5': 0,
            '4': 0,
            '3': 0,
            '2': 0,
            '1': 0,
          },
        },
      };
    }

    const packageReviews: PackageReview[] = reviews.map(
      (r: {
        id: string;
        booking_id: string;
        reviewer_name: string;
        overall_rating: number;
        guide_rating: number | null;
        facility_rating: number | null;
        value_rating: number | null;
        review_text: string | null;
        created_at: string;
      }) => ({
        id: r.id,
        bookingId: r.booking_id,
        reviewerName: r.reviewer_name,
        overallRating: r.overall_rating,
        guideRating: r.guide_rating,
        facilityRating: r.facility_rating,
        valueRating: r.value_rating,
        reviewText: r.review_text,
        createdAt: r.created_at,
      })
    );

    const ratings = aggregatePackageRatings(reviews);

    return {
      reviews: packageReviews,
      ratings,
    };
  } catch (error) {
    return {
      reviews: [],
      ratings: {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: {
          '5': 0,
          '4': 0,
          '3': 0,
          '2': 0,
          '1': 0,
        },
      },
    };
  }
}

