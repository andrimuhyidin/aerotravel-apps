/**
 * Public Packages API
 * GET /api/public/packages - Get list of published packages
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = parseInt(searchParams.get('offset') || '0');
  const destination = searchParams.get('destination');
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');

  logger.info('GET /api/public/packages', { limit, offset, destination });

  const supabase = await createClient();

  let query = supabase
    .from('packages')
    .select(`
      id,
      slug,
      name,
      destination,
      province,
      description,
      duration_days,
      duration_nights,
      min_pax,
      max_pax,
      inclusions,
      exclusions,
      created_at,
      package_prices (
        min_pax,
        max_pax,
        price_publish,
        price_nta
      )
    `)
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (destination) {
    query = query.ilike('destination', `%${destination}%`);
  }

  const { data: packages, error } = await query.range(offset, offset + limit - 1);

  if (error) {
    logger.error('Failed to fetch packages', error);
    return NextResponse.json(
      { error: 'Failed to fetch packages' },
      { status: 500 }
    );
  }

  if (!packages || packages.length === 0) {
    return NextResponse.json({ packages: [], total: 0 });
  }

  // Get rating stats for all packages
  const packageIds = packages.map(p => p.id);
  const { data: ratingStats } = await supabase
    .from('package_rating_stats' as any)
    .select('package_id, average_rating, total_reviews')
    .in('package_id', packageIds);

  // Create rating map
  const ratingMap = new Map<string, { rating: number; reviews: number }>();
  if (ratingStats && Array.isArray(ratingStats)) {
    (ratingStats as unknown as Array<{ package_id: string; average_rating: number | null; total_reviews: number | null }>).forEach(rs => {
      if (rs && rs.package_id) {
        ratingMap.set(rs.package_id, {
          rating: rs.average_rating || 0,
          reviews: rs.total_reviews || 0,
        });
      }
    });
  }

  // Transform data
  const transformedPackages = (packages || []).map((pkg) => {
    const prices = pkg.package_prices || [];
    const lowestPrice = prices[0];
    const adultPrice = lowestPrice?.price_publish || 0;
    const stats = ratingMap.get(pkg.id) || { rating: 0, reviews: 0 };

    return {
      id: pkg.id,
      slug: pkg.slug,
      name: pkg.name,
      destination: pkg.destination,
      province: pkg.province,
      description: pkg.description,
      duration: {
        days: pkg.duration_days,
        nights: pkg.duration_nights,
        label: `${pkg.duration_days}D${pkg.duration_nights}N`,
      },
      minPax: pkg.min_pax,
      maxPax: pkg.max_pax,
      rating: stats.rating,
      reviewCount: stats.reviews,
      price: adultPrice,
      inclusions: pkg.inclusions || [],
      exclusions: pkg.exclusions || [],
      pricing: {
        // Adult price from price_publish
        adultPrice: adultPrice,
        // Child price is typically 50-75% of adult price
        childPrice: Math.round(adultPrice * 0.75),
        // Infant price is typically free or minimal
        infantPrice: 0,
      },
    };
  });

  // Apply price filters after transformation
  let filteredPackages = transformedPackages;
  if (minPrice) {
    filteredPackages = filteredPackages.filter(
      (p) => p.pricing.adultPrice >= parseInt(minPrice)
    );
  }
  if (maxPrice) {
    filteredPackages = filteredPackages.filter(
      (p) => p.pricing.adultPrice <= parseInt(maxPrice)
    );
  }

  return NextResponse.json({
    packages: filteredPackages,
    total: filteredPackages.length,
  });
});

