/**
 * Public Package Reviews API
 * GET /api/public/packages/[slug]/reviews - Get reviews for a package
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

type RouteParams = {
  params: Promise<{ slug: string }>;
};

export const GET = withErrorHandler(async (request: NextRequest, context: RouteParams) => {
  const { slug } = await context.params;
  const searchParams = request.nextUrl.searchParams;
  const limit = parseInt(searchParams.get('limit') || '10');
  const offset = parseInt(searchParams.get('offset') || '0');

  logger.info('GET /api/public/packages/[slug]/reviews', { slug, limit, offset });

  const supabase = await createClient();

  // Get package ID from slug
  const { data: pkg } = await supabase
    .from('packages')
    .select('id')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (!pkg) {
    return NextResponse.json(
      { error: 'Package not found' },
      { status: 404 }
    );
  }

  // Get reviews with user info
  const { data: reviews, error } = await supabase
    .from('package_reviews')
    .select(`
      id,
      rating,
      review,
      created_at,
      users (
        id,
        full_name,
        avatar_url
      )
    `)
    .eq('package_id', pkg.id)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    logger.error('Failed to fetch reviews', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }

  // Get rating distribution
  const { data: distribution } = await supabase
    .from('package_reviews')
    .select('rating')
    .eq('package_id', pkg.id)
    .eq('status', 'published');

  const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  (distribution || []).forEach((r) => {
    if (r.rating >= 1 && r.rating <= 5) {
      ratingCounts[r.rating as 1 | 2 | 3 | 4 | 5]++;
    }
  });

  // Transform reviews
  const transformedReviews = (reviews || []).map((r) => {
    const user = r.users as { id: string; full_name: string; avatar_url: string | null } | null;
    return {
      id: r.id,
      rating: r.rating,
      review: r.review,
      createdAt: r.created_at,
      user: user ? {
        name: user.full_name || 'Traveler',
        avatarUrl: user.avatar_url,
      } : {
        name: 'Traveler',
        avatarUrl: null,
      },
    };
  });

  return NextResponse.json({
    reviews: transformedReviews,
    summary: {
      averageRating: pkg.average_rating || 0,
      totalReviews: pkg.review_count || 0,
      distribution: ratingCounts,
    },
  });
});

