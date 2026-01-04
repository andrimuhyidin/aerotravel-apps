/**
 * API: Package Recommendations
 * GET /api/partner/packages/recommendations?packageId=...&limit=5
 * Returns recommended packages based on booking history, destination, type, price
 */

import { withErrorHandler } from '@/lib/api/error-handler';
import { verifyPartnerAccess, sanitizeSearchParams } from '@/lib/api/partner-helpers';
import { getBranchContext } from '@/lib/branch/branch-injection';
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
  const { isPartner, partnerId } = await verifyPartnerAccess(user.id);
  if (!isPartner || !partnerId) {
    return NextResponse.json({ error: 'Partner access required' }, { status: 403 });
  }

  const branchContext = await getBranchContext(user.id);
  const client = supabase as unknown as any;

  const searchParams = sanitizeSearchParams(request);
  const packageId = searchParams.get('packageId');
  const limit = parseInt(searchParams.get('limit') || '5');

  if (!packageId) {
    return NextResponse.json(
      { error: 'packageId is required' },
      { status: 400 }
    );
  }

  try {
    // Get current package details
    const { data: currentPackage, error: pkgError } = await client
      .from('packages')
      .select('id, destination, province, package_type, package_prices(price_nta, price_publish)')
      .eq('id', packageId)
      .single();

    if (pkgError || !currentPackage) {
      return NextResponse.json(
        { error: 'Package not found' },
        { status: 404 }
      );
    }

    // Get base price for similarity calculation
    const prices = currentPackage.package_prices || [];
    const basePrice = prices.find((p: any) => p.min_pax === 1)?.price_nta || prices[0]?.price_nta || 0;

    // Get partner's booking history to find similar packages
    const { data: bookings, error: bookingsError } = await client
      .from('bookings')
      .select('package_id, package:packages(destination, package_type)')
      .eq('mitra_id', partnerId)
      .in('status', ['confirmed', 'paid', 'ongoing', 'completed'])
      .neq('package_id', packageId)
      .limit(50);

    // Get similar packages based on multiple criteria
    let recommendationsQuery = client
      .from('packages')
      .select(
        `
        id,
        name,
        destination,
        province,
        duration_days,
        duration_nights,
        thumbnail_url,
        package_type,
        package_prices(
          min_pax,
          max_pax,
          price_nta,
          price_publish
        )
      `
      )
      .eq('is_active', true)
      .neq('id', packageId);

    // Filter by branch (unless super admin)
    if (!branchContext.isSuperAdmin && branchContext.branchId) {
      recommendationsQuery = recommendationsQuery.eq('branch_id', branchContext.branchId);
    }

    const { data: allPackages, error: allPackagesError } = await recommendationsQuery;

    if (allPackagesError || !allPackages) {
      logger.error('Failed to fetch packages for recommendations', allPackagesError, {
        userId: user.id,
        packageId,
      });
      return NextResponse.json({ recommendations: [] });
    }

    // Score packages based on similarity
    const scoredPackages = allPackages.map((pkg: any) => {
      let score = 0;

      // Same destination (high weight)
      if (pkg.destination === currentPackage.destination) {
        score += 10;
      }

      // Same province (medium weight)
      if (pkg.province === currentPackage.province) {
        score += 5;
      }

      // Same package type (medium weight)
      if (pkg.package_type === currentPackage.package_type) {
        score += 5;
      }

      // Similar price range (within 20% - medium weight)
      const pkgPrices = pkg.package_prices || [];
      const pkgBasePrice = pkgPrices.find((p: any) => p.min_pax === 1)?.price_nta || pkgPrices[0]?.price_nta || 0;
      if (pkgBasePrice > 0 && basePrice > 0) {
        const priceDiff = Math.abs(pkgBasePrice - basePrice) / basePrice;
        if (priceDiff <= 0.2) {
          score += 5;
        } else if (priceDiff <= 0.5) {
          score += 2;
        }
      }

      // Booked by this partner before (high weight)
      if (bookings && bookings.length > 0) {
        const bookedPackageIds = bookings.map((b: any) => b.package_id);
        if (bookedPackageIds.includes(pkg.id)) {
          score += 15;
        }
      }

      // Popular packages (low weight)
      // This would require popularity data, but we'll skip for now

      return {
        ...pkg,
        similarityScore: score,
      };
    });

    // Sort by score and take top N
    const recommendations = scoredPackages
      .sort((a: any, b: any) => b.similarityScore - a.similarityScore)
      .slice(0, limit)
      .map((pkg: any) => {
        const prices = pkg.package_prices || [];
        const basePriceTier = prices.find((p: any) => p.min_pax === 1) || prices[0] || null;

        const allNTAPrices = prices.map((p: any) => Number(p.price_nta));
        const minNTAPrice = allNTAPrices.length > 0 ? Math.min(...allNTAPrices) : 0;
        const maxNTAPrice = allNTAPrices.length > 0 ? Math.max(...allNTAPrices) : 0;

        return {
          id: pkg.id,
          name: pkg.name,
          destination: pkg.destination,
          province: pkg.province,
          durationDays: pkg.duration_days,
          durationNights: pkg.duration_nights,
          thumbnailUrl: pkg.thumbnail_url,
          packageType: pkg.package_type,
          baseNTAPrice: basePriceTier ? Number(basePriceTier.price_nta) : null,
          priceRange: {
            nta: {
              min: minNTAPrice,
              max: maxNTAPrice,
            },
          },
          similarityScore: pkg.similarityScore,
        };
      });

    return NextResponse.json({ recommendations });
  } catch (error) {
    logger.error('Failed to get package recommendations', error, {
      userId: user.id,
      packageId,
    });
    return NextResponse.json({ recommendations: [] });
  }
});

