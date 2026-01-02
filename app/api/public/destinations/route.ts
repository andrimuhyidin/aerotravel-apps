/**
 * Destinations API
 * GET /api/public/destinations - Get destinations with package counts
 */

import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/api/error-handler';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

// Coordinates for popular destinations in Lampung
const DESTINATION_COORDS: Record<string, { lat: number; lng: number }> = {
  'pahawang': { lat: -5.6667, lng: 105.2167 },
  'kiluan': { lat: -5.7833, lng: 105.0833 },
  'way kambas': { lat: -4.9333, lng: 105.7833 },
  'krui': { lat: -5.1833, lng: 103.9167 },
  'tanjung setia': { lat: -5.5667, lng: 104.0333 },
  'lampung': { lat: -5.4500, lng: 105.2667 },
  'bandar lampung': { lat: -5.4500, lng: 105.2667 },
  'pesawaran': { lat: -5.5833, lng: 105.0833 },
  'tanggamus': { lat: -5.4167, lng: 104.6333 },
  'pringsewu': { lat: -5.3500, lng: 104.9833 },
  'default': { lat: -5.4500, lng: 105.2667 },
};

function getCoordinates(destination: string): { lat: number; lng: number } {
  const normalized = destination.toLowerCase().trim();
  
  for (const [key, coords] of Object.entries(DESTINATION_COORDS)) {
    if (normalized.includes(key)) {
      return coords;
    }
  }
  
  return DESTINATION_COORDS['default'];
}

export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const province = searchParams.get('province');
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');
  const type = searchParams.get('type'); // 'open_trip' | 'private_trip'

  logger.info('GET /api/public/destinations', { province, minPrice, maxPrice, type });

  const supabase = await createClient();

  // Get packages with prices
  let query = supabase
    .from('packages')
    .select(`
      id,
      name,
      slug,
      destination,
      province,
      package_type,
      duration_days,
      duration_nights,
      average_rating,
      review_count,
      package_prices (
        price_publish
      )
    `)
    .eq('status', 'published');

  if (province) {
    query = query.eq('province', province);
  }

  if (type) {
    query = query.eq('package_type', type);
  }

  const { data: packages, error } = await query;

  if (error) {
    logger.error('Failed to fetch packages', error);
    return NextResponse.json(
      { error: 'Failed to fetch destinations' },
      { status: 500 }
    );
  }

  // Group by destination
  const destinationMap = new Map<string, {
    destination: string;
    province: string;
    coords: { lat: number; lng: number };
    packageCount: number;
    packages: {
      id: string;
      name: string;
      slug: string;
      type: string;
      duration: string;
      lowestPrice: number;
      rating: number;
      reviewCount: number;
    }[];
    lowestPrice: number;
    highestRating: number;
  }>();

  (packages || []).forEach((pkg) => {
    const key = pkg.destination.toLowerCase();
    const prices = pkg.package_prices as { price_publish: number }[] || [];
    const lowestPrice = prices.length > 0 
      ? Math.min(...prices.map((p) => p.price_publish))
      : 0;

    // Apply price filter
    if (minPrice && lowestPrice < Number(minPrice)) return;
    if (maxPrice && lowestPrice > Number(maxPrice)) return;

    const existing = destinationMap.get(key);

    const pkgData = {
      id: pkg.id,
      name: pkg.name,
      slug: pkg.slug,
      type: pkg.package_type === 'open_trip' ? 'Open Trip' : 'Private',
      duration: `${pkg.duration_days}H${pkg.duration_nights}M`,
      lowestPrice,
      rating: pkg.average_rating || 0,
      reviewCount: pkg.review_count || 0,
    };

    if (existing) {
      existing.packageCount++;
      existing.packages.push(pkgData);
      if (lowestPrice < existing.lowestPrice || existing.lowestPrice === 0) {
        existing.lowestPrice = lowestPrice;
      }
      if ((pkg.average_rating || 0) > existing.highestRating) {
        existing.highestRating = pkg.average_rating || 0;
      }
    } else {
      destinationMap.set(key, {
        destination: pkg.destination,
        province: pkg.province,
        coords: getCoordinates(pkg.destination),
        packageCount: 1,
        packages: [pkgData],
        lowestPrice,
        highestRating: pkg.average_rating || 0,
      });
    }
  });

  const destinations = Array.from(destinationMap.values())
    .sort((a, b) => b.packageCount - a.packageCount);

  // Get unique provinces for filter
  const provinces = [...new Set((packages || []).map((p) => p.province))].filter(Boolean).sort();

  return NextResponse.json({
    destinations,
    totalDestinations: destinations.length,
    totalPackages: packages?.length || 0,
    provinces,
    center: { lat: -5.4500, lng: 105.2667 }, // Lampung center
  });
});

