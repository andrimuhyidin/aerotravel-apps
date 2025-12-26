/**
 * API: Similar Packages
 * GET /api/partner/packages/[id]/similar - Get similar packages by destination or price range
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
  const limit = parseInt(searchParams.get('limit') || '6');
  const { id: packageId } = await params;

  try {
    // Get current package details
    const { data: currentPackage, error: currentError } = await supabase
      .from('packages')
      .select('destination, province, duration_days, package_prices(price_nta)')
      .eq('id', packageId)
      .single();

    if (currentError || !currentPackage) {
      return NextResponse.json(
        { error: 'Package not found' },
        { status: 404 }
      );
    }

    // Get price range for current package
    const currentPrices = currentPackage.package_prices as any[];
    const currentPrice = currentPrices.length > 0 
      ? Math.min(...currentPrices.map(p => p.price_nta))
      : 0;

    const priceMin = currentPrice * 0.7; // -30%
    const priceMax = currentPrice * 1.3; // +30%

    // Find similar packages (same destination OR similar price range)
    const { data: packages, error: packagesError } = await supabase
      .from('packages')
      .select(`
        id,
        name,
        destination,
        duration_days,
        duration_nights,
        thumbnail_url,
        package_prices(
          min_pax,
          max_pax,
          price_publish,
          price_nta
        )
      `)
      .eq('status', 'published')
      .is('deleted_at', null)
      .neq('id', packageId)
      .or(`destination.eq.${currentPackage.destination},province.eq.${currentPackage.province}`)
      .limit(limit * 2); // Get more to filter by price

    if (packagesError) {
      logger.error('Failed to fetch similar packages', packagesError);
      return NextResponse.json({ packages: [] });
    }

    // Transform and filter by price range
    const transformedPackages = (packages || [])
      .map((pkg: any) => {
        const prices = pkg.package_prices || [];
        const basePriceTier = prices.find((p: any) => p.min_pax === 1) || prices[0] || null;
        
        const margin = basePriceTier
          ? Number(basePriceTier.price_publish) - Number(basePriceTier.price_nta)
          : 0;

        const allNTAPrices = prices.map((p: any) => Number(p.price_nta));
        const minNTAPrice = allNTAPrices.length > 0 ? Math.min(...allNTAPrices) : 0;
        const maxNTAPrice = allNTAPrices.length > 0 ? Math.max(...allNTAPrices) : 0;

        const allPublishPrices = prices.map((p: any) => Number(p.price_publish));
        const minPublishPrice = allPublishPrices.length > 0 ? Math.min(...allPublishPrices) : 0;
        const maxPublishPrice = allPublishPrices.length > 0 ? Math.max(...allPublishPrices) : 0;

        return {
          id: pkg.id,
          name: pkg.name,
          destination: pkg.destination,
          durationDays: pkg.duration_days,
          durationNights: pkg.duration_nights,
          thumbnailUrl: pkg.thumbnail_url,
          baseNTAPrice: basePriceTier ? Number(basePriceTier.price_nta) : null,
          basePublishPrice: basePriceTier ? Number(basePriceTier.price_publish) : null,
          margin,
          priceRange: {
            nta: { min: minNTAPrice, max: maxNTAPrice },
            publish: { min: minPublishPrice, max: maxPublishPrice },
          },
          facilities: ['meals', 'hotel', 'transport'], // TODO: Get from DB when available
          similarity: {
            sameDestination: pkg.destination === currentPackage.destination,
            priceDiff: Math.abs(minNTAPrice - currentPrice),
          },
        };
      })
      .filter((pkg: any) => {
        // Include if same destination OR within price range
        return pkg.similarity.sameDestination || 
               (pkg.priceRange.nta.min >= priceMin && pkg.priceRange.nta.min <= priceMax);
      })
      .sort((a: any, b: any) => {
        // Sort by similarity: same destination first, then by price similarity
        if (a.similarity.sameDestination && !b.similarity.sameDestination) return -1;
        if (!a.similarity.sameDestination && b.similarity.sameDestination) return 1;
        return a.similarity.priceDiff - b.similarity.priceDiff;
      })
      .slice(0, limit);

    return NextResponse.json({
      packages: transformedPackages,
      count: transformedPackages.length,
    });
  } catch (error) {
    logger.error('Failed to fetch similar packages', error, { packageId });
    throw error;
  }
});

