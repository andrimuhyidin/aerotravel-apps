/**
 * API: Package Reviews
 * GET /api/partner/packages/[id]/reviews - Get reviews with stats
 */

import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const sort = searchParams.get('sort') || 'recent'; // recent, highest, helpful
  const rating = searchParams.get('rating'); // filter by specific rating
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');

  const { id: packageId } = await params;

  try {
    // For now, return mock data since package_reviews table might not exist yet
    // TODO: Replace with actual database query when table is created

    const mockReviews = [
      {
        id: '1',
        reviewer_name: 'Budi Santoso',
        overall_rating: 5,
        review_text: 'Pengalaman yang luar biasa! Tour guide sangat ramah dan profesional. Destinasi yang dikunjungi sangat menarik dan sesuai dengan itinerary. Highly recommended!',
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        trip_date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        helpful_count: 12,
      },
      {
        id: '2',
        reviewer_name: 'Siti Aminah',
        overall_rating: 4,
        review_text: 'Paket wisata yang bagus dengan harga yang reasonable. Akomodasi dan makanan memuaskan. Hanya saja waktu di beberapa tempat wisata terlalu singkat.',
        created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        trip_date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        helpful_count: 8,
      },
      {
        id: '3',
        reviewer_name: 'Ahmad Rizki',
        overall_rating: 5,
        review_text: 'Pelayanan excellent! Transport nyaman, hotel bersih, dan guide sangat informatif. Perjalanan menjadi sangat memorable. Terima kasih!',
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        trip_date: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
        helpful_count: 15,
      },
    ];

    // Calculate stats
    const totalReviews = mockReviews.length;
    const ratingSum = mockReviews.reduce((sum, r) => sum + r.overall_rating, 0);
    const averageRating = totalReviews > 0 ? ratingSum / totalReviews : 0;

    const ratingBreakdown = {
      '5': mockReviews.filter(r => r.overall_rating === 5).length,
      '4': mockReviews.filter(r => r.overall_rating === 4).length,
      '3': mockReviews.filter(r => r.overall_rating === 3).length,
      '2': mockReviews.filter(r => r.overall_rating === 2).length,
      '1': mockReviews.filter(r => r.overall_rating === 1).length,
    };

    // Filter by rating if specified
    let filteredReviews = mockReviews;
    if (rating) {
      filteredReviews = mockReviews.filter(r => r.overall_rating === parseInt(rating));
    }

    // Sort reviews
    switch (sort) {
      case 'highest':
        filteredReviews.sort((a, b) => b.overall_rating - a.overall_rating);
        break;
      case 'helpful':
        filteredReviews.sort((a, b) => b.helpful_count - a.helpful_count);
        break;
      case 'recent':
      default:
        filteredReviews.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        break;
    }

    // Pagination
    const offset = (page - 1) * limit;
    const paginatedReviews = filteredReviews.slice(offset, offset + limit);

    return NextResponse.json({
      reviews: paginatedReviews,
      stats: {
        averageRating,
        totalReviews,
        ratingBreakdown,
      },
      pagination: {
        page,
        limit,
        total: filteredReviews.length,
        totalPages: Math.ceil(filteredReviews.length / limit),
      },
    });
  } catch (error) {
    logger.error('Failed to fetch reviews', error, { packageId });
    throw error;
  }
});

