/**
 * API: Partner Packages Listing
 * GET /api/partner/packages - List packages with NTA pricing for partners
 * 
 * Returns packages available to partner's branch with:
 * - NTA pricing (Net Travel Agent price)
 * - Publish pricing (for margin calculation)
 * - Availability info
 * - Margin potential
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { getBranchContext } from '@/lib/branch/branch-injection';
import { getPackageAvailabilityBatch } from '@/lib/partner/package-availability';
import { fetchPackageRatingsBatch } from '@/lib/partner/package-ratings';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get partner branch context
  let branchContext;
  try {
    branchContext = await getBranchContext(user.id);
  } catch (error) {
    logger.warn('Failed to get branch context, using default', {
      userId: user.id,
      error: error instanceof Error ? error.message : String(error),
    });
    // Fallback: allow access to all packages if branch context fails
    branchContext = { branchId: null, isSuperAdmin: false };
  }
  const client = supabase as unknown as any;

  // Get query params
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const destination = searchParams.get('destination');
  const packageType = searchParams.get('packageType');
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');
  const minMargin = searchParams.get('minMargin');
  const maxMargin = searchParams.get('maxMargin');
  const minDuration = searchParams.get('minDuration');
  const maxDuration = searchParams.get('maxDuration');
  const minPax = searchParams.get('minPax');
  const maxPax = searchParams.get('maxPax');
  const dateFrom = searchParams.get('dateFrom');
  const dateTo = searchParams.get('dateTo');
  const minRating = searchParams.get('minRating');
  const minReviews = searchParams.get('minReviews');
  const availabilityStatus = searchParams.get('availabilityStatus');
  const durations = searchParams.get('durations'); // comma-separated: "1,2,3"
  const packageTypes = searchParams.get('packageTypes'); // comma-separated: "open_trip,private_trip"
  const facilities = searchParams.get('facilities'); // comma-separated: "meals,hotel,transport"
  const sortBy = searchParams.get('sortBy') || 'popularity'; // 'popularity', 'price_asc', 'price_desc', 'commission', 'rating', 'newest'
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '12');
  const offset = (page - 1) * limit;

  try {
    // Build packages query with NTA pricing
    let packagesQuery = client
      .from('packages')
      .select(
        `
        id,
        name,
        destination,
        duration_days,
        duration_nights,
        thumbnail_url,
        status,
        package_type,
        min_pax,
        max_pax,
        created_at,
        prices:package_prices(
          min_pax,
          max_pax,
          price_publish,
          price_nta,
          is_active
        )
      `,
        { count: 'exact' }
      )
      .eq('status', 'published')
      .is('deleted_at', null);

    // Note: Partners can see all published packages (not filtered by branch)
    // RLS policy 'packages_select_published' handles access control

    // Search filter
    if (search) {
      packagesQuery = packagesQuery.or(
        `name.ilike.%${search}%,destination.ilike.%${search}%`
      );
    }

    // Destination filter
    if (destination) {
      packagesQuery = packagesQuery.eq('destination', destination);
    }

    // Package type filter (single or multiple)
    if (packageType) {
      packagesQuery = packagesQuery.eq('package_type', packageType);
    } else if (packageTypes) {
      const types = packageTypes.split(',').map(t => t.trim());
      packagesQuery = packagesQuery.in('package_type', types);
    }

    // Duration filter (will filter after fetching)
    // Note: duration_days is in the select, we'll filter in memory

    // Order by name (default, will re-sort after filtering)
    packagesQuery = packagesQuery.order('name', { ascending: true });

    // Pagination
    packagesQuery = packagesQuery.range(offset, offset + limit - 1);

    const { data: packages, error: packagesError, count } = await packagesQuery;

    if (packagesError) {
      logger.error('Failed to fetch partner packages', packagesError, {
        userId: user.id,
        branchId: branchContext.branchId,
        errorMessage: packagesError.message,
        errorDetails: packagesError.details,
        errorHint: packagesError.hint,
      });
      // Return empty result instead of throwing
      return NextResponse.json({
        packages: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      });
    }

    // Fetch popularity stats for all packages
    const packageIds = (packages || []).map((p: any) => p.id);
    let popularityMap: Record<string, {
      booking_count: number;
      total_revenue: number;
      popularity_score: number;
    }> = {};

    if (packageIds.length > 0) {
      try {
        // Use RPC or direct query - package_popularity is a view
        const { data: popularityData, error: popularityError } = await (client as any)
          .from('package_popularity')
          .select('package_id, booking_count, total_revenue, popularity_score')
          .in('package_id', packageIds);

        if (!popularityError && popularityData) {
          popularityData.forEach((pop: any) => {
            popularityMap[pop.package_id] = {
              booking_count: pop.booking_count || 0,
              total_revenue: pop.total_revenue || 0,
              popularity_score: pop.popularity_score || 0,
            };
          });
        }
      } catch (popularityError) {
        logger.warn('Failed to fetch popularity stats', {
          packageIds: packageIds.length,
          error: popularityError instanceof Error ? popularityError.message : String(popularityError),
        });
        // Continue without popularity stats - not critical
      }
    }

    // Fetch ratings for all packages
    let ratingsMap: Record<string, {
      averageRating: number;
      totalReviews: number;
      ratingDistribution: {
        '5': number;
        '4': number;
        '3': number;
        '2': number;
        '1': number;
      };
    }> = {};

    if (packageIds.length > 0) {
      try {
        ratingsMap = await fetchPackageRatingsBatch(client, packageIds);
      } catch (ratingsError) {
        logger.warn('Failed to fetch ratings', {
          packageIds: packageIds.length,
          error: ratingsError instanceof Error ? ratingsError.message : String(ratingsError),
        });
        // Continue without ratings - not critical
      }
    }

    // Fetch availability for all packages
    let availabilityMap: Record<string, {
      status: 'available' | 'limited' | 'sold_out';
      nextAvailableDate: string | null;
      availableDatesCount: number;
    }> = {};

    if (packageIds.length > 0) {
      try {
        availabilityMap = await getPackageAvailabilityBatch(client, packageIds, 30);
      } catch (availabilityError) {
        logger.warn('Failed to fetch availability', {
          packageIds: packageIds.length,
          error: availabilityError instanceof Error ? availabilityError.message : String(availabilityError),
        });
        // Continue without availability - not critical
      }
    }

    // Transform data to include margin calculation and popularity
    let transformedPackages = (packages || []).map((pkg: any) => {
      const prices = pkg.prices || [];
      
      // Get base pricing tier (typically min_pax = 1)
      const basePriceTier = prices.find((p: any) => p.min_pax === 1) || prices[0] || null;

      // Calculate margin (publish - NTA)
      const margin = basePriceTier
        ? Number(basePriceTier.price_publish) - Number(basePriceTier.price_nta)
        : 0;

      // Get price range (min/max from all tiers)
      const allPublishPrices = prices.map((p: any) => Number(p.price_publish));
      const allNTAPrices = prices.map((p: any) => Number(p.price_nta));
      const minPublishPrice = allPublishPrices.length > 0 ? Math.min(...allPublishPrices) : 0;
      const maxPublishPrice = allPublishPrices.length > 0 ? Math.max(...allPublishPrices) : 0;
      const minNTAPrice = allNTAPrices.length > 0 ? Math.min(...allNTAPrices) : 0;
      const maxNTAPrice = allNTAPrices.length > 0 ? Math.max(...allNTAPrices) : 0;

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
        destination: pkg.destination,
        durationDays: pkg.duration_days,
        durationNights: pkg.duration_nights,
        thumbnailUrl: pkg.thumbnail_url,
        packageType: pkg.package_type,
        isActive: pkg.is_active,
        createdAt: pkg.created_at || new Date().toISOString(),
        facilities: ['meals', 'hotel', 'transport'], // TODO: Get from package data when available
        // Pricing summary
        baseNTAPrice: basePriceTier ? Number(basePriceTier.price_nta) : null,
        basePublishPrice: basePriceTier ? Number(basePriceTier.price_publish) : null,
        margin,
        priceRange: {
          nta: {
            min: minNTAPrice,
            max: maxNTAPrice,
          },
          publish: {
            min: minPublishPrice,
            max: maxPublishPrice,
          },
        },
        // Full pricing tiers for detailed view
        pricingTiers: prices.map((p: any) => ({
          minPax: p.min_pax,
          maxPax: p.max_pax,
          ntaPrice: Number(p.price_nta),
          publishPrice: Number(p.price_publish),
          margin: Number(p.price_publish) - Number(p.price_nta),
        })),
        // Popularity stats
        popularity,
        // Ratings
        ratings,
        // Availability
        availability,
      };
    });

    // Apply filters
    let filteredPackages = transformedPackages;
    
    // Duration filter (support multiple durations)
    if (durations) {
      const durationList = durations.split(',').map(d => parseInt(d.trim()));
      filteredPackages = filteredPackages.filter((pkg: any) => {
        // Handle special cases: 4 = 4-5 days, 6 = 6+ days
        return durationList.some((d) => {
          if (d === 4) return pkg.durationDays >= 4 && pkg.durationDays <= 5;
          if (d === 6) return pkg.durationDays >= 6;
          return pkg.durationDays === d;
        });
      });
    }
    
    // Facilities filter (package must have all requested facilities)
    if (facilities) {
      const facilityList = facilities.split(',').map(f => f.trim());
      filteredPackages = filteredPackages.filter((pkg: any) => {
        const pkgFacilities = pkg.facilities || [];
        return facilityList.every(f => pkgFacilities.includes(f));
      });
    }
    
    // Rating filter
    if (minRating) {
      const minRatingNum = parseFloat(minRating);
      filteredPackages = filteredPackages.filter((pkg: any) => {
        return (pkg.ratings?.averageRating || 0) >= minRatingNum;
      });
    }
    
    // Date range filter (filter by availability in date range)
    // Note: This is a simplified version. For better performance, we use the availability
    // data already fetched in availabilityMap instead of querying again
    if (dateFrom || dateTo) {
      const startDate = dateFrom ? new Date(dateFrom) : new Date();
      const endDate = dateTo ? new Date(dateTo) : new Date();
      endDate.setDate(endDate.getDate() + 90); // Default to 90 days if no end date

      filteredPackages = filteredPackages.filter((pkg: any) => {
        const availability = availabilityMap[pkg.id];
        if (!availability) return false;

        // If package has availability and next available date is in range
        if (availability.nextAvailableDate) {
          const nextAvailable = new Date(availability.nextAvailableDate);
          if (nextAvailable >= startDate && nextAvailable <= endDate) {
            return true;
          }
          if (!dateTo && nextAvailable >= startDate) {
            return true;
          }
        }

        // Include if not sold out (might have dates in range)
        return availability.status !== 'sold_out';
      });
    }
    
    // Price filters
    if (minPrice) {
      filteredPackages = filteredPackages.filter(
        (pkg: any) => pkg.priceRange.nta.min >= Number(minPrice)
      );
    }
    if (maxPrice) {
      filteredPackages = filteredPackages.filter(
        (pkg: any) => pkg.priceRange.nta.max <= Number(maxPrice)
      );
    }

    // Margin filters
    if (minMargin) {
      filteredPackages = filteredPackages.filter(
        (pkg: any) => pkg.margin >= Number(minMargin)
      );
    }
    if (maxMargin) {
      filteredPackages = filteredPackages.filter(
        (pkg: any) => pkg.margin <= Number(maxMargin)
      );
    }

    // Duration filters
    if (minDuration) {
      filteredPackages = filteredPackages.filter(
        (pkg: any) => pkg.durationDays >= Number(minDuration)
      );
    }
    if (maxDuration) {
      filteredPackages = filteredPackages.filter(
        (pkg: any) => pkg.durationDays <= Number(maxDuration)
      );
    }

    // Pax range filters
    // Filter packages that support the requested pax range
    // A package supports a pax range if: min_pax <= maxPax AND max_pax >= minPax
    if (minPax || maxPax) {
      filteredPackages = filteredPackages.filter((pkg: any) => {
        const pkgMinPax = pkg.pricingTiers.length > 0 
          ? Math.min(...pkg.pricingTiers.map((t: any) => t.minPax))
          : null;
        const pkgMaxPax = pkg.pricingTiers.length > 0
          ? Math.max(...pkg.pricingTiers.map((t: any) => t.maxPax))
          : null;

        if (!pkgMinPax || !pkgMaxPax) return false;

        if (minPax && maxPax) {
          // Package must support the entire range
          return pkgMinPax <= Number(maxPax) && pkgMaxPax >= Number(minPax);
        } else if (minPax) {
          // Package must support at least minPax
          return pkgMaxPax >= Number(minPax);
        } else if (maxPax) {
          // Package must support at most maxPax
          return pkgMinPax <= Number(maxPax);
        }
        return true;
      });
    }

    // Apply sorting
    filteredPackages.sort((a: any, b: any) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'price_asc':
          comparison = a.priceRange.nta.min - b.priceRange.nta.min;
          break;
        case 'price_desc':
          comparison = b.priceRange.nta.min - a.priceRange.nta.min;
          break;
        case 'commission':
          // Sort by margin (higher is better)
          comparison = b.margin - a.margin;
          break;
        case 'rating':
          // Sort by average rating (higher is better)
          comparison = (b.ratings?.averageRating || 0) - (a.ratings?.averageRating || 0);
          break;
        case 'newest':
          // Sort by created date (newer first)
          comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          break;
        case 'popularity':
        default:
          // Sort by popularity score (higher is better)
          comparison = (b.popularity?.popularity_score || 0) - (a.popularity?.popularity_score || 0);
          break;
      }
      
      return comparison;
    });

    return NextResponse.json({
      packages: filteredPackages,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    logger.error('Failed to fetch partner packages', error, {
      userId: user.id,
    });
    throw error;
  }
});

