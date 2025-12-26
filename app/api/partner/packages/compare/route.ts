/**
 * API: Package Comparison
 * GET /api/partner/packages/compare?ids=id1,id2,id3
 * Returns detailed data for selected packages for comparison
 */

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext } from '@/lib/branch/branch-injection';
import { getPackageAvailabilityBatch } from '@/lib/partner/package-availability';
import { fetchPackageRatingsBatch } from '@/lib/partner/package-ratings';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import { NextRequest, NextResponse } from 'next/server';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  const { searchParams } = new URL(request.url);
  const idsParam = searchParams.get('ids');

  if (!idsParam) {
    return NextResponse.json(
      { error: 'Package IDs required' },
      { status: 400 }
    );
  }

  const packageIds = idsParam.split(',').filter((id) => id.trim());

  if (packageIds.length === 0 || packageIds.length > 3) {
    return NextResponse.json(
      { error: 'Please select 1-3 packages to compare' },
      { status: 400 }
    );
  }

  try {
    // Fetch packages with full details
    let packagesQuery = client
      .from('packages')
      .select(
        `
        id,
        name,
        description,
        destination,
        province,
        duration_days,
        duration_nights,
        min_pax,
        max_pax,
        package_type,
        inclusions,
        exclusions,
        thumbnail_url,
        gallery_urls,
        meeting_point,
        package_prices(
          min_pax,
          max_pax,
          price_publish,
          price_nta
        )
      `
      )
      .in('id', packageIds)
      .eq('is_active', true);

    // Filter by branch (unless super admin)
    if (!branchContext.isSuperAdmin && branchContext.branchId) {
      packagesQuery = packagesQuery.eq('branch_id', branchContext.branchId);
    }

    const { data: packages, error: packagesError } = await packagesQuery;

    if (packagesError) {
      logger.error('Failed to fetch packages for comparison', packagesError, {
        userId: user.id,
        packageIds,
      });
      throw packagesError;
    }

    if (!packages || packages.length === 0) {
      return NextResponse.json(
        { error: 'No packages found' },
        { status: 404 }
      );
    }

    // Fetch ratings
    const ratingsMap = await fetchPackageRatingsBatch(client, packageIds);

    // Fetch availability
    const availabilityMap = await getPackageAvailabilityBatch(client, packageIds, 30);

    // Fetch popularity
    let popularityMap: Record<string, {
      booking_count: number;
      total_revenue: number;
      popularity_score: number;
    }> = {};

    try {
      const { data: popularityData } = await (client as any)
        .from('package_popularity')
        .select('package_id, booking_count, total_revenue, popularity_score')
        .in('package_id', packageIds);

      if (popularityData) {
        popularityData.forEach((pop: any) => {
          popularityMap[pop.package_id] = {
            booking_count: pop.booking_count || 0,
            total_revenue: pop.total_revenue || 0,
            popularity_score: pop.popularity_score || 0,
          };
        });
      }
    } catch (popularityError) {
      logger.warn('Failed to fetch popularity for comparison', {
        error: popularityError instanceof Error ? popularityError.message : String(popularityError),
      });
    }

    // Transform packages for comparison
    const comparisonData = packages.map((pkg: any) => {
      const prices = pkg.package_prices || [];
      const basePriceTier = prices.find((p: any) => p.min_pax === 1) || prices[0] || null;

      const allNTAPrices = prices.map((p: any) => Number(p.price_nta));
      const minNTAPrice = allNTAPrices.length > 0 ? Math.min(...allNTAPrices) : 0;
      const maxNTAPrice = allNTAPrices.length > 0 ? Math.max(...allNTAPrices) : 0;

      const margin = basePriceTier
        ? Number(basePriceTier.price_publish) - Number(basePriceTier.price_nta)
        : 0;

      const popularity = popularityMap[pkg.id] || {
        booking_count: 0,
        total_revenue: 0,
        popularity_score: 0,
      };

      const ratings = ratingsMap[pkg.id] || {
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

      const availability = availabilityMap[pkg.id] || {
        status: 'sold_out' as const,
        nextAvailableDate: null,
        availableDatesCount: 0,
      };

      return {
        id: pkg.id,
        name: pkg.name,
        description: pkg.description,
        destination: pkg.destination,
        province: pkg.province,
        durationDays: pkg.duration_days,
        durationNights: pkg.duration_nights,
        minPax: pkg.min_pax,
        maxPax: pkg.max_pax,
        packageType: pkg.package_type,
        inclusions: pkg.inclusions || [],
        exclusions: pkg.exclusions || [],
        thumbnailUrl: pkg.thumbnail_url,
        meetingPoint: pkg.meeting_point,
        pricing: {
          minNTA: minNTAPrice,
          maxNTA: maxNTAPrice,
          margin,
          tiers: prices.map((p: any) => ({
            minPax: p.min_pax,
            maxPax: p.max_pax,
            ntaPrice: Number(p.price_nta),
            publishPrice: Number(p.price_publish),
            margin: Number(p.price_publish) - Number(p.price_nta),
          })),
        },
        popularity,
        ratings,
        availability,
      };
    });

    return NextResponse.json({
      packages: comparisonData,
    });
  } catch (error) {
    logger.error('Failed to fetch packages for comparison', error, {
      userId: user.id,
      packageIds,
    });
    throw error;
  }
});

