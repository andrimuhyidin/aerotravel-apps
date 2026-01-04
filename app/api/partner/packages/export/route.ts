/**
 * API: Export Package Catalog
 * GET /api/partner/packages/export?format=pdf|excel
 * Exports current filtered packages to PDF or Excel
 */

import { withErrorHandler } from '@/lib/api/error-handler';
import { verifyPartnerAccess, sanitizeSearchParams } from '@/lib/api/partner-helpers';
import { getBranchContext } from '@/lib/branch/branch-injection';
import { generateCatalogExcel, generateCatalogPDF } from '@/lib/partner/catalog-export';
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

  // Verify partner access
  const { isPartner } = await verifyPartnerAccess(user.id);
  if (!isPartner) {
    return NextResponse.json({ error: 'Partner access required' }, { status: 403 });
  }

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  const searchParams = sanitizeSearchParams(request);
  const format = searchParams.get('format') || 'excel'; // 'pdf' or 'excel'

  if (!['pdf', 'excel'].includes(format)) {
    return NextResponse.json(
      { error: 'Invalid format. Use "pdf" or "excel"' },
      { status: 400 }
    );
  }

  // Get all query params (same as packages list API)
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

  try {
    // Build query (same logic as packages list API)
    let packagesQuery = client
      .from('packages')
      .select(
        `
        id,
        name,
        destination,
        province,
        duration_days,
        duration_nights,
        min_pax,
        max_pax,
        package_type,
        thumbnail_url,
        is_active,
        package_prices(
          min_pax,
          max_pax,
          price_publish,
          price_nta
        )
      `
      )
      .eq('is_active', true);

    // Filter by branch (unless super admin)
    if (!branchContext.isSuperAdmin && branchContext.branchId) {
      packagesQuery = packagesQuery.eq('branch_id', branchContext.branchId);
    }

    // Apply search filter
    if (search) {
      packagesQuery = packagesQuery.or(
        `name.ilike.%${search}%,destination.ilike.%${search}%,province.ilike.%${search}%`
      );
    }

    // Apply destination filter
    if (destination) {
      packagesQuery = packagesQuery.eq('destination', destination);
    }

    // Apply package type filter
    if (packageType) {
      packagesQuery = packagesQuery.eq('package_type', packageType);
    }

    const { data: packages, error: packagesError } = await packagesQuery;

    if (packagesError) {
      logger.error('Failed to fetch packages for export', packagesError, {
        userId: user.id,
      });
      throw packagesError;
    }

    if (!packages || packages.length === 0) {
      return NextResponse.json(
        { error: 'No packages found to export' },
        { status: 404 }
      );
    }

    // Fetch additional data (ratings, availability, popularity)
    const packageIds = packages.map((p: any) => p.id);
    const ratingsMap = await fetchPackageRatingsBatch(client, packageIds);
    const availabilityMap = await getPackageAvailabilityBatch(client, packageIds, 30);

    const popularityMap: Record<string, {
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
      logger.warn('Failed to fetch popularity for export', {
        error: popularityError instanceof Error ? popularityError.message : String(popularityError),
      });
    }

    // Transform packages
    let transformedPackages = packages.map((pkg: any) => {
      const prices = pkg.package_prices || [];
      const basePriceTier = prices.find((p: any) => p.min_pax === 1) || prices[0] || null;

      const margin = basePriceTier
        ? Number(basePriceTier.price_publish) - Number(basePriceTier.price_nta)
        : 0;

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
        province: pkg.province,
        durationDays: pkg.duration_days,
        durationNights: pkg.duration_nights,
        minPax: pkg.min_pax,
        maxPax: pkg.max_pax,
        packageType: pkg.package_type,
        thumbnailUrl: pkg.thumbnail_url,
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
        pricingTiers: prices.map((p: any) => ({
          minPax: p.min_pax,
          maxPax: p.max_pax,
          ntaPrice: Number(p.price_nta),
          publishPrice: Number(p.price_publish),
          margin: Number(p.price_publish) - Number(p.price_nta),
        })),
        popularity,
        ratings,
        availability,
      };
    });

    // Apply filters (same as packages list API)
    if (minPrice) {
      transformedPackages = transformedPackages.filter(
        (pkg: any) => pkg.priceRange.nta.min >= Number(minPrice)
      );
    }
    if (maxPrice) {
      transformedPackages = transformedPackages.filter(
        (pkg: any) => pkg.priceRange.nta.max <= Number(maxPrice)
      );
    }
    if (minMargin) {
      transformedPackages = transformedPackages.filter(
        (pkg: any) => pkg.margin >= Number(minMargin)
      );
    }
    if (maxMargin) {
      transformedPackages = transformedPackages.filter(
        (pkg: any) => pkg.margin <= Number(maxMargin)
      );
    }
    if (minDuration) {
      transformedPackages = transformedPackages.filter(
        (pkg: any) => pkg.durationDays >= Number(minDuration)
      );
    }
    if (maxDuration) {
      transformedPackages = transformedPackages.filter(
        (pkg: any) => pkg.durationDays <= Number(maxDuration)
      );
    }
    if (minRating) {
      transformedPackages = transformedPackages.filter(
        (pkg: any) => (pkg.ratings?.averageRating || 0) >= Number(minRating)
      );
    }
    if (minReviews) {
      transformedPackages = transformedPackages.filter(
        (pkg: any) => (pkg.ratings?.totalReviews || 0) >= Number(minReviews)
      );
    }
    if (availabilityStatus && availabilityStatus !== 'all') {
      transformedPackages = transformedPackages.filter(
        (pkg: any) => pkg.availability?.status === availabilityStatus
      );
    }

    // Generate export file
    let buffer: Buffer;
    let filename: string;
    let contentType: string;

    if (format === 'pdf') {
      buffer = await generateCatalogPDF(transformedPackages);
      filename = `package-catalog-${new Date().toISOString().split('T')[0]}.pdf`;
      contentType = 'application/pdf';
    } else {
      buffer = await generateCatalogExcel(transformedPackages);
      filename = `package-catalog-${new Date().toISOString().split('T')[0]}.xlsx`;
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    }

    logger.info('Catalog exported', {
      userId: user.id,
      format,
      packageCount: transformedPackages.length,
    });

    return new NextResponse(Buffer.from(buffer), {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    logger.error('Failed to export catalog', error, {
      userId: user.id,
      format,
    });
    throw error;
  }
});

